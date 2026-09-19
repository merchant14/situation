from rest_framework import serializers
from .models import Profile

class ProfileSerializer(serializers.ModelSerializer):
    photo_url=serializers.SerializerMethodField()
    class Meta:
        model=Profile
        fields=("public_id","display_name","gender","city","bio","photo","photo_url","is_active","created_at","updated_at")
        read_only_fields=("public_id","photo_url","is_active","created_at","updated_at")
    def get_photo_url(self,obj):
        if not obj.photo:return None
        request=self.context.get("request")
        return request.build_absolute_uri(obj.photo.url) if request else obj.photo.url
