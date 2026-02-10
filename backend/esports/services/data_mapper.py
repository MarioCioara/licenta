import logging
from datetime import datetime, timezone
from django.db.models import Q
from ..models import Team, Tournament
from .team_name_aliases import TEAM_NAME_ALIASES

logger = logging.getLogger('esports')

class DataMapper:

    def __init__(self, tournament=None):
        self._team_cache = {}
        self._tournament = tournament

    def resolve_team(self, api_team_name):
        if api_team_name in self._team_cache:
            return self._team_cache[api_team_name]

        db_name = TEAM_NAME_ALIASES.get(api_team_name, api_team_name)

        team = Team.objects.filter(name=db_name).first()
        if team:
            self._team_cache[api_team_name] = team
            return team

        team = Team.objects.filter(name__icontains=db_name).first()
        if team:
            self._team_cache[api_team_name] = team
            return team

        if self._tournament:
            participants = self._tournament.participants.all()
        else:
            participants = Team.objects.all()

        for t in participants:
            if t.name.lower() in api_team_name.lower() or api_team_name.lower() in t.name.lower():
                self._team_cache[api_team_name] = t
                return t

        logger.warning('Could not resolve team name: %s', api_team_name)
        self._team_cache[api_team_name] = None
        return None


    @staticmethod
    def resolve_tournament(tournament_name, league_name=None):
        qs = Tournament.objects.all()
        t = qs.filter(name__iexact=tournament_name).first()
        if t:
            return t
        t = qs.filter(name__icontains=tournament_name).first()
        if t:
            return t
        if league_name:
            t = qs.filter(name__icontains=league_name).first()
            if t:
                return t
        return None


    def map_schedule_event(self, event):
        external_id = event.get('match', {}).get('id') or event.get('id')
        if not external_id:
            return None

        # Teams
        match_info = event.get('match', {})
        teams = match_info.get('teams', [])
        if len(teams) < 2:
            return None

        team1_name = teams[0].get('name', '')
        team2_name = teams[1].get('name', '')

        if not team1_name or not team2_name:
            return None
        if team1_name.lower() in ('tbd', 'to be determined') or team2_name.lower() in ('tbd', 'to be determined'):
            return None

        start_time_str = event.get('startTime', '')
        try:
            dt = datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            dt = None

        state = event.get('state', 'unstarted')

        block_name = event.get('blockName', '')

        score = ''
        team1_wins = teams[0].get('result', {}).get('gameWins')
        team2_wins = teams[1].get('result', {}).get('gameWins')
        if team1_wins is not None and team2_wins is not None:
            score = f'{team1_wins}-{team2_wins}'

        strategy = match_info.get('strategy', {})
        strategy_type = strategy.get('type', '')
        strategy_count = strategy.get('count', 0)
        best_of = f'Bo{strategy_count}' if strategy_count else ''

        vod_link = ''
        games = match_info.get('games', [])
        for game in games:
            vods = game.get('vods', [])
            for vod in vods:
                if vod.get('parameter'):
                    vod_link = f'https://www.youtube.com/watch?v={vod["parameter"]}'
                    break
            if vod_link:
                break

        stats = {
            'state': state,
            'block_name': block_name,
            'best_of': best_of,
        }
        if games:
            stats['games'] = [
                {
                    'number': g.get('number'),
                    'state': g.get('state', ''),
                    'vods': [
                        {'parameter': v.get('parameter', ''), 'locale': v.get('locale', '')}
                        for v in g.get('vods', [])
                    ]
                }
                for g in games
            ]

        return {
            'external_id': str(external_id),
            'date_time': dt,
            'team1_name': team1_name,
            'team2_name': team2_name,
            'score': score,
            'vod_link': vod_link,
            'stats': stats,
            'state': state,
        }

    def map_event_details(self, event_detail):
        """Map detailed event info (from getEventDetails) to update fields.

        Returns a dict with: score, vod_link, stats, state.
        Returns None if unmappable.
        """
        if not event_detail:
            return None

        match_info = event_detail.get('match', {})
        teams = match_info.get('teams', [])

        score = ''
        team_id_map = {}
        if len(teams) >= 2:
            t1_wins = teams[0].get('result', {}).get('gameWins')
            t2_wins = teams[1].get('result', {}).get('gameWins')
            if t1_wins is not None and t2_wins is not None:
                score = f'{t1_wins}-{t2_wins}'
            for t in teams:
                tid = t.get('id', '')
                team_id_map[tid] = {
                    'name': t.get('name', ''),
                    'code': t.get('code', ''),
                }

        vod_link = ''
        games = match_info.get('games', [])
        for game in games:
            for vod in game.get('vods', []):
                if vod.get('parameter') and vod.get('locale', '').startswith('en'):
                    vod_link = f'https://www.youtube.com/watch?v={vod["parameter"]}'
                    break
            if vod_link:
                break
        if not vod_link:
            for game in games:
                for vod in game.get('vods', []):
                    if vod.get('parameter'):
                        vod_link = f'https://www.youtube.com/watch?v={vod["parameter"]}'
                        break
                if vod_link:
                    break

        state = event_detail.get('state') or match_info.get('state') or ''
        if not state and games:
            game_states = [g.get('state', '') for g in games]
            finished_states = {'completed', 'unneeded'}
            if all(s in finished_states for s in game_states):
                state = 'completed'
            elif any(s == 'inProgress' for s in game_states):
                state = 'inProgress'
            elif any(s == 'completed' for s in game_states):
                state = 'inProgress'
            else:
                state = 'unstarted'

        strategy = match_info.get('strategy', {})
        best_of = f'Bo{strategy.get("count", 0)}' if strategy.get('count') else ''

        stats = {
            'state': state,
            'block_name': event_detail.get('blockName', ''),
            'best_of': best_of,
        }
        if games:
            stats['games'] = []
            for g in games:
                game_teams = []
                for gt in g.get('teams', []):
                    tid = gt.get('id', '')
                    info = team_id_map.get(tid, {})
                    game_teams.append({
                        'name': info.get('name', ''),
                        'code': info.get('code', ''),
                        'side': gt.get('side', ''),
                    })

                stats['games'].append({
                    'number': g.get('number'),
                    'state': g.get('state', ''),
                    'teams': game_teams,
                    'vods': [
                        {'parameter': v.get('parameter', ''), 'locale': v.get('locale', '')}
                        for v in g.get('vods', [])
                    ]
                })

        return {
            'score': score,
            'vod_link': vod_link,
            'stats': stats,
            'state': state,
        }
