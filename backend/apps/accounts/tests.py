from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.core.management import call_command, CommandError
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase


class AuthenticationApiTests(APITestCase):
    def test_custom_user_model_is_configured(self):
        self.assertEqual(get_user_model()._meta.label, "accounts.User")

    def registration_payload(self, **overrides):
        payload = {
            "email": "person@example.com",
            "password": "CorrectHorseBatteryStaple42!",
            "date_of_birth": "2000-01-01",
        }
        payload.update(overrides)
        return payload

    def test_adult_can_register_and_password_is_hashed(self):
        response = self.client.post("/api/v1/auth/register/", self.registration_payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = get_user_model().objects.get(email="person@example.com")
        self.assertTrue(user.check_password("CorrectHorseBatteryStaple42!"))
        self.assertNotEqual(user.password, "CorrectHorseBatteryStaple42!")

    def test_underage_registration_is_rejected(self):
        birth_date = date.today() - timedelta(days=17 * 365)
        response = self.client.post(
            "/api/v1/auth/register/",
            self.registration_payload(date_of_birth=birth_date.isoformat()),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("date_of_birth", response.data["errors"])

    def test_login_and_authenticated_me_endpoint(self):
        self.client.post("/api/v1/auth/register/", self.registration_payload(), format="json")
        login = self.client.post(
            "/api/v1/auth/login/",
            {"email": "person@example.com", "password": "CorrectHorseBatteryStaple42!"},
            format="json",
        )

        self.assertEqual(login.status_code, status.HTTP_200_OK)
        access_token = login.data["data"]["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        response = self.client.get("/api/v1/auth/me/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "person@example.com")

    def test_unauthenticated_me_endpoint_is_rejected(self):
        response = self.client.get("/api/v1/auth/me/")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_user_can_create_and_edit_own_profile(self):
        self.client.post("/api/v1/auth/register/", self.registration_payload(), format="json")
        login = self.client.post(
            "/api/v1/auth/login/",
            {"email": "person@example.com", "password": "CorrectHorseBatteryStaple42!"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['data']['access']}")
        created = self.client.post(
            "/api/v1/profile/me/",
            {"display_name": "Avery", "gender": "non_binary", "city": "Pune", "bio": "Looking for clear communication."},
            format="multipart",
        )
        edited = self.client.patch("/api/v1/profile/me/", {"city": "Mumbai"}, format="multipart")

        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        self.assertEqual(edited.status_code, status.HTTP_200_OK)
        self.assertEqual(edited.data["city"], "Mumbai")

    def test_authenticated_user_can_create_connection_preferences(self):
        self.client.post("/api/v1/auth/register/", self.registration_payload(), format="json")
        login = self.client.post(
            "/api/v1/auth/login/",
            {"email": "person@example.com", "password": "CorrectHorseBatteryStaple42!"},
            format="json",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['data']['access']}")
        response = self.client.post(
            "/api/v1/preferences/me/",
            {"connection_goal": "situationship", "connection_style": "emotional", "exclusivity": "not_sure", "meeting_frequency": "flexible"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["connection_goal"], "situationship")

    def test_discovery_excludes_requester_and_private_account_data(self):
        user_model = get_user_model()
        requester = user_model.objects.create_user(
            username="requester", email="requester@example.com", password="CorrectHorseBatteryStaple42!", date_of_birth="2000-01-01"
        )
        candidate = user_model.objects.create_user(
            username="candidate", email="candidate@example.com", password="CorrectHorseBatteryStaple42!", date_of_birth="1995-01-01"
        )
        from apps.preferences.models import Preference
        from apps.profiles.models import Profile
        Profile.objects.create(user=requester, display_name="Requester", gender="woman", city="Pune")
        Profile.objects.create(user=candidate, display_name="Candidate", gender="man", city="Mumbai", bio="Hello")
        Preference.objects.create(user=requester, connection_goal="situationship", connection_style="emotional", exclusivity="no", meeting_frequency="flexible")
        Preference.objects.create(user=candidate, connection_goal="casual_dating", connection_style="romantic", exclusivity="not_sure", meeting_frequency="monthly")
        self.client.force_authenticate(requester)

        response = self.client.get("/api/v1/discover/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        profile = response.data["results"][0]
        self.assertEqual(profile["display_name"], "Candidate")
        self.assertEqual(profile["age"], 31)
        self.assertNotIn("email", profile)
        self.assertNotIn("date_of_birth", profile)

    def test_discovery_excludes_users_already_passed(self):
        user_model = get_user_model()
        requester = user_model.objects.create_user(username="passer", email="passer@example.com", password="CorrectHorseBatteryStaple42!", date_of_birth="2000-01-01")
        candidate = user_model.objects.create_user(username="passed", email="passed@example.com", password="CorrectHorseBatteryStaple42!", date_of_birth="1995-01-01")
        from apps.preferences.models import Preference
        from apps.profiles.models import Profile
        from apps.interests.models import Interest
        Profile.objects.create(user=requester, display_name="Passer", gender="woman", city="Pune")
        Profile.objects.create(user=candidate, display_name="Passed", gender="man", city="Mumbai")
        for user in (requester, candidate):
            Preference.objects.create(user=user, connection_goal="situationship", connection_style="emotional", exclusivity="no", meeting_frequency="flexible")
        Interest.objects.create(from_user=requester, to_user=candidate, decision=Interest.Decision.PASS)
        self.client.force_authenticate(requester)

        response = self.client.get("/api/v1/discover/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 0)


class DemoSeedCommandTests(APITestCase):
    @override_settings(DEBUG=True)
    def test_seed_is_idempotent_and_reset_preserves_unrelated_users(self):
        from apps.chat.models import Message
        from apps.interests.models import Interest
        from apps.matches.models import Match
        from apps.moderation.models import Block, Report

        call_command("seed_demo_data", verbosity=0)
        call_command("seed_demo_data", verbosity=0)
        self.assertEqual(get_user_model().objects.filter(email__startswith="demo.").count(), 10)
        self.assertEqual(Interest.objects.count(), 9)
        self.assertEqual(Match.objects.count(), 3)
        self.assertEqual(Message.objects.count(), 5)
        self.assertEqual(Block.objects.count(), 1)
        self.assertEqual(Report.objects.count(), 1)
        self.assertTrue(get_user_model().objects.get(email="demo.alex@example.com").check_password("DemoPass123!"))

        unrelated = get_user_model().objects.create_user(username="ordinary", email="ordinary@example.com", password="CorrectHorseBatteryStaple42!", date_of_birth="2000-01-01")
        call_command("seed_demo_data", "--reset", verbosity=0)
        self.assertTrue(get_user_model().objects.filter(pk=unrelated.pk).exists())
        self.assertEqual(get_user_model().objects.filter(email__startswith="demo.").count(), 10)
        self.assertEqual(Match.objects.count(), 3)

    @override_settings(DEBUG=False)
    def test_command_refuses_to_run_outside_debug(self):
        with self.assertRaises(CommandError):
            call_command("seed_demo_data", verbosity=0)
        self.assertFalse(get_user_model().objects.filter(email="demo.alex@example.com").exists())

    @override_settings(DEBUG=True)
    def test_reset_refuses_external_relationships_before_deleting_demo_data(self):
        call_command("seed_demo_data", verbosity=0)
        User = get_user_model()
        outside = User.objects.create_user(username="outside", email="outside@example.com", password="CorrectHorseBatteryStaple42!", date_of_birth="2000-01-01")
        from apps.interests.models import Interest
        demo = User.objects.get(email="demo.alex@example.com")
        Interest.objects.create(from_user=outside, to_user=demo, decision="pass")

        with self.assertRaises(CommandError):
            call_command("seed_demo_data", "--reset", verbosity=0)
        self.assertTrue(User.objects.filter(pk=demo.pk).exists())
        self.assertTrue(User.objects.filter(pk=outside.pk).exists())

    def test_mutual_interest_creates_one_match_and_can_be_unmatched(self):
        user_model = get_user_model()
        first = user_model.objects.create_user(username="first", email="first@example.com", password="CorrectHorseBatteryStaple42!", date_of_birth="2000-01-01")
        second = user_model.objects.create_user(username="second", email="second@example.com", password="CorrectHorseBatteryStaple42!", date_of_birth="1999-01-01")
        from apps.profiles.models import Profile
        first_profile = Profile.objects.create(user=first, display_name="First", gender="woman", city="Pune")
        second_profile = Profile.objects.create(user=second, display_name="Second", gender="man", city="Mumbai")
        self.client.force_authenticate(first)
        first_action = self.client.post("/api/v1/interests/", {"target_profile_id": str(second_profile.public_id), "decision": "interested"}, format="json")
        self.client.force_authenticate(second)
        second_action = self.client.post("/api/v1/interests/", {"target_profile_id": str(first_profile.public_id), "decision": "interested"}, format="json")
        matches = self.client.get("/api/v1/matches/")
        self.client.delete(f"/api/v1/matches/{second_action.data['data']['match_id']}/")

        self.assertFalse(first_action.data["data"]["matched"])
        self.assertTrue(second_action.data["data"]["matched"])
        self.assertEqual(matches.data["count"], 1)
