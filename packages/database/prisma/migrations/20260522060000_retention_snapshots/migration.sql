-- RetentionSnapshot — daily cohort retention metric, point-in-time.
--
-- Records D1 / D7 / D14 / D30 cohort retention rates once per day so
-- the admin dashboard can show retention TREND (not just the current
-- value, which jumps around on small cohorts). Written by the daily
-- retention-snapshot cron at 04:00 UTC.
--
-- Each row is one named cohort window on one snapshot date. The
-- cohort is defined relative to the snapshot date — e.g. on June 1,
-- the D7 cohort is users who registered May 18–25 and were active
-- May 25–June 1. This decoupling lets the admin dashboard show how
-- retention shifted across days without re-querying every cohort.
--
-- Idempotent: (snapshotDate, cohortKind) is unique. Re-runs upsert.
--
-- Cohort sizes < 20 are noisy — the UI marks those as "low signal"
-- so the founder doesn't over-react to a small cohort moving by
-- 10 percentage points.

CREATE TABLE "retention_snapshots" (
  "id"             TEXT         NOT NULL,
  "snapshotDate"   DATE         NOT NULL,
  "cohortKind"     TEXT         NOT NULL,
  "cohortSize"     INTEGER      NOT NULL,
  "retainedCount"  INTEGER      NOT NULL,
  "retentionPct"   DOUBLE PRECISION NOT NULL,
  "cohortStartAt"  TIMESTAMP(3) NOT NULL,
  "cohortEndAt"    TIMESTAMP(3) NOT NULL,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "retention_snapshots_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "retention_snapshots_snapshotDate_cohortKind_key"
    UNIQUE ("snapshotDate", "cohortKind")
);

CREATE INDEX "retention_snapshots_snapshotDate_idx"
  ON "retention_snapshots" ("snapshotDate" DESC);
CREATE INDEX "retention_snapshots_cohortKind_idx"
  ON "retention_snapshots" ("cohortKind");
