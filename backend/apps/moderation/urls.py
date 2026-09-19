from django.urls import path
from .views import BlockView,ReportView
urlpatterns=[path("blocks/",BlockView.as_view(),name="blocks"),path("reports/",ReportView.as_view(),name="reports")]
