from django.urls import path
from .views import (AccountTokenRefreshView, CurrentUserView, LoginView,
                    PasswordChangeView, RegisterView)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("refresh/", AccountTokenRefreshView.as_view(), name="token-refresh"),
    path("me/", CurrentUserView.as_view(), name="current-user"),
    path("change-password/", PasswordChangeView.as_view(), name="change-password"),
]
