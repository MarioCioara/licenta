import os
import openpyxl
from esports.models import Player
from django.conf import settings
from django.core.management.base import BaseCommand

STAT_COLUMNS = {
    3: 'games',
    4: 'win_rate',
    5: 'kda',
    6: 'avg_kills',
    7: 'avg_deaths',
    8: 'avg_assists',
    9: 'csm',
    10: 'gpm',
    11: 'kp_pct',
    12: 'dmg_pct',
    13: 'gold_pct',
    14: 'vs_pct',
    15: 'dpm',
    16: 'vspm',
    17: 'avg_wpm',
    18: 'avg_wcpm',
    19: 'avg_vwpm',
    20: 'gd_at_15',
    21: 'csg_at_15',
    22: 'xpd_at_15',
    23: 'fb_pct',
    24: 'fb_victim',
    25: 'penta_kills',
    26: 'solo_kills',
}


class Command(BaseCommand):
    help = 'Update player stats from player_stats.xlsx'

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            default=os.path.join('player_stats.xlsx'),
            help='Path to the Excel file (default: player_stats.xlsx in backend/)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be updated without saving',
        )

    def handle(self, *args, **options):

        file_path = options['file']
        dry_run = options['dry_run']

        if not os.path.isabs(file_path):
            file_path = os.path.join(settings.BASE_DIR, file_path)

        if not os.path.exists(file_path):
            self.stderr.write(self.style.ERROR(f'File not found: {file_path}'))
            return

        wb = openpyxl.load_workbook(file_path, read_only=True)
        ws = wb.active

        rows = list(ws.iter_rows(values_only=True))
        wb.close()

        if len(rows) < 2:
            self.stderr.write(self.style.ERROR('Excel file has no data rows.'))
            return

        data_rows = rows[1:]

        updated = 0
        skipped = 0
        not_found = 0

        for row in data_rows:
            nickname = row[0]
            if not nickname:
                skipped += 1
                continue

            nickname = str(nickname).strip()

            player = Player.objects.filter(nickname__iexact=nickname).first()
            if not player:
                not_found += 1
                self.stdout.write(self.style.WARNING(f'  Player not found: {nickname}'))
                continue

            stats = {}
            for col_idx, key in STAT_COLUMNS.items():
                val = row[col_idx - 1] if col_idx - 1 < len(row) else None
                if val is None or val == '-' or val == '':
                    stats[key] = None
                elif isinstance(val, (int, float)):
                    stats[key] = val
                else:
                    try:
                        stats[key] = float(val)
                    except (ValueError, TypeError):
                        stats[key] = None

            if dry_run:
                self.stdout.write(f'  [DRY RUN] Would update {nickname}: {stats}')
            else:
                player.stats = stats
                player.save(update_fields=['stats'])

            updated += 1

        prefix = '[DRY RUN] ' if dry_run else ''
        self.stdout.write(self.style.SUCCESS(
            f'{prefix}Done — updated: {updated}, not found: {not_found}, skipped: {skipped}'
        ))
