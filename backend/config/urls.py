from django.urls import path, include
from rest_framework import routers
from . import views
from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static

admin.site.site_url = 'http://localhost:3000'
admin.site.site_header = 'Rift Pulse Administration'
admin.site.site_title = 'Rift Pulse Admin'
admin.site.index_title = 'Welcome to Rift Pulse Admin'

router = routers.DefaultRouter()
router.register(r'games', views.GameViewSet, basename='game')
router.register(r'teams', views.TeamViewSet, basename='team')
router.register(r'players', views.PlayerViewSet, basename='player')
router.register(r'tournaments', views.TournamentViewSet, basename='tournament')
router.register(r'matches', views.MatchViewSet, basename='match')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('esports.urls')),
    path('api-auth/', include('rest_framework.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)