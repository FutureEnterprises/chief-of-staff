-- AutopilotMapSnapshot — weekly "Wrapped for self-sabotage" snapshot.
--
-- One row per user per ISO week (weekStart = Monday 00:00 UTC of the
-- summarized week). Produced by /api/cron/autopilot-map-snapshot every
-- Monday 06:00 UTC for the week that just ended. Powers the four-card
-- artifact promised by the /autopilot-map marketing page plus the
-- public /m/[slug] share-card route.
--
-- Idempotent: (userId, weekStart) is unique — re-running the cron
-- upserts rather than duplicates. Safe to backfill.
--
-- IF NOT EXISTS on the table + indexes so this migration is replay-
-- safe in environments where prior partial applies left artifacts.

CREATE TABLE IF NOT EXISTS "autopilot_map_snapshots" (
  "id"               TEXT         NOT NULL,
  "userId"           TEXT         NOT NULL,
  "weekStart"        TIMESTAMP(3) NOT NULL,
  "weekLabel"        TEXT         NOT NULL,
  "topExcuse"        TEXT,
  "topExcuseCount"   INTEGER,
  "peakWindowLabel"  TEXT,
  "peakWindowSlips"  INTEGER,
  "slipsThisWeek"    INTEGER,
  "recoveredCount"   INTEGER,
  "recoveryRate"     INTEGER,
  "patternSignature" TEXT,
  "shareSlug"        TEXT         NOT NULL,
  "publishedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "autopilot_map_snapshots_pkey" PRIMARY KEY ("id")
);

-- Unique constraint on shareSlug so /m/[slug] resolves to at most one row.
CREATE UNIQUE INDEX IF NOT EXISTS "autopilot_map_snapshots_shareSlug_key"
  ON "autopilot_map_snapshots" ("shareSlug");

-- Idempotent upsert key: one snapshot per user per week.
CREATE UNIQUE INDEX IF NOT EXISTS "autopilot_map_snapshots_userId_weekStart_key"
  ON "autopilot_map_snapshots" ("userId", "weekStart");

-- Read pattern: render a user's most-recent snapshot on /autopilot-map
-- (ORDER BY weekStart DESC LIMIT 1).
CREATE INDEX IF NOT EXISTS "autopilot_map_snapshots_userId_weekStart_idx"
  ON "autopilot_map_snapshots" ("userId", "weekStart");

-- Foreign key — cascade on user delete (snapshots are derived data).
-- Guarded with a NOT EXISTS check so this migration is replay-safe.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'autopilot_map_snapshots_userId_fkey'
  ) THEN
    ALTER TABLE "autopilot_map_snapshots"
      ADD CONSTRAINT "autopilot_map_snapshots_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Defense-in-depth RLS, matching the COYL public-schema convention.
-- Prisma reads/writes via the service role (which bypasses RLS), so
-- the application keeps working with zero changes. This lock-down
-- prevents accidental exposure via the anon Supabase REST client.
-- /m/[slug] is rendered by the Next.js route handler using the
-- service-role Prisma client, not via the public REST surface.
ALTER TABLE "autopilot_map_snapshots" ENABLE ROW LEVEL SECURITY;
