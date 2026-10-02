from datetime import date, datetime, time, timedelta
from io import BytesIO

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.management.base import BaseCommand, CommandError
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.db import transaction
from django.utils import timezone


DEMO_PASSWORD = "DemoPass123!"

# Demo identities are deliberately namespaced and fixed. Reset only ever considers
# this allowlist, and verifies each username before deleting anything.
PEOPLE = [
    ("alex", "Alex Morgan", 28, "woman", "Pune", "Designing thoughtful spaces, finding new coffee, and taking long walks after rain.", "companionship", "emotional", "yes", "weekly"),
    ("maya", "Maya Shah", 31, "woman", "Pune", "Ceramics, quiet weekends, and conversations that can wander without a plan.", "companionship", "emotional", "yes", "weekly"),
    ("liam", "Liam Rao", 27, "man", "Mumbai", "Live music, coastal trains, and making a very ambitious Sunday breakfast.", "situationship", "social", "not_sure", "monthly"),
    ("sofia", "Sofia Iyer", 30, "woman", "Pune", "I like independent people, small galleries, and being clear about what I want.", "situationship", "social", "not_sure", "monthly"),
    ("noah", "Noah Kapoor", 29, "man", "Nashik", "Usually reading or out on a trail. Happiest when plans leave room to breathe.", "open_to_relationship", "combination", "yes", "flexible"),
    ("emma", "Emma Das", 32, "woman", "Mumbai", "A good meal and honest company are my favorite kind of evening.", "casual_dating", "romantic", "no", "occasionally"),
    ("oliver", "Oliver Sen", 26, "man", "Pune", "Learning the guitar slowly and collecting places to visit by bicycle.", "friendship_romantic", "social", "not_sure", "weekly"),
    ("chloe", "Chloe Fernandes", 34, "woman", "Bengaluru", "Books, architecture, and friendships that make space for change.", "open_to_relationship", "combination", "yes", "flexible"),
    ("ethan", "Ethan Roy", 28, "man", "Pune", "I enjoy cooking for friends, early hikes, and a little time offline.", "casual_dating", "physical", "no", "occasionally"),
    ("amelia", "Amelia D'Souza", 29, "woman", "Mumbai", "Photography walks, old films, and finding new ways to make home feel warm.", "friendship_romantic", "romantic", "not_sure", "monthly"),
]

INTERACTIONS = [
    ("alex", "maya", "interested"), ("maya", "alex", "interested"),
    ("liam", "sofia", "interested"), ("sofia", "liam", "interested"),
    ("noah", "chloe", "interested"), ("chloe", "noah", "interested"),
    ("emma", "oliver", "interested"),
    ("alex", "ethan", "pass"), ("sofia", "amelia", "pass"),
]
PHOTO_KEYS = {"alex", "maya", "liam", "chloe"}

CONVERSATIONS = {
    ("alex", "maya"): [
        ("alex", "Hey Maya, I saw your note about ceramics. What have you been making lately?", 5, True),
        ("maya", "A set of slightly uneven breakfast bowls. They make good coffee cups, though.", 4, True),
        ("alex", "Uneven things have more character. Would you be up for a relaxed coffee sometime?", 2, False),
    ],
    ("liam", "sofia"): [
        ("sofia", "I found a small gallery near the old station that might be your kind of place.", 3, True),
        ("liam", "That sounds lovely. I can do Saturday afternoon if that feels unhurried.", 1, False),
    ],
}


class Command(BaseCommand):
    help = "Create the deterministic local Situationship demo dataset (DEBUG only)."

    def add_arguments(self, parser):
        parser.add_argument("--reset", action="store_true", help="Safely remove and recreate only the known demo accounts.")
        parser.add_argument("--allow-production", action="store_true", help="Allow seeding when DJANGO_DEBUG is false.")

    def handle(self, *args, **options):
        if not settings.DEBUG and not options["allow_production"]:
            raise CommandError("In production, pass --allow-production to seed demo data explicitly.")

        User = get_user_model()
        validate_password(DEMO_PASSWORD)
        by_key = {row[0]: row for row in PEOPLE}
        emails = {key: f"demo.{key}@example.com" for key in by_key}
        with transaction.atomic():
            existing = {u.email: u for u in User.objects.filter(email__in=emails.values())}
            for key, email in emails.items():
                user = existing.get(email)
                if user and (user.username != f"demo_{key}" or user.is_staff or user.is_superuser):
                    raise CommandError(f"Refusing to manage {email}: account identity or privilege flags do not match the demo seed.")

            if options["reset"]:
                self._check_reset_isolated(existing)
                if existing:
                    User.objects.filter(pk__in=[u.pk for u in existing.values()]).delete()

            users = {}
            created_users = created_profiles = created_preferences = 0
            from apps.profiles.models import Profile
            from apps.preferences.models import Preference
            for key, display_name, age, gender, city, bio, goal, style, exclusivity, frequency in PEOPLE:
                email = emails[key]
                born = date.today() - timedelta(days=age * 365 + 100)
                user, was_created = User.objects.get_or_create(
                    email=email,
                    defaults={"username": f"demo_{key}", "date_of_birth": born, "first_name": display_name.split()[0]},
                )
                created_users += int(was_created)
                if user.username != f"demo_{key}" or user.is_staff or user.is_superuser:
                    raise CommandError(f"Refusing to update unexpected account {email}.")
                user.date_of_birth = born
                user.is_active = True
                user.set_password(DEMO_PASSWORD)
                user.save()
                users[key] = user
                _, made = Profile.objects.update_or_create(
                    user=user,
                    defaults={"display_name": display_name, "gender": gender, "city": city, "bio": bio, "is_active": True},
                )
                created_profiles += int(made)
                profile = Profile.objects.get(user=user)
                if key in PHOTO_KEYS:
                    photo_path = f"profiles/demo_seed/{key}.png"
                    if not default_storage.exists(photo_path):
                        default_storage.save(photo_path, ContentFile(self._avatar_png(display_name)))
                    if profile.photo.name != photo_path:
                        profile.photo.name = photo_path
                        profile.save(update_fields=["photo"])
                elif profile.photo.name and profile.photo.name.startswith("profiles/demo_seed/"):
                    profile.photo = None
                    profile.save(update_fields=["photo"])
                _, made = Preference.objects.update_or_create(
                    user=user,
                    defaults={"connection_goal": goal, "connection_style": style, "exclusivity": exclusivity, "meeting_frequency": frequency},
                )
                created_preferences += int(made)

            from apps.interests.models import Interest
            from apps.matches.models import Match
            from apps.chat.models import Message
            from apps.moderation.models import Block, Report
            created_interests = 0
            for sender, recipient, decision in INTERACTIONS:
                _, made = Interest.objects.update_or_create(
                    from_user=users[sender], to_user=users[recipient], defaults={"decision": decision}
                )
                created_interests += int(made)

            created_matches = 0
            match_by_pair = {}
            for a, b in (("alex", "maya"), ("liam", "sofia"), ("noah", "chloe")):
                first, second = sorted((users[a], users[b]), key=lambda item: item.pk)
                if not Interest.objects.filter(from_user=first, to_user=second, decision="interested").exists() or not Interest.objects.filter(from_user=second, to_user=first, decision="interested").exists():
                    raise CommandError(f"Cannot seed match {a}/{b}: mutual interested records are required.")
                match, made = Match.objects.get_or_create(user_one=first, user_two=second)
                created_matches += int(made)
                match_by_pair[frozenset((a, b))] = match

            created_messages = 0
            for pair, entries in CONVERSATIONS.items():
                match = match_by_pair[frozenset(pair)]
                for sender, body, days_ago, is_read in entries:
                    message, made = Message.objects.get_or_create(match=match, sender=users[sender], body=body, defaults={"is_read": is_read})
                    created_messages += int(made)
                    if made:
                        created_at = timezone.make_aware(datetime.combine(date.today() - timedelta(days=days_ago), time(12, 0)))
                        Message.objects.filter(pk=message.pk).update(created_at=created_at)

            _, created_block = Block.objects.get_or_create(blocker=users["ethan"], blocked=users["amelia"])
            _, created_report = Report.objects.get_or_create(
                reporter=users["chloe"], reported=users["noah"], category="safety",
                defaults={"details": "Demo scenario for reviewing the safety report workflow."},
            )

        self.stdout.write(self.style.SUCCESS("Situationship demo data is ready."))
        self.stdout.write(f"Users created: {created_users} / {len(PEOPLE)}")
        self.stdout.write(f"Profiles created: {created_profiles} / {len(PEOPLE)}")
        self.stdout.write(f"Preferences created: {created_preferences} / {len(PEOPLE)}")
        self.stdout.write(f"Interest actions created: {created_interests} / {len(INTERACTIONS)}")
        self.stdout.write(f"Matches created: {created_matches} / 3")
        self.stdout.write(f"Messages created: {created_messages}; Photos: {len(PHOTO_KEYS)} generated placeholders; Blocks created: {int(created_block)}; Reports created: {int(created_report)}; Notifications: 0 (unsupported)")
        self.stdout.write(f"Demo login: {emails['alex']}  Password: {DEMO_PASSWORD}")

    def _check_reset_isolated(self, existing):
        ids = [user.pk for user in existing.values()]
        if not ids:
            return
        from django.contrib.auth import get_user_model
        from apps.interests.models import Interest
        from apps.matches.models import Match
        from apps.chat.models import Message
        from apps.moderation.models import Block, Report
        from apps.profiles.models import Profile

        outsider = get_user_model().objects.exclude(pk__in=ids)
        external_interest = Interest.objects.filter(from_user__in=outsider, to_user_id__in=ids) | Interest.objects.filter(from_user_id__in=ids, to_user__in=outsider)
        external_match = Match.objects.filter(user_one_id__in=ids).exclude(user_two_id__in=ids) | Match.objects.filter(user_two_id__in=ids).exclude(user_one_id__in=ids)
        external_block = Block.objects.filter(blocker_id__in=ids).exclude(blocked_id__in=ids) | Block.objects.filter(blocked_id__in=ids).exclude(blocker_id__in=ids)
        external_report = Report.objects.filter(reporter_id__in=ids).exclude(reported_id__in=ids) | Report.objects.filter(reported_id__in=ids).exclude(reporter_id__in=ids)
        demo_match_ids = Match.objects.filter(user_one_id__in=ids, user_two_id__in=ids).values("id")
        external_message = Message.objects.filter(match_id__in=demo_match_ids).exclude(sender_id__in=ids)
        demo_photos = [f"profiles/demo_seed/{key}.png" for key in PHOTO_KEYS]
        external_photo = Profile.objects.exclude(user_id__in=ids).filter(photo__in=demo_photos)
        if external_interest.exists() or external_match.exists() or external_block.exists() or external_report.exists() or external_message.exists() or external_photo.exists():
            raise CommandError("Reset refused: demo records have relationships or references to non-demo accounts. Remove those links explicitly first.")
        for path in demo_photos:
            if default_storage.exists(path):
                default_storage.delete(path)

    @staticmethod
    def _avatar_png(display_name):
        from PIL import Image, ImageDraw

        image = Image.new("RGB", (160, 160), "#e8e1dc")
        draw = ImageDraw.Draw(image)
        draw.ellipse((20, 18, 140, 138), fill="#f8f5f2")
        draw.ellipse((56, 38, 104, 86), fill="#a95743")
        draw.rounded_rectangle((38, 88, 122, 145), radius=28, fill="#536650")
        initials = "".join(part[0] for part in display_name.split()[:2]).upper()
        draw.text((80, 151), initials, fill="#3a2924", anchor="mm")
        result = BytesIO()
        image.save(result, format="PNG", optimize=True)
        return result.getvalue()
