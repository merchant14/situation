from django.db import IntegrityError, transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from apps.matches.models import Match
from apps.profiles.models import Profile
from apps.moderation.models import Block
from apps.notifications.models import Notification

from .models import Interest
from .serializers import InterestActionSerializer


class InterestActionView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = InterestActionSerializer

    @extend_schema(request=InterestActionSerializer, responses={200: InterestActionSerializer})
    def post(self, request):
        serializer = InterestActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        target = get_object_or_404(Profile, public_id=serializer.validated_data["target_profile_id"], is_active=True)
        if target.user_id == request.user.id:
            return Response({"detail": "You cannot act on your own profile."}, status=status.HTTP_400_BAD_REQUEST)
        if Block.objects.filter(Q(blocker=request.user, blocked=target.user) | Q(blocker=target.user, blocked=request.user)).exists():
            return Response({"detail": "This action is unavailable."}, status=status.HTTP_403_FORBIDDEN)

        with transaction.atomic():
            # Serialize actions for this pair so concurrent reciprocal requests cannot
            # both race through the match/notification creation path.
            locked_users = list(type(request.user).objects.select_for_update().filter(
                id__in=sorted((request.user.id, target.user_id))
            ).order_by("id"))
            if Block.objects.filter(Q(blocker=request.user, blocked=target.user) | Q(blocker=target.user, blocked=request.user)).exists():
                return Response({"detail": "This action is unavailable."}, status=status.HTTP_403_FORBIDDEN)
            interest, _ = Interest.objects.update_or_create(
                from_user=request.user,
                to_user=target.user,
                defaults={"decision": serializer.validated_data["decision"]},
            )
            match = None
            reciprocal = interest.decision == Interest.Decision.INTERESTED and Interest.objects.filter(
                from_user=target.user, to_user=request.user, decision=Interest.Decision.INTERESTED
            ).exists()
            if interest.decision == Interest.Decision.INTERESTED and not reciprocal:
                Notification.objects.get_or_create(
                    recipient=target.user, actor=request.user, kind=Notification.Kind.INTEREST,
                    defaults={
                        "title": "Someone is interested in you",
                        "body": f"{request.user.profile.display_name} is interested in you.",
                        "metadata": {"profile_id": str(request.user.profile.public_id)},
                    },
                )
            if reciprocal:
                first, second = sorted((request.user, target.user), key=lambda user: user.id)
                try:
                    match, _ = Match.objects.get_or_create(user_one=first, user_two=second)
                except IntegrityError:
                    match = Match.objects.get(user_one=first, user_two=second)
                for recipient, other in ((request.user, target.user), (target.user, request.user)):
                    Notification.objects.get_or_create(
                        recipient=recipient, match=match, kind=Notification.Kind.MATCH,
                        defaults={
                            "actor": other,
                            "title": "You have a new match",
                            "body": f"You matched with {other.profile.display_name}!",
                            "metadata": {"match_id": str(match.public_id)},
                        },
                    )

        data = {"decision": interest.decision, "matched": match is not None}
        if match:
            data["match_id"] = str(match.public_id)
        return Response({"success": True, "data": data})
