from datetime import date
from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import Match


class MatchSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()

    class Meta:
        model = Match
        fields = ("public_id", "profile", "created_at")

    @extend_schema_field(serializers.DictField())
    def get_profile(self, match) -> dict:
        other = match.user_two if match.user_one_id == self.context["request"].user.id else match.user_one
        profile = other.profile
        today = date.today()
        age = today.year - other.date_of_birth.year - ((today.month, today.day) < (other.date_of_birth.month, other.date_of_birth.day))
        photo_url = None
        request = self.context.get("request")
        if profile.photo and hasattr(profile.photo, "url"):
            photo_url = request.build_absolute_uri(profile.photo.url) if request is not None else profile.photo.url
        return {"public_id": str(profile.public_id), "display_name": profile.display_name, "age": age, "city": profile.city, "photo_url": photo_url}
