from django.core.management.base import BaseCommand
from django_q.tasks import schedule
from django_q.models import Schedule

class Command(BaseCommand):
    help = 'Set up the scheduled task for match notifications'

    def handle(self, *args, **options):
        Schedule.objects.filter(name='send_match_notifications').delete()

        schedule(
            'esports.tasks.send_match_notifications',
            name='send_match_notifications',
            schedule_type=Schedule.MINUTES,
            minutes=5,
            repeats=-1,
        )

        self.stdout.write(
            self.style.SUCCESS('Successfully scheduled match notifications task (runs every 5 minutes)')
        )
