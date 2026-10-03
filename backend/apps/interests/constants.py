from django.conf import settings

DEFAULT_PROFILE_INTEREST_LIMIT = 10
MAX_PROFILE_INTERESTS = getattr(settings, "MAX_PROFILE_INTERESTS", DEFAULT_PROFILE_INTEREST_LIMIT)

DEFAULT_PROFILE_INTERESTS = (
    ("Travel", "travel"), ("Music", "music"), ("Movies", "movies"),
    ("Hiking", "hiking"), ("Fitness", "fitness"), ("Food", "food"),
    ("Photography", "photography"), ("Reading", "reading"), ("Gaming", "gaming"),
)
