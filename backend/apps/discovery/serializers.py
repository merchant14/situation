from datetime import date

from rest_framework import serializers

from apps.profiles.models import Profile


class DiscoveryProfileSerializer(serializers.ModelSerializer):
    age = serializers.SerializerMethodField()
    connection_goal = serializers.CharField(source="user.preferences.connection_goal", read_only=True)
    connection_style = serializers.CharField(source="user.preferences.connection_style", read_only=True)
    exclusivity = serializers.CharField(source="user.preferences.exclusivity", read_only=True)
    meeting_frequency = serializers.CharField(source="user.preferences.meeting_frequency", read_only=True)

    class Meta:
        model = Profile
        fields = (
            "public_id", "display_name", "age", "gender", "city", "bio",
            "connection_goal", "connection_style", "exclusivity", "meeting_frequency",
        )

    def get_age(self, profile: Profile) -> int:
        birth_date = profile.user.date_of_birth
        today = date.today()
        return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
