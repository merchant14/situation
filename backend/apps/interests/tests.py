from datetime import date

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.interests.models import Interest, ProfileInterest
from apps.preferences.models import Preference
from apps.profiles.models import Profile


class ProfileInterestsApiTests(APITestCase):
    password = "CorrectHorseBatteryStaple42!"

    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(
            username="interest-owner", email="owner@example.com", password=self.password,
            date_of_birth=date(2000, 1, 1),
        )
        self.profile = Profile.objects.create(user=self.user, display_name="Avery", gender="woman", city="Pune")
        self.other_user = User.objects.create_user(
            username="other", email="other@example.com", password=self.password,
            date_of_birth=date(1998, 1, 1),
        )
        self.other_profile = Profile.objects.create(user=self.other_user, display_name="Sam", gender="man", city="Mumbai")
        self.travel = ProfileInterest.objects.get(slug="travel")
        self.music = ProfileInterest.objects.get(slug="music")
        self.movies = ProfileInterest.objects.get(slug="movies")

    def test_authenticated_user_can_get_catalog(self):
        self.client.force_authenticate(self.user)
        response = self.client.get("/api/v1/interests/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data["count"], 9)
        self.assertIn({"id": self.travel.id, "name": "Travel", "slug": "travel"}, response.data["results"])

    def test_current_user_can_get_and_save_and_replace_interests(self):
        self.client.force_authenticate(self.user)
        initial = self.client.get("/api/v1/profile/interests/")
        self.assertEqual(initial.data, {"interests": []})

        saved = self.client.put("/api/v1/profile/interests/", {"interest_ids": [self.travel.id, self.music.id]}, format="json")
        self.assertEqual(saved.status_code, status.HTTP_200_OK)
        self.assertEqual({x["id"] for x in saved.data["interests"]}, {self.travel.id, self.music.id})

        replaced = self.client.put("/api/v1/profile/interests/", {"interest_ids": [self.movies.id]}, format="json")
        self.assertEqual(replaced.status_code, status.HTTP_200_OK)
        self.assertEqual([x["slug"] for x in replaced.data["interests"]], ["movies"])

    def test_empty_list_removes_every_interest(self):
        self.profile.interests.add(self.travel, self.music)
        self.client.force_authenticate(self.user)
        response = self.client.put("/api/v1/profile/interests/", {"interest_ids": []}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"interests": []})

    def test_invalid_id_or_bad_payload_does_not_partially_update(self):
        self.profile.interests.add(self.travel, self.music)
        self.client.force_authenticate(self.user)
        for payload in (
            {"interest_ids": [self.movies.id, 999999]},
            {"interest_ids": [self.movies.id, "not-an-id"]},
            {"wrong_key": [self.movies.id]},
        ):
            response = self.client.put("/api/v1/profile/interests/", payload, format="json")
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertEqual(set(self.profile.interests.values_list("id", flat=True)), {self.travel.id, self.music.id})

    def test_duplicate_ids_are_rejected_without_changes(self):
        self.profile.interests.add(self.travel)
        self.client.force_authenticate(self.user)
        response = self.client.put("/api/v1/profile/interests/", {"interest_ids": [self.movies.id, self.movies.id]}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(list(self.profile.interests.values_list("id", flat=True)), [self.travel.id])

    def test_unauthenticated_user_cannot_read_or_write_profile_interests(self):
        read = self.client.get("/api/v1/profile/interests/")
        write = self.client.put("/api/v1/profile/interests/", {"interest_ids": [self.travel.id]}, format="json")
        self.assertEqual(read.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(write.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_only_updates_their_own_profile(self):
        self.other_profile.interests.add(self.music)
        self.client.force_authenticate(self.user)
        response = self.client.put("/api/v1/profile/interests/", {"interest_ids": [self.travel.id]}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(list(self.other_profile.interests.values_list("id", flat=True)), [self.music.id])

    def test_profile_and_discovery_return_profile_interests_without_private_data(self):
        self.profile.interests.add(self.travel)
        Preference.objects.create(user=self.other_user, connection_goal="situationship", connection_style="emotional", exclusivity="no", meeting_frequency="flexible")
        self.client.force_authenticate(self.user)

        profile_response = self.client.get("/api/v1/profile/me/")
        discover_response = self.client.get("/api/v1/discover/")

        self.assertEqual(profile_response.status_code, status.HTTP_200_OK)
        self.assertEqual(profile_response.data["interests"][0]["slug"], "travel")
        self.assertEqual(discover_response.status_code, status.HTTP_200_OK)
        discovered = discover_response.data["results"][0]
        self.assertEqual(discovered["interests"], [])
        self.assertNotIn("email", discovered)
        self.assertNotIn("date_of_birth", discovered)

    def test_existing_connection_interest_action_remains_separate(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(
            "/api/v1/interests/",
            {"target_profile_id": str(self.other_profile.public_id), "decision": "interested"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(Interest.objects.filter(from_user=self.user, to_user=self.other_user, decision="interested").exists())
        self.assertFalse(self.profile.interests.exists())

    def test_profile_update_remains_unchanged(self):
        self.client.force_authenticate(self.user)
        response = self.client.patch("/api/v1/profile/me/", {"city": "Delhi"}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["city"], "Delhi")
        self.assertEqual(response.data["interests"], [])
