from django.conf import settings
from django.db import models


class ProfileInterest(models.Model):
    name = models.CharField(max_length=80, unique=True)
    slug = models.SlugField(max_length=90, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("name", "id")

    def __str__(self) -> str:
        return self.name


class Interest(models.Model):
    class Decision(models.TextChoices):
        INTERESTED = "interested", "Interested"
        PASS = "pass", "Pass"

    from_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_interests")
    to_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="received_interests")
    decision = models.CharField(max_length=12, choices=Decision.choices)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=("from_user", "to_user"), name="unique_interest_direction")]
        indexes = [models.Index(fields=("from_user", "decision")), models.Index(fields=("to_user", "decision"))]
