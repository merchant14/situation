from django.contrib import admin
from .models import Block, Report
admin.site.register(Block)
@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ("reported", "category", "created_at")
    list_filter = ("category",)
    search_fields = ("reported__email", "reporter__email")
