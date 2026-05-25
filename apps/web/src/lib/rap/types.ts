/**
 * RAP — Risk Assessment Protocol v0.1 shared type contract.
 *
 * The contract every RAP module (classifier, routing-envelope builder,
 * coordinator, audit) implements against. Lives in one file so the
 * parallel agents building the reference engine don't diverge on field
 * names, enum values, or decision shapes.
 *
 * Mirrors the Prisma models (RAPAssessment, RAPEscalation, RAPRiskClass)
 * but adds the in-flight classification + signal-chain types that don't
 * persist as their own rows.
 *
 * See docs/protocol/RAP-0.1.md for the canonical spec; this file is the
 * TypeScript projection.
 */

import type { RAPRiskClass } from '@repo/database'

/* ──────────────────── Risk class re-export ──────────────────── */

/**
 * The four risk classes every behavioral moment is classified into.
 *
 *   ROUTINE_FRICTION              — default; AI may coach
 *   PATTERN_RELAPSE               — user crossed back into a left-pattern
 *   CRISIS_INDICATION             — credible crisis signal; AI stops coaching
 *   LEGAL_OR_MEDICAL_EMERGENCY    — imminent danger; RAP supersedes everything
 *
 * See RAP-0.1.md §2 for the full definitions.
 */
export type { RAPRiskClass }

/* ──────────────────── Signal chain ──────────────────── */

/**
 * A single behavioral signal from BIP. Simplified for v0.1 — the full
 * BIP signal envelope (modality, source partner, structured metadata
 * schema versions, etc.) lands in v0.2 when RAP plugs into the live
 * BIP signal bus.
 *
 * `kind` is the signal taxonomy bucket: "chat_message", "decision_text",
 * "audit_event", "wearable_event", etc. The classifier only inspects
 * `text` in v0.1; `metadata` is carried through for downstream
 * consumers (audit replay, T&S review) but does not drive the
 * classification.
 */
export type RAPSignal = {
  /** Signal taxonomy bucket (e.g. "chat_message", "decision_text", "audit_event") */
  kind: string
  /** Raw text content if applicable */
  text?: string
  /** Arbitrary structured payload from the source partner */
  metadata?: Record<string, unknown>
  /** ISO 8601 timestamp the signal was observed */
  timestamp: string
}

/* ──────────────────── Classification inputs ──────────────────── */

/**
 * The proposed-action context the classifier sees. RAP runs BEFORE the
 * proposed action ships, so the classifier can refuse / escalate based
 * on what's about to happen, not just what the user said.
 */
export type RAPProposedAction = {
  /** e.g. "pap_proposal" | "eap_action_request" | "manual" */
  kind: string
  /** Human-readable summary of the action (for audit display) */
  headline?: string
  /** Foreign key into PAPProposal / EAPActionRequest if applicable */
  refId?: string
}

/**
 * Input shape every classifier call takes. Stateless — each call is a
 * fresh per-moment evaluation. The user can be in ROUTINE_FRICTION at
 * 2:00 PM and CRISIS_INDICATION at 2:47 PM; the only history that
 * matters is what's in `signalChain`.
 */
export type RAPClassificationInput = {
  userId: string
  /** What's about to happen, if anything. Omitted for pure signal-driven evals. */
  proposedAction?: RAPProposedAction
  /** Most recent N signals from BIP, in chronological order */
  signalChain: RAPSignal[]
  /** ISO 3166-2 jurisdiction code; defaults to 'US' if absent (for crisis-line routing) */
  jurisdiction?: string
}

/* ──────────────────── Classification output ──────────────────── */

/**
 * The classifier's verdict on a single moment. The persistence layer
 * (RAPAssessment) takes this plus the routing envelope and persists
 * one row per classification for audit replay.
 *
 * `rationaleSignature` is sha256 of the canonical signal-chain JSON
 * (sorted keys, no whitespace). A Trust & Safety reviewer can re-run
 * the classifier months later against the same signal chain and
 * confirm the same risk class — the signature lets them verify the
 * inputs haven't drifted.
 *
 * `ttlSeconds` is how long this classification is valid before the
 * caller must re-classify. Emergency + crisis are short (60s) because
 * the situation evolves fast; relapse is 600s; routine_friction is
 * 1800s (acceptable to coast on a routine classification for half an
 * hour).
 */
export type RAPClassification = {
  riskClass: RAPRiskClass
  /** sha256 (hex) of the canonical signal chain JSON */
  rationaleSignature: string
  /** Classifier version string — bump when rules or model change */
  classifierVersion: string
  /** Which hard rule fired, if any (e.g. "EMERGENCY:overdose") */
  matchedRule?: string
  /** How long this classification is valid */
  ttlSeconds: number
}
