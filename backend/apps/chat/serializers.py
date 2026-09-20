from rest_framework import serializers

from .models import Message


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ("id", "sender_id", "body", "is_read", "created_at")
        read_only_fields = ("id", "sender_id", "is_read", "created_at")
