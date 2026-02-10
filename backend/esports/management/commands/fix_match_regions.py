from django.core.management.base import BaseCommand
from esports.models import Match, Tournament

LCK_TEAMS = {
    'T1', 'Gen.G Esports', 'DRX', 'Dplus KIA', 'FEARX', 'OKSavingsBank BRION',
    'Kwangdong Freecs', 'Hanwha Life Esports', 'Nongshim RedForce', 'KT Rolster',
    'BRION', 'SOOPers',
}

LEC_TEAMS = {
    'G2 Esports', 'Fnatic', 'Karmine Corp Blue', 'KOI', 'GIANTX', 'Natus Vincere',
    'Team BDS', 'Rogue', 'Team Heretics', 'SK Gaming', 'Team Vitality',
    'Karmine Corp', 'Los Ratones', 'Shifters',
}

LPL_TEAMS = {
    'Oh My God', 'Top Esports', 'Weibo Gaming', 'Team WE', 'EDward Gaming',
    'Invictus Gaming', 'JD Gaming', 'LGD Gaming', 'LNG Esports',
    'ThunderTalk Gaming', 'Ultra Prime', 'Bilibili Gaming', "Anyone's Legend",
    'Ninjas in Pyjamas', 'Royal Never Give Up', 'FunPlus Phoenix',
}

LCS_TEAMS = {
    'Team Liquid', 'FlyQuest', 'Shopify Rebellion', 'Sentinels', 'LYON Gaming',
    'Disguised', 'Cloud9', '100 Thieves', 'Immortals', 'NRG', 'Dignitas', 'TSM',
}

APAC_TEAMS = {
    'Deep Cross Gaming', 'CTBC Flying Oyster', 'GAM Esports', 'DetonatioN FocusMe',
    'Ground Zero Gaming', 'MVK Esports', 'Secret Whales',
    'Fukuoka SoftBank HAWKS gaming',
}

TEAM_TO_REGION = {}
for team in LCK_TEAMS:
    TEAM_TO_REGION[team] = 'south_korea'
for team in LEC_TEAMS:
    TEAM_TO_REGION[team] = 'europe'
for team in LPL_TEAMS:
    TEAM_TO_REGION[team] = 'china'
for team in LCS_TEAMS:
    TEAM_TO_REGION[team] = 'north_america'
for team in APAC_TEAMS:
    TEAM_TO_REGION[team] = 'apac'


class Command(BaseCommand):
    help = 'Fix matches assigned to wrong tournaments by reassigning based on team names'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be changed without saving',
        )

    def handle(self, *args, **options):

        dry_run = options['dry_run']
        fixed = 0
        skipped = 0
        already_correct = 0

        for match in Match.objects.select_related('team1', 'team2', 'tournament').all():
            team1_name = match.team1.name
            team2_name = match.team2.name

            correct_region = TEAM_TO_REGION.get(team1_name) or TEAM_TO_REGION.get(team2_name)

            if not correct_region:
                self.stdout.write(self.style.WARNING(
                    f'Unknown teams: {team1_name} vs {team2_name} (match #{match.id})'
                ))
                skipped += 1
                continue

            if match.tournament.region == correct_region:
                already_correct += 1
                continue

            correct_tournament = Tournament.objects.filter(
                region=correct_region
            ).order_by('-start_date').first()

            if not correct_tournament:
                self.stdout.write(self.style.WARNING(
                    f'No tournament for region {correct_region}: {match}'
                ))
                skipped += 1
                continue

            old_name = match.tournament.name
            if dry_run:
                self.stdout.write(
                    f'[DRY RUN] {team1_name} vs {team2_name} | {old_name} -> {correct_tournament.name}'
                )
            else:
                match.tournament = correct_tournament
                match.save()
                self.stdout.write(
                    f'Fixed: {team1_name} vs {team2_name} | {old_name} -> {correct_tournament.name}'
                )
            fixed += 1

        prefix = '[DRY RUN] ' if dry_run else ''
        self.stdout.write(self.style.SUCCESS(
            f'{prefix}Done. Fixed {fixed}, already correct {already_correct}, skipped {skipped}.'
        ))
