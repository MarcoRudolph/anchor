#!/usr/bin/env bash
# Anchor DB migration runner: applies all SQL migrations in lexical order via psql.
# Requires: DATABASE_URL environment variable set.
# Usage: pnpm db:migrate

set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set." >&2
  exit 1
fi

MIGRATIONS_DIR="$(dirname "$0")/../supabase/migrations"

if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "No migrations directory found at $MIGRATIONS_DIR — nothing to run."
  exit 0
fi

for f in $(ls "$MIGRATIONS_DIR"/*.sql 2>/dev/null | sort); do
  echo "Applying: $f"
  psql "$DATABASE_URL" -f "$f"
done

echo "Migrations complete."
