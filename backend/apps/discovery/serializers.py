from datetime import date

from rest_framework import serializers

from apps.profiles.models import Profile
from apps.interests.serializers import ProfileInterestSerializer


class DiscoveryProfileSerializer(serializers.ModelSerializer):
    age = serializers.SerializerMethodField()
    photo_url = serializers.SerializerMethodField(read_only=True)
    interests = ProfileInterestSerializer(many=True, read_only=True)
    connection_goal = serializers.CharField(source="user.preferences.connection_goal", read_only=True)
    connection_style = serializers.CharField(source="user.preferences.connection_style", read_only=True)
    exclusivity = serializers.CharField(source="user.preferences.exclusivity", read_only=True)
    meeting_frequency = serializers.CharField(source="user.preferences.meeting_frequency", read_only=True)

    class Meta:
        model = Profile
        fields = (
            "public_id", "display_name", "age", "gender", "city", "bio",
            "connection_goal", "connection_style", "exclusivity", "meeting_frequency", "photo_url", "interests",
        )

    def get_age(self, profile: Profile) -> int:
        birth_date = profile.user.date_of_birth
        today = date.today()
        return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))

    def get_photo_url(self, obj: Profile):
        request = self.context.get("request")
        if obj.photo and hasattr(obj.photo, "url"):
            if request is not None:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return None
