from django.db import migrations, models
import django.db.models.deletion
import uuid

class Migration(migrations.Migration):
    initial = True
    dependencies = [("accounts", "0002_user_date_of_birth_user_email"), ("matches", "0001_initial")]
    operations = [
        migrations.CreateModel(
            name="Message",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("public_id", models.UUIDField(default=uuid.uuid4, editable=False, unique=True)),
                ("body", models.TextField(max_length=2000)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("read_at", models.DateTimeField(blank=True, null=True)),
                ("match", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="messages", to="matches.match")),
                ("sender", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="sent_messages", to="accounts.user")),
            ],
            options={"ordering": ("created_at",)},
        ),
        migrations.AddIndex(model_name="message", index=models.Index(fields=("match", "created_at"), name="chat_messa_match_i_8e5b55_idx")),
        migrations.AddIndex(model_name="message", index=models.Index(fields=("sender", "created_at"), name="chat_messa_sender__1e20d4_idx")),
    ]
