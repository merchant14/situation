from django.contrib import admin

from .models import Preference


@admin.register(Preference)
class PreferenceAdmin(admin.ModelAdmin):
    list_display = ("user", "connection_goal", "connection_style", "exclusivity", "meeting_frequency")
    list_filter = ("connection_goal", "connection_style", "exclusivity", "meeting_frequency")
