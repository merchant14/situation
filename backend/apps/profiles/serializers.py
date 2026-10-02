from rest_framework import serializers
from apps.interests.serializers import ProfileInterestSerializer

from .models import Profile


class ProfileSerializer(serializers.ModelSerializer):
    photo_url = serializers.SerializerMethodField(read_only=True)
    photo = serializers.ImageField(write_only=True, required=False, allow_null=True)
    interests = ProfileInterestSerializer(many=True, read_only=True)

    class Meta:
        model = Profile
        fields = ("public_id", "display_name", "gender", "city", "bio", "interests", "is_active", "created_at", "updated_at", "photo", "photo_url")
        read_only_fields = ("public_id", "is_active", "created_at", "updated_at", "photo_url")

    def get_photo_url(self, obj: Profile):
        request = self.context.get("request")
        if obj.photo and hasattr(obj.photo, "url"):
            if request is not None:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return None

    def validate_photo(self, value):
        if value is None:
            return value
        content_type = value.content_type
        if content_type not in ("image/jpeg", "image/jpg", "image/png"):
            raise serializers.ValidationError("Only JPG and PNG images are allowed.")
        max_size = 5 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError("Image size must be 5 MB or less.")
        return value
