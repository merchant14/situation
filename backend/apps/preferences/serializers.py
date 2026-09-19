from rest_framework import serializers

from .models import Preference


class PreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Preference
        fields = ("connection_goal", "connection_style", "exclusivity", "meeting_frequency", "created_at", "updated_at")
        read_only_fields = ("created_at", "updated_at")
