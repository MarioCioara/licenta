import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import UserProfile, Match
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

logger = logging.getLogger('esports')

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()


@receiver(post_save, sender=Match)
def broadcast_match_update(sender, instance, **kwargs):
    try:

        channel_layer = get_channel_layer()
        if channel_layer is None:
            return

        async_to_sync(channel_layer.group_send)(
            'matches',
            {
                'type': 'match_update',
                'content': {
                    'match_id': instance.id,
                    'external_id': instance.external_id,
                    'team1': instance.team1.name if instance.team1 else None,
                    'team2': instance.team2.name if instance.team2 else None,
                    'score': instance.score,
                    'state': instance.stats.get('state', '') if isinstance(instance.stats, dict) else '',
                    'date_time': instance.date_time.isoformat() if instance.date_time else None,
                },
            }
        )
    except Exception:
        logger.debug('Could not broadcast match update for match %s', instance.id, exc_info=True)
