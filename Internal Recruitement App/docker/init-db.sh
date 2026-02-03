#!/bin/bash
set -e

# Create Internal_Hiring database (only runs on first container init)
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" -d postgres -c 'CREATE DATABASE "Internal_Hiring"'

# Run migrations
for migration in /migrations/*.sql; do
    if [ -f "$migration" ]; then
        echo "Running migration: $migration"
        psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "Internal_Hiring" -f "$migration"
    fi
done

echo "Database initialization complete."
