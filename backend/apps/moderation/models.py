from django.conf import settings
from django.db import models

class Block(models.Model):
    blocker = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="blocks_created")
    blocked = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="blocks_received")
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta: constraints = [models.UniqueConstraint(fields=("blocker", "blocked"), name="unique_block")]

class Report(models.Model):
    class Category(models.TextChoices):
        FAKE = "fake_profile", "Fake profile"; HARASSMENT = "harassment", "Harassment"; SPAM = "spam", "Spam"; INAPPROPRIATE = "inappropriate", "Inappropriate content"; SAFETY = "safety", "Safety concern"; OTHER = "other", "Other"
    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reports_created")
    reported = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reports_received")
    category = models.CharField(max_length=20, choices=Category.choices)
    details = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
