from django.urls import path
from .views import MatchMessagesView, MarkMessagesReadView

urlpatterns = [
    path("<uuid:match_id>/messages/", MatchMessagesView.as_view(), name="match-messages"),
    path("<uuid:match_id>/messages/read/", MarkMessagesReadView.as_view(), name="mark-messages-read"),
