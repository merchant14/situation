from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = [migrations.swappable_dependency(settings.AUTH_USER_MODEL)]
    operations = [
        migrations.CreateModel(
            name="Preference",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("connection_goal", models.CharField(choices=[("situationship", "Situationship"), ("casual_dating", "Casual dating"), ("companionship", "Companionship"), ("friendship_romantic", "Friendship with romantic potential"), ("open_to_relationship", "Open to relationship")], max_length=30)),
                ("connection_style", models.CharField(choices=[("emotional", "Emotional"), ("romantic", "Romantic"), ("physical", "Physical"), ("social", "Social/companionship"), ("combination", "Combination")], max_length=20)),
                ("exclusivity", models.CharField(choices=[("yes", "Yes"), ("no", "No"), ("not_sure", "Not sure")], max_length=10)),
                ("meeting_frequency", models.CharField(choices=[("weekly", "Once a week"), ("monthly", "2-3 times a month"), ("occasionally", "Occasionally"), ("flexible", "Flexible")], max_length=20)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.OneToOneField(on_delete=models.deletion.CASCADE, related_name="preferences", to=settings.AUTH_USER_MODEL)),
            ],
        )
    ]
