from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.matches.models import Match

from .models import Message
from .serializers import MessageSerializer


class ChatMessageListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MessageSerializer

    def get_match(self):
        match_id = self.kwargs.get("match_id")
        match = get_object_or_404(Match, public_id=match_id)
        if not (match.user_one == self.request.user or match.user_two == self.request.user):
            self.permission_denied(self.request, "You are not a participant in this match.")
        return match

    def get_queryset(self):
        match = self.get_match()
        return Message.objects.filter(match=match).order_by("created_at")

    def perform_create(self, serializer):
        match = self.get_match()
        serializer.save(sender=self.request.user, match=match)


class MarkMessagesAsReadView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        match_id = self.kwargs.get("match_id")
        match = get_object_or_404(Match, public_id=match_id)
        if not (match.user_one == request.user or match.user_two == request.user):
            self.permission_denied(request, "You are not a participant in this match.")

        # Mark all messages from the other user as read
        other_user = match.user_two if match.user_one == request.user else match.user_one
        Message.objects.filter(match=match, sender=other_user, is_read=False).update(is_read=True)

        return Response(status=status.HTTP_204_NO_CONTENT)


class UpdateMessageView(generics.UpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MessageSerializer

    def get_object(self):
        match_id = self.kwargs.get("match_id")
        message_id = self.kwargs.get("message_id")
        match = get_object_or_404(Match, public_id=match_id)
        if not (match.user_one == self.request.user or match.user_two == self.request.user):
            self.permission_denied(self.request, "Not a match participant")
        message = get_object_or_404(Message, id=message_id, match=match)
        if message.sender != self.request.user:
            self.permission_denied(self.request, "Can only edit own messages")
        if message.is_deleted:
            self.permission_denied(self.request, "Cannot edit deleted messages")
        return message

    def perform_update(self, serializer):
        serializer.save(edited_at=timezone.now())


class DeleteMessageView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MessageSerializer

    def get_object(self):
        match_id = self.kwargs.get("match_id")
        message_id = self.kwargs.get("message_id")
        match = get_object_or_404(Match, public_id=match_id)
        if not (match.user_one == self.request.user or match.user_two == self.request.user):
            self.permission_denied(self.request, "Not a match participant")
        message = get_object_or_404(Message, id=message_id, match=match)
        if message.sender != self.request.user:
            self.permission_denied(self.request, "Can only delete own messages")
        return message

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.body = "[This message was deleted]"
        instance.save()
