from datetime import date, timedelta

from django.contrib.auth import get_user_model
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
        self.assertIn("date_of_birth", response.data)

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
            format="json",
        )
        edited = self.client.patch("/api/v1/profile/me/", {"city": "Mumbai"}, format="json")

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
