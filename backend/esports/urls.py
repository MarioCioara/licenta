from django.urls import path, include
from rest_framework import routers
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views, auth_views

router = routers.DefaultRouter()
router.register(r'games', views.GameViewSet, basename='game')
router.register(r'teams', views.TeamViewSet, basename='team')
router.register(r'players', views.PlayerViewSet, basename='player')
router.register(r'tournaments', views.TournamentViewSet, basename='tournament')
router.register(r'matches', views.MatchViewSet, basename='match')

urlpatterns = [
    path('', include(router.urls)),
    path('search/', views.search, name='search'),
    path('auth/register/', auth_views.RegisterView.as_view(), name='register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', auth_views.logout_view, name='logout'),
    path('auth/me/', auth_views.current_user, name='current_user'),
    path('auth/delete-account/', auth_views.delete_account, name='delete_account'),
    path('teams/<int:team_id>/favorite/', auth_views.toggle_favorite_team, name='toggle_favorite_team'),
    path('matches/<int:match_id>/favorite/', auth_views.toggle_favorite_match, name='toggle_favorite_match'),
]