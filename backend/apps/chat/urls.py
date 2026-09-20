from django.urls import path

from .views import ChatMessageListCreateView, MarkMessagesAsReadView

urlpatterns = [
    path("<str:match_id>/messages/", ChatMessageListCreateView.as_view(), name="chat-messages"),
    path("<str:match_id>/messages/read/", MarkMessagesAsReadView.as_view(), name="mark-read"),
]
