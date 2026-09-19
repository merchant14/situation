from django.db import migrations, models
import django.db.models.deletion
import uuid

class Migration(migrations.Migration):
    initial = True
    dependencies = [("accounts", "0002_user_date_of_birth_user_email"), ("matches", "0001_initial")]
    operations = [
        migrations.CreateModel(
            name="Notification",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("public_id", models.UUIDField(default=uuid.uuid4, editable=False, unique=True)),
                ("kind", models.CharField(choices=[("match","New match"),("message","New message"),("system","System")], max_length=20)),
                ("text", models.CharField(max_length=300)),
                ("is_read", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("actor", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="triggered_notifications", to="accounts.user")),
                ("match", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="notifications", to="matches.match")),
                ("recipient", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="notifications", to="accounts.user")),
            ],
            options={"ordering": ("-created_at",)},
        ),
        migrations.AddIndex(model_name="notification", index=models.Index(fields=("recipient","is_read","created_at"), name="notificati_recipie_9f5a3b_idx")),
    ]
