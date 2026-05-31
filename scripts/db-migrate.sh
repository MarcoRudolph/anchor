#!/usr/bin/env bash
# Anchor DB migration runner: applies all SQL migrations in lexical order via psql.
# Requires: DATABASE_URL environment variable set.
# Usage: pnpm db:migrate
#
# ON_ERROR_STOP=1 ensures psql exits non-zero on the first SQL error so this
# script propagates the failure rather than continuing with a broken schema.

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
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
done

echo "Migrations complete."
