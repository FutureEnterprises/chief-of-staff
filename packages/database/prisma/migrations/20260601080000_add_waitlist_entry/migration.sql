-- WaitlistEntry — invite-only FOMO engine for the consumer launch.
-- Robinhood-style line-jumping: +5 effective positions per referral
-- (computed at read time, not stored). See the model doc in schema.prisma.

-- CreateTable
CREATE TABLE "waitlist_entries" (
    "id"              TEXT NOT NULL,
    "email"           TEXT NOT NULL,
    "inviteCode"      TEXT NOT NULL,
    "referredByCode"  TEXT,
    "joinedPosition"  INTEGER NOT NULL,
    "referralCount"   INTEGER NOT NULL DEFAULT 0,
    "archetypeSlug"   TEXT,
    "source"          TEXT,
    "ipHash"          TEXT,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waitlist_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex — dedupe key.
CREATE UNIQUE INDEX "waitlist_entries_email_key" ON "waitlist_entries"("email");

-- CreateIndex — invite code is the referral join key, must be unique.
CREATE UNIQUE INDEX "waitlist_entries_inviteCode_key" ON "waitlist_entries"("inviteCode");

-- CreateIndex — referral lookups (who joined through a code).
CREATE INDEX "waitlist_entries_referredByCode_idx" ON "waitlist_entries"("referredByCode");

-- CreateIndex — recent joins.
CREATE INDEX "waitlist_entries_createdAt_idx" ON "waitlist_entries"("createdAt" DESC);
