#!/bin/bash
# Run database migrations on Ubuntu server (Docker or standalone PostgreSQL)
# Usage:
#   ./scripts/run-migrations.sh
#   DB_HOST=localhost DB_NAME=Internal_Hiring DB_USER=postgres DB_PASSWORD=secret ./scripts/run-migrations.sh

set -e

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-Internal_Hiring}"
DB_USER="${DB_USER:-postgres}"
export PGPASSWORD="${DB_PASSWORD:-}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="${SCRIPT_DIR}/../database/migrations"

echo "Running migrations from $MIGRATIONS_DIR"
echo "Connecting to $DB_NAME at $DB_HOST:$DB_PORT as $DB_USER"

# Create database if not exists (requires connection to postgres DB)
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'Internal_Hiring'" | grep -q 1 || \
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c 'CREATE DATABASE "Internal_Hiring"'

# Run each migration in order
for migration in "$MIGRATIONS_DIR"/*.sql; do
    if [ -f "$migration" ]; then
        echo "Applying: $(basename "$migration")"
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration" -v ON_ERROR_STOP=1
    fi
done

echo "Migrations completed successfully."
