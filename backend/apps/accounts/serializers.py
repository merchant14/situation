from datetime import date
from uuid import uuid4

from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    class Meta:
        model = User
        fields = ("email", "password", "date_of_birth")

    def validate_email(self, value: str) -> str:
        return value.lower()

    def validate_date_of_birth(self, value: date) -> date:
        today = date.today()
        age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
        if age < 18:
            raise serializers.ValidationError("You must be at least 18 years old to register.")
        return value

    def validate_password(self, value: str) -> str:
        validate_password(value)
        return value

    def create(self, validated_data: dict) -> User:
        # Keep username as a non-public compatibility field while email is the login identity.
        user = User(
            email=validated_data["email"],
            date_of_birth=validated_data["date_of_birth"],
            username=f"user-{uuid4().hex}",
        )
        user.set_password(validated_data["password"])
        user.save()
        return user


class EmailTokenObtainPairSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs: dict) -> dict:
        email = attrs["email"].lower()
        password = attrs["password"]
        try:
            user = User.objects.get(email__iexact=email, is_active=True)
        except User.DoesNotExist:
            raise serializers.ValidationError("No active account found with the given credentials.")

        if not user.check_password(password):
            raise serializers.ValidationError("No active account found with the given credentials.")

        refresh = RefreshToken.for_user(user)
        return {"refresh": str(refresh), "access": str(refresh.access_token)}


class CurrentUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "date_of_birth", "date_joined")
        read_only_fields = fields
