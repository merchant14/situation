from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Block, Report
from apps.profiles.models import Profile


class SafetyEndpointTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.actor = User.objects.create_user(
            username="safety-actor", email="safety-actor@example.com", password="CorrectHorseBatteryStaple42!",
            date_of_birth="1995-01-01",
        )
        self.target = User.objects.create_user(
            username="safety-target", email="safety-target@example.com", password="CorrectHorseBatteryStaple42!",
            date_of_birth="1994-01-01",
        )
        self.actor_profile = Profile.objects.create(user=self.actor, display_name="Actor", gender="woman", city="Pune")
        self.target_profile = Profile.objects.create(user=self.target, display_name="Target", gender="man", city="Mumbai")

    def test_block_endpoint_requires_auth_and_blocks_target_for_requester(self):
        payload = {"target_profile_id": str(self.target_profile.public_id)}
        anonymous = self.client.post("/api/v1/blocks/", payload, format="json")
        self.assertEqual(anonymous.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.actor)
        response = self.client.post("/api/v1/blocks/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(Block.objects.filter(blocker=self.actor, blocked=self.target).exists())

    def test_report_endpoint_requires_auth_and_records_report_for_requester(self):
        payload = {"target_profile_id": str(self.target_profile.public_id), "category": "safety", "details": "Concern"}
        anonymous = self.client.post("/api/v1/reports/", payload, format="json")
        self.assertEqual(anonymous.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.actor)
        response = self.client.post("/api/v1/reports/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Report.objects.filter(reporter=self.actor, reported=self.target, category="safety").exists())
