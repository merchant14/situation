from rest_framework import serializers
from .constants import MAX_PROFILE_INTERESTS
from .models import ProfileInterest


class ProfileInterestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfileInterest
        fields = ("id", "name", "slug")


class ProfileInterestsUpdateSerializer(serializers.Serializer):
    interest_ids = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=ProfileInterest.objects.all()),
        allow_empty=True,
        max_length=MAX_PROFILE_INTERESTS,
    )

    def validate_interest_ids(self, interests):
        ids = [interest.pk for interest in interests]
        if len(ids) != len(set(ids)):
            raise serializers.ValidationError("Duplicate interests are not allowed.")
        return interests


class InterestActionSerializer(serializers.Serializer):
    target_profile_id = serializers.UUIDField()
    decision = serializers.ChoiceField(choices=("interested", "pass"))
