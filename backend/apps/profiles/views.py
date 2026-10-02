from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, parsers
from rest_framework.exceptions import ValidationError
from django.db.models import Q

from apps.discovery.serializers import DiscoveryProfileSerializer
from apps.moderation.models import Block
from .models import Profile
from .serializers import ProfileSerializer


class MyProfileView(generics.RetrieveUpdateAPIView, generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ProfileSerializer
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def get_object(self):
        return get_object_or_404(Profile, user=self.request.user)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

    def perform_create(self, serializer):
        if Profile.objects.filter(user=self.request.user).exists():
            raise ValidationError({"detail": "A profile already exists for this account."})
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        serializer.save()


class PublicProfileView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DiscoveryProfileSerializer
    lookup_field = "public_id"

    def get_queryset(self):
        blocked = Block.objects.filter(blocker=self.request.user).values("blocked_id")
        blocking = Block.objects.filter(blocked=self.request.user).values("blocker_id")
        return (
            Profile.objects.filter(is_active=True, user__is_active=True, user__preferences__isnull=False)
            .exclude(user=self.request.user)
            .exclude(user_id__in=blocked)
            .exclude(user_id__in=blocking)
            .select_related("user", "user__preferences")
        )

    def get_serializer_context(self):
        return {**super().get_serializer_context(), "request": self.request}
