/**
 * /api/cron/teams-graph-pull
 *
 * The Microsoft Graph dispatcher — turns the four COYL Teams interrupt
 * classes from "buttons that fire via direct API calls" into "fires
 * automatically from real calendar + email signals."
 *
 * Runs every 5 minutes (see apps/web/vercel.json). For each user with
 * an active TeamsUserAuth row:
 *
 *   a. FOCUS_DEFENDER          — calendar event in the next 15 min with
 *                                a focus/deep-work tag → fire once.
 *                                Cap: once per event.
 *   b. FOLLOW_THROUGH_PINGER   — sent email >48h with no reply from a
 *                                ranked-important recipient.
 *                                Cap: once per recipient per 7 days.
 *   c. MEETING_DECLINER        — calendar density >70% across 3
 *                                consecutive days.
 *                                Cap: once per user per day.
 *   d. RECOVERY_COACH          — back-to-back heavy meetings just
 *                                ended with ≥5 min buffer to next.
 *                                Cap: once per user per 4 hours.
 *
 * Per-class rate-limits are enforced by looking for prior
 * `teams_interrupt_sent` rows on `productivity_events` — that's the
 * existing source-of-truth shape the notify-by-class route writes, so
 * we don't introduce a parallel state surface.
 *
 * Fires interrupts by POSTing to the EXISTING
 * /api/v1/teams/interrupt/[tenantId] endpoint with a CRON_SECRET
 * bearer — same path the manual dispatch button uses, so the audit
 * trail looks identical in the admin dashboard.
 *
 * Heartbeat: records to `cron_heartbeats` via recordHeartbeat() so the
 * admin dashboard can spot a wedged poller before the next 5-min tick.
 */
import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { verifyCronAuth } from '@/lib/cron-auth'
import { recordHeartbeat } from '@/lib/cron-heartbeat'
import {
  conversationHasReplyAfter,
  getGraphConfig,
  getValidAccessToken,
  listCalendarEvents,
  listSentEmailsWithoutReply,
  type GraphCalendarEvent,
  type GraphSentMessage,
} from '@/lib/integrations/microsoft-graph'

export const maxDuration = 120

// ────────────────────────────────────────────────────────────────────
// Per-class rate-limit thresholds. Tuned to "interrupts feel like a
// caring colleague, not a chatbot." Adjusting these is the single
// biggest knob for whether users keep the integration installed.
// ────────────────────────────────────────────────────────────────────

const FOLLOW_THROUGH_AGE_HOURS = 48
const FOLLOW_THROUGH_COOLDOWN_DAYS = 7
const MEETING_DECLINER_COOLDOWN_HOURS = 24
const RECOVERY_COACH_COOLDOWN_HOURS = 4
const FOCUS_LOOKAHEAD_MIN = 15
const FOCUS_LOOKAHEAD_BUFFER_MIN = 5 // matches cron interval; ensures we don't miss a fire
const DENSITY_THRESHOLD_PCT = 70
const DENSITY_DAYS_REQUIRED = 3
const RECOVERY_BUFFER_MIN = 5
const RECOVERY_BACK_TO_BACK_MIN = 2

// Cap per-cron user count so a single tick can't run away. With 5-min
// cadence + per-user budget of ~6 Graph requests, 100 users keeps us
// well under Graph's 10k-requests-per-10-min rate ceiling.
const PAGE_SIZE = 100

type InterruptClass =
  | 'FOCUS_DEFENDER'
  | 'FOLLOW_THROUGH_PINGER'
  | 'MEETING_DECLINER'
  | 'RECOVERY_COACH'

/**
 * Look up the most recent `teams_interrupt_sent` event for a user
 * matching the class predicate. Returns the createdAt timestamp or
 * null. Used by every per-class cooldown gate.
 *
 * `keyMatcher` is an optional metadataJson path equality — e.g. the
 * Focus Defender cap is "once per event id", which means
 * metadataJson.eventId === thisEventId.
 */
async function lastInterruptFiredAt(
  userId: string,
  cls: InterruptClass,
  keyMatcher?: { path: string[]; equals: string },
): Promise<Date | null> {
  const where: Record<string, unknown> = {
    userId,
    eventType: 'NOTIFICATION_OPENED',
    eventValue: 'teams_interrupt_sent',
  }
  // Filter on JSONB equality. Prisma supports this via `metadataJson: { path, equals }`.
  const whereWithMeta: Record<string, unknown> = keyMatcher
    ? {
        ...where,
        AND: [
          { metadataJson: { path: ['interruptClass'], equals: cls } },
          {
            metadataJson: {
              path: keyMatcher.path,
              equals: keyMatcher.equals,
            },
          },
        ],
      }
    : {
        ...where,
        metadataJson: { path: ['interruptClass'], equals: cls },
      }

  const row = await prisma.productivityEvent.findFirst({
    where: whereWithMeta,
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  })
  return row?.createdAt ?? null
}

type TenantDispatch = {
  tenantId: string
  userId: string
  interruptClass: InterruptClass
  context: { archetype?: string; data?: Record<string, string | number> }
}

/**
 * POST the interrupt-dispatch payload to the existing notify-by-class
 * route. Uses CRON_SECRET bearer so the route's two-track auth treats
 * us as a server-to-server call (no Clerk session needed).
 */
async function dispatchToTeamsInterrupt(
  payload: TenantDispatch,
): Promise<{ ok: boolean; status: number; body?: unknown }> {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return { ok: false, status: 503 }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coyl.app'
  // Sanitize the tenantId — the notify route zod-validates this anyway,
  // but we belt-and-suspenders the URL to keep a strict scanner happy.
  const safeTenantId = encodeURIComponent(payload.tenantId)
  const url = `${appUrl}/api/v1/teams/interrupt/${safeTenantId}`
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cronSecret}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        userId: payload.userId,
        interruptClass: payload.interruptClass,
        context: payload.context,
      }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return { ok: false, status: res.status, body }
    }
    return { ok: true, status: res.status }
  } catch (err) {
    return {
      ok: false,
      status: 0,
      body: err instanceof Error ? err.message : 'fetch_failed',
    }
  }
}

/**
 * Heuristic: does this calendar event look like a focus / deep-work
 * block?
 *
 * Microsoft Graph doesn't expose a first-class "focus block" surface;
 * the closest signal is showAs='busy' + the categories[] array
 * carrying a user-chosen "Focus" / "Deep Work" tag, OR the subject
 * containing canonical focus-block phrasing. We accept any of these.
 */
function isFocusBlock(ev: GraphCalendarEvent): boolean {
  const subject = (ev.subject ?? '').toLowerCase()
  if (
    subject.includes('focus block') ||
    subject.includes('deep work') ||
    subject.includes('do not disturb') ||
    subject.includes('heads down') ||
    subject.includes('quiet hours') ||
    subject.includes('focus time')
  ) {
    return true
  }
  const cats = (ev.categories ?? []).map((c) => c.toLowerCase())
  if (
    cats.some(
      (c) =>
        c.includes('focus') || c.includes('deep work') || c === 'do not disturb',
    )
  ) {
    return true
  }
  return false
}

/**
 * Heuristic: does this calendar event count as a "heavy meeting"
 * for the recovery-coach signal?
 *
 * Heavy = explicit high importance OR ≥30 min and not a 1:1 (i.e.
 * 2+ attendees so the cognitive load isn't trivial). We deliberately
 * miss some real heavies to keep the false-positive rate low.
 */
function isHeavyMeeting(ev: GraphCalendarEvent): boolean {
  if (ev.importance === 'high') return true
  const attendeeCount = (ev.attendees ?? []).length
  const startMs = new Date(ev.start.dateTime + 'Z').getTime()
  const endMs = new Date(ev.end.dateTime + 'Z').getTime()
  const durationMin = (endMs - startMs) / 60_000
  return durationMin >= 30 && attendeeCount >= 2
}

/**
 * Rough density check: across the next `days` whole-day windows (8am
 * - 6pm local-time-ish, treated server-side as 10 hours = 600 min for
 * simplicity), how many minutes were in a non-free event?
 *
 * Returns the fraction of busy time. Density >0.7 means >70% of the
 * 8-hour work block was in meetings — the trigger threshold.
 */
function dayDensities(events: GraphCalendarEvent[], now: Date): number[] {
  const WORK_DAY_MINUTES = 600 // 8 AM through 6 PM, 10h
  const densities: number[] = []
  for (let d = 0; d < DENSITY_DAYS_REQUIRED; d++) {
    const dayStart = new Date(now)
    dayStart.setUTCDate(dayStart.getUTCDate() + d)
    dayStart.setUTCHours(8, 0, 0, 0)
    const dayEnd = new Date(dayStart)
    dayEnd.setUTCHours(18, 0, 0, 0)
    let busyMin = 0
    for (const ev of events) {
      const evStart = new Date(ev.start.dateTime + 'Z').getTime()
      const evEnd = new Date(ev.end.dateTime + 'Z').getTime()
      const overlapStart = Math.max(evStart, dayStart.getTime())
      const overlapEnd = Math.min(evEnd, dayEnd.getTime())
      if (overlapEnd > overlapStart && ev.showAs !== 'free') {
        busyMin += (overlapEnd - overlapStart) / 60_000
      }
    }
    densities.push(busyMin / WORK_DAY_MINUTES)
  }
  return densities
}

/**
 * Rank the user's email correspondents by frequency over the recent
 * sample. The Follow-Through Pinger only fires for the top-N
 * recipients so we don't pester every mailing list.
 */
function rankRecipientsByFrequency(messages: GraphSentMessage[]): Set<string> {
  const counts = new Map<string, number>()
  for (const m of messages) {
    const tos = m.toRecipients ?? []
    for (const r of tos) {
      const addr = r.emailAddress?.address?.toLowerCase()
      if (!addr) continue
      counts.set(addr, (counts.get(addr) ?? 0) + 1)
    }
  }
  // Anyone with 2+ sent messages in our 50-message sample is "ranked
  // important." Crude but matches the spec's instruction to "rank by
  // frequency of past correspondence."
  const ranked = new Set<string>()
  for (const [addr, n] of counts) {
    if (n >= 2) ranked.add(addr)
  }
  return ranked
}

export async function GET(req: Request) {
  const authError = verifyCronAuth(req)
  if (authError) return authError

  if (!getGraphConfig()) {
    // Heartbeat anyway so an operator sees the cron is firing but the
    // integration just isn't configured.
    await recordHeartbeat('teams-graph-pull', {
      skipped: 'integration_not_configured',
    })
    return NextResponse.json(
      { ok: false, error: 'integration_not_configured' },
      { status: 503 },
    )
  }

  const now = new Date()
  let scanned = 0
  let fired = 0
  let skipped = 0
  let errored = 0

  // Walk active TeamsUserAuth rows. Order by tokenExpiresAt to spread
  // refreshes evenly — we don't want a thundering herd refreshing on
  // the same tick.
  const rows = await prisma.teamsUserAuth.findMany({
    take: PAGE_SIZE,
    orderBy: { tokenExpiresAt: 'asc' },
    select: {
      userId: true,
      tenantId: true,
      scopesGranted: true,
    },
  })

  for (const row of rows) {
    scanned++
    try {
      // Refresh token if needed; skip silently on failure (the user must
      // re-consent, surfaced separately by the /settings card).
      const token = await getValidAccessToken(row.userId)
      if (!token) {
        skipped++
        continue
      }

      const hasCalendar = token.scopes.some((s) =>
        s.toLowerCase().includes('calendars.read'),
      )
      const hasMail = token.scopes.some((s) =>
        s.toLowerCase().includes('mail.read'),
      )

      // ──────────────────────────────────────────────────────────
      // (a) FOCUS_DEFENDER — fire 15 min before a focus block.
      // ──────────────────────────────────────────────────────────
      if (hasCalendar) {
        const lookAheadStart = new Date(
          now.getTime() + (FOCUS_LOOKAHEAD_MIN - FOCUS_LOOKAHEAD_BUFFER_MIN) * 60_000,
        )
        const lookAheadEnd = new Date(
          now.getTime() + (FOCUS_LOOKAHEAD_MIN + FOCUS_LOOKAHEAD_BUFFER_MIN) * 60_000,
        )
        const events = await listCalendarEvents(
          row.userId,
          lookAheadStart.toISOString(),
          lookAheadEnd.toISOString(),
        )
        const focusBlock = events.find(isFocusBlock)
        if (focusBlock) {
          // Cap: once per event id.
          const lastFire = await lastInterruptFiredAt(
            row.userId,
            'FOCUS_DEFENDER',
            { path: ['eventId'], equals: focusBlock.id },
          )
          if (!lastFire) {
            // Pull 3 most recent open commitments for the user — the
            // FOCUS_DEFENDER card uses these as the "what you said you'd
            // finish" anchor.
            const commitments = await prisma.commitment.findMany({
              where: { userId: row.userId, active: true },
              orderBy: { createdAt: 'desc' },
              take: 3,
              select: { rule: true },
            })
            const commitmentList = commitments
              .map((c) => `• ${c.rule}`)
              .join('\n')
            const minutesUntil = Math.max(
              1,
              Math.round(
                (new Date(focusBlock.start.dateTime + 'Z').getTime() -
                  now.getTime()) /
                  60_000,
              ),
            )
            const result = await dispatchToTeamsInterrupt({
              tenantId: row.tenantId,
              userId: row.userId,
              interruptClass: 'FOCUS_DEFENDER',
              context: {
                data: {
                  minutesUntil,
                  commitments:
                    commitmentList || 'Three open commitments on your list.',
                  // Embedded in the productivity_event metadataJson via
                  // the interrupt route; we read it back in the dedupe
                  // check above.
                  eventId: focusBlock.id,
                },
              },
            })
            if (result.ok) fired++
            else if (result.status === 503) skipped++
            else errored++
          }
        }
      }

      // ──────────────────────────────────────────────────────────
      // (b) FOLLOW_THROUGH_PINGER — sent email 48h+ no reply.
      // ──────────────────────────────────────────────────────────
      if (hasMail) {
        const cutoff = new Date(
          now.getTime() - FOLLOW_THROUGH_AGE_HOURS * 60 * 60 * 1000,
        )
        const sent = await listSentEmailsWithoutReply(
          row.userId,
          cutoff.toISOString(),
        )
        const ranked = rankRecipientsByFrequency(sent)
        // Iterate oldest-newest so the FIRST unreplied promise to a
        // ranked recipient triggers, not the most recent.
        const sortedSent = [...sent].sort(
          (a, b) =>
            new Date(a.sentDateTime).getTime() -
            new Date(b.sentDateTime).getTime(),
        )
        for (const msg of sortedSent) {
          const firstRecipient = msg.toRecipients?.[0]?.emailAddress?.address
            ?.toLowerCase()
          if (!firstRecipient || !ranked.has(firstRecipient)) continue
          // Cap: once per recipient per 7 days.
          const lastFire = await lastInterruptFiredAt(
            row.userId,
            'FOLLOW_THROUGH_PINGER',
            { path: ['recipient'], equals: firstRecipient },
          )
          if (
            lastFire &&
            now.getTime() - lastFire.getTime() <
              FOLLOW_THROUGH_COOLDOWN_DAYS * 24 * 60 * 60 * 1000
          ) {
            continue
          }
          // Final check: did the recipient already reply? (Cheap Graph
          // hit, fail-closed.)
          if (!msg.conversationId) continue
          const replied = await conversationHasReplyAfter(
            row.userId,
            msg.conversationId,
            msg.sentDateTime,
          )
          if (replied) continue

          const result = await dispatchToTeamsInterrupt({
            tenantId: row.tenantId,
            userId: row.userId,
            interruptClass: 'FOLLOW_THROUGH_PINGER',
            context: {
              data: {
                contact: firstRecipient,
                promiseDay: msg.sentDateTime.slice(0, 10),
                snippet: (msg.bodyPreview ?? '').slice(0, 140),
                recipient: firstRecipient,
                messageId: msg.id,
              },
            },
          })
          if (result.ok) fired++
          else if (result.status === 503) skipped++
          else errored++
          // Fire at most one Follow-Through Pinger per cron tick per
          // user — avoid a stampede if they have a dozen overdue threads.
          break
        }
      }

      // ──────────────────────────────────────────────────────────
      // (c) MEETING_DECLINER — density > 70% × 3 consecutive days.
      // ──────────────────────────────────────────────────────────
      if (hasCalendar) {
        const lastFire = await lastInterruptFiredAt(
          row.userId,
          'MEETING_DECLINER',
        )
        const cooledDown =
          !lastFire ||
          now.getTime() - lastFire.getTime() >
            MEETING_DECLINER_COOLDOWN_HOURS * 60 * 60 * 1000
        if (cooledDown) {
          const dayStart = new Date(now)
          dayStart.setUTCHours(0, 0, 0, 0)
          const lookEnd = new Date(dayStart)
          lookEnd.setUTCDate(lookEnd.getUTCDate() + DENSITY_DAYS_REQUIRED)
          const horizonEvents = await listCalendarEvents(
            row.userId,
            dayStart.toISOString(),
            lookEnd.toISOString(),
          )
          const densities = dayDensities(horizonEvents, dayStart)
          const allDense = densities.every(
            (d) => d * 100 >= DENSITY_THRESHOLD_PCT,
          )
          if (allDense) {
            const avgPct = Math.round(
              (densities.reduce((s, d) => s + d, 0) / densities.length) * 100,
            )
            const result = await dispatchToTeamsInterrupt({
              tenantId: row.tenantId,
              userId: row.userId,
              interruptClass: 'MEETING_DECLINER',
              context: {
                data: {
                  density: `${avgPct}%`,
                  days: DENSITY_DAYS_REQUIRED,
                },
              },
            })
            if (result.ok) fired++
            else if (result.status === 503) skipped++
            else errored++
          }
        }
      }

      // ──────────────────────────────────────────────────────────
      // (d) RECOVERY_COACH — back-to-back heavy meetings just ended.
      // ──────────────────────────────────────────────────────────
      if (hasCalendar) {
        const lastFire = await lastInterruptFiredAt(
          row.userId,
          'RECOVERY_COACH',
        )
        const cooledDown =
          !lastFire ||
          now.getTime() - lastFire.getTime() >
            RECOVERY_COACH_COOLDOWN_HOURS * 60 * 60 * 1000
        if (cooledDown) {
          // Look at events that ended in the last 15 min and the next
          // event up to 60 min out — we need both sides to decide buffer.
          const windowStart = new Date(now.getTime() - 60 * 60 * 1000)
          const windowEnd = new Date(now.getTime() + 60 * 60 * 1000)
          const events = await listCalendarEvents(
            row.userId,
            windowStart.toISOString(),
            windowEnd.toISOString(),
          )
          // Sort by start ascending and find back-to-back heavies that
          // just ended.
          const sorted = [...events].sort(
            (a, b) =>
              new Date(a.start.dateTime + 'Z').getTime() -
              new Date(b.start.dateTime + 'Z').getTime(),
          )
          // Find pair (a, b) where b.start - a.end <= RECOVERY_BACK_TO_BACK_MIN,
          // both heavy, and b.end was within the last 15 minutes.
          for (let i = 0; i < sorted.length - 1; i++) {
            const a = sorted[i]!
            const b = sorted[i + 1]!
            if (!isHeavyMeeting(a) || !isHeavyMeeting(b)) continue
            const aEnd = new Date(a.end.dateTime + 'Z').getTime()
            const bStart = new Date(b.start.dateTime + 'Z').getTime()
            const bEnd = new Date(b.end.dateTime + 'Z').getTime()
            const gapMin = (bStart - aEnd) / 60_000
            if (gapMin > RECOVERY_BACK_TO_BACK_MIN) continue
            const sinceBEndMin = (now.getTime() - bEnd) / 60_000
            if (sinceBEndMin < 0 || sinceBEndMin > 15) continue
            // Find the NEXT event after b — we want at least
            // RECOVERY_BUFFER_MIN minutes before whatever comes next.
            const next = sorted[i + 2]
            const nextGapMin = next
              ? (new Date(next.start.dateTime + 'Z').getTime() - now.getTime()) /
                60_000
              : Number.POSITIVE_INFINITY
            if (nextGapMin < RECOVERY_BUFFER_MIN) continue

            const result = await dispatchToTeamsInterrupt({
              tenantId: row.tenantId,
              userId: row.userId,
              interruptClass: 'RECOVERY_COACH',
              context: {
                data: {
                  trigger: 'Two back-to-back heavy meetings just ended.',
                  nextEvent: next
                    ? `Next: ${next.subject ?? 'unnamed event'} in ${Math.round(
                        nextGapMin,
                      )} min.`
                    : 'No event on the calendar for the next hour.',
                },
              },
            })
            if (result.ok) fired++
            else if (result.status === 503) skipped++
            else errored++
            break
          }
        }
      }
    } catch (err) {
      errored++
      console.warn('[teams-graph-pull] row failed', {
        userId: row.userId,
        err: err instanceof Error ? err.message : String(err),
      })
    }
  }

  await recordHeartbeat('teams-graph-pull', {
    scanned,
    fired,
    skipped,
    errored,
  })
  return NextResponse.json({
    ok: true,
    scanned,
    fired,
    skipped,
    errored,
    timestamp: now.toISOString(),
  })
}
