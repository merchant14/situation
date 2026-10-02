# Development demo data

The Django command creates a deterministic local dataset through the application's existing models and APIs. Run it from the repository root while the backend container is running:

```powershell
docker compose exec backend python manage.py seed_demo_data
```

The command requires `DJANGO_DEBUG=true`. It validates the shared password against the configured Django password validators and will refuse unexpected accounts that collide with a reserved demo email.

## Render production seed

The backend Docker image supports an explicit one-time production seed on startup. In the Render backend service, set `SEED_DEMO_DATA_ON_STARTUP=true` and deploy. The image runs migrations, seeds the demo data, then starts the web server. After the deploy succeeds, remove the variable or set it to `false` and redeploy. If left enabled, every service restart or deploy will reapply the demo data and reset the demo account passwords. Keep the service at one instance during seeding to avoid simultaneous seed runs.

This uses the shared demo password below, so use it only for a demo/staging deployment or a production instance where these demo accounts are intended to be accessible. A manual production run requires `python manage.py seed_demo_data --allow-production`.

## Login

All ten accounts use this development-only password:

```text
DemoPass123!
```

| Email | Scenario |
| --- | --- |
| `demo.alex@example.com` | Primary account; mutual match and conversation with Maya; passed Ethan |
| `demo.maya@example.com` | Mutual match and conversation with Alex |
| `demo.liam@example.com` | Mutual match and conversation with Sofia |
| `demo.sofia@example.com` | Mutual match with Liam; passed Amelia |
| `demo.noah@example.com` | Mutual match and safety report scenario with Chloe |
| `demo.emma@example.com` | One-sided interest in Oliver |
| `demo.oliver@example.com` | Receives Emma's one-sided interest; no match |
| `demo.chloe@example.com` | Mutual match with Noah; created the sample safety report |
| `demo.ethan@example.com` | No match; blocks Amelia |
| `demo.amelia@example.com` | No match; blocked by Ethan |

Every account has a profile and all four supported preferences. Bios and preference combinations vary by account and city. Alex, Maya, Liam, and Chloe use deterministic, locally generated abstract avatar placeholders; the other six profiles have no photo and exercise the UI fallback. No internet images are downloaded.

## Seeded relationships

- Three reciprocal interested pairs produce real Match rows: Alex/Maya, Liam/Sofia, and Noah/Chloe.
- Emma's interest in Oliver is one-sided.
- Alex has passed Ethan, and Sofia has passed Amelia. Discovery now excludes profiles the current user previously acted on, including passes, on subsequent requests.
- Alex/Maya and Liam/Sofia have seeded messages with varied timestamps and read states. Messages belong only to real matches.
- Ethan blocks Amelia. Chloe has filed a sample safety report about Noah.
- There is no Notification model/feed or hobby-interest/tag model in the current backend. No notification or hobby records are seeded, and no unsupported API is added. `Interest` stores directional `interested`/`pass` actions, not hobby tags.

## Reset and repeatability

Running the command again updates the same users, profiles, preferences, interaction rows, and deterministic messages. It does not add duplicate records. To rebuild the data:

```powershell
docker compose exec backend python manage.py seed_demo_data --reset
```

Reset only considers the ten reserved `demo.<name>@example.com` accounts, and checks their exact `demo_<name>` usernames and non-privileged status before proceeding. It refuses to delete them if a relationship exists with an account outside the demo set. Other accounts and records are preserved. Use these credentials only in local development.

## Useful flows

- Log in as Alex, open Matches, then open the existing Maya conversation; send a message or unmatch through the normal API.
- Log in as Maya to inspect the other side of that conversation and its unread message.
- Log in as Emma or Oliver to inspect the one-sided-interest/no-match state.
- Log in as Alex and refresh Discover to confirm Ethan stays excluded after the persisted pass.
- Log in as Ethan and confirm Amelia is excluded by the existing block rule.
- Use the existing moderation endpoints to inspect/report/block flows. Notifications cannot be exercised because a notification feed/read API and model are absent.
- Change preferences or profile fields through the existing `/api/v1/profile/me/` and `/api/v1/preferences/me/` endpoints.
# Development demo data

The Django command creates a deterministic local dataset through the application's existing models and APIs. Run it from the repository root while the backend container is running:

```powershell
docker compose exec backend python manage.py seed_demo_data
```

The command requires `DJANGO_DEBUG=true`. It validates the shared password against the configured Django password validators and will refuse unexpected accounts that collide with a reserved demo email.

## Login

All ten accounts use this development-only password:

```text
DemoPass123!
```

| Email | Scenario |
| --- | --- |
| `demo.alex@example.com` | Primary account; mutual match and conversation with Maya; passed Ethan |
| `demo.maya@example.com` | Mutual match and conversation with Alex |
| `demo.liam@example.com` | Mutual match and conversation with Sofia |
| `demo.sofia@example.com` | Mutual match with Liam; passed Amelia |
| `demo.noah@example.com` | Mutual match and safety report scenario with Chloe |
| `demo.emma@example.com` | One-sided interest in Oliver |
| `demo.oliver@example.com` | Receives Emma's one-sided interest; no match |
| `demo.chloe@example.com` | Mutual match with Noah; created the sample safety report |
| `demo.ethan@example.com` | No match; blocks Amelia |
| `demo.amelia@example.com` | No match; blocked by Ethan |

Every account has a profile and all four supported preferences. Bios and preference combinations vary by account and city. Alex, Maya, Liam, and Chloe use deterministic, locally generated abstract avatar placeholders; the other six profiles have no photo and exercise the UI fallback. No internet images are downloaded.

## Seeded relationships

- Three reciprocal interested pairs produce real Match rows: Alex/Maya, Liam/Sofia, and Noah/Chloe.
- Emma's interest in Oliver is one-sided.
- Alex has passed Ethan, and Sofia has passed Amelia. Discovery now excludes profiles the current user previously acted on, including passes, on subsequent requests.
- Alex/Maya and Liam/Sofia have seeded messages with varied timestamps and read states. Messages belong only to real matches.
- Ethan blocks Amelia. Chloe has filed a sample safety report about Noah.
- There is no Notification model/feed or hobby-interest/tag model in the current backend. No notification or hobby records are seeded, and no unsupported API is added. `Interest` stores directional `interested`/`pass` actions, not hobby tags.

## Reset and repeatability

Running the command again updates the same users, profiles, preferences, interaction rows, and deterministic messages. It does not add duplicate records. To rebuild the data:

```powershell
docker compose exec backend python manage.py seed_demo_data --reset
```

Reset only considers the ten reserved `demo.<name>@example.com` accounts, and checks their exact `demo_<name>` usernames and non-privileged status before proceeding. It refuses to delete them if a relationship exists with an account outside the demo set. Other accounts and records are preserved. Use these credentials only in local development.

## Useful flows

- Log in as Alex, open Matches, then open the existing Maya conversation; send a message or unmatch through the normal API.
- Log in as Maya to inspect the other side of that conversation and its unread message.
- Log in as Emma or Oliver to inspect the one-sided-interest/no-match state.
- Log in as Alex and refresh Discover to confirm Ethan stays excluded after the persisted pass.
- Log in as Ethan and confirm Amelia is excluded by the existing block rule.
- Use the existing moderation endpoints to inspect/report/block flows. Notifications cannot be exercised because a notification feed/read API and model are absent.
- Change preferences or profile fields through the existing `/api/v1/profile/me/` and `/api/v1/preferences/me/` endpoints.
