from django.contrib import admin
from django import forms
from esports.models import Game, Team, Player, Tournament, Match

class TeamAdminForm(forms.ModelForm):
    social_media = forms.JSONField(
        required=False,
        widget=forms.Textarea(attrs={'rows': 4, 'cols': 60}),
        initial=dict,
        help_text='Enter valid JSON, e.g., {"twitter": "https://twitter.com/team", "website": "https://team.com"}'
    )

    class Meta:
        model = Team
        fields = '__all__'

class PlayerAdminForm(forms.ModelForm):
    social_media = forms.JSONField(
        required=False,
        widget=forms.Textarea(attrs={'rows': 4, 'cols': 60}),
        initial=dict,
        help_text='Enter valid JSON, e.g., {"twitter": "https://twitter.com/player"}'
    )
    stats = forms.JSONField(
        required=False,
        widget=forms.Textarea(attrs={'rows': 4, 'cols': 60}),
        initial=dict,
        help_text='Enter valid JSON for player stats'
    )

    class Meta:
        model = Player
        fields = '__all__'

class MatchAdminForm(forms.ModelForm):
    stats = forms.JSONField(
        required=False,
        widget=forms.Textarea(attrs={'rows': 6, 'cols': 60}),
        initial=dict,
        help_text='Enter valid JSON for match stats (state, games, etc.)'
    )

    class Meta:
        model = Match
        fields = '__all__'

@admin.register(Game)
class GameAdmin(admin.ModelAdmin):
    list_display = ['name', 'developer', 'publisher']
    search_fields = ['name']

@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    form = TeamAdminForm
    list_display = ['name', 'region', 'country', 'founded_date']
    list_filter = ['region', 'country']
    search_fields = ['name', 'country']

@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    form = PlayerAdminForm
    list_display = ['nickname', 'real_name', 'team', 'role', 'country']
    list_filter = ['role', 'country', 'team']
    search_fields = ['nickname', 'real_name']

@admin.register(Tournament)
class TournamentAdmin(admin.ModelAdmin):
    list_display = ['name', 'game', 'region', 'start_date', 'end_date', 'status']
    list_filter = ['region', 'status', 'game']
    search_fields = ['name', 'location']
    date_hierarchy = 'start_date'

@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    form = MatchAdminForm
    list_display = ['id', 'tournament', 'team1', 'team2', 'date_time', 'score', 'result']
    list_filter = ['tournament', 'date_time']
    search_fields = ['team1__name', 'team2__name']
    date_hierarchy = 'date_time'
