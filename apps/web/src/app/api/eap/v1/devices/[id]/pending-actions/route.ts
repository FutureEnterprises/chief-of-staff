/**
 * GET /api/eap/v1/devices/[id]/pending-actions — EAP edge poll loop.
 *
 * The device coordinator on the user's hardware (macOS menu-bar app,
 * browser extension, future watchOS bridge) polls this every 30s to
 * pull the actions the server has allowed for THIS device but that the
 * device hasn't executed yet. The coordinator dispatches each to its
 * actuator router and then closes the loop with
 * POST /api/eap/v1/action/outcome.
 *
 * NOTE on the segment name: Next.js requires one dynamic param name per
 * segment level, and the sibling fleet route already owns
 * devices/[id]. We renamed that segment from [userId] to the neutral
 * [id] (the fleet route reads `id` AS a userId; this route reads it as
 * a deviceId) so both can coexist. Internally we treat `id` as the
 * deviceId.
 *
 * Auth (machine): see lib/eap/device-auth.ts. Accepts, in order:
 *   1. the EAP device token  (Bearer coyl_eap_<deviceId>_<secret>)
 *   2. an LLM-partner PAP key (Bearer coyl_pap_<id>_<secret>) holding a
 *      scope grant from the device owner
 *   3. the user's Clerk session cookie (bootstrap; how the browser
 *      extension authenticates today)
 *
 * Response — EXACTLY the shape apps/desktop-macos decodes
 * (Models/EAPAction.swift is the contract):
 *   {
 *     "actions": [
 *       {
 *         "id": "...",                  // required (Swift: non-optional)
 *         "executionToken": "...",      // required
 *         "actuator": "notification",   // required
 *         "params": { ... },            // required object
 *         "scopeRequested": "edge:...", // optional
 *         "reasoning": "...",           // optional
 *         "confidence": 0.83,           // optional
 *         "willExecuteAt": "2026-...Z", // optional ISO8601
 *         "ttlSeconds": 60,             // optional
 *         "llmPartnerId": "anthropic-…" // optional
 *       }
 *     ]
 *   }
 * Empty queue → { "actions": [] }, 200.
 *
 * ----------------------------------------------------------------------
 * Action-claiming: the ActionRequest model has NO separate
 * 'claimed'/'delivered' state — its lifecycle is decision (allowed →)
 * then a terminal outcome (executed/failed/rejected/expired) written by
 * /action/outcome. We therefore do NOT mutate a claim flag here. Instead
 * we rely on OUTCOME IDEMPOTENCY: every returned row already carries its
 * single-use executionToken, /action/outcome is idempotent on that
 * token, and we stop returning a row the moment it has a terminal
 * `outcome`. A re-poll before the coordinator reports an outcome will
 * re-surface the same row (by design — the coordinator may have crashed
 * mid-dispatch); the executionToken + outcome idempotency prevent a
 * double-close. Server-pushed actions (executeAction sets executedAt via
 * Expo) are filtered out here so the poll loop only carries actions that
 * still need device-side pickup.
 *
 * ----------------------------------------------------------------------
 * UAP execution receipts are NOT redeemed here, deliberately. A row only
 * reaches this queue because /api/eap/v1/action/request already decided
 * `allowed` — and that route redeems the receipt BEFORE writing the row
 * (gate 4.5 there). Redeeming at delivery instead would be strictly
 * weaker: the row would exist, be visible to the push executor, and be
 * pollable before the authorization was ever checked. Both delivery
 * paths (server push via executeAction, device poll via this route)
 * therefore inherit one redemption at the single point where the
 * authorization decision and the row creation meet.
 */

import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { authenticateDeviceRequest } from '@/lib/eap/device-auth'
import { loadKillSwitchEvent } from '@/lib/uap/kill-switch'
import { isUserCoachingPathClosed } from '@/lib/rap/store'

export const maxDuration = 15

/**
 * Default TTL window (seconds) for an allowed action that didn't carry
 * an explicit ttlSeconds at request time. Mirrors the action/request
 * route's `ttlSeconds ?? 30` default — kept here so expiry math is
 * consistent on both sides of the loop. Tunable.
 */
const DEFAULT_TTL_SECONDS = 30

/**
 * How far back we look for still-pending actions. An allowed action
 * older than this with no outcome is treated as abandoned and never
 * surfaced (the coordinator was offline well past any sane TTL). Tunable.
 */
const MAX_PENDING_AGE_MS = 24 * 60 * 60 * 1000 // 24h

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: 'missing_device_id' }, { status: 400 })
  }
  // Lock the path id to the cuid charset before it reaches auth/Prisma.
  const safeDeviceId = sanitizeCuid(id)
  if (!safeDeviceId) {
    return NextResponse.json({ error: 'invalid_device_id' }, { status: 400 })
  }

  const authed = await authenticateDeviceRequest(req, safeDeviceId)
  if (!authed.ok) {
    return NextResponse.json({ error: authed.error }, { status: authed.status })
  }

  // Refresh liveness — a poll is the strongest "this device is online"
  // signal we get. Best-effort; never block the response on it.
  void prisma.device
    .update({
      where: { id: authed.device.id },
      data: { online: true, lastSeenAt: new Date() },
    })
    .catch(() => {})

  const now = new Date()
  const ageCutoff = new Date(now.getTime() - MAX_PENDING_AGE_MS)

  // ── Delivery-time gates ──────────────────────────────────────────
  // An action was gated at REQUEST time, but the world can change
  // between request and device pickup. The user's protections must
  // hold at the moment of DELIVERY too, or "panic denies every LLM-
  // initiated action" and "the kill switch supersedes every in-flight
  // action" are only true for actions that hadn't been queued yet.
  //
  // 1. Panic: while active, the queue reads as empty. Actions are not
  //    mutated — if the panic window lapses before the 24h pending age
  //    does, still-live actions resume delivery.
  // nosemgrep
  const panic = await prisma.panicState.findUnique({
    where: { userId: authed.userId },
    select: { active: true, expiresAt: true },
  })
  const panicActive = Boolean(
    panic?.active &&
      (!panic.expiresAt || panic.expiresAt.getTime() > Date.now()),
  )
  if (panicActive) {
    return NextResponse.json({ actions: [] })
  }

  // 2. RAP: a closed coaching path (crisis/emergency window) means the
  //    user must not be reachable by any partner-initiated actuation —
  //    including ones queued before the crisis was classified.
  //    Fail-open on a read error (matches every other RAP call site).
  let coachingClosed = false
  try {
    coachingClosed = await isUserCoachingPathClosed(authed.userId)
  } catch {
    coachingClosed = false
  }
  if (coachingClosed) {
    return NextResponse.json({ actions: [] })
  }

  // 3. Kill switch: anything queued BEFORE the user's most recent
  //    global kill is dead forever — the kill "supersedes every
  //    in-flight action" (UAP-0.1 §3). Actions requested after the
  //    kill under freshly re-granted authority deliver normally.
  let killCutoff: Date | null = null
  try {
    const killEvent = await loadKillSwitchEvent(authed.userId)
    killCutoff = killEvent?.initiatedAt ?? null
  } catch {
    killCutoff = null // fail-open: the request-time gates still ran
  }

  // Pending = allowed by the coordinator, has a minted executionToken,
  // not yet closed by an outcome, recent enough to still be live, and
  // requested after the most recent kill (if any).
  // nosemgrep
  const rows = await prisma.actionRequest.findMany({
    where: {
      deviceId: authed.device.id,
      decision: 'allowed',
      outcome: null,
      executionToken: { not: null },
      createdAt:
        killCutoff && killCutoff.getTime() > ageCutoff.getTime()
          ? { gt: killCutoff }
          : { gte: ageCutoff },
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      executionToken: true,
      actuator: true,
      paramsJson: true,
      scopeRequested: true,
      reasoning: true,
      confidence: true,
      llmPartnerId: true,
      createdAt: true,
    },
    take: 100,
  })

  const actions = rows
    // executionToken is filtered non-null in the query, but the column
    // is nullable in the type — narrow it explicitly (noUncheckedIndexedAccess
    // / strict null safety) and drop any straggler the DB returned.
    .filter((r): r is typeof r & { executionToken: string } => r.executionToken !== null)
    .map((r) => {
      // willExecuteAt is immediate at request time (the action/request
      // route schedules willExecuteAt = createdAt); ttlSeconds bounds the
      // live window. We don't persist either column, so we surface
      // createdAt as willExecuteAt and the default TTL — the coordinator
      // applies the same `now > willExecuteAt + ttl` gate locally before
      // dispatch (EAPCoordinator.dispatch).
      //
      // WIRE-CRITICAL: the Swift decoder uses JSONDecoder.dateDecodingStrategy
      // = .iso8601, which is ISO8601DateFormatter with default options and
      // therefore REJECTS fractional seconds. JS Date.toISOString() always
      // emits milliseconds ("…:00.300Z"), which would throw on decode and
      // fail the ENTIRE pending-actions response (a present-but-malformed
      // value for a Swift Optional still throws). Strip the fractional part
      // so the emitted form is "…:00Z", which the Swift formatter accepts.
      const willExecuteAt = toIso8601NoFraction(r.createdAt)

      // params must be a JSON object for the Swift `JSONValue` decoder's
      // object subscripting to work; coerce non-object blobs to {}.
      const params =
        r.paramsJson && typeof r.paramsJson === 'object' && !Array.isArray(r.paramsJson)
          ? r.paramsJson
          : {}

      return {
        id: r.id,
        executionToken: r.executionToken,
        actuator: r.actuator,
        params,
        scopeRequested: r.scopeRequested,
        reasoning: r.reasoning,
        confidence: r.confidence,
        willExecuteAt,
        ttlSeconds: DEFAULT_TTL_SECONDS,
        llmPartnerId: r.llmPartnerId,
      }
    })

  return NextResponse.json({ actions })
}

/**
 * ISO8601 with NO fractional seconds: "YYYY-MM-DDTHH:MM:SSZ". The macOS
 * coordinator's JSONDecoder.iso8601 strategy can't parse milliseconds
 * (see willExecuteAt note above), so we drop them. UTC always.
 */
function toIso8601NoFraction(d: Date): string {
  // toISOString() → "2026-06-12T21:11:30.300Z"; cut ".300" before "Z".
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z')
}

/**
 * Whitelist-by-construction cuid sanitizer (mirrors the EAP routes).
 */
function sanitizeCuid(input: string): string | null {
  if (!input || input.length === 0 || input.length > 64) return null
  const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let out = ''
  for (let i = 0; i < input.length; i++) {
    const c = input.charAt(i)
    if (!ALPHABET.includes(c)) return null
    out += c
  }
  return out
}
