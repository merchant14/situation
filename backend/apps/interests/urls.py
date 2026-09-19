from django.urls import path
from .views import InterestActionView

urlpatterns = [path("", InterestActionView.as_view(), name="interest-action")]
