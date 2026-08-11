/**
 * DECISION 3 — partner-attested consent is a distinct, LOWER-TRUST class.
 *
 * Pre-change there was no class at all: a grant minted by a partner
 * presenting its own Bearer key and its own consent artifact was, at
 * decision time, indistinguishable from one minted through the
 * COYL-hosted ceremony under the user's own session. `send_message`
 * with `reversibility: 'reversible'` returned `allowed` in both cases.
 *
 * Failing-first: the floor-action tests below return `allowed` against
 * the pre-change coordinator (there was no `consent_class_insufficient`
 * reason to return), and readConsentClass did not exist.
 */

import { describe, it, expect } from 'vitest'
import {
  readConsentClass,
  consentClassLabel,
  isConsentClassInsufficientForFloor,
  CONSENT_CLASS_KEY,
} from '../consent-class'
import { decideExecute, type UAPDeps } from '../coordinator'
import type { UAPExecuteInput, UAPGrant, UAPRule } from '../types'

/* ──────────────────── Artifact reading ──────────────────── */

describe('readConsentClass', () => {
  it('reads a stamped class', () => {
    expect(readConsentClass({ [CONSENT_CLASS_KEY]: 'partner_attested' })).toBe(
      'partner_attested',
    )
    expect(
      readConsentClass({ [CONSENT_CLASS_KEY]: 'coordinator_verified' }),
    ).toBe('coordinator_verified')
  })

  it('returns null for an unstamped (legacy) artifact', () => {
    expect(readConsentClass({ userResponse: 'explicit_grant' })).toBeNull()
  })

  it('returns null for junk rather than trusting it', () => {
    expect(readConsentClass(null)).toBeNull()
    expect(readConsentClass('partner_attested')).toBeNull()
    expect(readConsentClass([{ [CONSENT_CLASS_KEY]: 'partner_attested' }])).toBeNull()
    expect(readConsentClass({ [CONSENT_CLASS_KEY]: 'self_certified' })).toBeNull()
  })

  it('labels an unstamped grant `unclassified`, never coordinator_verified', () => {
    // The wire must not imply COYL witnessed a consent it did not.
    expect(consentClassLabel({})).toBe('unclassified')
    expect(consentClassLabel({ [CONSENT_CLASS_KEY]: 'partner_attested' })).toBe(
      'partner_attested',
    )
  })

  it('only an explicit partner_attested is insufficient for the floor', () => {
    expect(isConsentClassInsufficientForFloor('partner_attested')).toBe(true)
    expect(isConsentClassInsufficientForFloor('coordinator_verified')).toBe(false)
    expect(isConsentClassInsufficientForFloor(null)).toBe(false)
  })
})

/* ──────────────────── Enforcement at decision time ──────────────────── */

const USER_ID = 'user_consentclass'
const GRANT_ID = 'grant_consentclass'
const PARTNER_ID = 'partner_consentclass'

function makeDeps(consentArtifact: unknown, rules: UAPRule[] = []): UAPDeps {
  const grant: UAPGrant & { rules: UAPRule[] } = {
    id: GRANT_ID,
    userId: USER_ID,
    llmPartnerId: PARTNER_ID,
    scopes: ['proactive_relational', 'proactive_purchase', 'proactive_food'],
    expiresAt: new Date('2099-01-01T00:00:00Z'),
    status: 'ACTIVE',
    consentArtifact: consentArtifact as UAPGrant['consentArtifact'],
    createdAt: new Date('2026-01-01T00:00:00Z'),
    terminatedAt: null,
    terminationReason: null,
    rules,
  }
  return {
    loadGrantWithRules: async () => grant,
    isUserKilledGlobally: async () => false,
    isPanicActive: async () => false,
    isInQuietHours: async () => false,
    checkPartnerRateLimit: async () => ({ allowed: true }),
    now: () => new Date('2026-05-24T15:00:00Z'),
  }
}

function floorAction(
  reversibility: UAPExecuteInput['action']['reversibility'] = 'reversible',
): UAPExecuteInput {
  return {
    grantId: GRANT_ID,
    partnerId: PARTNER_ID,
    userId: USER_ID,
    action: {
      kind: 'send_message', // irreversibility floor member
      operation: 'execute',
      reversibility,
      params: {},
    },
    context: {},
  }
}

function routineAction(): UAPExecuteInput {
  return {
    grantId: GRANT_ID,
    partnerId: PARTNER_ID,
    userId: USER_ID,
    action: {
      kind: 'meal_suggestion',
      operation: 'propose',
      reversibility: 'reversible',
      params: {},
    },
    context: {},
  }
}

describe('consent class — enforcement at decision time', () => {
  it('DENIES a floor action under a partner_attested grant (pre-change: allowed — the two issuance paths were indistinguishable)', async () => {
    const result = await decideExecute(
      floorAction(),
      makeDeps({ [CONSENT_CLASS_KEY]: 'partner_attested' }),
    )
    expect(result.decision).toBe('denied')
    if (result.decision !== 'denied') throw new Error('unreachable')
    expect(result.reason).toBe('consent_class_insufficient')
    expect(result.detail).toContain('send_message')
  })

  it('denies even when the PARTNER declares the action reversible — the declaration comes from the party whose evidence we are discounting', async () => {
    const result = await decideExecute(
      floorAction('reversible'),
      makeDeps({ [CONSENT_CLASS_KEY]: 'partner_attested' }),
    )
    expect(result.decision === 'denied' && result.reason).toBe(
      'consent_class_insufficient',
    )
  })

  it('a partner_attested grant still performs ROUTINE actions — the SDK path is not broken, only bounded', async () => {
    const result = await decideExecute(
      routineAction(),
      makeDeps({ [CONSENT_CLASS_KEY]: 'partner_attested' }),
    )
    expect(result.decision).toBe('allowed')
  })

  it('a coordinator_verified grant keeps the previous floor behavior exactly', async () => {
    const reversible = await decideExecute(
      floorAction('reversible'),
      makeDeps({ [CONSENT_CLASS_KEY]: 'coordinator_verified' }),
    )
    expect(reversible.decision).toBe('allowed')

    const irreversible = await decideExecute(
      floorAction('irreversible'),
      makeDeps({ [CONSENT_CLASS_KEY]: 'coordinator_verified' }),
    )
    expect(irreversible.decision).toBe('needs_per_action_confirmation')
  })

  it('a legacy (unstamped) grant is NOT retro-restricted — the documented boundary', async () => {
    // Pins the deliberate bounded fail-open in consent-class.ts. If a
    // backfill later stamps these rows, this expectation changes WITH
    // the data, visibly, rather than silently.
    const result = await decideExecute(
      floorAction('reversible'),
      makeDeps({ userResponse: 'explicit_grant' }),
    )
    expect(result.decision).toBe('allowed')
  })

  it('the class gate precedes rule evaluation — a floor action is refused on class alone', async () => {
    const result = await decideExecute(
      floorAction(),
      makeDeps({ [CONSENT_CLASS_KEY]: 'partner_attested' }, [
        {
          id: 'rule_junk',
          grantId: GRANT_ID,
          userId: USER_ID,
          kind: 'not_a_real_kind',
          params: {} as UAPRule['params'],
          createdAt: new Date(),
        },
      ]),
    )
    expect(result.decision === 'denied' && result.reason).toBe(
      'consent_class_insufficient',
    )
  })
})
