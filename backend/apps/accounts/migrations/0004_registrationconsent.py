from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("accounts", "0003_alter_user_date_joined_alter_user_email"),
    ]

    operations = [
        migrations.CreateModel(
            name="RegistrationConsent",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("terms_version", models.CharField(max_length=32)),
                ("privacy_version", models.CharField(max_length=32)),
                ("accepted_at", models.DateTimeField()),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="registration_consent", to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
