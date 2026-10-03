from django.urls import path

from .views import MyProfileView, PublicProfileView

urlpatterns = [
    path("me/", MyProfileView.as_view(), name="my-profile"),
    path("<uuid:public_id>/", PublicProfileView.as_view(), name="public-profile"),
]
