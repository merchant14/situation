from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Authentication identity; public dating profile fields live in the profiles app."""

    email = models.EmailField(unique=True)
    date_of_birth = models.DateField()


class RegistrationConsent(models.Model):
    """Policy versions accepted when an account is created."""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="registration_consent")
    terms_version = models.CharField(max_length=32)
    privacy_version = models.CharField(max_length=32)
    accepted_at = models.DateTimeField()
