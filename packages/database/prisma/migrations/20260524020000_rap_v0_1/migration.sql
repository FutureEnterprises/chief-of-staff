-- RAP v0.1 — Risk Assessment Protocol data layer
--
-- The fifth COYL protocol. Risk classification layer sitting orthogonal
-- to BIP/PAP/EAP/UAP. Every PAP proposal and EAP action request is
-- classified by RAP into one of four risk classes (RAPRiskClass enum);
-- crisis-class and emergency-class assessments close the coaching path
-- and emit routing envelopes to 988 / 911 / pre-designated emergency
-- contacts.
--
-- See docs/protocol/RAP-0.1.md for the full spec.
-- See packages/database/prisma/schema.prisma for the Prisma definitions.

-- ─────────────────────── ENUM ───────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rap_risk_class') THEN
    CREATE TYPE "rap_risk_class" AS ENUM (
      'ROUTINE_FRICTION',
      'PATTERN_RELAPSE',
      'CRISIS_INDICATION',
      'LEGAL_OR_MEDICAL_EMERGENCY'
    );
  END IF;
END
$$;

-- ─────────────────────── rap_assessments ───────────────────────

CREATE TABLE IF NOT EXISTS "rap_assessments" (
  "id"                  TEXT PRIMARY KEY,
  "userId"              TEXT NOT NULL,
  "riskClass"           "rap_risk_class" NOT NULL,
  "rationaleSignature"  TEXT NOT NULL,
  "classifierVersion"   TEXT NOT NULL DEFAULT 'rap-v0.1-rules-only',
  "signalChain"         JSONB NOT NULL,
  "ttlSeconds"          INTEGER NOT NULL DEFAULT 300,
  "triggerKind"         TEXT NOT NULL,
  "triggerRefId"        TEXT,
  "routingEnvelope"     JSONB,
  "coachingPathClosed"  BOOLEAN NOT NULL DEFAULT false,
  "pathReopenedAt"      TIMESTAMP(3),
  "pathReopenedReason"  TEXT,
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- FK to users — guarded so a re-apply doesn't fail.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rap_assessments_userId_fkey'
  ) THEN
    ALTER TABLE "rap_assessments"
      ADD CONSTRAINT "rap_assessments_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "rap_assessments_userId_createdAt_idx"
  ON "rap_assessments" ("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "rap_assessments_riskClass_createdAt_idx"
  ON "rap_assessments" ("riskClass", "createdAt");
CREATE INDEX IF NOT EXISTS "rap_assessments_userId_coachingPathClosed_idx"
  ON "rap_assessments" ("userId", "coachingPathClosed");

ALTER TABLE "rap_assessments" ENABLE ROW LEVEL SECURITY;

-- ─────────────────────── rap_escalations ───────────────────────

CREATE TABLE IF NOT EXISTS "rap_escalations" (
  "id"              TEXT PRIMARY KEY,
  "assessmentId"    TEXT NOT NULL,
  "escalatedTo"     TEXT NOT NULL,
  "envelopeKind"    TEXT NOT NULL,
  "outcome"         TEXT,
  "outcomeNotedAt"  TIMESTAMP(3),
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rap_escalations_assessmentId_fkey'
  ) THEN
    ALTER TABLE "rap_escalations"
      ADD CONSTRAINT "rap_escalations_assessmentId_fkey"
      FOREIGN KEY ("assessmentId") REFERENCES "rap_assessments"("id") ON DELETE CASCADE;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "rap_escalations_assessmentId_idx"
  ON "rap_escalations" ("assessmentId");
CREATE INDEX IF NOT EXISTS "rap_escalations_escalatedTo_createdAt_idx"
  ON "rap_escalations" ("escalatedTo", "createdAt");

ALTER TABLE "rap_escalations" ENABLE ROW LEVEL SECURITY;
