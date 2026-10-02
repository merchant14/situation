from rest_framework import generics, permissions

from apps.profiles.models import Profile
from apps.moderation.models import Block
from apps.interests.models import Interest

from .serializers import DiscoveryProfileSerializer


class DiscoveryListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DiscoveryProfileSerializer

    def get_queryset(self):
        blocked_ids = Block.objects.filter(blocker=self.request.user).values("blocked")
        blocking_ids = Block.objects.filter(blocked=self.request.user).values("blocker")
        acted_on_ids = Interest.objects.filter(from_user=self.request.user).values("to_user_id")
        return (
            Profile.objects.filter(is_active=True, user__is_active=True, user__preferences__isnull=False)
            .exclude(user=self.request.user)
            .exclude(user__in=blocked_ids)
            .exclude(user__in=blocking_ids)
            .exclude(user_id__in=acted_on_ids)
            .select_related("user", "user__preferences")
            .prefetch_related("interests")
            .order_by("-created_at")
        )
