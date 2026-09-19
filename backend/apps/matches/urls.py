from django.urls import path
from .views import MatchListView, UnmatchView

urlpatterns = [path("", MatchListView.as_view(), name="match-list"), path("<uuid:public_id>/", UnmatchView.as_view(), name="unmatch")]
