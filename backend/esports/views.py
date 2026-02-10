from rest_framework import viewsets
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django.db.models import Q
from .models import Game, Team, Player, Tournament, Match
from .serializers import GameSerializer, TeamSerializer, TeamDetailSerializer, PlayerSerializer, TournamentSerializer, TournamentDetailSerializer, MatchSerializer
from datetime import timedelta
from django.utils import timezone
from datetime import datetime

@api_view(['GET'])
def search(request):
    """Search across teams, players, and tournaments."""
    query = request.query_params.get('q', '').strip()

    if not query or len(query) < 2:
        return Response({
            'teams': [],
            'players': [],
            'tournaments': []
        })

    teams = Team.objects.filter(
        Q(name__icontains=query) |
        Q(country__icontains=query)
    )[:10]

    players = Player.objects.filter(
        Q(nickname__icontains=query) |
        Q(real_name__icontains=query)
    ).select_related('team')[:10]

    tournaments = Tournament.objects.filter(
        Q(name__icontains=query) |
        Q(location__icontains=query)
    )[:10]

    return Response({
        'teams': TeamSerializer(teams, many=True, context={'request': request}).data,
        'players': PlayerSerializer(players, many=True).data,
        'tournaments': TournamentSerializer(tournaments, many=True).data
    })

class GameViewSet(viewsets.ModelViewSet):
    queryset = Game.objects.all()
    serializer_class = GameSerializer

class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TeamDetailSerializer
        return TeamSerializer

    def get_queryset(self):
        queryset = Team.objects.all()
        region = self.request.query_params.get('region', None)
        if region:
            queryset = queryset.filter(region=region)
        return queryset

    @action(detail=True, methods=['get'])
    def tournament_results(self, request, pk=None):
        """Get tournament results for this team."""
        team = self.get_object()

        matches = Match.objects.filter(
            Q(team1=team) | Q(team2=team)
        ).select_related('tournament', 'team1', 'team2').order_by('-date_time')

        tournaments_data = {}
        for match in matches:
            tournament_id = match.tournament.id
            if tournament_id not in tournaments_data:
                tournaments_data[tournament_id] = {
                    'tournament_id': tournament_id,
                    'tournament_name': match.tournament.name,
                    'tournament_status': match.tournament.status,
                    'start_date': match.tournament.start_date,
                    'wins': 0,
                    'losses': 0,
                    'total_matches': 0,
                }

            if 'completed' in match.stats.get('state', '').lower():
                tournaments_data[tournament_id]['total_matches'] += 1

                if match.score and '-' in match.score:
                    scores = match.score.split('-')
                    if len(scores) == 2:
                        try:
                            if match.team1 == team:
                                team_score = int(scores[0])
                                opponent_score = int(scores[1])
                            else:
                                team_score = int(scores[1])
                                opponent_score = int(scores[0])

                            if team_score > opponent_score:
                                tournaments_data[tournament_id]['wins'] += 1
                            else:
                                tournaments_data[tournament_id]['losses'] += 1
                        except (ValueError, IndexError):
                            pass

        results = list(tournaments_data.values())
        results.sort(key=lambda x: x['start_date'], reverse=True)

        return Response(results)

class PlayerViewSet(viewsets.ModelViewSet):
    queryset = Player.objects.all()
    serializer_class = PlayerSerializer

    def get_queryset(self):
        queryset = Player.objects.all()
        region = self.request.query_params.get('region', None)
        if region:
            queryset = queryset.filter(team__region=region)
        return queryset

class TournamentViewSet(viewsets.ModelViewSet):
    queryset = Tournament.objects.all()
    serializer_class = TournamentSerializer

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TournamentDetailSerializer
        return TournamentSerializer

    def get_queryset(self):
        queryset = Tournament.objects.filter(
            game__name__icontains='league',
            start_date__year=2026
        )
        region = self.request.query_params.get('region', None)
        if region:
            queryset = queryset.filter(
                Q(region=region) | Q(participants__region=region)
            ).distinct()
        return queryset

    @action(detail=True, methods=['get'])
    def standings(self, request, pk=None):
        """Calculate tournament standings based on match results."""

        tournament = self.get_object()
        teams = tournament.participants.all()

        tournament_start = tournament.start_date if tournament.start_date else timezone.make_aware(datetime(2026, 1, 17))

        if 'LPL' in tournament.name and '2026' in tournament.name and 'Split 1' in tournament.name:
            groups = {
                'Group Ascend': ['Bilibili Gaming', "Anyone's Legend", 'Top Esports',
                                'Invictus Gaming', 'JD Gaming', 'Weibo Gaming'],
                'Group Perseverance': ['Ninjas in Pyjamas', 'Team WE', 'EDward Gaming',
                                      'ThunderTalk Gaming'],
                'Group Nirvana': ['LGD Gaming', 'LNG Esports', 'Oh My God', 'Ultra Prime']
            }

            all_group_standings = []

            for group_name, team_names in groups.items():
                group_standings = []

                for team_name in team_names:
                    team = teams.filter(name=team_name).first()
                    if not team:
                        continue

                    team_matches = Match.objects.filter(
                        tournament=tournament,
                        date_time__gte=tournament_start
                    ).filter(
                        Q(team1=team) | Q(team2=team)
                    )

                    wins = 0
                    losses = 0
                    games_won = 0
                    games_lost = 0

                    for match in team_matches:
                        opponent = match.team2 if match.team1 == team else match.team1
                        if opponent.name not in team_names:
                            continue

                        if match.score and '-' in match.score:
                            scores = match.score.split('-')
                            if len(scores) == 2:
                                try:
                                    if match.team1 == team:
                                        team_games = int(scores[0])
                                        opponent_games = int(scores[1])
                                    else:
                                        team_games = int(scores[1])
                                        opponent_games = int(scores[0])

                                    games_won += team_games
                                    games_lost += opponent_games

                                    if team_games > opponent_games:
                                        wins += 1
                                    else:
                                        losses += 1
                                except (ValueError, IndexError):
                                    continue

                    group_standings.append({
                        'team_id': team.id,
                        'team_name': team_name,
                        'wins': wins,
                        'losses': losses,
                        'games_won': games_won,
                        'games_lost': games_lost,
                        'game_differential': games_won - games_lost,
                    })

                group_standings.sort(key=lambda x: (-x['wins'], -x['game_differential'], -x['games_won']))

                for rank, standing in enumerate(group_standings, 1):
                    all_group_standings.append({
                        **standing,
                        'group': group_name,
                        'rank': rank
                    })

            return Response(all_group_standings)

        standings = []
        for team in teams:
            team_matches = Match.objects.filter(
                tournament=tournament,
                date_time__gte=tournament_start
            ).filter(
                Q(team1=team) | Q(team2=team)
            )

            wins = 0
            losses = 0
            games_won = 0
            games_lost = 0

            for match in team_matches:
                if 'completed' not in match.stats.get('state', '').lower():
                    continue

                if match.score and '-' in match.score:
                    scores = match.score.split('-')
                    if len(scores) == 2:
                        try:
                            if match.team1 == team:
                                team_games = int(scores[0])
                                opponent_games = int(scores[1])
                            else:
                                team_games = int(scores[1])
                                opponent_games = int(scores[0])

                            games_won += team_games
                            games_lost += opponent_games

                            if team_games > opponent_games:
                                wins += 1
                            else:
                                losses += 1
                        except (ValueError, IndexError):
                            continue

            standings.append({
                'team_id': team.id,
                'team_name': team.name,
                'wins': wins,
                'losses': losses,
                'games_won': games_won,
                'games_lost': games_lost,
                'game_differential': games_won - games_lost,
            })

        standings.sort(key=lambda x: (-x['wins'], -x['game_differential'], -x['games_won']))

        return Response(standings)

class MatchViewSet(viewsets.ModelViewSet):
    queryset = Match.objects.all()
    serializer_class = MatchSerializer

    def get_queryset(self):

        queryset = Match.objects.exclude(
            Q(team1__isnull=True) | Q(team2__isnull=True) |
            Q(team1__name__iexact='TBD') | Q(team2__name__iexact='TBD') |
            Q(team1__name__iexact='To Be Determined') | Q(team2__name__iexact='To Be Determined')
        )

        tournament_id = self.request.query_params.get('tournament', None)
        if tournament_id:
            queryset = queryset.filter(tournament_id=tournament_id)
        else:
            cutoff = timezone.now() + timedelta(days=14)
            queryset = queryset.filter(date_time__lte=cutoff)

        return queryset.order_by('date_time')