from rest_framework import serializers
from .models import Message

class MessageSerializer(serializers.ModelSerializer):
    is_edited = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = ("id", "sender_id", "body", "is_read", "is_deleted", "edited_at", "is_edited", "created_at")
        read_only_fields = ("id", "sender_id", "is_read", "created_at")
    
    def get_is_edited(self, obj):
        return obj.edited_at is not None
