-- CronHeartbeat — last-success ledger for cron/workflow jobs.
--
-- Workflow DevKit-migrated jobs upsert here at the end of each run
-- so the admin dashboard can surface wedged or stale jobs. One row
-- per named job; `name` is the primary key. JSONB metadata column
-- stores per-run stats (counts, durations, errors).

CREATE TABLE "cron_heartbeats" (
  "name"        TEXT PRIMARY KEY,
  "lastRunAt"   TIMESTAMP(3) NOT NULL,
  "lastRunMeta" JSONB
);
