from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response

from .models import Match
from .serializers import MatchSerializer


class MatchListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MatchSerializer

    def get_queryset(self):
        return Match.objects.filter(Q(user_one=self.request.user) | Q(user_two=self.request.user)).select_related("user_one__profile", "user_two__profile").order_by("-created_at")


class UnmatchView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MatchSerializer
    lookup_field = "public_id"

    def get_queryset(self):
        return Match.objects.filter(Q(user_one=self.request.user) | Q(user_two=self.request.user))

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
