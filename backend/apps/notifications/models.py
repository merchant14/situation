import uuid

from django.conf import settings
from django.db import models


class Notification(models.Model):
    class Kind(models.TextChoices):
        INTEREST = "interest", "Interest"
        MATCH = "match", "Match"

    public_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="notifications_sent")
    match = models.ForeignKey("matches.Match", on_delete=models.CASCADE, null=True, blank=True, related_name="notifications")
    kind = models.CharField(max_length=12, choices=Kind.choices)
    title = models.CharField(max_length=100)
    body = models.CharField(max_length=255)
    metadata = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(fields=("recipient", "actor", "kind"), condition=models.Q(kind="interest"), name="unique_interest_notification"),
            models.UniqueConstraint(fields=("recipient", "match", "kind"), condition=models.Q(kind="match"), name="unique_match_notification"),
        ]

