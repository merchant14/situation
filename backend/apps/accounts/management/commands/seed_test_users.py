"""
Management command to seed 100 test users with profiles, preferences, and interests.
Run with: python manage.py seed_test_users
"""

from datetime import datetime, timedelta
from random import choice, randint, random, shuffle
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.profiles.models import Profile
from apps.preferences.models import Preference
from apps.interests.models import Interest

User = get_user_model()

# Sample names and data
FIRST_NAMES_WOMAN = [
    "Sophia", "Emma", "Olivia", "Ava", "Isabella", "Mia", "Charlotte", "Amelia", "Harper", "Evelyn",
    "Abigail", "Elizabeth", "Emily", "Avery", "Ella", "Scarlett", "Victoria", "Madison", "Luna", "Grace",
    "Chloe", "Penelope", "Layla", "Riley", "Zoey", "Nora", "Lily", "Eleanor", "Hannah", "Lillian",
]

FIRST_NAMES_MAN = [
    "Liam", "Noah", "Oliver", "Elijah", "James", "William", "Benjamin", "Lucas", "Henry", "Alexander",
    "Mason", "Michael", "Ethan", "Daniel", "Jacob", "Logan", "Jackson", "Sebastian", "Aiden", "Matthew",
    "Samuel", "David", "Joseph", "Carter", "Owen", "Wyatt", "John", "Jack", "Albert", "Victor",
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez",
    "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee",
    "Garcia", "Rodriguez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Perez", "Collins", "Reyes",
]

CITIES = [
    "New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego",
    "Dallas", "San Jose", "Austin", "Jacksonville", "Fort Worth", "Columbus", "Charlotte", "San Francisco",
    "Indianapolis", "Seattle", "Denver", "Boston", "Atlanta", "Miami", "Portland", "Nashville", "Detroit",
]

BIOS = [
    "Love traveling and trying new restaurants",
    "Outdoor enthusiast, coffee addict",
    "Artist and musician",
    "Fitness enthusiast, always up for adventures",
    "Book lover, film junkie",
    "Travel bug with a camera",
    "Yoga instructor, wellness advocate",
    "Tech geek, startup founder",
    "Foodie exploring the city",
    "Living life one experience at a time",
    "Looking for genuine connection",
    "Creative soul, open-minded",
    "Dog lover, weekend traveler",
    "Entrepreneur with a passion for design",
    "Adventure seeker, nature lover",
]

CONNECTION_GOALS = [goal[0] for goal in Preference.ConnectionGoal.choices]
CONNECTION_STYLES = [style[0] for style in Preference.ConnectionStyle.choices]
EXCLUSIVITIES = [excl[0] for excl in Preference.Exclusivity.choices]
MEETING_FREQUENCIES = [freq[0] for freq in Preference.MeetingFrequency.choices]

GENDERS = [choice[0] for choice in Profile.Gender.choices]


class Command(BaseCommand):
    help = "Seed database with 100 test users"

    def add_arguments(self, parser):
        parser.add_argument("--count", type=int, default=100, help="Number of users to create")
        parser.add_argument("--clear", action="store_true", help="Delete all users before seeding")

    def handle(self, *args, **options):
        count = options["count"]
        clear = options["clear"]

        if clear:
            self.stdout.write("Clearing existing users...")
            User.objects.all().delete()

        self.stdout.write(f"Creating {count} test users...")
        users_created = 0

        for i in range(count):
            gender = choice(GENDERS)
            first_names = FIRST_NAMES_WOMAN if gender == "woman" else FIRST_NAMES_MAN
            
            first_name = choice(first_names)
            last_name = choice(LAST_NAMES)
            email = f"user{i+1}@test.example.com"
            display_name = f"{first_name} {last_name[:1]}"
            
            # Create user with realistic age (18-45)
            age = randint(18, 45)
            dob = datetime.now().date() - timedelta(days=age * 365 + randint(0, 365))
            
            try:
                user = User.objects.create_user(
                    username=email.split("@")[0] + str(i),
                    email=email,
                    password="testpass123",
                    first_name=first_name,
                    last_name=last_name,
                    date_of_birth=dob,
                )
                
                # Create profile
                profile = Profile.objects.create(
                    user=user,
                    display_name=display_name,
                    gender=gender,
                    city=choice(CITIES),
                    bio=choice(BIOS) if random() > 0.2 else "",
                    is_active=True,
                )
                
                # Create preferences
                preferences = Preference.objects.create(
                    user=user,
                    connection_goal=choice(CONNECTION_GOALS),
                    connection_style=choice(CONNECTION_STYLES),
                    exclusivity=choice(EXCLUSIVITIES),
                    meeting_frequency=choice(MEETING_FREQUENCIES),
                )
                
                users_created += 1
                if (i + 1) % 10 == 0:
                    self.stdout.write(f"  Created {i + 1}/{count} users")
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error creating user {i}: {e}"))

        # Create some interests between users for discovery experience
        self.stdout.write("Creating interests between users...")
        all_users = list(User.objects.all()[:count])
        
        for user in all_users:
            # Each user shows interest in 5-15 other random users
            num_interests = randint(5, 15)
            potential_targets = [u for u in all_users if u.id != user.id]
            targets = potential_targets[:num_interests] if len(potential_targets) >= num_interests else potential_targets
            shuffle(targets)
            
            for target in targets[:num_interests]:
                # 70% interested, 30% pass
                decision = "interested" if random() > 0.3 else "pass"
                try:
                    Interest.objects.get_or_create(
                        from_user=user,
                        to_user=target,
                        defaults={"decision": decision},
                    )
                except Exception:
                    pass

        self.stdout.write(
            self.style.SUCCESS(f"\n✅ Successfully created {users_created} test users with profiles and preferences!")
        )
