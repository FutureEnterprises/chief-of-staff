-- AuditFunnelEvent — anonymous funnel telemetry for /audit.
--
-- Tracks the four-stage funnel the founder action master list named:
-- started → completed → email_captured → signup. Separate from
-- ProductivityEvent (which requires a userId; /audit visitors are
-- mostly anonymous) and separate from AuditLead (which only fires at
-- the email-captured stage and misses the prior two drop-offs).
--
-- A sessionId cookie ties the four events together so the admin
-- funnel page can compute step-to-step conversion. ipHash is the
-- fallback when the cookie is missing (browser blocks cookies, etc.)
-- so the funnel measurement isn't blind to ~10% of visitors who
-- disable cookies.
--
-- Indexes:
--   • createdAt desc — for "last N days" admin window queries
--   • kind — for per-stage counts
--   • sessionId — for funnel-cohort join
--   • archetypeFamily — to see which archetypes convert better

CREATE TABLE "audit_funnel_events" (
  "id"              TEXT         NOT NULL,
  "sessionId"       TEXT         NOT NULL,
  "kind"            TEXT         NOT NULL,
  "archetypeFamily" TEXT,
  "archetypeSlug"   TEXT,
  "wedge"           TEXT,
  "window"          TEXT,
  "script"          TEXT,
  "source"          TEXT,
  "userAgent"       TEXT,
  "ipHash"          TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_funnel_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_funnel_events_createdAt_idx" ON "audit_funnel_events" ("createdAt" DESC);
CREATE INDEX "audit_funnel_events_kind_idx"      ON "audit_funnel_events" ("kind");
CREATE INDEX "audit_funnel_events_sessionId_idx" ON "audit_funnel_events" ("sessionId");
CREATE INDEX "audit_funnel_events_archetypeFamily_idx" ON "audit_funnel_events" ("archetypeFamily");
