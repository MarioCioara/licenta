# Generated manually – seed tournaments from the past year for the 5 focus games

from django.db import migrations
from datetime import datetime


def seed_tournaments(apps, schema_editor):
    Game = apps.get_model('esports', 'Game')
    Tournament = apps.get_model('esports', 'Tournament')

    tournaments_data = [
        # League of Legends
        {
            'game_name': 'League of Legends',
            'name': 'MSI 2024',
            'start_date': datetime(2024, 5, 1, 0, 0, 0),
            'end_date': datetime(2024, 5, 19, 23, 59, 59),
            'prize_pool': 250_000,
            'location': 'Chengdu, China',
            'format': 'Play-In + Bracket, 12 teams',
            'status': 'completed',
        },
        {
            'game_name': 'League of Legends',
            'name': 'World Championship 2024',
            'start_date': datetime(2024, 9, 25, 0, 0, 0),
            'end_date': datetime(2024, 11, 2, 23, 59, 59),
            'prize_pool': 450_000,
            'location': 'Berlin, Paris, London',
            'format': 'Play-In, Swiss Stage, Playoffs',
            'status': 'completed',
        },
        # Valorant
        {
            'game_name': 'Valorant',
            'name': 'Valorant Champions 2024',
            'start_date': datetime(2024, 8, 1, 0, 0, 0),
            'end_date': datetime(2024, 8, 25, 23, 59, 59),
            'prize_pool': 2_250_000,
            'location': 'Seoul, South Korea',
            'format': 'Group Stage + Playoffs',
            'status': 'completed',
        },
        {
            'game_name': 'Valorant',
            'name': 'VCT Masters Madrid 2024',
            'start_date': datetime(2024, 3, 14, 0, 0, 0),
            'end_date': datetime(2024, 3, 24, 23, 59, 59),
            'prize_pool': 500_000,
            'location': 'Madrid, Spain',
            'format': '8 teams, Double Elimination',
            'status': 'completed',
        },
        # Counter-Strike
        {
            'game_name': 'Counter-Strike',
            'name': 'IEM Katowice 2024',
            'start_date': datetime(2024, 1, 31, 0, 0, 0),
            'end_date': datetime(2024, 2, 11, 23, 59, 59),
            'prize_pool': 1_000_000,
            'location': 'Katowice, Poland',
            'format': 'Play-In, Groups, Playoffs',
            'status': 'completed',
        },
        {
            'game_name': 'Counter-Strike',
            'name': 'PGL Major Copenhagen 2024',
            'start_date': datetime(2024, 3, 17, 0, 0, 0),
            'end_date': datetime(2024, 3, 31, 23, 59, 59),
            'prize_pool': 1_250_000,
            'location': 'Copenhagen, Denmark',
            'format': 'Swiss + Playoffs, 24 teams',
            'status': 'completed',
        },
        {
            'game_name': 'Counter-Strike',
            'name': 'IEM Cologne 2024',
            'start_date': datetime(2024, 8, 7, 0, 0, 0),
            'end_date': datetime(2024, 8, 18, 23, 59, 59),
            'prize_pool': 1_000_000,
            'location': 'Cologne, Germany',
            'format': 'Play-In, Groups, Playoffs',
            'status': 'completed',
        },
        # Dota 2
        {
            'game_name': 'Dota 2',
            'name': 'The International 2024',
            'start_date': datetime(2024, 9, 4, 0, 0, 0),
            'end_date': datetime(2024, 9, 15, 23, 59, 59),
            'prize_pool': 2_776_566,
            'location': 'Copenhagen, Denmark',
            'format': 'Group Stage + Double Elimination Playoffs',
            'status': 'completed',
        },
        # Age of Empires II
        {
            'game_name': 'Age of Empires II',
            'name': 'King of the Desert 5',
            'start_date': datetime(2024, 11, 22, 0, 0, 0),
            'end_date': datetime(2024, 12, 21, 23, 59, 59),
            'prize_pool': 50_600,
            'location': 'Online',
            'format': '1v1, Single Elimination',
            'status': 'completed',
        },
        {
            'game_name': 'Age of Empires II',
            'name': 'NAC5 - Nations Cup',
            'start_date': datetime(2024, 6, 1, 0, 0, 0),
            'end_date': datetime(2024, 7, 14, 23, 59, 59),
            'prize_pool': 25_000,
            'location': 'Online',
            'format': 'Team-based, Group Stage + Playoffs',
            'status': 'completed',
        },
    ]

    for data in tournaments_data:
        game = Game.objects.filter(name=data['game_name']).first()
        if not game:
            continue
        Tournament.objects.get_or_create(
            name=data['name'],
            game=game,
            defaults={
                'start_date': data['start_date'],
                'end_date': data['end_date'],
                'prize_pool': data['prize_pool'],
                'location': data['location'],
                'format': data['format'],
                'status': data['status'],
            },
        )


def remove_tournaments(apps, schema_editor):
    Tournament = apps.get_model('esports', 'Tournament')
    names = [
        'MSI 2024', 'World Championship 2024',
        'Valorant Champions 2024', 'VCT Masters Madrid 2024',
        'IEM Katowice 2024', 'PGL Major Copenhagen 2024', 'IEM Cologne 2024',
        'The International 2024',
        'King of the Desert 5', 'NAC5 - Nations Cup',
    ]
    Tournament.objects.filter(name__in=names).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('esports', '0003_seed_focus_games'),
    ]

    operations = [
        migrations.RunPython(seed_tournaments, remove_tournaments),
    ]
