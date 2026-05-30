/**
 * Free-tier event sink — server-side router.
 *
 * Marketing-funnel events are tracked CLIENT-SIDE via PostHog (see
 * posthog-client.ts) AND server-side via the existing AuditFunnelEvent
 * beacon path (see /api/v1/audit/event). This file handles the
 * CLINICAL event set — the PHI-adjacent events that must stay inside
 * our infrastructure.
 *
 * Routing today (May 30 2026 — Month 1 of v3 plan):
 *   - Marketing events (audit.*, free_tier.signup, audit.shared):
 *     fire client-side via captureMarketingEvent() in posthog-client.
 *     This file is NOT in their path.
 *   - Clinical events (interrupt.*, slip.reported, recovery.completed,
 *     kill_switch.fired, app.opened): write to ClinicalEvent in
 *     Postgres. Append-only. Never sent to PostHog.
 *
 * Tomorrow (when iOS app ships):
 *   - The iOS app POSTs clinical events to /api/v1/clinical-event,
 *     which calls trackFreeTierEvent() on the server.
 *   - PHI-adjacent retention rules (UAP §AUDIT_QUERY) apply.
 *   - When the BAA is in place, Postgres RLS enforces append-only.
 */

import { prisma } from '@repo/database'
import type { FreeTierEventPayload } from './free-tier-events'
import { FreeTierEventName } from './free-tier-events'

/** The clinical-event subset of FreeTierEventName. */
const CLINICAL_EVENT_NAMES = new Set<string>([
  FreeTierEventName.DANGER_WINDOW_DETECTED,
  FreeTierEventName.INTERRUPT_FIRED,
  FreeTierEventName.INTERRUPT_CHANGED_BEHAVIOR,
  FreeTierEventName.SLIP_REPORTED,
  FreeTierEventName.RECOVERY_COMPLETED,
  FreeTierEventName.KILL_SWITCH_FIRED,
  FreeTierEventName.APP_OPENED,
])

/**
 * Track a single free-tier event server-side. For clinical events,
 * writes to ClinicalEvent. For marketing events, logs and returns
 * (the actual marketing capture happens client-side via PostHog).
 *
 * Always await. The clinical write is a real I/O round-trip; the
 * caller's request handler should backpressure on the analytics
 * sink rather than silently drop on a slow DB.
 */
export async function trackFreeTierEvent(
  event: FreeTierEventPayload,
  ipHash?: string,
): Promise<void> {
  if (CLINICAL_EVENT_NAMES.has(event.name)) {
    // Strip the four columnar base props out of the JSON payload so
    // they don't get duplicated.
    const {
      anonymousUserId,
      clientTimestamp,
      surface,
      buildVersion,
      ...extraProps
    } = event.props
    await prisma.clinicalEvent.create({
      data: {
        name: event.name,
        anonymousUserId,
        surface,
        buildVersion,
        clientTimestamp: new Date(clientTimestamp),
        props: extraProps as never,
        ipHash: ipHash ?? null,
      },
    })
    return
  }

  // Marketing event arrived server-side. The web client should be
  // hitting PostHog directly via captureMarketingEvent(); we log this
  // so we can find code paths that haven't been migrated yet.
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('[free-tier.telemetry] marketing event arrived server-side (expected client-side):', event.name)
  }
}
