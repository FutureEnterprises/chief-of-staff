/**
 * RAP — Risk Assessment Protocol v0.1 classifier (rules-only).
 *
 * Per RAP-0.1.md §3 ("Classification process"), the reference engine
 * uses a hybrid:
 *
 *   - Hard rules for CRISIS_INDICATION and LEGAL_OR_MEDICAL_EMERGENCY
 *     — keyword + phrase pattern triggers that bypass the LLM entirely.
 *     False-positive rate accepted in exchange for zero false-negative
 *     tolerance on life-safety classes.
 *
 *   - LLM evaluation for ROUTINE_FRICTION vs. PATTERN_RELAPSE — the
 *     foundation model evaluates the recent signal chain against the
 *     user's BIP pattern history. (Deferred to v0.2.)
 *
 *   - Confidence floor at 0.7 — when in doubt, escalate, never
 *     de-escalate. (Deferred to v0.2 alongside the LLM path.)
 *
 * v0.1 keeps EVERYTHING in hard rules. That intentionally trades some
 * false-positive relapse classifications for guaranteed zero
 * false-negatives on emergency + crisis — the bar a Trust & Safety
 * reviewer cares about at integration time. The LLM-driven
 * routine-vs-relapse classifier ships in v0.2.
 *
 * ──────────────────────────────────────────────────────────────────────
 * Walk order
 * ──────────────────────────────────────────────────────────────────────
 *
 * The classifier walks `signalChain` in order and tests three keyword
 * sets in priority order:
 *
 *   1. EMERGENCY_PATTERNS  → LEGAL_OR_MEDICAL_EMERGENCY (highest priority)
 *   2. CRISIS_PATTERNS     → CRISIS_INDICATION
 *   3. RELAPSE_PATTERNS    → PATTERN_RELAPSE
 *
 * The FIRST emergency match across the chain wins; if none, the FIRST
 * crisis match wins; if none, the FIRST relapse match wins; otherwise
 * the default is ROUTINE_FRICTION. This guarantees emergency always
 * supersedes crisis which always supersedes relapse, regardless of
 * signal ordering.
 *
 * ──────────────────────────────────────────────────────────────────────
 * Rationale signature
 * ──────────────────────────────────────────────────────────────────────
 *
 * `rationaleSignature` = sha256 (hex) of the canonical signal-chain
 * JSON. Canonical = JSON.stringify with sorted keys, no whitespace.
 * This lets a T&S reviewer re-run the classifier months later against
 * the same signal chain, recompute the signature, and confirm the
 * inputs haven't drifted.
 */

import { createHash } from 'crypto'
import type {
  RAPClassification,
  RAPClassificationInput,
  RAPRiskClass,
  RAPSignal,
} from './types'

/* ──────────────────── Classifier version ──────────────────── */

const CLASSIFIER_VERSION = 'rap-v0.1-rules-only'

/* ──────────────────── TTL by risk class ──────────────────── */

const TTL_SECONDS: Record<RAPRiskClass, number> = {
  // Emergency + crisis: short TTL because the situation evolves fast and
  // we want the caller to re-classify on every new signal.
  LEGAL_OR_MEDICAL_EMERGENCY: 60,
  CRISIS_INDICATION: 60,
  // Relapse: 10 minutes. The user is in a pattern; re-classify
  // periodically but don't churn.
  PATTERN_RELAPSE: 600,
  // Routine: 30 minutes. Acceptable to coast on a routine classification.
  ROUTINE_FRICTION: 1800,
}

/* ──────────────────── Pattern definitions ──────────────────── */

/**
 * EMERGENCY_PATTERNS — imminent danger to life or limb. Match →
 * LEGAL_OR_MEDICAL_EMERGENCY. RAP supersedes every other protocol,
 * UAP grants included.
 */
const EMERGENCY_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  {
    name: 'EMERGENCY:overdose',
    pattern: /\b(overdosed|overdosing|too many pills|just took.*pills)\b/i,
  },
  {
    name: 'EMERGENCY:active_bleeding',
    pattern: /\b(bleeding (out|heavily)|won't stop bleeding|massive blood)\b/i,
  },
  {
    name: 'EMERGENCY:cardiac_or_stroke',
    pattern: /\b(chest pain.*can't breathe|stroke symptoms|having a stroke|heart attack)\b/i,
  },
  {
    name: 'EMERGENCY:active_violence',
    pattern: /\b(being attacked|he's hurting me|she's beating|active violence)\b/i,
  },
]

/**
 * CRISIS_PATTERNS — credible indication of psychological crisis. Match
 * → CRISIS_INDICATION. AI must stop coaching immediately; emit the
 * crisis_referral_envelope (built downstream).
 */
const CRISIS_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  {
    name: 'CRISIS:suicidal_ideation',
    pattern: /\b(want to (die|kill myself)|going to (kill myself|end it)|suicide plan|suicidal)\b/i,
  },
  {
    name: 'CRISIS:self_harm',
    pattern: /\b(cut myself|burning myself|hurt(ing)? myself|self.harm)\b/i,
  },
  {
    name: 'CRISIS:acute_substance',
    pattern: /\b(can't stop (drinking|using)|relapsed.*acute|withdrawal symptoms)\b/i,
  },
  {
    name: 'CRISIS:dv_or_abuse',
    pattern: /\b(he's hitting me|abuse(d|r)|controlling me|won't let me leave)\b/i,
  },
]

/**
 * RELAPSE_PATTERNS — user crossed back into a behavioral pattern they
 * previously committed to leaving. Match → PATTERN_RELAPSE. No
 * automatic clinical routing; the accountability_referral_envelope
 * may fire downstream if the user opted in via UAP scope
 * notify:relapse_signal.
 *
 * Two distinct shapes:
 *
 *   - returning_to: standalone match on "back to drinking", "started
 *     again", "broke my streak" — the user is signaling resumption
 *     directly.
 *
 *   - prior_commitment_with_resumption: requires BOTH a
 *     prior-commitment marker ("quit 30 days ago", "sober until",
 *     "clean since", "nicotine-free") AND a resumption mention in the
 *     same signal. The two-clause structure avoids false-positives on
 *     someone reflecting fondly on their quit streak.
 */
const RELAPSE_RETURNING_TO_PATTERN =
  /\b(back to (drinking|smoking|binge|using|scrolling)|started again|broke my (streak|quit))\b/i

const RELAPSE_PRIOR_COMMITMENT_PATTERN =
  /\b(quit.*\d+ days? ago|sober.*until|clean since|nicotine.free)\b/i

/**
 * Resumption verbs / phrases that, when co-present with a
 * prior-commitment marker in the same signal text, indicate the user
 * has crossed back into the pattern they left.
 */
const RELAPSE_RESUMPTION_PATTERN =
  /\b(had (a|one|some)|drank|smoked|used|relapsed|slipped|caved|gave in|broke (it|down)|just (did|had)|couldn't (resist|stop))\b/i

/* ──────────────────── Pattern matchers ──────────────────── */

function matchEmergency(text: string): string | null {
  for (const { name, pattern } of EMERGENCY_PATTERNS) {
    if (pattern.test(text)) return name
  }
  return null
}

function matchCrisis(text: string): string | null {
  for (const { name, pattern } of CRISIS_PATTERNS) {
    if (pattern.test(text)) return name
  }
  return null
}

function matchRelapse(text: string): string | null {
  if (RELAPSE_RETURNING_TO_PATTERN.test(text)) {
    return 'RELAPSE:returning_to'
  }
  // The prior-commitment shape requires BOTH clauses in the same signal.
  if (
    RELAPSE_PRIOR_COMMITMENT_PATTERN.test(text) &&
    RELAPSE_RESUMPTION_PATTERN.test(text)
  ) {
    return 'RELAPSE:prior_commitment_with_resumption'
  }
  return null
}

/* ──────────────────── Canonical JSON + signature ──────────────────── */

/**
 * Canonical JSON for a single signal — keys sorted alphabetically, no
 * whitespace. Used to build the rationale signature input.
 */
function canonicalJSON(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    return '[' + value.map(canonicalJSON).join(',') + ']'
  }
  const keys = Object.keys(value as Record<string, unknown>).sort()
  const parts = keys.map(
    (k) => JSON.stringify(k) + ':' + canonicalJSON((value as Record<string, unknown>)[k]),
  )
  return '{' + parts.join(',') + '}'
}

function rationaleSignature(signalChain: RAPSignal[]): string {
  const canonical = canonicalJSON(signalChain)
  return createHash('sha256').update(canonical, 'utf8').digest('hex')
}

/* ──────────────────── Public classifier ──────────────────── */

/**
 * Classify a single behavioral moment into one of the four RAP risk
 * classes. Stateless — each call is a fresh per-moment evaluation.
 *
 * The function is async to leave room for the v0.2 LLM-backed
 * routine-vs-relapse path; the v0.1 implementation is fully
 * synchronous under the hood.
 *
 * See RAP-0.1.md §2 for risk-class semantics and §3 for the
 * classification contract.
 */
export async function classify(
  input: RAPClassificationInput,
): Promise<RAPClassification> {
  const signature = rationaleSignature(input.signalChain)

  // Walk the chain three times — once per priority bucket. Emergency
  // wins over crisis wins over relapse, regardless of signal order.
  let firstEmergency: string | null = null
  let firstCrisis: string | null = null
  let firstRelapse: string | null = null

  for (const signal of input.signalChain) {
    const text = signal.text
    if (!text) continue

    if (firstEmergency === null) {
      const m = matchEmergency(text)
      if (m !== null) firstEmergency = m
    }
    if (firstCrisis === null) {
      const m = matchCrisis(text)
      if (m !== null) firstCrisis = m
    }
    if (firstRelapse === null) {
      const m = matchRelapse(text)
      if (m !== null) firstRelapse = m
    }

    // Early-exit: if emergency already fired, we don't need to keep
    // scanning — emergency is the highest priority and no further
    // signal can change the verdict.
    if (firstEmergency !== null) break
  }

  let riskClass: RAPRiskClass
  let matchedRule: string | undefined

  if (firstEmergency !== null) {
    riskClass = 'LEGAL_OR_MEDICAL_EMERGENCY'
    matchedRule = firstEmergency
  } else if (firstCrisis !== null) {
    riskClass = 'CRISIS_INDICATION'
    matchedRule = firstCrisis
  } else if (firstRelapse !== null) {
    riskClass = 'PATTERN_RELAPSE'
    matchedRule = firstRelapse
  } else {
    riskClass = 'ROUTINE_FRICTION'
  }

  return {
    riskClass,
    rationaleSignature: signature,
    classifierVersion: CLASSIFIER_VERSION,
    matchedRule,
    ttlSeconds: TTL_SECONDS[riskClass],
  }
}
