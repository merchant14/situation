from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions
from rest_framework.exceptions import ValidationError

from .models import Preference
from .serializers import PreferenceSerializer


class MyPreferenceView(generics.RetrieveUpdateAPIView, generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PreferenceSerializer

    def get_object(self):
        return get_object_or_404(Preference, user=self.request.user)

    def perform_create(self, serializer):
        if Preference.objects.filter(user=self.request.user).exists():
            raise ValidationError({"detail": "Connection preferences already exist for this account."})
        serializer.save(user=self.request.user)
