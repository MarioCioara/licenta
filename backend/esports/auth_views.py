from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.models import User
from .serializers import RegisterSerializer, UserSerializer
from .models import Team, Match

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)

        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        refresh_token = request.data.get('refresh')
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({'detail': 'Successfully logged out.'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_favorite_team(request, team_id):
    try:
        team = Team.objects.get(id=team_id)
        profile = request.user.profile

        if team in profile.favorite_teams.all():
            profile.favorite_teams.remove(team)
            return Response({'detail': 'Team removed from favorites.', 'is_favorite': False})
        else:
            profile.favorite_teams.add(team)
            return Response({'detail': 'Team added to favorites.', 'is_favorite': True})
    except Team.DoesNotExist:
        return Response({'detail': 'Team not found.'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_favorite_match(request, match_id):
    try:
        match = Match.objects.get(id=match_id)
        profile = request.user.profile

        if match in profile.favorite_matches.all():
            profile.favorite_matches.remove(match)
            return Response({'detail': 'Match removed from favorites.', 'is_favorite': False})
        else:
            profile.favorite_matches.add(match)
            return Response({'detail': 'Match added to favorites.', 'is_favorite': True})
    except Match.DoesNotExist:
        return Response({'detail': 'Match not found.'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_account(request):
    user = request.user
    user.delete()
    return Response({'detail': 'Account deleted successfully.'}, status=status.HTTP_200_OK)
