from django.urls import include, path
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema


@extend_schema(responses={200: OpenApiTypes.OBJECT})
@api_view(["GET"])
@permission_classes([AllowAny])
def api_root(request):
    return Response({
        "success": True,
        "data": {
            "version": "v1",
            "endpoints": {"health": "/api/v1/health/"},
        },
    })


@extend_schema(responses={200: OpenApiTypes.OBJECT})
@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    return Response({"success": True, "data": {"status": "ok"}})


urlpatterns = [
    path("auth/", include("apps.accounts.urls")),
    path("profile/", include("apps.profiles.urls")),
    path("preferences/", include("apps.preferences.urls")),
    path("discover/", include("apps.discovery.urls")),
    path("", api_root, name="api-root"),
    path("health/", health_check, name="health-check"),
]
