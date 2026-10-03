from django.contrib import admin

from .models import ProfileInterest


@admin.register(ProfileInterest)
class ProfileInterestAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "profile_count", "created_at")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}

    @admin.display(description="Profiles")
    def profile_count(self, obj):
        return obj.profiles.count()
