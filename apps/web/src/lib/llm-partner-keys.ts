/**
 * LLM-partner API-key primitives.
 *
 * Foundation labs (Anthropic, OpenAI, Google) authenticate to the
 * PAP/EAP endpoints with a Bearer API key issued by COYL. Keys are
 * minted as 64-char hex secrets (crypto.randomBytes(32)) and stored
 * server-side only as bcrypt hashes on LLMPartner.apiKeyHash. The
 * last four chars of the plaintext are persisted separately
 * (apiKeyLastFour) so the admin UI can disambiguate keys without
 * keeping the secret material around.
 *
 * The wire format the platform issues to a partner is:
 *   coyl_pap_<llmPartnerId>_<keySecret>
 * The lib/llm-partner-auth.ts module parses that format and feeds the
 * keySecret half through verifyApiKey here.
 *
 * Why bcrypt (cost 12): we expect a small number of partners (tens,
 * not millions of users), so the per-auth cost — well under 100ms on
 * Vercel Functions — is a non-issue. The cost-12 work factor blunts
 * an offline brute-force in the unlikely event the DB is exfiltrated.
 */
import { randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'

/** bcrypt work factor. Higher = slower but more brute-force resistant. */
const BCRYPT_COST = 12

/** Length, in characters, of the hex-encoded key secret. */
const KEY_SECRET_HEX_LENGTH = 64

/** Generate a fresh 64-char hex API-key secret. */
export function generateApiKey(): string {
  // 32 bytes → 64 hex chars. Crypto-strong.
  return randomBytes(32).toString('hex')
}

/** Hash a plaintext API key with bcrypt at the configured work factor. */
export async function hashApiKey(key: string): Promise<string> {
  return bcrypt.hash(key, BCRYPT_COST)
}

/** Verify a plaintext API key against its bcrypt hash. */
export async function verifyApiKey(key: string, hash: string): Promise<boolean> {
  if (!key || !hash) return false
  try {
    return await bcrypt.compare(key, hash)
  } catch {
    // Malformed hash, etc. — fail closed.
    return false
  }
}

/**
 * Last-four-character display helper. Used by the admin dashboard to
 * disambiguate partner keys without surfacing the secret itself.
 * Returns the literal last 4 chars; the caller should pad/truncate
 * for narrower display surfaces.
 */
export function apiKeyLastFour(key: string): string {
  if (!key) return ''
  if (key.length <= 4) return key
  return key.slice(-4)
}

/** Exported for tests + the partner-onboarding admin tooling. */
export const _internals = {
  BCRYPT_COST,
  KEY_SECRET_HEX_LENGTH,
}
