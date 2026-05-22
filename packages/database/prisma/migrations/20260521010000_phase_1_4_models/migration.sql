-- Phase 1-4 moat layer
--
-- Adds the data substrate for the passive-signal stack, predictive
-- model, daily-number ritual, redirect choices, family/couples
-- accountability pods, and Microsoft Teams B2B provisioning.
--
-- The legacy `pod_members` table (challenge-cohort membership) is
-- renamed to `challenge_pod_members` so the table name `pod_members`
-- can be reused by the new family/couples accountability pod model.
-- The new `PodMember` Prisma model is a fundamentally different shape
-- (shareLevel, archetype, active, invitedBy) and joins to the new
-- `pods` table, not `challenge_pods`.

-- ============================================================
-- STEP 1 — Rename legacy challenge-pod membership table
-- ============================================================

ALTER TABLE "pod_members" RENAME TO "challenge_pod_members";

ALTER TABLE "challenge_pod_members" RENAME CONSTRAINT "pod_members_pkey" TO "challenge_pod_members_pkey";
ALTER TABLE "challenge_pod_members" RENAME CONSTRAINT "pod_members_podId_fkey" TO "challenge_pod_members_podId_fkey";
ALTER TABLE "challenge_pod_members" RENAME CONSTRAINT "pod_members_userId_fkey" TO "challenge_pod_members_userId_fkey";

ALTER INDEX "pod_members_podId_userId_key" RENAME TO "challenge_pod_members_podId_userId_key";

-- ============================================================
-- STEP 2 — SignalCluster
-- ============================================================

CREATE TABLE "signal_clusters" (
  "id"                  TEXT        NOT NULL,
  "userId"              TEXT        NOT NULL,
  "capturedAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "hrvSamples"          JSONB,
  "hrvBaseline"         DOUBLE PRECISION,
  "hrvDeltaPct"         DOUBLE PRECISION,
  "sedentaryMins"       INTEGER,
  "unlockRateDelta"     DOUBLE PRECISION,
  "screenOnMins"        INTEGER,
  "locationKind"        TEXT,
  "dayOfWeek"           INTEGER     NOT NULL,
  "hourOfDay"           INTEGER     NOT NULL,
  "meetingDensity"      INTEGER,
  "weekdayStress"       TEXT,
  "outcomeWithin30Min"  TEXT,
  "outcomeWithin60Min"  TEXT,
  "outcomeRecordedAt"   TIMESTAMP(3),
  CONSTRAINT "signal_clusters_pkey"       PRIMARY KEY ("id"),
  CONSTRAINT "signal_clusters_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "signal_clusters_userId_capturedAt_idx"
  ON "signal_clusters"("userId", "capturedAt");
CREATE INDEX IF NOT EXISTS "signal_clusters_userId_outcomeWithin30Min_idx"
  ON "signal_clusters"("userId", "outcomeWithin30Min");

-- ============================================================
-- STEP 3 — PredictionModel
-- ============================================================

CREATE TABLE "prediction_models" (
  "id"            TEXT             NOT NULL,
  "userId"        TEXT             NOT NULL,
  "version"       INTEGER          NOT NULL DEFAULT 1,
  "coefficients"  JSONB            NOT NULL,
  "intercept"     DOUBLE PRECISION NOT NULL,
  "trainedOn"     TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sampleCount"   INTEGER          NOT NULL,
  "accuracy"      DOUBLE PRECISION,
  "precision"     DOUBLE PRECISION,
  "recall"        DOUBLE PRECISION,
  "active"        BOOLEAN          NOT NULL DEFAULT true,
  CONSTRAINT "prediction_models_pkey"       PRIMARY KEY ("id"),
  CONSTRAINT "prediction_models_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "prediction_models_userId_version_key"
  ON "prediction_models"("userId", "version");
CREATE INDEX IF NOT EXISTS "prediction_models_userId_active_idx"
  ON "prediction_models"("userId", "active");

-- ============================================================
-- STEP 4 — DailyNumber
-- ============================================================

CREATE TABLE "daily_numbers" (
  "id"               TEXT         NOT NULL,
  "userId"           TEXT         NOT NULL,
  "date"             TIMESTAMP(3) NOT NULL,
  "selfTrustScore"   INTEGER      NOT NULL,
  "selfTrustDelta"   INTEGER      NOT NULL,
  "identitySentence" TEXT         NOT NULL,
  "dayNumber"        INTEGER      NOT NULL,
  "archetype"        TEXT,
  "topWindowHeld"    TEXT,
  "topWindowMissed"  TEXT,
  "shareCount"       INTEGER      NOT NULL DEFAULT 0,
  "lastSharedAt"     TIMESTAMP(3),
  "shareCode"        TEXT         NOT NULL,
  "generatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "daily_numbers_pkey"       PRIMARY KEY ("id"),
  CONSTRAINT "daily_numbers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "daily_numbers_userId_date_key"
  ON "daily_numbers"("userId", "date");
CREATE UNIQUE INDEX IF NOT EXISTS "daily_numbers_shareCode_key"
  ON "daily_numbers"("shareCode");
CREATE INDEX IF NOT EXISTS "daily_numbers_userId_date_idx"
  ON "daily_numbers"("userId", "date");
CREATE INDEX IF NOT EXISTS "daily_numbers_shareCode_idx"
  ON "daily_numbers"("shareCode");

-- ============================================================
-- STEP 5 — RedirectChoice
-- ============================================================

CREATE TABLE "redirect_choices" (
  "id"               TEXT             NOT NULL,
  "userId"           TEXT             NOT NULL,
  "rank"             INTEGER          NOT NULL,
  "text"             TEXT             NOT NULL,
  "category"         TEXT,
  "servedCount"      INTEGER          NOT NULL DEFAULT 0,
  "acceptedCount"    INTEGER          NOT NULL DEFAULT 0,
  "effectivenessPct" DOUBLE PRECISION,
  "createdAt"        TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "archivedAt"       TIMESTAMP(3),
  "active"           BOOLEAN          NOT NULL DEFAULT true,
  CONSTRAINT "redirect_choices_pkey"       PRIMARY KEY ("id"),
  CONSTRAINT "redirect_choices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "redirect_choices_userId_active_idx"
  ON "redirect_choices"("userId", "active");

-- ============================================================
-- STEP 6 — Pod (family/couples accountability pod)
-- ============================================================

CREATE TABLE "pods" (
  "id"          TEXT         NOT NULL,
  "name"        TEXT         NOT NULL,
  "createdById" TEXT         NOT NULL,
  "inviteCode"  TEXT         NOT NULL,
  "maxMembers"  INTEGER      NOT NULL DEFAULT 6,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "archivedAt"  TIMESTAMP(3),
  CONSTRAINT "pods_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "pods_inviteCode_key"
  ON "pods"("inviteCode");
CREATE INDEX IF NOT EXISTS "pods_createdById_idx"
  ON "pods"("createdById");
CREATE INDEX IF NOT EXISTS "pods_inviteCode_idx"
  ON "pods"("inviteCode");

-- ============================================================
-- STEP 7 — PodMember (joins User to Pod)
-- ============================================================

CREATE TABLE "pod_members" (
  "id"         TEXT         NOT NULL,
  "podId"      TEXT         NOT NULL,
  "userId"     TEXT         NOT NULL,
  "role"       TEXT         NOT NULL DEFAULT 'member',
  "archetype"  TEXT,
  "shareLevel" TEXT         NOT NULL DEFAULT 'counts_only',
  "invitedBy"  TEXT,
  "joinedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "leftAt"     TIMESTAMP(3),
  "active"     BOOLEAN      NOT NULL DEFAULT true,
  CONSTRAINT "pod_members_pkey"        PRIMARY KEY ("id"),
  CONSTRAINT "pod_members_podId_fkey"  FOREIGN KEY ("podId")  REFERENCES "pods"("id")  ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "pod_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "pod_members_podId_userId_key"
  ON "pod_members"("podId", "userId");
CREATE INDEX IF NOT EXISTS "pod_members_podId_idx"
  ON "pod_members"("podId");
CREATE INDEX IF NOT EXISTS "pod_members_userId_active_idx"
  ON "pod_members"("userId", "active");

-- ============================================================
-- STEP 8 — TeamsWorkspace (Microsoft Azure AD tenant mapping)
-- ============================================================

CREATE TABLE "teams_workspaces" (
  "id"            TEXT         NOT NULL,
  "tenantId"      TEXT         NOT NULL,
  "workspaceName" TEXT         NOT NULL,
  "installedById" TEXT         NOT NULL,
  "installedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "defaultPlan"   TEXT         NOT NULL DEFAULT 'CORE',
  "ssoProvider"   TEXT         NOT NULL DEFAULT 'azure_ad',
  "scimEnabled"   BOOLEAN      NOT NULL DEFAULT false,
  "active"        BOOLEAN      NOT NULL DEFAULT true,
  "paymentStatus" TEXT         NOT NULL DEFAULT 'pending',
  CONSTRAINT "teams_workspaces_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "teams_workspaces_tenantId_key"
  ON "teams_workspaces"("tenantId");
CREATE INDEX IF NOT EXISTS "teams_workspaces_tenantId_idx"
  ON "teams_workspaces"("tenantId");
