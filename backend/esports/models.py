from django.db import models
from django.contrib.auth.models import User

class Game(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    release_date = models.DateField()
    developer = models.CharField(max_length=100)
    publisher = models.CharField(max_length=100)
    logo = models.ImageField(upload_to='game_logos/', null=True, blank=True)

    def __str__(self):
        return self.name

class Team(models.Model):
    REGION_CHOICES = [
        ('europe', 'Europe'),
        ('north_america', 'North America'),
        ('china', 'China'),
        ('south_korea', 'South Korea'),
        ('apac', 'APAC'),
    ]

    name = models.CharField(max_length=100)
    logo = models.URLField(max_length=1000, blank=True, null=True)
    founded_date = models.DateField()
    country = models.CharField(max_length=100)
    region = models.CharField(
        max_length=20,
        choices=REGION_CHOICES,
        default='europe',
        help_text='Regional division for the team'
    )
    game = models.ForeignKey(Game, on_delete=models.CASCADE)
    description = models.TextField()
    social_media = models.JSONField()

    def __str__(self):
        return self.name

class Player(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    nickname = models.CharField(max_length=100)
    real_name = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    birth_date = models.DateField()
    team = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, blank=True)
    role = models.CharField(max_length=50)
    social_media = models.JSONField()
    stats = models.JSONField()

    def __str__(self):
        return self.nickname

class Tournament(models.Model):
    name = models.CharField(max_length=200)
    game = models.ForeignKey(Game, on_delete=models.CASCADE)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    prize_pool = models.DecimalField(max_digits=12, decimal_places=2)
    location = models.CharField(max_length=100)
    format = models.CharField(max_length=100)
    region = models.CharField(
        max_length=20,
        choices=Team.REGION_CHOICES,
        null=True,
        blank=True,
        help_text='Primary region for this tournament'
    )
    participants = models.ManyToManyField(Team)
    status_choices = [
        ('upcoming', 'Upcoming'),
        ('ongoing', 'Ongoing'),
        ('completed', 'Completed'),
    ]
    status = models.CharField(max_length=10, choices=status_choices)

    def __str__(self):
        return self.name

class Match(models.Model):
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE)
    team1 = models.ForeignKey(Team, related_name='team1_matches', on_delete=models.CASCADE)
    team2 = models.ForeignKey(Team, related_name='team2_matches', on_delete=models.CASCADE)
    date_time = models.DateTimeField()
    result = models.CharField(max_length=100)
    score = models.CharField(max_length=50)
    vod_link = models.URLField()
    stats = models.JSONField()
    external_id = models.CharField(
        max_length=200, blank=True, null=True, unique=True,
        help_text='External match ID from lolesports API'
    )

    def __str__(self):
        return f"{self.team1} vs {self.team2} - {self.tournament}"

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    favorite_teams = models.ManyToManyField('Team', blank=True, related_name='favorited_by')
    favorite_matches = models.ManyToManyField('Match', blank=True, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s profile"

class NotificationLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    match = models.ForeignKey('Match', on_delete=models.CASCADE)
    notification_type = models.CharField(max_length=50)
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'match', 'notification_type')

    def __str__(self):
        return f"Notification for {self.user.username} - {self.match}"