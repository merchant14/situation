import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = [migrations.swappable_dependency(settings.AUTH_USER_MODEL)]
    operations = [migrations.CreateModel(name="Match", fields=[("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")), ("public_id", models.UUIDField(default=uuid.uuid4, editable=False, unique=True)), ("created_at", models.DateTimeField(auto_now_add=True)), ("user_one", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="matches_as_one", to=settings.AUTH_USER_MODEL)), ("user_two", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="matches_as_two", to=settings.AUTH_USER_MODEL))], options={"indexes": [models.Index(fields=["user_one"], name="matches_mat_user_on_b31334_idx"), models.Index(fields=["user_two"], name="matches_mat_user_tw_9dfaba_idx")]}), migrations.AddConstraint(model_name="match", constraint=models.UniqueConstraint(fields=("user_one", "user_two"), name="unique_match_pair"))]
