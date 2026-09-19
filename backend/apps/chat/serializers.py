from rest_framework import serializers
from .models import Message

class MessageSerializer(serializers.ModelSerializer):
    sender_profile_id = serializers.UUIDField(source="sender.profile.public_id", read_only=True)
    sender_name = serializers.CharField(source="sender.profile.display_name", read_only=True)

    class Meta:
        model = Message
        fields = ("public_id", "sender_profile_id", "sender_name", "body", "created_at", "read_at")
        read_only_fields = fields
