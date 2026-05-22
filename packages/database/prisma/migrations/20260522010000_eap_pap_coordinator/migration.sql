-- EAP + PAP coordinator data substrate
--
-- Data layer for the proactive AI infrastructure. Five Wave 2 cloud
-- agents import these types: auth, EAP core, PAP core, coordinator
-- logic, and admin dashboard.
--
-- EAP (Edge AI Protocol) = LLM-emitted device action requests +
--   multi-device orchestrations + sensor pub/sub.
-- PAP (Proactive AI Protocol) = LLM-emitted intervention proposals
--   scoped to user-level moments rather than specific devices.
-- Coordinator owns scope grants, audit log, and emergency panic state.

-- ============================================================
-- 1) llm_partners
-- ============================================================

CREATE TABLE IF NOT EXISTS "llm_partners" (
  "id"                TEXT         NOT NULL,
  "slug"              TEXT         NOT NULL,
  "name"              TEXT         NOT NULL,
  "publisher"         TEXT         NOT NULL,
  "apiKeyHash"        TEXT         NOT NULL,
  "apiKeyLastFour"    TEXT         NOT NULL,
  "active"            BOOLEAN      NOT NULL DEFAULT true,
  "rateLimitPerHour"  INTEGER      NOT NULL DEFAULT 1000,
  "pricingTier"       TEXT         NOT NULL DEFAULT 'usage',
  "bundledScopes"     TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL,
  CONSTRAINT "llm_partners_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "llm_partners_slug_key"        ON "llm_partners" ("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "llm_partners_apiKeyHash_key"  ON "llm_partners" ("apiKeyHash");
CREATE INDEX        IF NOT EXISTS "llm_partners_slug_idx"        ON "llm_partners" ("slug");
CREATE INDEX        IF NOT EXISTS "llm_partners_active_idx"      ON "llm_partners" ("active");

-- ============================================================
-- 2) devices
-- ============================================================

CREATE TABLE IF NOT EXISTS "devices" (
  "id"                TEXT         NOT NULL,
  "userId"            TEXT         NOT NULL,
  "deviceClass"       TEXT         NOT NULL,
  "model"             TEXT,
  "os"                TEXT,
  "deviceFingerprint" TEXT         NOT NULL,
  "paired"            BOOLEAN      NOT NULL DEFAULT false,
  "pairedAt"          TIMESTAMP(3),
  "manifestJson"      JSONB        NOT NULL,
  "operationalState"  JSONB,
  "online"            BOOLEAN      NOT NULL DEFAULT false,
  "lastSeenAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "pushToken"         TEXT,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL,
  CONSTRAINT "devices_pkey"        PRIMARY KEY ("id"),
  CONSTRAINT "devices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "devices_deviceFingerprint_key" ON "devices" ("deviceFingerprint");
CREATE INDEX        IF NOT EXISTS "devices_userId_paired_idx"     ON "devices" ("userId", "paired");
CREATE INDEX        IF NOT EXISTS "devices_deviceFingerprint_idx" ON "devices" ("deviceFingerprint");

-- ============================================================
-- 3) scope_grants
-- ============================================================

CREATE TABLE IF NOT EXISTS "scope_grants" (
  "id"                   TEXT         NOT NULL,
  "userId"               TEXT         NOT NULL,
  "llmPartnerId"         TEXT         NOT NULL,
  "scope"                TEXT         NOT NULL,
  "bundleKey"            TEXT,
  "grantedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt"            TIMESTAMP(3),
  "revokedAt"            TIMESTAMP(3),
  "active"               BOOLEAN      NOT NULL DEFAULT true,
  "consentScreenVersion" TEXT         NOT NULL,
  "ipAddress"            TEXT,
  "userAgent"            TEXT,
  CONSTRAINT "scope_grants_pkey"              PRIMARY KEY ("id"),
  CONSTRAINT "scope_grants_userId_fkey"       FOREIGN KEY ("userId")       REFERENCES "users"("id")        ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "scope_grants_llmPartnerId_fkey" FOREIGN KEY ("llmPartnerId") REFERENCES "llm_partners"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "scope_grants_userId_llmPartnerId_scope_key" ON "scope_grants" ("userId", "llmPartnerId", "scope");
CREATE INDEX        IF NOT EXISTS "scope_grants_userId_active_idx"             ON "scope_grants" ("userId", "active");
CREATE INDEX        IF NOT EXISTS "scope_grants_llmPartnerId_active_idx"       ON "scope_grants" ("llmPartnerId", "active");

-- ============================================================
-- 4) pap_proposals
-- ============================================================

CREATE TABLE IF NOT EXISTS "pap_proposals" (
  "id"              TEXT         NOT NULL,
  "proposalKey"     TEXT         NOT NULL,
  "llmPartnerId"    TEXT         NOT NULL,
  "userId"          TEXT         NOT NULL,
  "scopeRequested"  TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
  "actionJson"      JSONB        NOT NULL,
  "contextJson"     JSONB        NOT NULL,
  "decision"        TEXT         NOT NULL,
  "decisionReason"  TEXT,
  "scheduledFor"    TIMESTAMP(3),
  "executionToken"  TEXT,
  "executedAt"      TIMESTAMP(3),
  "outcome"         TEXT,
  "outcomeSource"   TEXT,
  "outcomeAt"       TIMESTAMP(3),
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "pap_proposals_pkey"              PRIMARY KEY ("id"),
  CONSTRAINT "pap_proposals_llmPartnerId_fkey" FOREIGN KEY ("llmPartnerId") REFERENCES "llm_partners"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "pap_proposals_userId_fkey"       FOREIGN KEY ("userId")       REFERENCES "users"("id")        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "pap_proposals_proposalKey_key"          ON "pap_proposals" ("proposalKey");
CREATE UNIQUE INDEX IF NOT EXISTS "pap_proposals_executionToken_key"       ON "pap_proposals" ("executionToken");
CREATE INDEX        IF NOT EXISTS "pap_proposals_userId_createdAt_idx"     ON "pap_proposals" ("userId", "createdAt");
CREATE INDEX        IF NOT EXISTS "pap_proposals_llmPartnerId_createdAt_idx" ON "pap_proposals" ("llmPartnerId", "createdAt");
CREATE INDEX        IF NOT EXISTS "pap_proposals_decision_idx"             ON "pap_proposals" ("decision");

-- ============================================================
-- 5) orchestrations (created BEFORE action_requests because of FK)
-- ============================================================

CREATE TABLE IF NOT EXISTS "orchestrations" (
  "id"               TEXT         NOT NULL,
  "orchestrationKey" TEXT         NOT NULL,
  "llmPartnerId"     TEXT         NOT NULL,
  "userId"           TEXT         NOT NULL,
  "atomicity"        TEXT         NOT NULL DEFAULT 'best_effort',
  "decision"         TEXT         NOT NULL,
  "startedAt"        TIMESTAMP(3),
  "completedAt"     TIMESTAMP(3),
  "rolledBackAt"    TIMESTAMP(3),
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "orchestrations_pkey"              PRIMARY KEY ("id"),
  CONSTRAINT "orchestrations_llmPartnerId_fkey" FOREIGN KEY ("llmPartnerId") REFERENCES "llm_partners"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "orchestrations_userId_fkey"       FOREIGN KEY ("userId")       REFERENCES "users"("id")        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "orchestrations_orchestrationKey_key"        ON "orchestrations" ("orchestrationKey");
CREATE INDEX        IF NOT EXISTS "orchestrations_userId_createdAt_idx"        ON "orchestrations" ("userId", "createdAt");
CREATE INDEX        IF NOT EXISTS "orchestrations_llmPartnerId_createdAt_idx"  ON "orchestrations" ("llmPartnerId", "createdAt");

-- ============================================================
-- 6) action_requests
-- ============================================================

CREATE TABLE IF NOT EXISTS "action_requests" (
  "id"              TEXT         NOT NULL,
  "actionKey"       TEXT         NOT NULL,
  "llmPartnerId"    TEXT         NOT NULL,
  "userId"          TEXT         NOT NULL,
  "deviceId"        TEXT         NOT NULL,
  "actuator"        TEXT         NOT NULL,
  "paramsJson"      JSONB        NOT NULL,
  "scopeRequested"  TEXT         NOT NULL,
  "reasoning"       TEXT         NOT NULL,
  "confidence"      DOUBLE PRECISION,
  "decision"        TEXT         NOT NULL,
  "decisionReason"  TEXT,
  "executionToken"  TEXT,
  "executedAt"      TIMESTAMP(3),
  "outcome"         TEXT,
  "outcomeReason"   TEXT,
  "outcomeAt"       TIMESTAMP(3),
  "userInteracted"  BOOLEAN      NOT NULL DEFAULT false,
  "orchestrationId" TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "action_requests_pkey"                PRIMARY KEY ("id"),
  CONSTRAINT "action_requests_llmPartnerId_fkey"   FOREIGN KEY ("llmPartnerId")   REFERENCES "llm_partners"("id")   ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "action_requests_userId_fkey"         FOREIGN KEY ("userId")         REFERENCES "users"("id")          ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "action_requests_deviceId_fkey"       FOREIGN KEY ("deviceId")       REFERENCES "devices"("id")        ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "action_requests_orchestrationId_fkey" FOREIGN KEY ("orchestrationId") REFERENCES "orchestrations"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "action_requests_actionKey_key"             ON "action_requests" ("actionKey");
CREATE UNIQUE INDEX IF NOT EXISTS "action_requests_executionToken_key"        ON "action_requests" ("executionToken");
CREATE INDEX        IF NOT EXISTS "action_requests_userId_createdAt_idx"      ON "action_requests" ("userId", "createdAt");
CREATE INDEX        IF NOT EXISTS "action_requests_deviceId_createdAt_idx"    ON "action_requests" ("deviceId", "createdAt");
CREATE INDEX        IF NOT EXISTS "action_requests_llmPartnerId_createdAt_idx" ON "action_requests" ("llmPartnerId", "createdAt");

-- ============================================================
-- 7) sensor_subscriptions
-- ============================================================

CREATE TABLE IF NOT EXISTS "sensor_subscriptions" (
  "id"               TEXT         NOT NULL,
  "subscriptionKey"  TEXT         NOT NULL,
  "llmPartnerId"     TEXT         NOT NULL,
  "userId"           TEXT         NOT NULL,
  "deviceId"         TEXT,
  "sensor"           TEXT         NOT NULL,
  "filterJson"       JSONB        NOT NULL,
  "webhookUrl"       TEXT         NOT NULL,
  "webhookSecret"    TEXT         NOT NULL,
  "rateLimitPerHour" INTEGER      NOT NULL DEFAULT 60,
  "active"           BOOLEAN      NOT NULL DEFAULT true,
  "failureCount"     INTEGER      NOT NULL DEFAULT 0,
  "lastFiredAt"      TIMESTAMP(3),
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sensor_subscriptions_pkey"              PRIMARY KEY ("id"),
  CONSTRAINT "sensor_subscriptions_llmPartnerId_fkey" FOREIGN KEY ("llmPartnerId") REFERENCES "llm_partners"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "sensor_subscriptions_userId_fkey"       FOREIGN KEY ("userId")       REFERENCES "users"("id")        ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "sensor_subscriptions_deviceId_fkey"     FOREIGN KEY ("deviceId")     REFERENCES "devices"("id")      ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "sensor_subscriptions_subscriptionKey_key"    ON "sensor_subscriptions" ("subscriptionKey");
CREATE INDEX        IF NOT EXISTS "sensor_subscriptions_userId_active_idx"      ON "sensor_subscriptions" ("userId", "active");
CREATE INDEX        IF NOT EXISTS "sensor_subscriptions_llmPartnerId_active_idx" ON "sensor_subscriptions" ("llmPartnerId", "active");

-- ============================================================
-- 8) eap_audit_entries  (append-only — no FK to users or llm_partners)
-- ============================================================

CREATE TABLE IF NOT EXISTS "eap_audit_entries" (
  "id"           TEXT         NOT NULL,
  "userId"       TEXT         NOT NULL,
  "llmPartnerId" TEXT,
  "eventKind"    TEXT         NOT NULL,
  "referenceId"  TEXT,
  "payloadJson"  JSONB        NOT NULL,
  "ipAddress"    TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "eap_audit_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "eap_audit_entries_userId_createdAt_idx"       ON "eap_audit_entries" ("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "eap_audit_entries_llmPartnerId_createdAt_idx" ON "eap_audit_entries" ("llmPartnerId", "createdAt");
CREATE INDEX IF NOT EXISTS "eap_audit_entries_eventKind_createdAt_idx"    ON "eap_audit_entries" ("eventKind", "createdAt");

-- ============================================================
-- 9) panic_states
-- ============================================================

CREATE TABLE IF NOT EXISTS "panic_states" (
  "id"          TEXT         NOT NULL,
  "userId"      TEXT         NOT NULL,
  "active"      BOOLEAN      NOT NULL DEFAULT false,
  "activatedAt" TIMESTAMP(3),
  "expiresAt"   TIMESTAMP(3),
  "reason"      TEXT,
  CONSTRAINT "panic_states_pkey"        PRIMARY KEY ("id"),
  CONSTRAINT "panic_states_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "panic_states_userId_key" ON "panic_states" ("userId");
