from django.core.management.base import BaseCommand
from esports.tasks import fetch_match_schedules, fetch_match_results

class Command(BaseCommand):
    help = 'Fetch match schedules and/or results from lolesports API (one-shot)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--schedules-only',
            action='store_true',
            help='Only fetch schedules (skip results)',
        )
        parser.add_argument(
            '--results-only',
            action='store_true',
            help='Only fetch results (skip schedules)',
        )

    def handle(self, *args, **options):

        schedules_only = options['schedules_only']
        results_only = options['results_only']

        if not results_only:
            self.stdout.write('Fetching match schedules...')
            result = fetch_match_schedules()
            self.stdout.write(self.style.SUCCESS(result))

        if not schedules_only:
            self.stdout.write('Fetching match results...')
            result = fetch_match_results()
            self.stdout.write(self.style.SUCCESS(result))

        self.stdout.write(self.style.SUCCESS('Done.'))
