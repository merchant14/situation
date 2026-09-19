from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Notification
from .serializers import NotificationSerializer

class NotificationListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NotificationSerializer
    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

class NotificationReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request, public_id):
        notification = get_object_or_404(Notification, public_id=public_id, recipient=request.user)
        notification.is_read = True
        notification.save(update_fields=["is_read"])
        return Response({"success": True})

class NotificationReadAllView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        count = Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({"success": True, "data": {"updated": count}})
