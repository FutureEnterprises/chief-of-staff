-- Wave-grant lifecycle for the invite-only waitlist.
-- Idempotent (IF NOT EXISTS) so a manual prod apply + a later
-- `prisma migrate deploy` can't collide on an already-added column.

ALTER TABLE "waitlist_entries" ADD COLUMN IF NOT EXISTS "grantedAt" TIMESTAMP(3);
ALTER TABLE "waitlist_entries" ADD COLUMN IF NOT EXISTS "grantEmailSentAt" TIMESTAMP(3);
ALTER TABLE "waitlist_entries" ADD COLUMN IF NOT EXISTS "redeemedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "waitlist_entries_grantedAt_idx" ON "waitlist_entries"("grantedAt");
