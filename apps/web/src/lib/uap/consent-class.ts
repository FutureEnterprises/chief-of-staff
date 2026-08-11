/**
 * UAP consent provenance class — how the consent behind a grant was
 * obtained, and what that buys the grant.
 *
 * Two issuance paths reach POST /api/uap/v1/grant and, until this
 * module, produced grants that were byte-for-byte indistinguishable at
 * decision time:
 *
 *   1. USER SESSION (Clerk cookie) — the COYL-hosted ceremony at
 *      /consent/uap. COYL rendered the disclosure, the user's own
 *      authenticated session posted the acceptance, and the grant's
 *      userId came from that session. → `coordinator_verified`.
 *
 *   2. PARTNER BEARER (coyl_uap_*) — the partner names the target user
 *      and hands us a consent artifact it says it collected. We have
 *      the partner's word. The partner is also the party that benefits
 *      from the grant. → `partner_attested`.
 *
 * The class is enforced in the coordinator: a `partner_attested` grant
 * cannot authorize an irreversibility-floor action
 * (`consent_class_insufficient`). Everything else is unchanged, so the
 * SDK-compatible partner issuance path keeps working for the routine,
 * reversible actions it was designed for.
 *
 * ── Storage: no schema migration ──────────────────────────────────
 *
 * The class lives inside `UAPGrant.consentArtifact`, an existing Json
 * column, under the key `consentClass`. The artifact is already the
 * immutable record of "what consent produced this grant," so the
 * provenance of that consent belongs in the same object — this is not
 * a workaround so much as the natural home. No column was added.
 *
 * ── The legacy boundary (read this before trusting a null) ─────────
 *
 * Grants written BEFORE this change carry no `consentClass` key.
 * `readConsentClass` returns null for them and the coordinator does NOT
 * apply the floor restriction to a null. That is a deliberate, bounded
 * fail-open for pre-existing rows only: retro-classifying them as
 * partner_attested would deny floor actions on grants that may well
 * have come from the COYL-hosted ceremony, and retro-classifying them
 * as coordinator_verified would assert something we did not observe.
 *
 * The clean close is a one-time data backfill (no schema change):
 *
 *   UPDATE uap_grants
 *      SET consent_artifact = consent_artifact || '{"consentClass":"partner_attested"}'::jsonb
 *    WHERE consent_artifact->>'consentClass' IS NULL;
 *
 * After that backfill, null becomes unreachable for persisted rows and
 * the null branch is dead-but-defensive. Every grant issued from this
 * commit forward is stamped at write time.
 */

import { UAP_CONSENT_CLASSES, type UAPConsentClass } from './types'

const CONSENT_CLASS_SET: ReadonlySet<string> = new Set<string>(
  UAP_CONSENT_CLASSES,
)

/** The JSON key the class is stored under inside `consentArtifact`. */
export const CONSENT_CLASS_KEY = 'consentClass'

/**
 * Read the consent class off a grant's `consentArtifact` Json blob.
 *
 * Returns null when the artifact is absent, is not an object, or has no
 * (or an unrecognized) `consentClass` — i.e. "this grant predates
 * consent classing." Callers MUST treat null as "unclassified," never
 * as a class.
 */
export function readConsentClass(
  consentArtifact: unknown,
): UAPConsentClass | null {
  if (
    typeof consentArtifact !== 'object' ||
    consentArtifact === null ||
    Array.isArray(consentArtifact)
  ) {
    return null
  }
  const raw = (consentArtifact as Record<string, unknown>)[CONSENT_CLASS_KEY]
  if (typeof raw !== 'string') return null
  return CONSENT_CLASS_SET.has(raw) ? (raw as UAPConsentClass) : null
}

/**
 * Wire-facing label for a grant's class. Distinguishes "we know it was
 * partner-attested" from "this grant predates classing" so a relying
 * party is never told a legacy grant was coordinator-verified.
 */
export function consentClassLabel(
  consentArtifact: unknown,
): UAPConsentClass | 'unclassified' {
  return readConsentClass(consentArtifact) ?? 'unclassified'
}

/**
 * True when the class is insufficient for irreversibility-floor
 * actions. Only an explicit `partner_attested` fails — see the legacy
 * boundary note in the module header for why null does not.
 */
export function isConsentClassInsufficientForFloor(
  consentClass: UAPConsentClass | null,
): boolean {
  return consentClass === 'partner_attested'
}
