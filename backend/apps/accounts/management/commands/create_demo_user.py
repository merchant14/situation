from django.core.management.base import BaseCommand

from apps.accounts.models import User
from apps.profiles.models import Profile
from apps.preferences.models import Preference
from apps.matches.models import Match


class Command(BaseCommand):
    help = "Create a demo user with known credentials for local testing."

    def handle(self, *args, **options):
        email = "demo.you@example.test"
        password = "password"
        user, created = User.objects.get_or_create(
            email=email,
            defaults={"username": "demo-you", "date_of_birth": "1990-01-01", "is_active": True},
        )
        if created:
            user.set_password(password)
            user.save()
        else:
            user.set_password(password)
            user.save(update_fields=["password"]) 

        Profile.objects.update_or_create(user=user, defaults={"display_name": "You", "gender": "man", "city": "Pune", "bio": "Demo user created for testing.", "is_active": True})
        Preference.objects.update_or_create(user=user, defaults={"connection_goal": "casual_dating", "connection_style": "romantic", "exclusivity": "no", "meeting_frequency": "flexible"})

        other = User.objects.filter(email="arjun@example.test").first()
        if other:
            ordered = sorted((user, other), key=lambda u: u.id)
            Match.objects.get_or_create(user_one=ordered[0], user_two=ordered[1])

        self.stdout.write(self.style.SUCCESS(f"Created demo user {email} with password '{password}'."))
