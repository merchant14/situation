from django.urls import path

from .views import ChatMessageListCreateView, MarkMessagesAsReadView, UpdateMessageView, DeleteMessageView

urlpatterns = [
    path("<str:match_id>/messages/", ChatMessageListCreateView.as_view(), name="messages"),
    path("<str:match_id>/messages/read/", MarkMessagesAsReadView.as_view(), name="mark-read"),
    path("<str:match_id>/messages/<str:message_id>/", UpdateMessageView.as_view(), name="update-message"),
    path("<str:match_id>/messages/<str:message_id>/delete/", DeleteMessageView.as_view(), name="delete-message"),
]
