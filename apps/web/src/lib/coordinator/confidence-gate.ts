/**
 * Confidence gate — cheap pure check that runs before any DB hit.
 *
 * Each LLM-emitted proposal/action carries a `confidence` score in
 * [0, 1]. Below the user's threshold (default 0.7), the coordinator
 * denies before spending a rate-limit slot or running dedup. The
 * threshold lives per-user in the future (UI TBD); for now we accept
 * an override argument so callers can pass a per-user value once
 * surfaced in the User schema.
 *
 * Semantics:
 *   - confidence === undefined → pass (proposal opted out of scoring)
 *   - confidence < threshold   → fail
 *   - confidence >= threshold  → pass
 */

export const DEFAULT_CONFIDENCE_THRESHOLD = 0.7

export function isAboveConfidenceThreshold(
  proposal: { context?: { confidence?: number }; confidence?: number },
  userThreshold: number = DEFAULT_CONFIDENCE_THRESHOLD,
): boolean {
  // Accept either shape — PAPProposal uses context.confidence, EAP
  // ActionRequest carries confidence on the top-level. The coordinator
  // doesn't care which path it came in on.
  const score =
    proposal.context?.confidence !== undefined
      ? proposal.context.confidence
      : proposal.confidence

  if (score === undefined || score === null) return true
  return score >= userThreshold
}
