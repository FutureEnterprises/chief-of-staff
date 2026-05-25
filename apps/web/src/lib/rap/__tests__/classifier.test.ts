/**
 * RAP classifier — unit tests.
 *
 * Covers all four risk classes defined in RAP-0.1.md §2:
 *
 *   - ROUTINE_FRICTION            (default; no crisis/emergency/relapse markers)
 *   - PATTERN_RELAPSE             (user crossed back into a left-pattern)
 *   - CRISIS_INDICATION           (credible crisis signal — e.g. "suicidal ideation")
 *   - LEGAL_OR_MEDICAL_EMERGENCY  (imminent danger — e.g. "overdose")
 *
 * Plus the rationale-signature determinism contract, classifier version
 * tag, and per-class TTL defaults.
 *
 * No mocks needed — the v0.1 classifier is rules-only and pure.
 */

import { describe, it, expect } from 'vitest'
import { classify } from '../classifier'
import type { RAPClassificationInput, RAPSignal } from '../types'

/* ──────────────────── Test helpers ──────────────────── */

const T0 = '2026-05-24T12:00:00.000Z'

function signal(text: string, timestamp = T0): RAPSignal {
  return { kind: 'chat_message', text, timestamp }
}

function makeInput(signals: RAPSignal[], jurisdiction = 'US'): RAPClassificationInput {
  return {
    userId: 'user_test_classifier',
    signalChain: signals,
    jurisdiction,
  }
}

/* ──────────────────── ROUTINE_FRICTION ──────────────────── */

describe('classify — ROUTINE_FRICTION (default class)', () => {
  it('returns ROUTINE_FRICTION for an empty signal chain', async () => {
    const result = await classify(makeInput([]))
    expect(result.riskClass).toBe('ROUTINE_FRICTION')
    expect(result.matchedRule).toBeUndefined()
  })

  it('returns ROUTINE_FRICTION when no crisis/emergency/relapse markers fire', async () => {
    const result = await classify(
      makeInput([
        signal('I had a productive morning, knocked out the spec review.'),
        signal("Going to grab lunch and then dive into the migration ticket."),
        signal("Honestly feeling pretty good about the sprint pace."),
      ]),
    )
    expect(result.riskClass).toBe('ROUTINE_FRICTION')
    expect(result.matchedRule).toBeUndefined()
  })

  it('TTL for ROUTINE_FRICTION is 1800s (30 minutes — long; safe to coast)', async () => {
    const result = await classify(makeInput([signal('routine update, nothing flagged')]))
    expect(result.ttlSeconds).toBe(1800)
  })
})

/* ──────────────────── CRISIS_INDICATION ──────────────────── */

describe('classify — CRISIS_INDICATION', () => {
  it('classifies "suicidal ideation" phrasing as CRISIS_INDICATION', async () => {
    const result = await classify(
      makeInput([signal("I've been having suicidal thoughts the past few days. I'm suicidal.")]),
    )
    expect(result.riskClass).toBe('CRISIS_INDICATION')
    expect(result.matchedRule).toMatch(/CRISIS:/)
  })

  it('classifies "want to die" as CRISIS_INDICATION', async () => {
    const result = await classify(makeInput([signal('honestly I just want to die')]))
    expect(result.riskClass).toBe('CRISIS_INDICATION')
    expect(result.matchedRule).toMatch(/CRISIS:suicidal_ideation/)
  })

  it('classifies self-harm phrasing as CRISIS_INDICATION', async () => {
    const result = await classify(makeInput([signal('I cut myself last night and want to hide it')]))
    expect(result.riskClass).toBe('CRISIS_INDICATION')
    expect(result.matchedRule).toMatch(/CRISIS:/)
  })

  it('TTL for CRISIS_INDICATION is 60s (short — re-classify on every new signal)', async () => {
    const result = await classify(makeInput([signal('I want to kill myself')]))
    expect(result.ttlSeconds).toBe(60)
  })
})

/* ──────────────────── LEGAL_OR_MEDICAL_EMERGENCY ──────────────────── */

describe('classify — LEGAL_OR_MEDICAL_EMERGENCY', () => {
  it('classifies "overdose" / "overdosed" as LEGAL_OR_MEDICAL_EMERGENCY', async () => {
    const result = await classify(makeInput([signal('I think I overdosed. I took the whole bottle.')]))
    expect(result.riskClass).toBe('LEGAL_OR_MEDICAL_EMERGENCY')
    expect(result.matchedRule).toBe('EMERGENCY:overdose')
  })

  it('emergency supersedes crisis — overdose wins over suicidal ideation in the same chain', async () => {
    // Emergency must beat crisis regardless of signal ordering.
    const result = await classify(
      makeInput([
        signal('I want to die'),
        signal('I think I just overdosed on the pills'),
      ]),
    )
    expect(result.riskClass).toBe('LEGAL_OR_MEDICAL_EMERGENCY')
    expect(result.matchedRule).toBe('EMERGENCY:overdose')
  })

  it('TTL for LEGAL_OR_MEDICAL_EMERGENCY is 60s (short — situation evolves fast)', async () => {
    const result = await classify(makeInput([signal('overdosed on pills, help')]))
    expect(result.ttlSeconds).toBe(60)
  })
})

/* ──────────────────── PATTERN_RELAPSE ──────────────────── */

describe('classify — PATTERN_RELAPSE', () => {
  it('classifies "back to drinking" as PATTERN_RELAPSE (returning_to shape)', async () => {
    const result = await classify(
      makeInput([signal("I'm back to drinking every night. Couldn't hold it.")]),
    )
    expect(result.riskClass).toBe('PATTERN_RELAPSE')
    expect(result.matchedRule).toBe('RELAPSE:returning_to')
  })

  it('classifies prior-commitment + resumption co-located as PATTERN_RELAPSE', async () => {
    // Both clauses ("quit N days ago" + a resumption verb) in the same signal.
    const result = await classify(
      makeInput([signal('I quit 30 days ago and then I just had a drink last night')]),
    )
    expect(result.riskClass).toBe('PATTERN_RELAPSE')
    expect(result.matchedRule).toBe('RELAPSE:prior_commitment_with_resumption')
  })

  it('TTL for PATTERN_RELAPSE is 600s (10 minutes — slower-moving than crisis)', async () => {
    const result = await classify(makeInput([signal('back to smoking after my quit streak')]))
    expect(result.ttlSeconds).toBe(600)
  })
})

/* ──────────────────── rationaleSignature ──────────────────── */

describe('classify — rationaleSignature', () => {
  it('is deterministic — same signal chain → same sha256', async () => {
    const chain: RAPSignal[] = [
      signal('routine morning standup'),
      signal('focused on the migration', T0),
    ]
    const a = await classify(makeInput(chain))
    const b = await classify(makeInput([...chain]))
    expect(a.rationaleSignature).toBe(b.rationaleSignature)
  })

  it('is a 64-character hex digest (sha256)', async () => {
    const result = await classify(makeInput([signal('hello')]))
    expect(result.rationaleSignature).toMatch(/^[0-9a-f]{64}$/)
  })

  it('changes when the signal chain changes (different text → different signature)', async () => {
    const a = await classify(makeInput([signal('alpha')]))
    const b = await classify(makeInput([signal('bravo')]))
    expect(a.rationaleSignature).not.toBe(b.rationaleSignature)
  })

  it('is order-sensitive — reordered signals produce a different signature', async () => {
    const a = await classify(makeInput([signal('first'), signal('second')]))
    const b = await classify(makeInput([signal('second'), signal('first')]))
    expect(a.rationaleSignature).not.toBe(b.rationaleSignature)
  })

  it('is stable across key insertion order (canonical JSON sorts keys)', async () => {
    // Build two signal-chain inputs that differ only in property insertion
    // order. The canonical-JSON hashing should normalize them to the same
    // signature.
    const sigA: RAPSignal = { kind: 'chat_message', text: 'hi', timestamp: T0 }
    const sigB: RAPSignal = { timestamp: T0, text: 'hi', kind: 'chat_message' } as RAPSignal
    const a = await classify(makeInput([sigA]))
    const b = await classify(makeInput([sigB]))
    expect(a.rationaleSignature).toBe(b.rationaleSignature)
  })
})

/* ──────────────────── classifierVersion ──────────────────── */

describe('classify — classifierVersion + return shape', () => {
  it('sets classifierVersion to a non-empty rap-v0.1-* tag', async () => {
    const result = await classify(makeInput([signal('routine')]))
    expect(result.classifierVersion).toBeTruthy()
    expect(typeof result.classifierVersion).toBe('string')
    expect(result.classifierVersion).toMatch(/^rap-v0\.1/)
  })

  it('returns ttlSeconds in the documented range (60–1800) for every class', async () => {
    const validTtls = new Set([60, 600, 1800])
    const cases = [
      'routine update',
      'back to drinking',
      'I want to die',
      'overdosed',
    ]
    for (const text of cases) {
      const r = await classify(makeInput([signal(text)]))
      expect(validTtls.has(r.ttlSeconds)).toBe(true)
    }
  })

  it('returns a defined riskClass and rationaleSignature on every call', async () => {
    const result = await classify(makeInput([signal('test')]))
    expect(result.riskClass).toBeDefined()
    expect(result.rationaleSignature).toBeDefined()
    expect(result.classifierVersion).toBeDefined()
    expect(result.ttlSeconds).toBeDefined()
  })
})
