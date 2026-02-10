# Generated manually – seed focus games for the esports app

from django.db import migrations
from datetime import date


def create_focus_games(apps, schema_editor):
    Game = apps.get_model('esports', 'Game')
    games_data = [
        {
            'name': 'League of Legends',
            'description': 'League of Legends is a team-based strategy game where two teams of five powerful champions face off to destroy the other\'s base. Choose from over 160 champions to make epic plays, secure kills, and take down towers as you battle your way to victory.',
            'release_date': date(2009, 10, 27),
            'developer': 'Riot Games',
            'publisher': 'Riot Games',
        },
        {
            'name': 'Valorant',
            'description': 'Valorant is a tactical first-person shooter where two teams of five compete to plant or defuse the Spike. Mix of precise gunplay and unique agent abilities in round-based matches.',
            'release_date': date(2020, 6, 2),
            'developer': 'Riot Games',
            'publisher': 'Riot Games',
        },
        {
            'name': 'Counter-Strike',
            'description': 'Counter-Strike is a competitive first-person shooter. Teams of terrorists and counter-terrorists battle in objective-based rounds. The franchise includes CS:GO and Counter-Strike 2, defining tactical esports FPS.',
            'release_date': date(2012, 8, 21),  # CS:GO release
            'developer': 'Valve',
            'publisher': 'Valve',
        },
        {
            'name': 'Dota 2',
            'description': 'Dota 2 is a multiplayer online battle arena (MOBA) where two teams of five players defend their base and destroy the enemy Ancient. Deep strategy, hundreds of heroes, and one of the largest esports prize pools.',
            'release_date': date(2013, 7, 9),
            'developer': 'Valve',
            'publisher': 'Valve',
        },
        {
            'name': 'Age of Empires II',
            'description': 'Age of Empires II is a real-time strategy game set in the Middle Ages. Build civilizations, gather resources, raise armies, and conquer in competitive 1v1 or team matches. A classic RTS with a thriving competitive scene.',
            'release_date': date(2019, 11, 14),  # Definitive Edition
            'developer': 'Forgotten Empires',
            'publisher': 'Xbox Game Studios',
        },
    ]
    for data in games_data:
        Game.objects.get_or_create(
            name=data['name'],
            defaults=data,
        )


def remove_focus_games(apps, schema_editor):
    Game = apps.get_model('esports', 'Game')
    names = [
        'League of Legends', 'Valorant', 'Counter-Strike',
        'Dota 2', 'Age of Empires II',
    ]
    Game.objects.filter(name__in=names).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('esports', '0002_alter_game_logo'),
    ]

    operations = [
        migrations.RunPython(create_focus_games, remove_focus_games),
    ]
