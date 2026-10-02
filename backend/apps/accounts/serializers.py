from datetime import date
from uuid import uuid4

from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.utils import get_md5_hash_password
from drf_spectacular.utils import extend_schema_field

from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    class Meta:
        model = User
        fields = ("email", "password", "date_of_birth")

    def validate_email(self, value: str) -> str:
        email = value.lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("This email is already registered.")
        return email

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
            raise serializers.ValidationError({"email": "No account is registered with this email."})

        if not user.check_password(password):
            raise serializers.ValidationError({"password": "The password is incorrect."})

        refresh = RefreshToken.for_user(user)
        return {"refresh": str(refresh), "access": str(refresh.access_token)}


class CurrentUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "date_of_birth", "date_joined")
        read_only_fields = fields


class AccountSettingsSerializer(serializers.Serializer):
    display_name = serializers.CharField(allow_null=True)
    email = serializers.EmailField()


class SettingsFeaturesSerializer(serializers.Serializer):
    password_change = serializers.BooleanField()
    safety_tools = serializers.BooleanField()
    notification_settings = serializers.BooleanField()
    privacy_settings = serializers.BooleanField()
    delete_account = serializers.BooleanField()


class SettingsSummarySerializer(serializers.Serializer):
    account = serializers.SerializerMethodField()
    features = serializers.SerializerMethodField()

    @extend_schema_field(AccountSettingsSerializer)
    def get_account(self, user):
        profile = getattr(user, "profile", None)
        return AccountSettingsSerializer({
            "display_name": profile.display_name if profile else None,
            "email": user.email,
        }).data

    @extend_schema_field(SettingsFeaturesSerializer)
    def get_features(self, user):
        return SettingsFeaturesSerializer({
            "password_change": True,
            "safety_tools": True,
            "notification_settings": False,
            "privacy_settings": False,
            "delete_account": True,
        }).data


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True, trim_whitespace=False)
    new_password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("The current password is incorrect.")
        return value

    def validate_new_password(self, value):
        validate_password(value, user=self.context["request"].user)
        return value


class AccountDeletionSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_current_password(self, value):
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError("The current password is incorrect.")
        return value


class ActiveAccountTokenRefreshSerializer(TokenRefreshSerializer):
    def validate(self, attrs):
        refresh = self.token_class(attrs["refresh"])
        user_id = refresh.get(api_settings.USER_ID_CLAIM)
        try:
            user = User.objects.get(**{api_settings.USER_ID_FIELD: user_id})
        except User.DoesNotExist:
            raise AuthenticationFailed("The account is no longer available.")
        if not user.is_active:
            raise AuthenticationFailed("The account is no longer available.")
        if api_settings.CHECK_REVOKE_TOKEN and refresh.get(
            api_settings.REVOKE_TOKEN_CLAIM
        ) != get_md5_hash_password(user.password):
            raise AuthenticationFailed("The token has been revoked.")
        return super().validate(attrs)
