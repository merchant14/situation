import uuid
from django.conf import settings
from django.db import models

class Message(models.Model):
    public_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    match = models.ForeignKey("matches.Match", on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_messages")
    body = models.TextField(max_length=2000)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("created_at",)
        indexes = [models.Index(fields=("match", "created_at")), models.Index(fields=("sender", "created_at"))]
