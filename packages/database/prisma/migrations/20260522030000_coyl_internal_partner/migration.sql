-- COYL Internal LLM partner — first production PAP self-integration.
--
-- Seeds one row in llm_partners with id = 'coyl_internal' so the
-- /today server render can emit real PAPProposal rows through the
-- same coordinator gates external partners would hit. Converts the
-- protocol page from "open spec" to "running surface" — the moat
-- claim against an Anthropic-builds-it scenario depends on having
-- live production traffic against the audit table.
--
-- Sentinel apiKeyHash ('internal:no-bearer-token') deliberately
-- cannot match any bcrypt-hashed real key. The row is internal-only;
-- callers go through lib/coyl-internal-pap.ts which sets
-- llmPartnerId directly without an HTTP/Bearer auth step.
--
-- Idempotent: ON CONFLICT (id) DO NOTHING preserves the existing row
-- across redeploys.

INSERT INTO "llm_partners" (
  "id",
  "slug",
  "name",
  "publisher",
  "apiKeyHash",
  "apiKeyLastFour",
  "active",
  "rateLimitPerHour",
  "pricingTier",
  "bundledScopes",
  "createdAt",
  "updatedAt"
) VALUES (
  'coyl_internal',
  'coyl-internal',
  'COYL Internal',
  'COYL',
  'internal:no-bearer-token',
  '----',
  true,
  100000,
  'strategic',
  ARRAY['proactive_food', 'proactive_focus', 'read:context']::TEXT[],
  NOW(),
  NOW()
) ON CONFLICT ("id") DO NOTHING;
