from django.conf import settings
from django.db import models


class Preference(models.Model):
    class ConnectionGoal(models.TextChoices):
        SITUATIONSHIP = "situationship", "Situationship"
        CASUAL_DATING = "casual_dating", "Casual dating"
        COMPANIONSHIP = "companionship", "Companionship"
        FRIENDSHIP_ROMANTIC = "friendship_romantic", "Friendship with romantic potential"
        OPEN_TO_RELATIONSHIP = "open_to_relationship", "Open to relationship"

    class ConnectionStyle(models.TextChoices):
        EMOTIONAL = "emotional", "Emotional"
        ROMANTIC = "romantic", "Romantic"
        PHYSICAL = "physical", "Physical"
        SOCIAL = "social", "Social/companionship"
        COMBINATION = "combination", "Combination"

    class Exclusivity(models.TextChoices):
        YES = "yes", "Yes"
        NO = "no", "No"
        NOT_SURE = "not_sure", "Not sure"

    class MeetingFrequency(models.TextChoices):
        WEEKLY = "weekly", "Once a week"
        MONTHLY = "monthly", "2-3 times a month"
        OCCASIONALLY = "occasionally", "Occasionally"
        FLEXIBLE = "flexible", "Flexible"

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="preferences")
    connection_goal = models.CharField(max_length=30, choices=ConnectionGoal.choices)
    connection_style = models.CharField(max_length=20, choices=ConnectionStyle.choices)
    exclusivity = models.CharField(max_length=10, choices=Exclusivity.choices)
    meeting_frequency = models.CharField(max_length=20, choices=MeetingFrequency.choices)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
