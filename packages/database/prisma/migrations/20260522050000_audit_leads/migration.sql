-- AuditLead — anonymous /audit completers who entered an email
-- to receive their result, but didn't (yet) commit to a scheduled
-- interrupt or a Clerk signup.
--
-- Distinct from the existing scheduled-interrupt funnel: that path
-- captures phone OR email AND books an actual SMS/email send for
-- the next instance of the user's danger window. This row type is
-- lower-commitment — "email me this result so I can come back" —
-- meant to convert the visitor who isn't ready to schedule but is
-- willing to leave a contact for the drip.
--
-- Each row links to its archetype slug + the answers that produced
-- it (wedge × window × script). Source captures referral context
-- so we can attribute viral acquisitions to channel.
--
-- Indexes:
--   • email — dedup + lookup when the same person retakes the audit
--   • createdAt desc — recent-lead list view on /admin/leads
--   • archetypeFamily — cohort analysis ("Deservers convert at X%")

CREATE TABLE "audit_leads" (
  "id"              TEXT         NOT NULL,
  "email"           TEXT         NOT NULL,
  "archetypeFamily" TEXT         NOT NULL,
  "archetypeSlug"   TEXT,
  "wedge"           TEXT         NOT NULL,
  "window"          TEXT         NOT NULL,
  "script"          TEXT         NOT NULL,
  "source"          TEXT,
  "userAgent"       TEXT,
  "ipHash"          TEXT,
  "emailSentAt"     TIMESTAMP(3),
  "emailMessageId"  TEXT,
  "convertedUserId" TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_leads_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_leads_email_idx"           ON "audit_leads" ("email");
CREATE INDEX "audit_leads_createdAt_idx"       ON "audit_leads" ("createdAt" DESC);
CREATE INDEX "audit_leads_archetypeFamily_idx" ON "audit_leads" ("archetypeFamily");
CREATE INDEX "audit_leads_source_idx"          ON "audit_leads" ("source");
