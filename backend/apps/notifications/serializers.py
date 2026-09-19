from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ("public_id", "kind", "text", "match", "is_read", "created_at")
        read_only_fields = fields
