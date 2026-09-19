from rest_framework import generics, permissions

from apps.profiles.models import Profile

from .serializers import DiscoveryProfileSerializer


class DiscoveryListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DiscoveryProfileSerializer

    def get_queryset(self):
        return (
            Profile.objects.filter(is_active=True, user__is_active=True, user__preferences__isnull=False)
            .exclude(user=self.request.user)
            .select_related("user", "user__preferences")
            .order_by("-created_at")
        )
