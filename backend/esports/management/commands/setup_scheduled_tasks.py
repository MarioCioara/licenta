from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Set up Django-Q scheduled tasks for match fetching and notifications'

    def handle(self, *args, **options):
        from django_q.models import Schedule

        schedules = [
            {
                'name': 'send_match_notifications',
                'func': 'esports.tasks.send_match_notifications',
                'minutes': 5,
            },
            {
                'name': 'fetch_match_schedules',
                'func': 'esports.tasks.fetch_match_schedules',
                'minutes': 15,
            },
            {
                'name': 'fetch_match_results',
                'func': 'esports.tasks.fetch_match_results',
                'minutes': 5,
            },
        ]

        for sched in schedules:
            obj, created = Schedule.objects.update_or_create(
                name=sched['name'],
                defaults={
                    'func': sched['func'],
                    'schedule_type': Schedule.MINUTES,
                    'minutes': sched['minutes'],
                    'repeats': -1,  # Run indefinitely
                },
            )
            status = 'Created' if created else 'Updated'
            self.stdout.write(self.style.SUCCESS(
                f'{status} schedule: {sched["name"]} (every {sched["minutes"]} min)'
            ))

        self.stdout.write(self.style.SUCCESS('All scheduled tasks configured.'))
