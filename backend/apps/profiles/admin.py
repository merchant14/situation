from django.contrib import admin

from .models import Profile


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("display_name", "city", "gender", "is_active", "created_at")
    list_filter = ("gender", "is_active")
    search_fields = ("display_name", "city", "user__email")
