from django.urls import path

from apps.interests.views import MyProfileInterestsView

from .views import MyProfileView, PublicProfileView

urlpatterns = [
    path("me/", MyProfileView.as_view(), name="my-profile"),
    path("interests/", MyProfileInterestsView.as_view(), name="my-profile-interests"),
    path("<uuid:public_id>/", PublicProfileView.as_view(), name="public-profile"),
]
