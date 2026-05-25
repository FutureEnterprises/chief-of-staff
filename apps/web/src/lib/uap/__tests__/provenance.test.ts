/**
 * UAP provenance — ed25519 signing for representation actions.
 *
 * Covers UAP-0.1.md §5.5 (canonical wire format) and §6 T9 (spoofed
 * provenance):
 *   - signProvenance + verifyProvenance roundtrip on a clean payload
 *   - tampered payload → verify returns false
 *   - wrong public key → verify returns false
 *   - keypair generation (via ensureUserSigningKey) produces valid
 *     base64 outputs
 *   - signProvenance produces a §5.5-conforming canonical payload
 *
 * Strategy:
 *   - vi.mock('@repo/database') exposes a tiny User model with a single
 *     user we can read/write. ensureUserSigningKey reads existing keys
 *     or generates fresh ones and writes them back — the mock honors
 *     both paths.
 *   - We never call out to the real DB, never hit the network, and
 *     never load any other UAP module. The crypto primitives are
 *     Node's built-ins (no external dependency).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

/* ──────────────────── In-memory user store ──────────────────── */

type StoredUser = {
  id: string
  uapSigningKeyPublic: string | null
  uapSigningKeyPrivate: string | null
}

const userStore: Map<string, StoredUser> = new Map()

vi.mock('@repo/database', () => {
  return {
    prisma: {
      user: {
        findUnique: async ({
          where,
        }: {
          where: { id: string }
          select?: Record<string, boolean>
        }) => {
          const u = userStore.get(where.id)
          return u ?? null
        },
        update: async ({
          where,
          data,
        }: {
          where: { id: string }
          data: Partial<StoredUser>
        }) => {
          const existing = userStore.get(where.id)
          if (!existing) throw new Error(`user ${where.id} not found`)
          const updated = { ...existing, ...data }
          userStore.set(where.id, updated)
          return updated
        },
      },
    },
  }
})

import {
  signProvenance,
  verifyProvenance,
  ensureUserSigningKey,
  isRepresentationAction,
  REPRESENTATION_ACTION_KINDS,
} from '../provenance'
import type { UAPProvenanceSignature } from '../types'

/* ──────────────────── Helpers ──────────────────── */

const USER_ID = 'user_provenance_test'

beforeEach(() => {
  userStore.clear()
  // Seed the user with no keys — ensureUserSigningKey() will mint a
  // fresh keypair and write it back.
  userStore.set(USER_ID, {
    id: USER_ID,
    uapSigningKeyPublic: null,
    uapSigningKeyPrivate: null,
  })
})

function defaultSignParams() {
  return {
    userId: USER_ID,
    partnerId: 'anthropic-claude-opus-4',
    grantId: 'grant_test_1',
    auditId: 'audit_test_1',
    actionKind: 'send_message',
    recipientHint: 'alice@example.com',
  }
}

/* ──────────────────── Sign + verify roundtrip ──────────────────── */

describe('signProvenance + verifyProvenance — clean roundtrip', () => {
  it('signs a payload, returns a valid envelope, and verifies true', async () => {
    const sig = await signProvenance(defaultSignParams())
    expect(verifyProvenance(sig)).toBe(true)
  })

  it('returns a UAPProvenanceSignature shape', async () => {
    const sig = await signProvenance(defaultSignParams())
    expect(sig.algorithm).toBe('ed25519')
    expect(typeof sig.signature).toBe('string')
    expect(typeof sig.publicKey).toBe('string')
    expect(sig.payload.v).toBe('uap-0.1.1')
  })
})

/* ──────────────────── Tampered payload ──────────────────── */

describe('verifyProvenance — tampered payload', () => {
  it('returns false when the payload is mutated post-sign', async () => {
    const sig = await signProvenance(defaultSignParams())
    const tampered: UAPProvenanceSignature = {
      ...sig,
      payload: {
        ...sig.payload,
        recipient_hint: 'mallory@evil.example',
      },
    }
    expect(verifyProvenance(tampered)).toBe(false)
  })

  it('returns false when the audit_id is mutated', async () => {
    // audit_id is the recipient-verifier lookup key — flipping it
    // would let a forged audit row impersonate a real one. Must fail
    // closed.
    const sig = await signProvenance(defaultSignParams())
    const tampered: UAPProvenanceSignature = {
      ...sig,
      payload: {
        ...sig.payload,
        audit_id: 'audit_attacker_substituted',
      },
    }
    expect(verifyProvenance(tampered)).toBe(false)
  })

  it('returns false when the action_kind is mutated', async () => {
    const sig = await signProvenance(defaultSignParams())
    const tampered: UAPProvenanceSignature = {
      ...sig,
      payload: {
        ...sig.payload,
        action_kind: 'payment', // upgrade an innocuous send_message
      },
    }
    expect(verifyProvenance(tampered)).toBe(false)
  })
})

/* ──────────────────── Wrong public key ──────────────────── */

describe('verifyProvenance — wrong public key', () => {
  it('returns false when verified against a different keypair\'s public key', async () => {
    // Sign with user A; swap in user B's public key and verify. The
    // signature was produced with A's private key, so verifying with
    // B's public key MUST fail — this is the §6 T9 spoofed-provenance
    // threat ("attacker forges a signature in the user's name").
    const sigA = await signProvenance(defaultSignParams())

    // Seed user B as a fresh user, get its keys.
    const USER_B = 'user_b'
    userStore.set(USER_B, {
      id: USER_B,
      uapSigningKeyPublic: null,
      uapSigningKeyPrivate: null,
    })
    const keysB = await ensureUserSigningKey(USER_B)

    const wrongKey: UAPProvenanceSignature = {
      ...sigA,
      publicKey: keysB.publicKey,
    }
    expect(verifyProvenance(wrongKey)).toBe(false)
  })

  it('returns false when the public key is base64 garbage', async () => {
    const sig = await signProvenance(defaultSignParams())
    const broken: UAPProvenanceSignature = {
      ...sig,
      publicKey: 'not-valid-base64-at-all-!!@@$$',
    }
    expect(verifyProvenance(broken)).toBe(false)
  })

  it('returns false when the algorithm is unsupported', async () => {
    // Defensive: only ed25519 is whitelisted in v0.1.1. A future v0.2
    // may add more, but until then anything else is a spoof attempt or
    // a misconfigured caller.
    const sig = await signProvenance(defaultSignParams())
    const broken = {
      ...sig,
      algorithm: 'rsa-sha256' as unknown as 'ed25519',
    }
    expect(verifyProvenance(broken)).toBe(false)
  })
})

/* ──────────────────── Keypair generation ──────────────────── */

describe('ensureUserSigningKey — keypair generation', () => {
  it('mints a fresh keypair on first call (both keys are valid base64)', async () => {
    const keys = await ensureUserSigningKey(USER_ID)
    expect(typeof keys.publicKey).toBe('string')
    expect(typeof keys.privateKey).toBe('string')
    expect(() => Buffer.from(keys.publicKey, 'base64')).not.toThrow()
    expect(() => Buffer.from(keys.privateKey, 'base64')).not.toThrow()
    // SPKI Ed25519 public key DER is 44 bytes; PKCS#8 Ed25519 private
    // key DER is 48 bytes. Confirms the keys aren't truncated.
    expect(Buffer.from(keys.publicKey, 'base64').length).toBe(44)
    expect(Buffer.from(keys.privateKey, 'base64').length).toBe(48)
  })

  it('returns the persisted keypair on subsequent calls (idempotent)', async () => {
    const first = await ensureUserSigningKey(USER_ID)
    const second = await ensureUserSigningKey(USER_ID)
    expect(second.publicKey).toBe(first.publicKey)
    expect(second.privateKey).toBe(first.privateKey)
  })

  it('persists the keypair on the user row', async () => {
    await ensureUserSigningKey(USER_ID)
    const stored = userStore.get(USER_ID)
    expect(stored?.uapSigningKeyPublic).toBeTruthy()
    expect(stored?.uapSigningKeyPrivate).toBeTruthy()
  })

  it('throws when the user does not exist', async () => {
    await expect(ensureUserSigningKey('user_does_not_exist')).rejects.toThrow(
      /not found/,
    )
  })
})

/* ──────────────────── §5.5 canonical-payload shape ──────────────────── */

describe('signProvenance — UAP-0.1.md §5.5 canonical payload shape', () => {
  it('emits all nine required fields with correct types', async () => {
    // Per §5.5, the canonical payload carries exactly these nine
    // fields (no extras, no missing). The test pins the contract so a
    // future change that drops or reshapes a field can't ship silently.
    const sig = await signProvenance(defaultSignParams())
    const p = sig.payload

    expect(p.v).toBe('uap-0.1.1')
    expect(p.agent).toBe('anthropic-claude-opus-4')
    expect(p.subject).toBe(`did:coyl:${USER_ID}`)
    expect(p.grant_id).toBe('grant_test_1')
    expect(p.audit_id).toBe('audit_test_1')
    expect(p.action_kind).toBe('send_message')
    expect(p.recipient_hint).toBe('alice@example.com')

    // issued_at is ISO-8601 UTC — Date.parse round-trips it.
    expect(typeof p.issued_at).toBe('string')
    expect(Number.isFinite(Date.parse(p.issued_at))).toBe(true)
    expect(p.issued_at.endsWith('Z')).toBe(true)

    // audit_url is the recipient-verifier URL. §5.5 spec format:
    //   https://coyl.ai/api/uap/v1/provenance/{audit_id}
    expect(p.audit_url).toBe(
      'https://coyl.ai/api/uap/v1/provenance/audit_test_1',
    )

    // Field count: exactly nine, no extras smuggled in.
    expect(Object.keys(p).sort()).toEqual(
      [
        'action_kind',
        'agent',
        'audit_id',
        'audit_url',
        'grant_id',
        'issued_at',
        'recipient_hint',
        'subject',
        'v',
      ].sort(),
    )
  })

  it('subject uses did:coyl: DID-URL scheme', async () => {
    // §5.5: subject = "did:coyl:<userId>" — namespace-scoped so a
    // recipient can route the verifier lookup to the COYL endpoint.
    const sig = await signProvenance(defaultSignParams())
    expect(sig.payload.subject.startsWith('did:coyl:')).toBe(true)
  })

  it('audit_url points at coyl.ai/api/uap/v1/provenance/<auditId>', async () => {
    const sig = await signProvenance({
      ...defaultSignParams(),
      auditId: 'audit_custom_123',
    })
    expect(sig.payload.audit_url).toBe(
      'https://coyl.ai/api/uap/v1/provenance/audit_custom_123',
    )
  })
})

/* ──────────────────── Representation-action lookup ──────────────────── */

describe('isRepresentationAction', () => {
  it('returns true for the seven v0.1.1 representation kinds', () => {
    for (const kind of [
      'send_message',
      'calendar_rsvp',
      'public_post',
      'payment',
      'share',
      'dm_send',
      'comment_post',
    ]) {
      expect(isRepresentationAction(kind)).toBe(true)
    }
  })

  it('returns false for non-representation kinds', () => {
    // read_context is a read scope, meal_suggestion is proactive (not
    // representation) — neither carries provenance signatures.
    expect(isRepresentationAction('read_context')).toBe(false)
    expect(isRepresentationAction('meal_suggestion')).toBe(false)
    expect(isRepresentationAction('focus_callout')).toBe(false)
  })

  it('exposes a frozen-equivalent set for runtime lookup', () => {
    // The set is exported (REPRESENTATION_ACTION_KINDS) so route
    // handlers can confirm membership without taking a dependency on
    // the type-level tuple. We verify the size matches the seven
    // declared kinds.
    expect(REPRESENTATION_ACTION_KINDS.size).toBe(7)
  })
})
