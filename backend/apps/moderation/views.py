from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import permissions, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.matches.models import Match
from apps.profiles.models import Profile
from .models import Block, Report

class TargetSerializer(serializers.Serializer):
    target_profile_id=serializers.UUIDField()
class ReportSerializer(TargetSerializer):
    category=serializers.ChoiceField(choices=Report.Category.choices)
    details=serializers.CharField(max_length=500,required=False,allow_blank=True)

class BlockView(APIView):
    permission_classes=[permissions.IsAuthenticated]
    def get(self,request):
        blocks=Block.objects.filter(blocker=request.user).select_related("blocked__profile").order_by("-created_at")
        return Response({"success":True,"data":[{"profile_id":str(b.blocked.profile.public_id),"display_name":b.blocked.profile.display_name,"created_at":b.created_at} for b in blocks]})
    def post(self,request):
        serializer=TargetSerializer(data=request.data); serializer.is_valid(raise_exception=True)
        profile=get_object_or_404(Profile,public_id=serializer.validated_data["target_profile_id"])
        if profile.user_id==request.user.id:return Response({"detail":"You cannot block yourself."},status=400)
        Block.objects.get_or_create(blocker=request.user,blocked=profile.user)
        Match.objects.filter(Q(user_one=request.user,user_two=profile.user)|Q(user_one=profile.user,user_two=request.user)).delete()
        return Response({"success":True,"data":{"blocked":True}})
    def delete(self,request):
        serializer=TargetSerializer(data=request.data); serializer.is_valid(raise_exception=True)
        profile=get_object_or_404(Profile,public_id=serializer.validated_data["target_profile_id"])
        Block.objects.filter(blocker=request.user,blocked=profile.user).delete()
        return Response({"success":True,"data":{"blocked":False}})

class ReportView(APIView):
    permission_classes=[permissions.IsAuthenticated]
    def post(self,request):
        serializer=ReportSerializer(data=request.data); serializer.is_valid(raise_exception=True)
        profile=get_object_or_404(Profile,public_id=serializer.validated_data.pop("target_profile_id"))
        if profile.user_id==request.user.id:return Response({"detail":"You cannot report yourself."},status=400)
        Report.objects.create(reporter=request.user,reported=profile.user,**serializer.validated_data)
        return Response({"success":True,"data":{"reported":True}},status=status.HTTP_201_CREATED)
