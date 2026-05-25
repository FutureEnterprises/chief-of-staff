/**
 * RAP router — unit tests for `buildEnvelope`.
 *
 * Covers all four routing-envelope shapes from RAP-0.1.md §4:
 *
 *   1. `no_routing`              — for ROUTINE_FRICTION
 *   2. `crisis_referral`         — for CRISIS_INDICATION
 *   3. `emergency_referral`      — for LEGAL_OR_MEDICAL_EMERGENCY
 *   4. `pattern_relapse_signal`  — for PATTERN_RELAPSE (with + without
 *                                   accountability contact token)
 *
 * Plus jurisdiction-specific routing for US (988 + 741741) and GB
 * (Samaritans), and the fall-through to the international fallback.
 *
 * Pure function — no I/O, no mocks required.
 */

import { describe, it, expect } from 'vitest'
import { buildEnvelope } from '../router'

/* ──────────────────── ROUTINE_FRICTION ──────────────────── */

describe('buildEnvelope — ROUTINE_FRICTION', () => {
  it('returns the no_routing envelope (no clinical routing needed)', () => {
    const envelope = buildEnvelope({
      riskClass: 'ROUTINE_FRICTION',
      jurisdiction: 'US',
      userEmergencyContactToken: null,
      accountabilityContactToken: null,
    })
    // The router never literally returns null — it returns a discriminated
    // no_routing variant so callers can switch on `kind` without
    // null-checks. Persistence layers map this to a Postgres NULL.
    expect(envelope).toEqual({ kind: 'no_routing' })
  })

  it('ignores contact tokens for ROUTINE_FRICTION (no routing means no contacts)', () => {
    const envelope = buildEnvelope({
      riskClass: 'ROUTINE_FRICTION',
      jurisdiction: 'US',
      userEmergencyContactToken: 'emc_should_not_appear',
      accountabilityContactToken: 'acc_should_not_appear',
    })
    expect(envelope).toEqual({ kind: 'no_routing' })
  })
})

/* ──────────────────── CRISIS_INDICATION ──────────────────── */

describe('buildEnvelope — CRISIS_INDICATION', () => {
  it('US jurisdiction → 988 + Crisis Text Line (741741)', () => {
    const envelope = buildEnvelope({
      riskClass: 'CRISIS_INDICATION',
      jurisdiction: 'US',
      userEmergencyContactToken: null,
      accountabilityContactToken: null,
    })
    expect(envelope.kind).toBe('crisis_referral')
    if (envelope.kind !== 'crisis_referral') throw new Error('discriminator')

    const numbers = envelope.jurisdictionalLines.map((l) => l.number)
    expect(numbers).toContain('988')
    expect(numbers).toContain('741741')
    expect(envelope.coachingPathClosed).toBe(true)
  })

  it('GB jurisdiction → Samaritans (116 123) + SHOUT crisis text', () => {
    const envelope = buildEnvelope({
      riskClass: 'CRISIS_INDICATION',
      jurisdiction: 'GB',
      userEmergencyContactToken: null,
      accountabilityContactToken: null,
    })
    expect(envelope.kind).toBe('crisis_referral')
    if (envelope.kind !== 'crisis_referral') throw new Error('discriminator')

    const names = envelope.jurisdictionalLines.map((l) => l.name).join(' | ')
    expect(names).toMatch(/Samaritans/i)
    // Samaritans canonical number is "116 123"
    const numbers = envelope.jurisdictionalLines.map((l) => l.number)
    expect(numbers).toContain('116 123')
  })

  it('attaches userEmergencyContact token when UAP scope is granted', () => {
    const envelope = buildEnvelope({
      riskClass: 'CRISIS_INDICATION',
      jurisdiction: 'US',
      userEmergencyContactToken: 'emc_token_abc',
      accountabilityContactToken: null,
    })
    if (envelope.kind !== 'crisis_referral') throw new Error('discriminator')
    expect(envelope.userEmergencyContact).toBe('emc_token_abc')
  })

  it('userEmergencyContact is null when UAP scope is not granted', () => {
    const envelope = buildEnvelope({
      riskClass: 'CRISIS_INDICATION',
      jurisdiction: 'US',
      userEmergencyContactToken: null,
      accountabilityContactToken: null,
    })
    if (envelope.kind !== 'crisis_referral') throw new Error('discriminator')
    expect(envelope.userEmergencyContact).toBeNull()
  })

  it('includes a self-care holding pattern (message + actions array)', () => {
    const envelope = buildEnvelope({
      riskClass: 'CRISIS_INDICATION',
      jurisdiction: 'US',
      userEmergencyContactToken: null,
      accountabilityContactToken: null,
    })
    if (envelope.kind !== 'crisis_referral') throw new Error('discriminator')
    expect(envelope.selfCareHoldingPattern.message).toBeTruthy()
    expect(Array.isArray(envelope.selfCareHoldingPattern.actions)).toBe(true)
    expect(envelope.selfCareHoldingPattern.actions.length).toBeGreaterThan(0)
  })

  it('crisis path always closes the coaching path', () => {
    const envelope = buildEnvelope({
      riskClass: 'CRISIS_INDICATION',
      jurisdiction: 'US',
      userEmergencyContactToken: null,
      accountabilityContactToken: null,
    })
    if (envelope.kind !== 'crisis_referral') throw new Error('discriminator')
    expect(envelope.coachingPathClosed).toBe(true)
  })

  it('unknown jurisdiction falls back to international default lines (988 + 741741)', () => {
    const envelope = buildEnvelope({
      riskClass: 'CRISIS_INDICATION',
      jurisdiction: 'ZZ',
      userEmergencyContactToken: null,
      accountabilityContactToken: null,
    })
    if (envelope.kind !== 'crisis_referral') throw new Error('discriminator')
    const numbers = envelope.jurisdictionalLines.map((l) => l.number)
    expect(numbers).toContain('988')
    expect(numbers).toContain('741741')
  })
})

/* ──────────────────── LEGAL_OR_MEDICAL_EMERGENCY ──────────────────── */

describe('buildEnvelope — LEGAL_OR_MEDICAL_EMERGENCY', () => {
  it('US jurisdiction → emergency_referral envelope with 911', () => {
    const envelope = buildEnvelope({
      riskClass: 'LEGAL_OR_MEDICAL_EMERGENCY',
      jurisdiction: 'US',
      userEmergencyContactToken: null,
      accountabilityContactToken: null,
    })
    expect(envelope.kind).toBe('emergency_referral')
    if (envelope.kind !== 'emergency_referral') throw new Error('discriminator')
    expect(envelope.emergencyNumber.number).toBe('911')
  })

  it('GB jurisdiction → 999', () => {
    const envelope = buildEnvelope({
      riskClass: 'LEGAL_OR_MEDICAL_EMERGENCY',
      jurisdiction: 'GB',
      userEmergencyContactToken: null,
      accountabilityContactToken: null,
    })
    if (envelope.kind !== 'emergency_referral') throw new Error('discriminator')
    expect(envelope.emergencyNumber.number).toBe('999')
  })

  it('sets refusalToCoach=true and coachingPathClosed=true and locationServicesPrompt=true', () => {
    const envelope = buildEnvelope({
      riskClass: 'LEGAL_OR_MEDICAL_EMERGENCY',
      jurisdiction: 'US',
      userEmergencyContactToken: null,
      accountabilityContactToken: null,
    })
    if (envelope.kind !== 'emergency_referral') throw new Error('discriminator')
    expect(envelope.refusalToCoach).toBe(true)
    expect(envelope.coachingPathClosed).toBe(true)
    expect(envelope.locationServicesPrompt).toBe(true)
  })

  it('unknown jurisdiction falls back to international 112 dialer', () => {
    const envelope = buildEnvelope({
      riskClass: 'LEGAL_OR_MEDICAL_EMERGENCY',
      jurisdiction: 'ZZ',
      userEmergencyContactToken: null,
      accountabilityContactToken: null,
    })
    if (envelope.kind !== 'emergency_referral') throw new Error('discriminator')
    expect(envelope.emergencyNumber.number).toBe('112')
  })
})

/* ──────────────────── PATTERN_RELAPSE ──────────────────── */

describe('buildEnvelope — PATTERN_RELAPSE', () => {
  it('with accountabilityContactToken present → includes the token + envelope kind pattern_relapse_signal', () => {
    const envelope = buildEnvelope({
      riskClass: 'PATTERN_RELAPSE',
      jurisdiction: 'US',
      userEmergencyContactToken: null,
      accountabilityContactToken: 'acc_partner_xyz',
    })
    expect(envelope.kind).toBe('pattern_relapse_signal')
    if (envelope.kind !== 'pattern_relapse_signal') throw new Error('discriminator')
    expect(envelope.accountabilityContact).toBe('acc_partner_xyz')
  })

  it('with accountabilityContactToken null → no contact notification (signal logging only)', () => {
    const envelope = buildEnvelope({
      riskClass: 'PATTERN_RELAPSE',
      jurisdiction: 'US',
      userEmergencyContactToken: null,
      accountabilityContactToken: null,
    })
    if (envelope.kind !== 'pattern_relapse_signal') throw new Error('discriminator')
    expect(envelope.accountabilityContact).toBeNull()
  })

  it('keeps the coaching path open — relapse intensifies, never closes', () => {
    const envelope = buildEnvelope({
      riskClass: 'PATTERN_RELAPSE',
      jurisdiction: 'US',
      userEmergencyContactToken: null,
      accountabilityContactToken: 'acc_partner_xyz',
    })
    if (envelope.kind !== 'pattern_relapse_signal') throw new Error('discriminator')
    expect(envelope.coachingPathClosed).toBe(false)
  })

  it('sets intensifyEAPModality + reducePAPConfidenceThreshold to true', () => {
    const envelope = buildEnvelope({
      riskClass: 'PATTERN_RELAPSE',
      jurisdiction: 'US',
      userEmergencyContactToken: null,
      accountabilityContactToken: null,
    })
    if (envelope.kind !== 'pattern_relapse_signal') throw new Error('discriminator')
    expect(envelope.intensifyEAPModality).toBe(true)
    expect(envelope.reducePAPConfidenceThreshold).toBe(true)
  })
})

/* ──────────────────── ISO-3166-2 sub-region fallthrough ──────────────────── */

describe('buildEnvelope — jurisdiction normalization', () => {
  it('CA-ON (ISO-3166-2 sub-region) falls back to CA emergency table', () => {
    const envelope = buildEnvelope({
      riskClass: 'LEGAL_OR_MEDICAL_EMERGENCY',
      jurisdiction: 'CA-ON',
      userEmergencyContactToken: null,
      accountabilityContactToken: null,
    })
    if (envelope.kind !== 'emergency_referral') throw new Error('discriminator')
    expect(envelope.emergencyNumber.number).toBe('911')
  })

  it('lowercase jurisdiction "us" normalizes to US lookup', () => {
    const envelope = buildEnvelope({
      riskClass: 'CRISIS_INDICATION',
      jurisdiction: 'us',
      userEmergencyContactToken: null,
      accountabilityContactToken: null,
    })
    if (envelope.kind !== 'crisis_referral') throw new Error('discriminator')
    const numbers = envelope.jurisdictionalLines.map((l) => l.number)
    expect(numbers).toContain('988')
  })
})
