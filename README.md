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
3. Open `http://localhost:3000` for the frontend and `http://localhost:8000/api/v1/health/` for the API health check.

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

## API

`GET /api/v1/health/` is the only current API endpoint. Versioned routes for product features will be added in subsequent stages.

## Deployment notes

Never commit `.env` or production secrets. Use a secure secret manager in deployment, set `DJANGO_DEBUG=false`, use production allowed hosts/CORS origins, and run Django behind TLS-aware infrastructure.
