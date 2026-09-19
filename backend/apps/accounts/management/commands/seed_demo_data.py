from django.core.management.base import BaseCommand

from apps.accounts.models import User
from apps.interests.models import Interest
from apps.matches.models import Match
from apps.preferences.models import Preference
from apps.profiles.models import Profile


DEMO_USERS = [
    ("maya@example.test", "Maya", "woman", "Mumbai", "Bookstores, long walks, and honest conversations.", "situationship", "emotional", "not_sure", "weekly", "1998-05-18"),
    ("arjun@example.test", "Arjun", "man", "Pune", "Designer, home chef, and always looking for a new cafe.", "casual_dating", "romantic", "no", "flexible", "1996-02-08"),
    ("zoya@example.test", "Zoya", "woman", "Bengaluru", "Big on music, small adventures, and kindness.", "companionship", "social", "yes", "monthly", "1997-11-20"),
    ("kabir@example.test", "Kabir", "man", "Delhi", "Gym, films, and conversations that go somewhere.", "open_to_relationship", "combination", "not_sure", "weekly", "1995-08-30"),
    ("ria@example.test", "Ria", "non_binary", "Pune", "Creative work, street food, and clear communication.", "friendship_romantic", "emotional", "yes", "occasionally", "1999-01-14"),
]


class Command(BaseCommand):
    help = "Create safe, idempotent demo profiles for local discovery testing."

    def handle(self, *args, **options):
        users = []
        for email, name, gender, city, bio, goal, style, exclusivity, frequency, birth_date in DEMO_USERS:
            user, created = User.objects.get_or_create(
                email=email,
                defaults={"username": f"demo-{name.lower()}", "date_of_birth": birth_date, "is_active": True},
            )
            if created:
                user.set_unusable_password()
                user.save(update_fields=["password"])
            Profile.objects.update_or_create(user=user, defaults={"display_name": name, "gender": gender, "city": city, "bio": bio, "is_active": True})
            Preference.objects.update_or_create(user=user, defaults={"connection_goal": goal, "connection_style": style, "exclusivity": exclusivity, "meeting_frequency": frequency})
            users.append(user)

        for first, second in ((users[0], users[1]), (users[2], users[3])):
            Interest.objects.update_or_create(from_user=first, to_user=second, defaults={"decision": Interest.Decision.INTERESTED})
            Interest.objects.update_or_create(from_user=second, to_user=first, defaults={"decision": Interest.Decision.INTERESTED})
            ordered = sorted((first, second), key=lambda user: user.id)
            Match.objects.get_or_create(user_one=ordered[0], user_two=ordered[1])

        self.stdout.write(self.style.SUCCESS(f"Seeded {len(users)} demo profiles and 2 demo matches."))
