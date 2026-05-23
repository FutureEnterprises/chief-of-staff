-- UAP — User-Authority Protocol v0.1
--
-- Standing-authority layer for autonomous LLM action without
-- per-action consent. See docs/protocol/UAP-0.1.md.
--
-- The fourth layer of the COYL protocol stack. BIP reads the
-- substrate. PAP proposes the moment. EAP acts across the device
-- fleet. UAP is the standing-authority layer: scoped, expiring,
-- revocable, kill-switchable, cryptographically audited grants
-- that let LLMs operate while the user is absent.
--
-- Reference engine is deferred (per spec §13). These tables exist
-- now so the route stubs at /api/uap/v1/* compile and the public
-- API surface is reserved.

-- ============================================================
-- 1) UAPGrantStatus enum
-- ============================================================

DO $$ BEGIN
  CREATE TYPE "UAPGrantStatus" AS ENUM ('ACTIVE','REVOKED_BY_USER','EXPIRED','KILLED_GLOBALLY');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================
-- 2) uap_grants
-- ============================================================

CREATE TABLE IF NOT EXISTS "uap_grants" (
  "id"                TEXT             NOT NULL,
  "userId"            TEXT             NOT NULL,
  "llmPartnerId"      TEXT             NOT NULL,
  "scopes"            TEXT[]           NOT NULL DEFAULT ARRAY[]::TEXT[],
  "expiresAt"         TIMESTAMP(3)     NOT NULL,
  "status"            "UAPGrantStatus" NOT NULL DEFAULT 'ACTIVE',
  "consentArtifact"   JSONB            NOT NULL,
  "createdAt"         TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "terminatedAt"      TIMESTAMP(3),
  "terminationReason" TEXT,
  CONSTRAINT "uap_grants_pkey"              PRIMARY KEY ("id"),
  CONSTRAINT "uap_grants_userId_fkey"       FOREIGN KEY ("userId")       REFERENCES "users"("id")        ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "uap_grants_llmPartnerId_fkey" FOREIGN KEY ("llmPartnerId") REFERENCES "llm_partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "uap_grants_userId_status_idx"       ON "uap_grants" ("userId", "status");
CREATE INDEX IF NOT EXISTS "uap_grants_llmPartnerId_status_idx" ON "uap_grants" ("llmPartnerId", "status");
CREATE INDEX IF NOT EXISTS "uap_grants_expiresAt_idx"           ON "uap_grants" ("expiresAt");

-- ============================================================
-- 3) uap_rules
-- ============================================================

CREATE TABLE IF NOT EXISTS "uap_rules" (
  "id"        TEXT         NOT NULL,
  "grantId"   TEXT,
  "userId"    TEXT         NOT NULL,
  "kind"      TEXT         NOT NULL,
  "params"    JSONB        NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "uap_rules_pkey"         PRIMARY KEY ("id"),
  CONSTRAINT "uap_rules_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "uap_grants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "uap_rules_userId_fkey"  FOREIGN KEY ("userId")  REFERENCES "users"("id")      ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "uap_rules_userId_grantId_idx" ON "uap_rules" ("userId", "grantId");

-- ============================================================
-- 4) uap_audit_entries  (signed, append-only, hash-chained)
-- ============================================================

CREATE TABLE IF NOT EXISTS "uap_audit_entries" (
  "id"              TEXT         NOT NULL,
  "grantId"         TEXT         NOT NULL,
  "userId"          TEXT         NOT NULL,
  "llmPartnerId"    TEXT         NOT NULL,
  "operation"       TEXT         NOT NULL,
  "actionKind"      TEXT,
  "decision"        TEXT         NOT NULL,
  "decisionReason"  TEXT,
  "postTermination" BOOLEAN      NOT NULL DEFAULT false,
  "signature"       TEXT         NOT NULL,
  "prevHash"        TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "uap_audit_entries_pkey"         PRIMARY KEY ("id"),
  CONSTRAINT "uap_audit_entries_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "uap_grants"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "uap_audit_entries_userId_createdAt_idx"  ON "uap_audit_entries" ("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "uap_audit_entries_grantId_createdAt_idx" ON "uap_audit_entries" ("grantId", "createdAt");

-- ============================================================
-- 5) uap_kill_switch_events
-- ============================================================

CREATE TABLE IF NOT EXISTS "uap_kill_switch_events" (
  "id"               TEXT         NOT NULL,
  "userId"           TEXT         NOT NULL,
  "initiatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "propagatedAt"     TIMESTAMP(3),
  "affectedGrantIds" TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
  CONSTRAINT "uap_kill_switch_events_pkey"        PRIMARY KEY ("id"),
  CONSTRAINT "uap_kill_switch_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "uap_kill_switch_events_userId_key" ON "uap_kill_switch_events" ("userId");
