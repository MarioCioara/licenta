from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework.validators import UniqueValidator
from esports.models import Game, Team, Player, Tournament, Match
from esports.models import Player
from django.conf import settings

class GameSerializer(serializers.ModelSerializer):
    class Meta:
        model = Game
        fields = '__all__'

class TeamSerializer(serializers.ModelSerializer):
    region_display = serializers.CharField(source='get_region_display', read_only=True)
    logo = serializers.SerializerMethodField()

    class Meta:
        model = Team
        fields = '__all__'

    def get_logo(self, obj):
        if obj.logo:
            if obj.logo.startswith('http://') or obj.logo.startswith('https://'):
                return obj.logo

            request = self.context.get('request')
            if request:
                logo_url = f"{settings.MEDIA_URL}{obj.logo}"
                return request.build_absolute_uri(logo_url)
            return obj.logo
        return None

class PlayerSerializer(serializers.ModelSerializer):
    team_name = serializers.CharField(source='team.name', read_only=True, allow_null=True)

    class Meta:
        model = Player
        fields = '__all__'

class TeamDetailSerializer(serializers.ModelSerializer):
    region_display = serializers.CharField(source='get_region_display', read_only=True)
    game_name = serializers.CharField(source='game.name', read_only=True)
    current_players = serializers.SerializerMethodField()
    logo = serializers.SerializerMethodField()

    class Meta:
        model = Team
        fields = '__all__'

    def get_current_players(self, obj):
        current_players = Player.objects.filter(team=obj)
        return PlayerSerializer(current_players, many=True).data

    def get_logo(self, obj):
        if obj.logo:
            if obj.logo.startswith('http://') or obj.logo.startswith('https://'):
                return obj.logo

            request = self.context.get('request')
            if request:
                logo_url = f"{settings.MEDIA_URL}{obj.logo}"
                return request.build_absolute_uri(logo_url)
            return obj.logo
        return None

class TournamentSerializer(serializers.ModelSerializer):
    game_name = serializers.CharField(source='game.name', read_only=True)
    region_display = serializers.CharField(source='get_region_display', read_only=True)

    class Meta:
        model = Tournament
        fields = '__all__'

class TournamentDetailSerializer(serializers.ModelSerializer):
    game_name = serializers.CharField(source='game.name', read_only=True)
    region_display = serializers.CharField(source='get_region_display', read_only=True)
    participants = TeamSerializer(many=True, read_only=True)

    class Meta:
        model = Tournament
        fields = '__all__'

class MatchSerializer(serializers.ModelSerializer):
    team1_name = serializers.CharField(source='team1.name', read_only=True)
    team2_name = serializers.CharField(source='team2.name', read_only=True)
    tournament_name = serializers.CharField(source='tournament.name', read_only=True)
    tournament_region = serializers.CharField(source='tournament.get_region_display', read_only=True)

    class Meta:
        model = Match
        fields = '__all__'

class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all())]
    )
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user

class UserSerializer(serializers.ModelSerializer):
    """Serializer for user profile data."""
    favorite_teams = serializers.PrimaryKeyRelatedField(
        many=True,
        source='profile.favorite_teams',
        queryset=Team.objects.all(),
        required=False
    )
    favorite_matches = serializers.PrimaryKeyRelatedField(
        many=True,
        source='profile.favorite_matches',
        queryset=Match.objects.all(),
        required=False
    )

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'favorite_teams', 'favorite_matches')
        read_only_fields = ('id',)