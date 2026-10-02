from django.db import transaction
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema

from .serializers import (CurrentUserSerializer, EmailTokenObtainPairSerializer,
                          AccountDeletionSerializer, ActiveAccountTokenRefreshSerializer,
                          PasswordChangeSerializer, RegisterSerializer, SettingsSummarySerializer)

class RegisterView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer
    throttle_scope = "auth"

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {"success": True, "data": CurrentUserSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )


class LoginView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]
    serializer_class = EmailTokenObtainPairSerializer
    throttle_scope = "auth"

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        return Response({"success": True, "data": response.data}, status=response.status_code)


class AccountTokenRefreshView(TokenRefreshView):
    serializer_class = ActiveAccountTokenRefreshSerializer


class CurrentUserView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CurrentUserSerializer

    def get_object(self):
        return self.request.user

    @extend_schema(
        request=AccountDeletionSerializer,
        responses={
            200: OpenApiTypes.OBJECT,
            400: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT,
        },
        description=(
            "Permanently delete the authenticated user's account. Send a JSON request body "
            '`{"current_password": "your-current-password"}`. The required `current_password` '
            "field confirms the account owner. Returns 400 for a missing or incorrect password "
            "and 401 when the request is unauthenticated."
        ),
    )
    def delete(self, request, *args, **kwargs):
        serializer = AccountDeletionSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        user = request.user
        profile = getattr(user, "profile", None)
        photo_name = profile.photo.name if profile and profile.photo else None
        photo_storage = profile.photo.storage if photo_name else None

        with transaction.atomic():
            user.delete()
            if photo_name:
                transaction.on_commit(
                    lambda: photo_storage.delete(photo_name),
                    robust=True,
                )

        return Response({"success": True, "data": {"deleted": True}}, status=status.HTTP_200_OK)


class SettingsSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(responses=SettingsSummarySerializer)
    def get(self, request):
        return Response(SettingsSummarySerializer(request.user).data)


class PasswordChangeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(request=PasswordChangeSerializer, responses={204: None})
    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save(update_fields=("password",))
        return Response(status=status.HTTP_204_NO_CONTENT)
