from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from apps.interests.models import Interest
from apps.matches.models import Match
from apps.moderation.models import Block
from apps.profiles.models import Profile
from apps.preferences.models import Preference
from .models import Notification


class InterestNotificationTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.alex = User.objects.create_user(username="alex", email="alex@example.com", password="CorrectHorseBatteryStaple42!", date_of_birth="1995-01-01")
        self.blair = User.objects.create_user(username="blair", email="blair@example.com", password="CorrectHorseBatteryStaple42!", date_of_birth="1996-01-01")
        self.alex_profile = Profile.objects.create(user=self.alex, display_name="Alex Morgan", gender="woman", city="Pune")
        self.blair_profile = Profile.objects.create(user=self.blair, display_name="Blair Shah", gender="man", city="Mumbai")
        self.charlie = User.objects.create_user(username="charlie", email="charlie@example.com", password="CorrectHorseBatteryStaple42!", date_of_birth="1994-01-01")
        self.charlie_profile = Profile.objects.create(user=self.charlie, display_name="Charlie Rao", gender="non_binary", city="Nashik")
        for user in (self.alex, self.blair, self.charlie):
            Preference.objects.create(user=user, connection_goal="situationship", connection_style="emotional", exclusivity="no", meeting_frequency="flexible")

    def act(self, user, target, decision="interested"):
        self.client.force_authenticate(user)
        return self.client.post("/api/v1/interests/", {"target_profile_id": str(target.public_id), "decision": decision}, format="json")

    def test_first_interest_and_repeat_create_one_unread_notification(self):
        response = self.act(self.alex, self.blair_profile)
        self.assertEqual(response.status_code, 200)
        self.act(self.alex, self.blair_profile)
        self.assertEqual(Interest.objects.filter(from_user=self.alex, to_user=self.blair).count(), 1)
        self.assertEqual(Match.objects.count(), 0)
        self.assertFalse(Notification.objects.filter(recipient=self.alex).exists())
        self.assertEqual(Notification.objects.filter(recipient=self.blair, kind="interest").count(), 1)
        notification = Notification.objects.get(recipient=self.blair)
        self.assertFalse(notification.is_read)
        self.assertEqual(notification.body, "Alex Morgan is interested in you.")
        self.assertEqual(notification.metadata["profile_id"], str(self.alex_profile.public_id))

        self.client.force_authenticate(self.blair)
        feed = self.client.get("/api/v1/notifications/")
        self.assertEqual(feed.status_code, 200)
        self.assertEqual(feed.data["count"], 1)
        self.assertFalse(feed.data["results"][0]["is_read"])
        marked = self.client.post(f"/api/v1/notifications/{notification.public_id}/read/")
        self.assertEqual(marked.status_code, 200)
        notification.refresh_from_db()
        self.assertTrue(notification.is_read)

    def test_public_profile_is_retrievable_by_notification_profile_id_without_private_fields(self):
        self.act(self.alex, self.blair_profile)
        self.client.force_authenticate(self.blair)
        notification = self.client.get("/api/v1/notifications/").data["results"][0]
        self.assertEqual(notification["actor_profile_id"], str(self.alex_profile.public_id))
        profile = self.client.get(f"/api/v1/profile/{notification['actor_profile_id']}/")
        self.assertEqual(profile.status_code, 200)
        self.assertEqual(profile.data["display_name"], "Alex Morgan")
        self.assertEqual(profile.data["public_id"], notification["actor_profile_id"])
        self.assertNotIn("email", profile.data)
        self.assertNotIn("date_of_birth", profile.data)

    def test_database_unread_count_individual_read_mark_all_and_ownership(self):
        self.act(self.alex, self.blair_profile)
        self.act(self.charlie, self.blair_profile)
        self.client.force_authenticate(self.blair)
        self.assertEqual(self.client.get("/api/v1/notifications/unread-count/").data["count"], 2)
        feed = self.client.get("/api/v1/notifications/")
        self.assertEqual(feed.data["count"], 2)
        self.client.force_authenticate(self.alex)
        self.assertEqual(self.client.get("/api/v1/notifications/").data["count"], 0)
        self.assertEqual(self.client.post(f"/api/v1/notifications/{feed.data['results'][0]['public_id']}/read/").status_code, 404)

        self.client.force_authenticate(self.blair)
        first_id = feed.data["results"][0]["public_id"]
        self.assertEqual(self.client.post(f"/api/v1/notifications/{first_id}/read/").status_code, 200)
        self.assertEqual(self.client.post(f"/api/v1/notifications/{first_id}/read/").status_code, 200)
        self.assertEqual(self.client.get("/api/v1/notifications/unread-count/").data["count"], 1)

        own_notification = Notification.objects.create(
            recipient=self.alex, actor=self.blair, kind=Notification.Kind.INTEREST,
            title="Someone is interested in you", body="Blair Shah is interested in you.",
        )
        self.assertEqual(self.client.post("/api/v1/notifications/read-all/").status_code, 204)
        self.assertEqual(self.client.get("/api/v1/notifications/unread-count/").data["count"], 0)
        self.assertEqual(self.client.post("/api/v1/notifications/read-all/").status_code, 204)
        own_notification.refresh_from_db()
        self.assertFalse(own_notification.is_read)

    def test_reciprocal_interest_creates_one_match_and_two_match_notifications(self):
        self.act(self.alex, self.blair_profile)
        response = self.act(self.blair, self.alex_profile)
        self.assertTrue(response.data["data"]["matched"])
        self.act(self.blair, self.alex_profile)
        self.assertEqual(Match.objects.count(), 1)
        self.assertEqual(Notification.objects.filter(kind="match").count(), 2)
        self.assertEqual(Notification.objects.filter(recipient=self.alex, kind="match", is_read=False).count(), 1)
        self.assertEqual(Notification.objects.filter(recipient=self.blair, kind="match", is_read=False).count(), 1)
        self.assertEqual(Notification.objects.get(recipient=self.alex, kind="match").body, "You matched with Blair Shah!")
        self.assertEqual(Notification.objects.get(recipient=self.blair, kind="match").body, "You matched with Alex Morgan!")

        self.client.force_authenticate(self.alex)
        feed = self.client.get("/api/v1/notifications/")
        self.assertEqual(feed.data["count"], 1)
        match_notification = next(item for item in feed.data["results"] if item["kind"] == "match")
        self.assertEqual(match_notification["match_id"], response.data["data"]["match_id"])

        chat = self.client.post(
            f"/api/v1/chat/{response.data['data']['match_id']}/messages/",
            {"body": "Hello Blair"}, format="json",
        )
        self.assertEqual(chat.status_code, 201)
        self.assertEqual(self.client.get("/api/v1/matches/").data["count"], 1)

    def test_blocked_pair_cannot_create_interest_match_or_notification(self):
        Interest.objects.create(from_user=self.alex, to_user=self.blair, decision="interested")
        Interest.objects.create(from_user=self.blair, to_user=self.alex, decision="interested")
        Block.objects.create(blocker=self.alex, blocked=self.blair)
        response = self.act(self.alex, self.blair_profile)
        self.assertEqual(response.status_code, 403)
        self.assertEqual(Match.objects.count(), 0)
        self.assertEqual(Notification.objects.count(), 0)

    def test_pass_stays_pass_and_creates_no_notification(self):
        response = self.act(self.alex, self.blair_profile, "pass")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Interest.objects.get(from_user=self.alex, to_user=self.blair).decision, "pass")
        self.assertFalse(Notification.objects.exists())
