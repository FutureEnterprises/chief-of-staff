-- LiveActivityRegistration — tracks iOS ActivityKit Live Activities
-- so the server can push updates via APNs liveactivity pushes. See
-- apps/web/src/lib/live-activity-push.ts + the Expo bridge.
--
-- Idempotent: uses IF NOT EXISTS so re-running this migration on a
-- DB that already has the table is a no-op.

CREATE TABLE IF NOT EXISTS "live_activity_registrations" (
  "id"          TEXT PRIMARY KEY,
  "userId"      TEXT NOT NULL,
  "activityId"  TEXT NOT NULL,
  "pushToken"   TEXT,
  "interruptId" TEXT,
  "archetype"   TEXT,
  "startedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt"     TIMESTAMP(3),
  "active"      BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Foreign key to users — cascade delete so a user removal cleans up
-- their Live Activity registrations.
DO $$ BEGIN
  ALTER TABLE "live_activity_registrations"
    ADD CONSTRAINT "live_activity_registrations_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- One row per (user, activityId). Upsert key in the register endpoint.
CREATE UNIQUE INDEX IF NOT EXISTS "live_activity_registrations_userId_activityId_key"
  ON "live_activity_registrations" ("userId", "activityId");

-- Fast lookup for the danger-window-interrupt cron: "does this user
-- have any active Live Activity right now?"
CREATE INDEX IF NOT EXISTS "live_activity_registrations_userId_active_idx"
  ON "live_activity_registrations" ("userId", "active");

-- Token-based reverse lookup if we ever need to invalidate a stale
-- token (APNs returns BadDeviceToken when a token is dead — we want
-- to find which row to flip inactive without scanning the table).
CREATE INDEX IF NOT EXISTS "live_activity_registrations_pushToken_idx"
  ON "live_activity_registrations" ("pushToken");
