-- ClinicalEvent — PHI-adjacent free-tier event sink for iOS + future
-- mobile surfaces. Marketing-funnel events stay in AuditFunnelEvent;
-- clinical events live here, inside the BAA boundary. See the model
-- doc comment in schema.prisma for the separation rationale.
--
-- Append-only at the application layer. RLS policies (when the BAA is
-- in place) will enforce this at the database layer.

-- CreateTable
CREATE TABLE "clinical_events" (
    "id"                TEXT NOT NULL,
    "name"              TEXT NOT NULL,
    "anonymousUserId"   TEXT NOT NULL,
    "surface"           TEXT NOT NULL,
    "buildVersion"      TEXT NOT NULL,
    "clientTimestamp"   TIMESTAMP(3) NOT NULL,
    "serverTimestamp"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "props"             JSONB NOT NULL,
    "ipHash"            TEXT,

    CONSTRAINT "clinical_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex — server timestamp is the authoritative ordering field.
CREATE INDEX "clinical_events_serverTimestamp_idx" ON "clinical_events"("serverTimestamp" DESC);

-- CreateIndex — fast event-name aggregates for the admin dashboard.
CREATE INDEX "clinical_events_name_idx" ON "clinical_events"("name");

-- CreateIndex — per-user timeline lookup (audit log queries).
CREATE INDEX "clinical_events_anonymousUserId_serverTimestamp_idx" ON "clinical_events"("anonymousUserId", "serverTimestamp" DESC);

-- CreateIndex — name + timestamp range scans (cohort metric jobs).
CREATE INDEX "clinical_events_name_serverTimestamp_idx" ON "clinical_events"("name", "serverTimestamp" DESC);
