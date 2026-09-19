from django.conf import settings
from django.contrib import admin
from django.urls import include, path
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns=[
    path("admin/",admin.site.urls),
    path("api/schema/",SpectacularAPIView.as_view(),name="openapi-schema"),
    path("api/docs/",SpectacularSwaggerView.as_view(url_name="openapi-schema"),name="swagger-ui"),
    path("api/v1/",include("config.api_urls")),
]+static(settings.MEDIA_URL,document_root=settings.MEDIA_ROOT)
