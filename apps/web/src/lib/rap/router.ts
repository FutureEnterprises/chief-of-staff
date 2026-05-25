/**
 * RAP — Risk Assessment Protocol v0.1 — routing envelope builder.
 *
 * Converts a {@link RAPRiskClass} + jurisdiction into one of four
 * routing envelope shapes per RAP-0.1.md §4:
 *
 *   1. `no_routing`              — for ROUTINE_FRICTION. Coaching proceeds.
 *   2. `pattern_relapse_signal`  — for PATTERN_RELAPSE. Coaching continues
 *      with intensified intervention; optionally notifies a user-pre-
 *      designated accountability contact if UAP scope
 *      `notify:relapse_signal` was granted.
 *   3. `crisis_referral`         — for CRISIS_INDICATION. AI stops coaching
 *      and emits jurisdictional crisis lines + a self-care holding
 *      pattern + (if granted via UAP scope `route:emergency_contact`) the
 *      user's pre-set emergency contact. Coaching path closed.
 *   4. `emergency_referral`      — for LEGAL_OR_MEDICAL_EMERGENCY. AI
 *      refuses to coach; emits the 911-equivalent number for the user's
 *      jurisdiction + a location-services prompt. Coaching path closed.
 *
 * Standalone — this file is intentionally self-contained. Other
 * lib/rap/* modules (classifier, audit-replay, escalation-recorder) are
 * being built in parallel by sibling agents, so we do not import from
 * any of them. The only cross-package import is `RAPRiskClass` from
 * @repo/database (the Prisma enum), which is the wire format every
 * sibling module agrees on.
 *
 * See docs/protocol/RAP-0.1.md §4 for the canonical spec.
 */

import type { RAPRiskClass } from '@repo/database'

/* ──────────────────── Envelope union ──────────────────── */

/**
 * Discriminated union of every possible RAP routing envelope. Returned
 * by {@link buildEnvelope}; persisted into RAPAssessment.routingEnvelope
 * (a Json column) as the canonical wire format.
 *
 * The discriminator is `kind`. `no_routing` is the explicit "nothing to
 * route" case for routine_friction — chosen over a bare `null` so that
 * downstream consumers (PAP proposal gate, UI banner, audit replay)
 * can branch on a single union without `null`-checks at every site.
 */
export type RAPRoutingEnvelope =
  | { kind: 'no_routing' }
  | RAPCrisisEnvelope
  | RAPEmergencyEnvelope
  | RAPPatternRelapseEnvelope

/**
 * CRISIS_INDICATION envelope. AI stops coaching; jurisdictional crisis
 * lines are surfaced; the user's pre-set emergency contact is included
 * iff they granted the `route:emergency_contact` UAP scope.
 *
 * `selfCareHoldingPattern` is a calm-the-next-hour script the UI should
 * render alongside the lines — designed to reduce the cognitive load
 * of "decide what to do" down to "stay safe for the next hour."
 */
export type RAPCrisisEnvelope = {
  kind: 'crisis_referral'
  jurisdictionalLines: Array<{
    name: string
    number: string
    channel: ('call' | 'text')[]
  }>
  /** contact_token if user granted UAP scope route:emergency_contact */
  userEmergencyContact: string | null
  selfCareHoldingPattern: {
    message: string
    /** e.g. ["call 988 now", "text someone you trust", "go to nearest ER if you cannot stay safe"] */
    actions: string[]
  }
  coachingPathClosed: true
}

/**
 * LEGAL_OR_MEDICAL_EMERGENCY envelope. Maximum-priority. AI must not
 * propose any non-routing action; EAP irreversibility-floor must auto-
 * override any IRREVERSIBLE pending action per RAP-0.1.md §2.
 */
export type RAPEmergencyEnvelope = {
  kind: 'emergency_referral'
  /** 911 in US, 999 in UK, etc. */
  emergencyNumber: { name: string; number: string }
  locationServicesPrompt: boolean
  coachingPathClosed: true
  refusalToCoach: true
}

/**
 * PATTERN_RELAPSE envelope. Coaching continues — this is the "the user
 * crossed back into a pattern they previously committed to leaving"
 * case, not a crisis. Intervention is intensified rather than closed:
 *
 *   - `accountabilityContact` is set iff UAP scope
 *     `notify:relapse_signal` was granted; a sibling escalation worker
 *     reads the token and dispatches a pod/partner/sponsor ping.
 *   - `intensifyEAPModality` bumps notification urgency one level
 *     (push → SMS → call), respecting per-channel quiet-hours.
 *   - `reducePAPConfidenceThreshold` lowers the coordinator confidence
 *     floor temporarily for this user so more proposals fire in the
 *     window immediately after a relapse signal.
 */
export type RAPPatternRelapseEnvelope = {
  kind: 'pattern_relapse_signal'
  /** contact_token if user opted in via UAP scope notify:relapse_signal */
  accountabilityContact: string | null
  /** bump notification urgency */
  intensifyEAPModality: boolean
  /** lower coordinator confidence floor for this user temporarily */
  reducePAPConfidenceThreshold: boolean
  /** coaching continues with intensified intervention */
  coachingPathClosed: false
}

/* ──────────────────── Jurisdictional reference tables ──────────────────── */

/**
 * Per-jurisdiction crisis-line table. Keyed by ISO-3166-1 alpha-2 (or
 * ISO-3166-2 region code; the lookup degrades to the country prefix
 * first, then to the international default).
 *
 * This table is intentionally hard-coded — partner deployments that
 * need country-specific lines should PR them in; the alternative of
 * fetching from an external service introduces a network dependency
 * on the crisis-routing path, which is the worst place to add one.
 *
 * Source: RAP-0.1.md §5 open question #2 (per-jurisdiction routing
 * tables — community curation invited).
 */
const CRISIS_LINES_BY_JURISDICTION: Record<
  string,
  Array<{ name: string; number: string; channel: ('call' | 'text')[] }>
> = {
  US: [
    { name: '988 Suicide & Crisis Lifeline', number: '988', channel: ['call', 'text'] },
    { name: 'Crisis Text Line', number: '741741', channel: ['text'] },
  ],
  GB: [
    { name: 'Samaritans', number: '116 123', channel: ['call'] },
    { name: 'SHOUT Crisis Text', number: '85258', channel: ['text'] },
  ],
  CA: [{ name: 'Talk Suicide Canada', number: '1-833-456-4566', channel: ['call', 'text'] }],
  AU: [{ name: 'Lifeline Australia', number: '13 11 14', channel: ['call'] }],
}

/**
 * Per-jurisdiction emergency-number table (911-equivalent).
 *
 * For ISO-3166-2 sub-region codes (e.g. `CA-ON`), the lookup falls
 * back to the country prefix (`CA`). For unknown jurisdictions the
 * builder falls back to the international 112 fallback documented
 * inside {@link buildEnvelope}.
 */
const EMERGENCY_NUMBER_BY_JURISDICTION: Record<string, { name: string; number: string }> = {
  US: { name: 'Emergency Services', number: '911' },
  GB: { name: 'Emergency Services', number: '999' },
  CA: { name: 'Emergency Services', number: '911' },
  AU: { name: 'Emergency Services', number: '000' },
  EU: { name: 'European Emergency', number: '112' },
}

/**
 * The self-care holding pattern surfaced inside every CRISIS envelope.
 * Intentionally short: when someone is in crisis we do not want to
 * fill the screen with text. Four actions, in order of decreasing
 * cognitive load: call → text → go physical → remove means.
 *
 * Wording is from RAP-0.1.md §4 + the crisis-language review (see
 * docs/protocol/RAP-0.1.md §1 — Trust & Safety review notes). Do NOT
 * edit without re-running the language review.
 */
const SELF_CARE_HOLDING_PATTERN = {
  message:
    "You don't have to decide anything in the next minute. You only have to stay safe in the next hour.",
  actions: [
    'Call or text 988 — they will stay on the line as long as you need.',
    'Text someone in your life right now. Just "I\'m not okay" is enough.',
    'If you cannot stay safe, go to the nearest emergency room.',
    'Put any means of harm out of your reach. Lock them away. Give them to someone.',
  ],
} as const

/**
 * Default fallback crisis lines for jurisdictions not in the hard-
 * coded table. We surface 988 + Crisis Text Line (US lines, but
 * globally callable from many countries) plus a no-number entry that
 * the UI renders as "if you are in immediate danger, call your local
 * emergency services" — explicit about the limitation so users in
 * jurisdictions we haven't curated yet still see something useful.
 */
const DEFAULT_FALLBACK_LINES: Array<{
  name: string
  number: string
  channel: ('call' | 'text')[]
}> = [
  { name: '988 Suicide & Crisis Lifeline (US)', number: '988', channel: ['call', 'text'] },
  { name: 'Crisis Text Line (US)', number: '741741', channel: ['text'] },
  {
    name: 'If in immediate danger, call your local emergency services',
    number: '',
    channel: ['call'],
  },
]

/** International emergency-services fallback (EU 112 dialer; works in many countries). */
const DEFAULT_FALLBACK_EMERGENCY: { name: string; number: string } = {
  name: 'Local Emergency Services (international fallback)',
  number: '112',
}

/* ──────────────────── Lookup helpers ──────────────────── */

/**
 * Normalize a jurisdiction string to the country prefix used by the
 * lookup tables. ISO-3166-2 sub-region codes like `CA-ON` collapse to
 * `CA`; whitespace + case are normalized.
 */
function countryPrefix(jurisdiction: string): string {
  return jurisdiction.trim().toUpperCase().split('-')[0] ?? ''
}

function crisisLinesFor(
  jurisdiction: string,
): Array<{ name: string; number: string; channel: ('call' | 'text')[] }> {
  const prefix = countryPrefix(jurisdiction)
  const found = CRISIS_LINES_BY_JURISDICTION[prefix]
  if (found) return found
  return DEFAULT_FALLBACK_LINES
}

function emergencyNumberFor(jurisdiction: string): { name: string; number: string } {
  const prefix = countryPrefix(jurisdiction)
  const found = EMERGENCY_NUMBER_BY_JURISDICTION[prefix]
  if (found) return found
  return DEFAULT_FALLBACK_EMERGENCY
}

/* ──────────────────── Public entry point ──────────────────── */

/**
 * Build the routing envelope for a given risk classification.
 *
 * The return value is the canonical RAP routing envelope per
 * RAP-0.1.md §4 — persist directly into RAPAssessment.routingEnvelope
 * (a Json column). For ROUTINE_FRICTION returns `{ kind: 'no_routing' }`
 * so callers can switch on `kind` without null-checks; persistence
 * layers may map that to a Postgres NULL if they prefer.
 *
 * Pure function: no I/O, no side effects, deterministic given inputs.
 * Safe to call from the Edge runtime.
 */
export function buildEnvelope(params: {
  riskClass: RAPRiskClass
  /** ISO 3166-1 alpha-2 or ISO 3166-2 region code, e.g. 'US' | 'GB' | 'CA-ON' */
  jurisdiction: string
  /** contact_token if user granted UAP scope route:emergency_contact, else null */
  userEmergencyContactToken: string | null
  /** contact_token if user granted UAP scope notify:relapse_signal, else null */
  accountabilityContactToken: string | null
}): RAPRoutingEnvelope {
  const { riskClass, jurisdiction, userEmergencyContactToken, accountabilityContactToken } = params

  // Mirror the Prisma enum string literals. We avoid importing the
  // enum value at runtime to keep this file zero-dep beyond the type
  // import — the Prisma client's enum object lives behind a generated
  // path that the sibling agents may regenerate concurrently.
  switch (riskClass) {
    case 'ROUTINE_FRICTION':
      return { kind: 'no_routing' }

    case 'PATTERN_RELAPSE':
      return {
        kind: 'pattern_relapse_signal',
        accountabilityContact: accountabilityContactToken,
        intensifyEAPModality: true,
        reducePAPConfidenceThreshold: true,
        coachingPathClosed: false,
      }

    case 'CRISIS_INDICATION':
      return {
        kind: 'crisis_referral',
        jurisdictionalLines: crisisLinesFor(jurisdiction),
        userEmergencyContact: userEmergencyContactToken,
        selfCareHoldingPattern: {
          message: SELF_CARE_HOLDING_PATTERN.message,
          actions: [...SELF_CARE_HOLDING_PATTERN.actions],
        },
        coachingPathClosed: true,
      }

    case 'LEGAL_OR_MEDICAL_EMERGENCY':
      return {
        kind: 'emergency_referral',
        emergencyNumber: emergencyNumberFor(jurisdiction),
        locationServicesPrompt: true,
        coachingPathClosed: true,
        refusalToCoach: true,
      }

    default: {
      // Exhaustiveness check. If a new risk class is added to the
      // Prisma enum without updating this switch, TypeScript fails
      // here at compile time. At runtime we escalate-not-de-escalate
      // per RAP-0.1.md §3 confidence-floor rule.
      const _exhaustive: never = riskClass
      void _exhaustive
      return {
        kind: 'crisis_referral',
        jurisdictionalLines: crisisLinesFor(jurisdiction),
        userEmergencyContact: userEmergencyContactToken,
        selfCareHoldingPattern: {
          message: SELF_CARE_HOLDING_PATTERN.message,
          actions: [...SELF_CARE_HOLDING_PATTERN.actions],
        },
        coachingPathClosed: true,
      }
    }
  }
}
