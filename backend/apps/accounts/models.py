from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Authentication identity; public dating profile fields live in the profiles app."""

    email = models.EmailField(unique=True)
    date_of_birth = models.DateField()
