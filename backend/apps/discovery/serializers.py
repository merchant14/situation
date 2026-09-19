from datetime import date
from rest_framework import serializers
from apps.profiles.models import Profile

class DiscoveryProfileSerializer(serializers.ModelSerializer):
    age=serializers.SerializerMethodField()
    compatibility_score=serializers.SerializerMethodField()
    connection_goal=serializers.CharField(source="user.preferences.connection_goal",read_only=True)
    connection_style=serializers.CharField(source="user.preferences.connection_style",read_only=True)
    exclusivity=serializers.CharField(source="user.preferences.exclusivity",read_only=True)
    meeting_frequency=serializers.CharField(source="user.preferences.meeting_frequency",read_only=True)
    class Meta:
        model=Profile
        fields=("public_id","display_name","age","gender","city","bio","connection_goal","connection_style","exclusivity","meeting_frequency","compatibility_score")
    def get_age(self,profile):
        birth_date=profile.user.date_of_birth; today=date.today()
        return today.year-birth_date.year-((today.month,today.day)<(birth_date.month,birth_date.day))
    def get_compatibility_score(self,profile):
        request=self.context.get("request")
        mine=getattr(getattr(request,"user",None),"preferences",None)
        theirs=getattr(profile.user,"preferences",None)
        if not mine or not theirs:return 0
        fields=("connection_goal","connection_style","exclusivity","meeting_frequency")
        return round(sum(getattr(mine,f)==getattr(theirs,f) for f in fields)*25)
