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


class SettingsApiTests(APITestCase):
    password = "CorrectHorseBatteryStaple42!"

    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(
            username="settings-user", email="settings@example.com", password=self.password,
            date_of_birth="1995-01-01",
        )
        self.other = User.objects.create_user(
            username="other-settings-user", email="other-settings@example.com", password=self.password,
            date_of_birth="1994-01-01",
        )

    def test_authenticated_settings_summary_is_minimal_and_reports_real_capabilities(self):
        from apps.profiles.models import Profile

        Profile.objects.create(user=self.user, display_name="Avery", gender="woman", city="Pune")
        self.client.force_authenticate(self.user)

        response = self.client.get("/api/v1/settings/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["account"], {"display_name": "Avery", "email": self.user.email})
        self.assertEqual(response.data["features"], {
            "password_change": True,
            "safety_tools": True,
            "notification_settings": False,
            "privacy_settings": False,
            "delete_account": True,
        })
        rendered = str(response.data).lower()
        self.assertNotIn(self.user.password, rendered)
        self.assertNotIn("token", rendered)
        self.assertNotIn("id", response.data["account"])

    def test_settings_summary_requires_authentication(self):
        response = self.client.get("/api/v1/settings/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class AccountDeletionApiTests(APITestCase):
    password = "CorrectHorseBatteryStaple42!"

    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(
            username="delete-me", email="delete-me@example.com", password=self.password,
            date_of_birth="1995-01-01",
        )
        self.other = User.objects.create_user(
            username="keep-me", email="keep-me@example.com", password=self.password,
            date_of_birth="1994-01-01",
        )
        from apps.profiles.models import Profile
        self.profile = Profile.objects.create(user=self.user, display_name="Delete Me", gender="woman", city="Pune")
        self.other_profile = Profile.objects.create(user=self.other, display_name="Keep Me", gender="man", city="Mumbai")

    def test_delete_requires_authentication_and_current_password(self):
        anonymous = self.client.delete("/api/v1/auth/me/", {"current_password": self.password}, format="json")
        self.assertEqual(anonymous.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertTrue(get_user_model().objects.filter(pk=self.user.pk).exists())

        self.client.force_authenticate(self.user)
        invalid = self.client.delete("/api/v1/auth/me/", {"current_password": "wrong"}, format="json")
        self.assertEqual(invalid.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("current_password", invalid.data["errors"])
        self.assertTrue(get_user_model().objects.filter(pk=self.user.pk).exists())

    def test_delete_removes_owned_records_and_keeps_shared_catalog_and_other_users(self):
        from django.db.models import Q
        from apps.chat.models import Message
        from apps.interests.models import Interest, ProfileInterest
        from apps.matches.models import Match
        from apps.moderation.models import Block, Report
        from apps.notifications.models import Notification
        from apps.preferences.models import Preference
        from apps.profiles.models import Profile

        Preference.objects.create(
            user=self.user, connection_goal="situationship", connection_style="emotional",
            exclusivity="not_sure", meeting_frequency="flexible",
        )
        Preference.objects.create(
            user=self.other, connection_goal="situationship", connection_style="emotional",
            exclusivity="not_sure", meeting_frequency="flexible",
        )
        shared_interest = ProfileInterest.objects.get(slug="hiking")
        self.profile.interests.add(shared_interest)
        self.other_profile.interests.add(shared_interest)
        Interest.objects.create(from_user=self.user, to_user=self.other, decision="interested")
        Interest.objects.create(from_user=self.other, to_user=self.user, decision="pass")
        match = Match.objects.create(user_one=self.user, user_two=self.other)
        Message.objects.create(match=match, sender=self.user, body="A message")
        Notification.objects.create(
            recipient=self.user, actor=self.other, kind="match", match=match,
            title="A match", body="A match notification",
        )
        actor_notification = Notification.objects.create(
            recipient=self.other, actor=self.user, kind="interest",
            title="An interest", body="An interest notification",
        )
        Block.objects.create(blocker=self.user, blocked=self.other)
        Block.objects.create(blocker=self.other, blocked=self.user)
        Report.objects.create(reporter=self.user, reported=self.other, category="safety")
        Report.objects.create(reporter=self.other, reported=self.user, category="spam")
        self.client.force_authenticate(self.user)

        response = self.client.delete("/api/v1/auth/me/", {"current_password": self.password}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"success": True, "data": {"deleted": True}})
        self.assertFalse(get_user_model().objects.filter(pk=self.user.pk).exists())
        self.assertFalse(Profile.objects.filter(user_id=self.user.pk).exists())
        self.assertFalse(Preference.objects.filter(user_id=self.user.pk).exists())
        self.assertFalse(Interest.objects.filter(Q(from_user_id=self.user.pk) | Q(to_user_id=self.user.pk)).exists())
        self.assertFalse(Match.objects.filter(Q(user_one_id=self.user.pk) | Q(user_two_id=self.user.pk)).exists())
        self.assertFalse(Message.objects.filter(sender_id=self.user.pk).exists())
        self.assertFalse(Notification.objects.filter(recipient_id=self.user.pk).exists())
        actor_notification.refresh_from_db()
        self.assertIsNone(actor_notification.actor_id)
        self.assertFalse(Block.objects.filter(Q(blocker_id=self.user.pk) | Q(blocked_id=self.user.pk)).exists())
        self.assertFalse(Report.objects.filter(Q(reporter_id=self.user.pk) | Q(reported_id=self.user.pk)).exists())
        self.assertTrue(ProfileInterest.objects.filter(pk=shared_interest.pk).exists())
        self.assertTrue(self.other_profile.interests.filter(pk=shared_interest.pk).exists())
        self.assertTrue(get_user_model().objects.filter(pk=self.other.pk).exists())

    def test_deleted_account_access_and_refresh_tokens_cannot_access_protected_endpoints(self):
        from rest_framework_simplejwt.tokens import RefreshToken

        refresh = RefreshToken.for_user(self.user)
        old_access = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {old_access}")
        deleted = self.client.delete("/api/v1/auth/me/", {"current_password": self.password}, format="json")
        self.assertEqual(deleted.status_code, status.HTTP_200_OK)

        me_response = self.client.get("/api/v1/auth/me/")
        settings_response = self.client.get("/api/v1/settings/")
        self.assertEqual(me_response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(settings_response.status_code, status.HTTP_401_UNAUTHORIZED)

        refreshed = self.client.post("/api/v1/auth/refresh/", {"refresh": str(refresh)}, format="json")
        if refreshed.status_code == status.HTTP_200_OK:
            self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refreshed.data['access']}")
            self.assertEqual(self.client.get("/api/v1/auth/me/").status_code, status.HTTP_401_UNAUTHORIZED)

    def test_repeated_delete_with_same_token_is_rejected_safely(self):
        from rest_framework_simplejwt.tokens import RefreshToken

        access = str(RefreshToken.for_user(self.user).access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        first = self.client.delete("/api/v1/auth/me/", {"current_password": self.password}, format="json")
        second = self.client.delete("/api/v1/auth/me/", {"current_password": self.password}, format="json")

        self.assertEqual(first.status_code, status.HTTP_200_OK)
        self.assertEqual(second.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_database_deletion_rolls_back_if_cascade_fails(self):
        from django.db.models.signals import post_delete

        def fail_after_delete(sender, instance, **kwargs):
            raise RuntimeError("simulated cascade failure")

        post_delete.connect(fail_after_delete, sender=get_user_model(), weak=False)
        self.client.force_authenticate(self.user)
        try:
            with self.assertRaises(RuntimeError):
                self.client.delete("/api/v1/auth/me/", {"current_password": self.password}, format="json")
        finally:
            post_delete.disconnect(fail_after_delete, sender=get_user_model())

        self.assertTrue(get_user_model().objects.filter(pk=self.user.pk).exists())

class PasswordChangeApiTests(APITestCase):
    password = "CorrectHorseBatteryStaple42!"

    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(
            username="password-user", email="password@example.com", password=self.password,
            date_of_birth="1995-01-01",
        )
        self.other = User.objects.create_user(
            username="other-password-user", email="other-password@example.com", password=self.password,
            date_of_birth="1994-01-01",
        )

    def test_password_change_validates_current_and_new_password(self):
        self.client.force_authenticate(self.user)

        wrong_current = self.client.post("/api/v1/auth/change-password/", {
            "current_password": "not-the-current-password", "new_password": "AValidNewPassword!482",
        }, format="json")
        weak_new = self.client.post("/api/v1/auth/change-password/", {
            "current_password": self.password, "new_password": "123",
        }, format="json")

        self.assertEqual(wrong_current.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("current_password", wrong_current.data["errors"])
        self.assertEqual(weak_new.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("new_password", weak_new.data["errors"])
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(self.password))

    def test_password_change_updates_only_authenticated_user_and_revokes_old_jwt(self):
        from rest_framework_simplejwt.tokens import RefreshToken

        old_access = str(RefreshToken.for_user(self.user).access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {old_access}")
        response = self.client.post("/api/v1/auth/change-password/", {
            "current_password": self.password, "new_password": "AValidNewPassword!482",
        }, format="json")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.user.refresh_from_db()
        self.other.refresh_from_db()
        self.assertTrue(self.user.check_password("AValidNewPassword!482"))
        self.assertTrue(self.other.check_password(self.password))
        rejected_old_token = self.client.get("/api/v1/auth/me/")
        self.assertEqual(rejected_old_token.status_code, status.HTTP_401_UNAUTHORIZED)

        login = self.client.post("/api/v1/auth/login/", {
            "email": self.user.email, "password": "AValidNewPassword!482",
        }, format="json")
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        self.assertIn("access", login.data["data"])

    def test_password_change_requires_authentication(self):
        response = self.client.post("/api/v1/auth/change-password/", {
            "current_password": self.password, "new_password": "AValidNewPassword!482",
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
