from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    """Foundation identity model; product-specific fields arrive with account work."""

    pass
