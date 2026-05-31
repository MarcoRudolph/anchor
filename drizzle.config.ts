import { defineConfig } from 'drizzle-kit';

// REVERSED Drizzle workflow (DEC-0013, Pitfall 2): the SQL migrations under
// supabase/migrations/ are the source of truth. `drizzle-kit pull` introspects the
// LIVE schema and WRITES src/db/schema.ts (+ relations.ts, meta snapshots). NEVER run
// `drizzle-kit generate` or `drizzle-kit push` against this config — schema.ts is generated output.
//
//   pnpm db:migrate        # psql -f every migration in lexical order (mutates the DB)
//   pnpm drizzle-kit pull  # introspect live schema -> src/db/schema.ts (regenerate, commit)
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts', // OUTPUT of `drizzle-kit pull`, not hand-authored
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL! },
  // Only introspect the application schema; skip Supabase-internal schemas (auth, storage, ...).
  schemaFilter: ['public'],
  // Skip extension-managed objects during introspection. drizzle-kit 0.31.x only accepts 'postgis'
  // here (the sole supported value); it excludes PostGIS-owned objects so pull never tries to model
  // them. We do not use PostGIS, so this is a harmless, forward-safe default.
  extensionsFilters: ['postgis'],
});
