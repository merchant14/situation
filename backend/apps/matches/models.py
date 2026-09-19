import uuid

from django.conf import settings
from django.db import models


class Match(models.Model):
    public_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    user_one = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="matches_as_one")
    user_two = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="matches_as_two")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=("user_one", "user_two"), name="unique_match_pair")]
        indexes = [models.Index(fields=("user_one",)), models.Index(fields=("user_two",))]
