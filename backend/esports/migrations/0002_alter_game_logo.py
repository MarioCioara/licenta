# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('esports', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='game',
            name='logo',
            field=models.ImageField(blank=True, null=True, upload_to='game_logos/'),
        ),
    ]
