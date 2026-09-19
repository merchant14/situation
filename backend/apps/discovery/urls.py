from django.urls import path

from .views import DiscoveryListView

urlpatterns = [path("", DiscoveryListView.as_view(), name="discovery-list")]
