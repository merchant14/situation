from rest_framework import serializers

from .models import Profile


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ("public_id", "display_name", "gender", "city", "bio", "is_active", "created_at", "updated_at")
        read_only_fields = ("public_id", "is_active", "created_at", "updated_at")
