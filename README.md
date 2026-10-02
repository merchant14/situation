# Situationship Platform

An 18+ connection platform MVP. This repository currently contains only the development foundation; accounts, profiles, discovery, matching, chat, uploads, and moderation are intentionally not implemented yet.

## Architecture

The project is a modular monolith: Next.js/TypeScript/Tailwind provides the web UI, Django + Django REST Framework provides the versioned API, and PostgreSQL is the system of record. Cloudflare R2 will be added with profile-photo uploads. Django Channels and FastAPI are deferred until real-time chat and specialized matching justify them.

## Structure

```text
backend/          Django/DRF API
  apps/accounts/  Initial custom user model (no auth endpoints yet)
  config/         Settings, ASGI/WSGI, API routing
frontend/         Next.js + TypeScript + Tailwind shell
compose.yaml      PostgreSQL, backend, frontend services
```

## Local setup

1. Copy `.env.example` to `.env` and replace development secrets.
2. Run `docker compose up --build`.
3. Open `http://localhost:3000` for the frontend and `http://localhost:8001/api/v1/health/` for the API health check.

The backend runs migrations on startup. PostgreSQL data persists in the `postgres_data` Docker volume.

## Environment variables

`DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `DATABASE_URL`, and the `POSTGRES_*` variables configure local Django/PostgreSQL. `NEXT_PUBLIC_API_BASE_URL` configures the browser API base URL. The `R2_*` variables are documented as placeholders for the future profile photo feature.

## Checks

With a Python virtual environment that has `backend/requirements.txt` installed, run:

```powershell
Set-Location backend
python manage.py check
python manage.py test
```

With Docker running, check PostgreSQL connectivity and migrations through `docker compose up --build`; the backend will only start after PostgreSQL is healthy and executes `python manage.py migrate` first.

## Development demo accounts

With Docker running and `DJANGO_DEBUG=true`, create the deterministic local accounts and relationships with `docker compose exec backend python manage.py seed_demo_data`. Rebuild only those reserved demo accounts with `docker compose exec backend python manage.py seed_demo_data --reset`. Credentials, scenarios, reset safeguards, and current API limitations are documented in [docs/demo-data.md](docs/demo-data.md).

## API

`GET /api/v1/health/` confirms API availability. The initial account endpoints are `POST /api/v1/auth/register/`, `POST /api/v1/auth/login/`, `POST /api/v1/auth/refresh/`, and authenticated `GET /api/v1/auth/me/`. Registration accepts an email, password, and date of birth; users under 18 are rejected.

Authenticated profile setup uses `POST`, `GET`, and `PATCH /api/v1/profile/me/`; the same methods are available at `/api/v1/preferences/me/` for the four connection questions. `GET /api/v1/discover/` returns paginated active profiles with preferences, excluding the requester and private account data. Replace the development signing key before any deployment.

OpenAPI JSON is available at `/api/schema/`; Swagger UI is available at `/api/docs/`. Use the Swagger **Authorize** control with `Bearer <access token>` for authenticated endpoint exploration.

## Deployment notes

Never commit `.env` or production secrets. Use a secure secret manager in deployment, set `DJANGO_DEBUG=false`, use production allowed hosts/CORS origins, and run Django behind TLS-aware infrastructure.
