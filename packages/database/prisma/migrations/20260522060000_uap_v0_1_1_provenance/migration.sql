-- UAP v0.1.1 — Provenance columns on uap_audit_entries
--
-- Closes the "agent-as-representative" gap that v0.1 left implicit. Every
-- EXECUTE whose action is a representation action (acts AS the user to
-- another human or external system) MUST carry a cryptographic provenance
-- signature visible to the recipient.
--
-- These columns hold the outgoing-action provenance signature, distinct
-- from the existing `signature` column which secures the audit-chain row
-- itself. See docs/protocol/UAP-0.1.md §5.5 for the wire format.
--
-- All four columns are nullable: representation actions populate them;
-- internal actions (e.g. precheck, revoke, kill) leave them null.
--
-- Backfill: not needed. v0.1.1 is the first time we issue these signatures.
-- Existing rows (from the v0.1 reference-engine-stub period) are not
-- representation actions and stay null.

ALTER TABLE "uap_audit_entries"
  ADD COLUMN IF NOT EXISTS "provenanceSignature"  TEXT,
  ADD COLUMN IF NOT EXISTS "provenancePublicKey"  TEXT,
  ADD COLUMN IF NOT EXISTS "provenanceAlgorithm"  TEXT,
  ADD COLUMN IF NOT EXISTS "provenancePayload"    JSONB;

-- Recipients fetch GET /api/uap/v1/provenance/{audit_id} and the lookup
-- is by audit_id (primary key already indexed). The provenance public key
-- is also indexable for fan-out queries ("show me everything signed by
-- this user key") but at v0.1.1 cardinality is low — defer the index.
