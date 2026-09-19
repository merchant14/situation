from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = [migrations.swappable_dependency(settings.AUTH_USER_MODEL)]
    operations = [migrations.CreateModel(name="Interest", fields=[("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")), ("decision", models.CharField(choices=[("interested", "Interested"), ("pass", "Pass")], max_length=12)), ("created_at", models.DateTimeField(auto_now_add=True)), ("updated_at", models.DateTimeField(auto_now=True)), ("from_user", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="sent_interests", to=settings.AUTH_USER_MODEL)), ("to_user", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="received_interests", to=settings.AUTH_USER_MODEL))], options={"indexes": [models.Index(fields=["from_user", "decision"], name="interests_i_from_us_aa10d3_idx"), models.Index(fields=["to_user", "decision"], name="interests_i_to_user_2755eb_idx")]}), migrations.AddConstraint(model_name="interest", constraint=models.UniqueConstraint(fields=("from_user", "to_user"), name="unique_interest_direction"))]
