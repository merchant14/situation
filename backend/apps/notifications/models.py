import uuid
from django.conf import settings
from django.db import models

class Notification(models.Model):
    class Kind(models.TextChoices):
        MATCH = "match", "New match"
        MESSAGE = "message", "New message"
        SYSTEM = "system", "System"

    public_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name="triggered_notifications")
    kind = models.CharField(max_length=20, choices=Kind.choices)
    text = models.CharField(max_length=300)
    match = models.ForeignKey("matches.Match", on_delete=models.CASCADE, null=True, blank=True, related_name="notifications")
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [models.Index(fields=("recipient", "is_read", "created_at"))]
