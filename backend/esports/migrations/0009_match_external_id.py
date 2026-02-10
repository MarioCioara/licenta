from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('esports', '0008_userprofile_notificationlog'),
    ]

    operations = [
        migrations.AddField(
            model_name='match',
            name='external_id',
            field=models.CharField(
                max_length=200, blank=True, null=True, unique=True,
                help_text='External match ID from lolesports API'
            ),
        ),
    ]
