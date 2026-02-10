import logging
from django.core.mail import send_mail
from django.utils import timezone
from django.db.models import Q
from datetime import timedelta
from .models import Match, NotificationLog, UserProfile, Tournament

YEAR_FILTER = 2026
from .services.lolesports_client import LolesportsClient, LEAGUE_IDS
from .services.data_mapper import DataMapper

logger = logging.getLogger('esports')

def send_match_notifications():
    now = timezone.now()

    favorite_team_window_start = now + timedelta(hours=2)
    favorite_team_window_end = now + timedelta(hours=2, minutes=5)
    favorite_match_window_start = now + timedelta(minutes=10)
    favorite_match_window_end = now + timedelta(minutes=15)

    matches_2h = Match.objects.filter(
        date_time__gte=favorite_team_window_start,
        date_time__lt=favorite_team_window_end
    ).select_related('team1', 'team2', 'tournament')

    matches_10m = Match.objects.filter(
        date_time__gte=favorite_match_window_start,
        date_time__lt=favorite_match_window_end
    ).select_related('team1', 'team2', 'tournament')

    notifications_sent = 0

    for match in matches_2h:
        profiles_team1 = UserProfile.objects.filter(
            favorite_teams=match.team1
        ).select_related('user')

        profiles_team2 = UserProfile.objects.filter(
            favorite_teams=match.team2
        ).select_related('user')

        for profile in set(list(profiles_team1) + list(profiles_team2)):
            if NotificationLog.objects.filter(
                user=profile.user,
                match=match,
                notification_type='favorite_team'
            ).exists():
                continue

            try:
                send_mail(
                    subject=f'Upcoming Match: {match.team1.name} vs {match.team2.name}',
                    message=f'''Hi {profile.user.username},

Your favorite team is playing soon!

Match: {match.team1.name} vs {match.team2.name}
Tournament: {match.tournament.name}
Time: {match.date_time.strftime('%B %d, %Y at %I:%M %p')}

Don't miss it!

Best regards,
Rift Pulse Team''',
                    from_email=None,
                    recipient_list=[profile.user.email],
                    fail_silently=False,
                )

                NotificationLog.objects.create(
                    user=profile.user,
                    match=match,
                    notification_type='favorite_team'
                )
                notifications_sent += 1
            except Exception as e:
                print(f"Failed to send email to {profile.user.email}: {str(e)}")

    for match in matches_10m:
        profiles = UserProfile.objects.filter(
            favorite_matches=match
        ).select_related('user')

        for profile in profiles:
            if NotificationLog.objects.filter(
                user=profile.user,
                match=match,
                notification_type='favorite_match'
            ).exists():
                continue

            try:
                send_mail(
                    subject=f'Match Starting Soon: {match.team1.name} vs {match.team2.name}',
                    message=f'''Hi {profile.user.username},

One of your favorite matches is starting in 10 minutes!

Match: {match.team1.name} vs {match.team2.name}
Tournament: {match.tournament.name}
Time: {match.date_time.strftime('%B %d, %Y at %I:%M %p')}

Get ready!

Best regards,
Rift Pulse Team''',
                    from_email=None,
                    recipient_list=[profile.user.email],
                    fail_silently=False,
                )

                NotificationLog.objects.create(
                    user=profile.user,
                    match=match,
                    notification_type='favorite_match'
                )
                notifications_sent += 1
            except Exception as e:
                print(f"Failed to send email to {profile.user.email}: {str(e)}")

    return f"Sent {notifications_sent} notifications"


def _derive_winner(score, team1, team2):
    if not score or '-' not in score:
        return ''
    parts = score.split('-')
    if len(parts) != 2:
        return ''
    try:
        s1, s2 = int(parts[0]), int(parts[1])
    except ValueError:
        return ''
    if s1 > s2:
        return team1.name if hasattr(team1, 'name') else str(team1)
    elif s2 > s1:
        return team2.name if hasattr(team2, 'name') else str(team2)
    return ''


def fetch_match_schedules():

    client = LolesportsClient()
    created_count = 0
    updated_count = 0
    skipped_count = 0

    league_vod_fallbacks = {
        'LPL': 'https://www.youtube.com/@LPL_English',
        'LEC': 'https://www.youtube.com/@LEC',
        'LCS': 'https://www.youtube.com/@LCS',
        'LCK': 'https://www.youtube.com/@LCKglobal',
        'LCP': 'https://www.youtube.com/@lolpacificen',
    }

    league_region_map = {
        'LCK': 'south_korea',
        'LEC': 'europe',
        'LPL': 'china',
        'LCS': 'north_america',
    }

    for league_name, league_id in LEAGUE_IDS.items():
        schedule = client.get_schedule(league_id)
        if not schedule:
            logger.warning('fetch_match_schedules: no schedule data for %s', league_name)
            continue

        events = schedule.get('events', [])
        logger.info('fetch_match_schedules: %s returned %d events', league_name, len(events))

        region = league_region_map.get(league_name)

        tournament = Tournament.objects.filter(
            Q(name__icontains=league_name) |
            Q(name__icontains=league_name.replace('LCS', 'LTA')),
            region=region
        ).order_by('-start_date').first()

        if not tournament and region:
            tournament = Tournament.objects.filter(
                region=region
            ).order_by('-start_date').first()
            if tournament:
                logger.info('fetch_match_schedules: %s matched by region only -> %s', league_name, tournament.name)

        if not tournament:
            logger.warning('fetch_match_schedules: no tournament found for league %s', league_name)
            continue

        mapper = DataMapper(tournament=tournament)
        year_str = str(YEAR_FILTER)

        while True:
            all_future = True

            for event in events:
                # Pre-filter: quick year check on raw startTime before any mapping
                start_time = event.get('startTime', '')
                if len(start_time) >= 4 and start_time[:4] != year_str:
                    if start_time[:4] <= year_str:
                        all_future = False
                    skipped_count += 1
                    continue

                all_future = False

                mapped = mapper.map_schedule_event(event)
                if not mapped:
                    skipped_count += 1
                    continue

                if not mapped['date_time'] or mapped['date_time'].year != YEAR_FILTER:
                    skipped_count += 1
                    continue

                team1 = mapper.resolve_team(mapped['team1_name'])
                team2 = mapper.resolve_team(mapped['team2_name'])

                if not team1 or not team2:
                    skipped_count += 1
                    continue

                defaults = {
                    'tournament': tournament,
                    'team1': team1,
                    'team2': team2,
                    'date_time': mapped['date_time'],
                    'score': mapped['score'] or '',
                    'vod_link': mapped['vod_link'] or league_vod_fallbacks.get(league_name, ''),
                    'result': _derive_winner(mapped['score'], team1, team2) or mapped['state'] or '',
                    'stats': mapped['stats'],
                }

                _, was_created = Match.objects.update_or_create(
                    external_id=mapped['external_id'],
                    defaults=defaults,
                )

                if was_created:
                    created_count += 1
                else:
                    updated_count += 1

            # Stop paginating once every event on the page is past the target year
            if events and all_future:
                logger.info('fetch_match_schedules: %s — stopping, all events past %d', league_name, YEAR_FILTER)
                break

            page_token = schedule.get('pages', {}).get('newer')
            if not page_token:
                break

            schedule = client.get_schedule(league_id, page_token=page_token)
            if not schedule:
                break
            events = schedule.get('events', [])

    summary = f'fetch_match_schedules: created={created_count}, updated={updated_count}, skipped={skipped_count}'
    logger.info(summary)
    return summary


def fetch_match_results():

    client = LolesportsClient()
    now = timezone.now()
    updated_count = 0
    error_count = 0

    not_completed = Match.objects.filter(
        external_id__isnull=False,
        date_time__lt=now,
        date_time__year=YEAR_FILTER,
    ).exclude(
        stats__state='completed'
    ).order_by('-date_time')[:50]

    missing_details = Match.objects.filter(
        external_id__isnull=False,
        stats__state='completed',
        date_time__year=YEAR_FILTER,
    ).exclude(
        stats__has_key='games'
    ).order_by('-date_time')[:50]

    pending_matches = list(not_completed) + list(missing_details)
    seen = set()
    unique_matches = []
    for m in pending_matches:
        if m.id not in seen:
            seen.add(m.id)
            unique_matches.append(m)

    logger.info('fetch_match_results: checking %d matches (%d not-completed, %d missing-details)',
                len(unique_matches), not_completed.count(), missing_details.count())

    for match in unique_matches:
        details = client.get_event_details(match.external_id)
        if not details:
            error_count += 1
            continue

        mapper = DataMapper()
        update_data = mapper.map_event_details(details)
        if not update_data:
            error_count += 1
            continue

        changed = False
        if update_data['score'] and update_data['score'] != match.score:
            match.score = update_data['score']
            changed = True

        region_vod_fallbacks = {
            'south_korea': 'https://www.youtube.com/@LCKglobal',
            'europe': 'https://www.youtube.com/@LEC',
            'china': 'https://www.youtube.com/@LPL_English',
            'north_america': 'https://www.youtube.com/@LCS',
            'apac': 'https://www.youtube.com/@lolpacificen',
        }

        vod = update_data['vod_link']
        if not vod and not match.vod_link:
            vod = region_vod_fallbacks.get(match.tournament.region, '')
        if vod and vod != match.vod_link:
            match.vod_link = vod
            changed = True

        if update_data['stats'] != match.stats:
            match.stats = update_data['stats']
            changed = True

        winner = _derive_winner(update_data['score'] or match.score, match.team1, match.team2)
        new_result = winner or update_data['state'] or ''
        if new_result and new_result != match.result:
            match.result = new_result
            changed = True

        if changed:
            match.save()
            updated_count += 1

    summary = f'fetch_match_results: updated={updated_count}, errors={error_count}, checked={len(unique_matches)}'
    logger.info(summary)
    return summary
