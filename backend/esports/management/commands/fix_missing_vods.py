from django.core.management.base import BaseCommand

REGION_VOD_DEFAULTS = {
    'south_korea': 'https://www.youtube.com/@LCKglobal',
    'europe': 'https://www.youtube.com/@LEC',
    'china': 'https://www.youtube.com/@LPL_English',
    'north_america': 'https://www.youtube.com/@LCS',
    'apac': 'https://www.youtube.com/@lolpacificen',
}

class Command(BaseCommand):
    help = 'Fill in missing VOD links with default YouTube channels based on region'

    def handle(self, *args, **options):
        from esports.models import Match

        fixed = 0
        for match in Match.objects.select_related('tournament').filter(vod_link=''):
            region = match.tournament.region
            default_vod = REGION_VOD_DEFAULTS.get(region)
            if default_vod:
                match.vod_link = default_vod
                match.save()
                fixed += 1

        self.stdout.write(self.style.SUCCESS(f'Done. Updated {fixed} matches with default VOD links.'))
