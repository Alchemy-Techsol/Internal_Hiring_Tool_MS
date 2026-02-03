# Docker Deployment Guide - Ubuntu Server

Deploy the Internal Recruitment App on Ubuntu with Docker, PostgreSQL, and Nginx.

## Prerequisites

- Ubuntu 20.04+ (or any Linux with Docker)
- Docker 20.10+
- Docker Compose 2.0+

## Quick Start

```bash
# 1. Clone/copy the project
cd /path/to/Internal-Recruitement-App

# 2. Create .env file (copy from env.example and set DB_PASSWORD)
cp env.example .env
# Edit .env and set DB_PASSWORD, FRONTEND_URL

# 3. Build and run
docker compose up -d --build

# 4. Access the app at http://your-server-ip
```

## Environment Variables

Create a `.env` file in the project root:

```env
# Database
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_PORT=5432

# Optional: Frontend URL for CORS (use your domain in production)
FRONTEND_URL=https://your-domain.com
```

## Manual Migration (Existing PostgreSQL)

If you use an existing PostgreSQL server instead of Docker:

```bash
# Set connection vars and run migrations
export DB_HOST=your-db-host
export DB_PASSWORD=your-password
chmod +x scripts/run-migrations.sh
./scripts/run-migrations.sh
```

## Project Structure

```
├── docker-compose.yml      # Orchestration
├── backend/
│   └── Dockerfile
├── recruiter-frontend/
│   └── Dockerfile
├── database/
│   └── migrations/
│       └── 001_initial_schema.sql
├── docker/
│   └── init-db.sh         # Runs on first PostgreSQL start
├── nginx/
│   └── nginx.conf
└── scripts/
    └── run-migrations.sh  # For manual migration runs
```

## Ports

- **80** - Nginx (HTTP)
- **443** - Nginx (HTTPS, add certs to enable)
- **5000** - Backend API (internal)
- **5432** - PostgreSQL (internal)

## Production Checklist

1. Set strong `DB_PASSWORD` in `.env`
2. Configure `FRONTEND_URL` for CORS
3. Add SSL certificates for HTTPS (mount to nginx)
4. Use Docker secrets for sensitive data
5. Set up backups for PostgreSQL volume
