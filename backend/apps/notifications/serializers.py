from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    actor_profile_id = serializers.SerializerMethodField()
    actor_display_name = serializers.SerializerMethodField()
    match_id = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ("public_id", "kind", "title", "body", "actor_profile_id", "actor_display_name", "match_id", "metadata", "is_read", "created_at")

    def get_actor_profile_id(self, notification):
        if notification.actor_id and hasattr(notification.actor, "profile"):
            return str(notification.actor.profile.public_id)
        return notification.metadata.get("profile_id")

    def get_actor_display_name(self, notification):
        if notification.actor_id and hasattr(notification.actor, "profile"):
            return notification.actor.profile.display_name
        return None

    def get_match_id(self, notification):
        if notification.match_id:
            return str(notification.match.public_id)
        return notification.metadata.get("match_id")

