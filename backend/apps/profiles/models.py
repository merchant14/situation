import uuid
from django.conf import settings
from django.db import models

class Profile(models.Model):
    class Gender(models.TextChoices):
        WOMAN="woman","Woman"; MAN="man","Man"; NON_BINARY="non_binary","Non-binary"; OTHER="other","Other"; PREFER_NOT_TO_SAY="prefer_not_to_say","Prefer not to say"
    user=models.OneToOneField(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name="profile")
    public_id=models.UUIDField(default=uuid.uuid4,editable=False,unique=True)
    display_name=models.CharField(max_length=50)
    gender=models.CharField(max_length=20,choices=Gender.choices)
    city=models.CharField(max_length=100)
    bio=models.CharField(max_length=500,blank=True)
    photo=models.ImageField(upload_to="profiles/",blank=True,null=True)
    is_active=models.BooleanField(default=True)
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)
    def __str__(self): return f"{self.display_name} ({self.user.email})"
