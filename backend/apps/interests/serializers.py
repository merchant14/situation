from rest_framework import serializers


class InterestActionSerializer(serializers.Serializer):
    target_profile_id = serializers.UUIDField()
    decision = serializers.ChoiceField(choices=("interested", "pass"))
