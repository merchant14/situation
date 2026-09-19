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
    permission_classes=[permissions.IsAuthenticated]
    serializer_class=InterestActionSerializer

    @extend_schema(request=InterestActionSerializer,responses={200:InterestActionSerializer})
    def post(self,request):
        serializer=InterestActionSerializer(data=request.data); serializer.is_valid(raise_exception=True)
        target=get_object_or_404(Profile,public_id=serializer.validated_data["target_profile_id"],is_active=True)
        if target.user_id==request.user.id: return Response({"detail":"You cannot act on your own profile."},status=400)
        if Block.objects.filter(Q(blocker=request.user,blocked=target.user)|Q(blocker=target.user,blocked=request.user)).exists():
            return Response({"detail":"This action is unavailable."},status=status.HTTP_403_FORBIDDEN)
        with transaction.atomic():
            interest,_=Interest.objects.update_or_create(from_user=request.user,to_user=target.user,defaults={"decision":serializer.validated_data["decision"]})
            match=None
            if interest.decision==Interest.Decision.INTERESTED and Interest.objects.filter(from_user=target.user,to_user=request.user,decision=Interest.Decision.INTERESTED).exists():
                first,second=sorted((request.user,target.user),key=lambda user:user.id)
                try: match,_=Match.objects.get_or_create(user_one=first,user_two=second)
                except IntegrityError: match=Match.objects.get(user_one=first,user_two=second)
                Notification.objects.get_or_create(recipient=request.user,actor=target.user,kind=Notification.Kind.MATCH,match=match,text=f"You matched with {target.profile.display_name}.")
                Notification.objects.get_or_create(recipient=target.user,actor=request.user,kind=Notification.Kind.MATCH,match=match,text=f"You matched with {request.user.profile.display_name}.")
        data={"decision":interest.decision,"matched":match is not None}
        if match: data["match_id"]=str(match.public_id)
        return Response({"success":True,"data":data})
