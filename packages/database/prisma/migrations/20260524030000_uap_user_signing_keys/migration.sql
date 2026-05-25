-- UAP v0.1.1 — Per-user ed25519 signing keys on users
--
-- Adds the two columns that hold each user's UAP signing keypair.
-- Generated lazily at first-grant time by ensureUserSigningKey() in
-- apps/web/src/lib/uap/provenance.ts; signProvenance() reads the
-- private key, signs the §5.5 canonical payload, and the recipient
-- verifies against the public key returned by the public verifier at
-- GET /api/uap/v1/provenance/{audit_id}.
--
-- Both keys are stored base64. Encryption-at-rest is provided by the
-- underlying Supabase Postgres pgcrypto column policy — the schema
-- itself stores opaque text. Keys are rotated on KILL_SWITCH per
-- UAP-0.1.md §6 T9 (rotateUserSigningKey()), which intentionally
-- invalidates all outstanding provenance signatures: the kill closes
-- the trust path, so anything previously signed should no longer
-- verify against the user's current public key.
--
-- Both columns are nullable so existing rows (and rows for users who
-- never trigger a UAP grant) stay untouched. The lazy-generate path
-- means a user only has a keypair if they've granted UAP authority
-- to at least one partner.
--
-- Re-apply-safe via IF NOT EXISTS — this migration may be replayed
-- against a database where the columns already exist (e.g. shadow
-- DB rebuild during prisma migrate dev).

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "uapSigningKeyPublic"  TEXT,
  ADD COLUMN IF NOT EXISTS "uapSigningKeyPrivate" TEXT;
