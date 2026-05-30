/**
 * Free-tier event sink — stub today, real provider tomorrow.
 *
 * Today (May 2026): logs to server stdout in dev, no-op in prod.
 * Tomorrow (post-decision on analytics stack — PostHog vs. Plausible
 * vs. Prisma-backed events table): swap the implementation here, no
 * caller changes needed.
 *
 * Decision pending: see docs/strategy/free-consumer-tier.md §"Metrics"
 * and v3 plan Month 2 ("Compliance + analytics tooling: Engage
 * Vanta/Drata; pick analytics stack").
 *
 * Provider tradeoffs to decide between:
 *   - PostHog: best dev ergonomics, self-host option, generous free
 *     tier. SOC 2. ~$0/mo at our scale through 1M events.
 *   - Plausible: GDPR-clean, no cookies, lighter. Less product depth.
 *   - Prisma-backed events table: no third party at all; queryable in
 *     the admin UI directly; SOC-2-eligible. Engineering cost: own the
 *     pipeline ourselves.
 *
 * Recommendation: Prisma-backed events table for clinical events
 * (DANGER_WINDOW_DETECTED, INTERRUPT_FIRED, INTERRUPT_CHANGED_BEHAVIOR,
 * SLIP_REPORTED, RECOVERY_COMPLETED) — these touch PHI-adjacent data
 * and need BAA-clean handling. PostHog for marketing-funnel events
 * (AUDIT_STARTED, AUDIT_COMPLETED, FREE_TIER_SIGNUP) — these are
 * cookie-friendly, anonymous, and benefit from PostHog's funnel
 * visualization.
 */

import type { FreeTierEventPayload } from './free-tier-events'

/**
 * Track a single free-tier event.
 *
 * Server-side callers: always await this. The stub is fast (a console
 * log) but the real provider will be async I/O and we want backpressure
 * on the request handler if the analytics sink is degraded.
 *
 * Client-side callers (rare): import via a thin client wrapper that
 * batches and beacon()s on visibility change. Don't call this directly
 * from a browser component — the import would balloon the bundle.
 */
export async function trackFreeTierEvent(event: FreeTierEventPayload): Promise<void> {
  // STUB IMPLEMENTATION — wire to real provider when analytics decision lands.
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('[free-tier.telemetry]', event.name, event.props)
  }

  // TODO(month-2): swap based on provider decision. Sketch:
  //
  // if (isMarketingFunnelEvent(event.name)) {
  //   await posthog.capture({ distinctId: event.props.anonymousUserId, event: event.name, properties: event.props })
  // } else {
  //   await db.freeTierEvent.create({ data: { name: event.name, props: event.props, serverTimestamp: new Date() } })
  // }
}

/**
 * Convenience wrapper for the most-called audit-funnel events. Server
 * actions in /audit can call this without constructing the full payload.
 */
export async function trackAuditFunnelStep(params: {
  name:
    | typeof import('./free-tier-events').FreeTierEventName.AUDIT_STARTED
    | typeof import('./free-tier-events').FreeTierEventName.AUDIT_WEDGE_ANSWERED
    | typeof import('./free-tier-events').FreeTierEventName.AUDIT_WINDOW_ANSWERED
    | typeof import('./free-tier-events').FreeTierEventName.AUDIT_COMPLETED
  anonymousUserId: string
  surface: 'web'
  buildVersion: string
  // Loose payload for the wrapper — the strict variant lives in the
  // discriminated FreeTierEventPayload union and is preferred for new
  // call sites.
  extra: Record<string, unknown>
}): Promise<void> {
  await trackFreeTierEvent({
    name: params.name,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    props: {
      anonymousUserId: params.anonymousUserId,
      clientTimestamp: new Date().toISOString(),
      surface: params.surface,
      buildVersion: params.buildVersion,
      ...params.extra,
    } as any,
  })
}
