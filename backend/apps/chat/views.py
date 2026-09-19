from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.matches.models import Match
from apps.moderation.models import Block
from .models import Message
from .serializers import MessageSerializer

class MatchMessagesView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MessageSerializer

    def get_match(self):
        return get_object_or_404(Match, public_id=self.kwargs["match_id"])

    def get_queryset(self):
        match = self.get_match()
        if self.request.user.id not in (match.user_one_id, match.user_two_id):
            return Message.objects.none()
        return Message.objects.filter(match=match).select_related("sender__profile")

    def create(self, request, *args, **kwargs):
        match = self.get_match()
        if request.user.id not in (match.user_one_id, match.user_two_id):
            return Response({"detail": "You are not part of this match."}, status=status.HTTP_403_FORBIDDEN)
        other_id = match.user_two_id if request.user.id == match.user_one_id else match.user_one_id
        if Block.objects.filter(blocker=request.user, blocked_id=other_id).exists() or Block.objects.filter(blocker_id=other_id, blocked=request.user).exists():
            return Response({"detail": "Messaging is unavailable for this match."}, status=status.HTTP_403_FORBIDDEN)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        message = serializer.save(match=match, sender=request.user)
        return Response(self.get_serializer(message).data, status=status.HTTP_201_CREATED)

class MarkMessagesReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request, match_id):
        match = get_object_or_404(Match, public_id=match_id)
        if request.user.id not in (match.user_one_id, match.user_two_id):
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
        updated = Message.objects.filter(match=match).exclude(sender=request.user).filter(read_at__isnull=True).update(read_at=timezone.now())
        return Response({"success": True, "data": {"updated": updated}})
