/**
 * UAP — kill-switch realtime broadcast (v0.1.1, A3 gap #2).
 *
 * Bridges the atomic DB-only kill in `initiateKillSwitch` to every
 * subscriber surface (mobile, browser extension, watch companion, web
 * client) so the ≤5-second propagation deadline in
 * docs/protocol/UAP-0.1.md §3 is observably met across the wire — not
 * just inside the Postgres transaction.
 *
 *   DB txn  →  ~10–200ms  → row is `KILLED_GLOBALLY`
 *   Realtime broadcast → ~hundreds of ms → every subscribed surface
 *
 * Total wall-clock: well under the 5-second SLA.
 *
 * ───────────────────────────────────────────────────────────────
 * Channel name shape
 * ───────────────────────────────────────────────────────────────
 *
 *   `uap:kill:<userId>`
 *
 * One channel per user. Subscribers (mobile clients, browser
 * extensions, web tabs) open exactly the channel for their own user
 * and listen for the `kill` event. Cross-user broadcast is impossible
 * because the channel name is user-scoped. (At the platform layer
 * Supabase Realtime authorization should additionally gate channel
 * subscription on the authenticated user's id matching the channel —
 * that's an RLS-on-realtime concern, not this helper's concern.)
 *
 * ───────────────────────────────────────────────────────────────
 * Payload schema
 * ───────────────────────────────────────────────────────────────
 *
 *   {
 *     killedAt:         string  // ISO-8601, UTC. Same instant the DB txn committed.
 *     affectedGrantIds: string[] // IDs of grants flipped to KILLED_GLOBALLY in this kill.
 *     reason:           string  // 'user_initiated' | 'admin_intervention' | 'safety_routing' | etc.
 *   }
 *
 * Subscribers should treat receipt of ANY `kill` event for their
 * userId as authoritative: drop any in-flight UAP-grant-backed
 * action, refresh the local grant cache from the DB, surface UI
 * confirmation that the kill landed.
 *
 * ───────────────────────────────────────────────────────────────
 * Failure semantics
 * ───────────────────────────────────────────────────────────────
 *
 * THIS FUNCTION MUST NEVER THROW. The kill-switch DB transaction has
 * already committed by the time we're called; the protocol guarantee
 * (KILLED_GLOBALLY status is the source of truth) is already met.
 * Broadcast is an optimization that lets clients react in hundreds of
 * ms instead of waiting for their next poll. If the broadcast
 * publish fails — Supabase unreachable, env vars missing, network
 * partition, anything — we log and return resolved void. The kill
 * is unaffected.
 *
 * @see docs/protocol/UAP-0.1.md §3 (5-second propagation SLA)
 * @see docs/protocol/UAP-0.1.md §5 (wire format)
 * @see apps/web/src/lib/uap/kill-switch.ts (calls this after the txn)
 */

/* ──────────────────── Shared payload type ──────────────────── */

export type KillSwitchBroadcastPayload = {
  killedAt: string
  affectedGrantIds: string[]
  reason: string
}

/* ──────────────────── Singleton transport ────────────────────
 *
 * Module-level singleton. The Supabase Realtime broadcast endpoint
 * is HTTP — we POST a single signed request per kill and let the
 * Realtime server fan it out to subscribers. We do NOT keep a
 * long-lived websocket from the server: every kill is one
 * fire-and-forget HTTP request. The "singleton" here is just the
 * cached config object so we don't re-read env on the hot path.
 */

type Transport = {
  url: string // e.g. https://<project>.supabase.co
  serviceRoleKey: string
} | null

let _transport: Transport | undefined

function getTransport(): Transport {
  if (_transport !== undefined) return _transport

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ''
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? ''

  if (!url || !serviceRoleKey) {
    // Missing config — broadcast is a no-op. The kill still works
    // because the DB row is the source of truth.
    _transport = null
    return _transport
  }

  _transport = { url: url.replace(/\/+$/, ''), serviceRoleKey }
  return _transport
}

/* ──────────────────── broadcastKillSwitch ──────────────────── */

/**
 * Fire-and-forget publish to the Realtime channel `uap:kill:<userId>`.
 *
 * Implemented over Supabase Realtime's HTTP broadcast API (which is
 * the documented serverless-friendly path — equivalent to what the
 * Supabase JS SDK does for `supabase.channel(...).send({ type:
 * 'broadcast', event: 'kill', payload })`, just without holding a
 * websocket open from the server side).
 *
 * Always resolves to `void`. Never throws — internal errors are
 * caught and logged so the caller (kill-switch.ts) can be a single
 * unconditional line.
 *
 * @param userId  the user whose kill landed
 * @param payload broadcast payload (see `KillSwitchBroadcastPayload`)
 */
export async function broadcastKillSwitch(
  userId: string,
  payload: KillSwitchBroadcastPayload,
): Promise<void> {
  try {
    const transport = getTransport()
    if (!transport) {
      // Realtime not configured in this environment — silent no-op
      // is fine. The DB txn already guarantees correctness.
      return
    }

    const channel = `uap:kill:${userId}`

    // Standard Supabase Realtime broadcast HTTP shape. This is the
    // SDK-equivalent of:
    //
    //   supabase
    //     .channel('uap:kill:<userId>')
    //     .send({ type: 'broadcast', event: 'kill', payload })
    //
    // The HTTP path skips the websocket dance on the server side and
    // is the recommended serverless pattern.
    await fetch(`${transport.url}/realtime/v1/api/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: transport.serviceRoleKey,
        Authorization: `Bearer ${transport.serviceRoleKey}`,
      },
      body: JSON.stringify({
        messages: [
          {
            topic: channel,
            event: 'kill',
            payload,
            private: false,
          },
        ],
      }),
      // Don't let a slow Realtime endpoint stall the kill response.
      // Hundreds of ms is the target; cap at 2s to stay well under the
      // 5s SLA even if we're the last thing the request does.
      signal: AbortSignal.timeout(2000),
    })
  } catch (err) {
    // KILL MUST NEVER FAIL BECAUSE BROADCAST FAILED.
    // Log and swallow. Subscribers will pick the kill up on their
    // next reconnect / poll.
    console.warn('[uap.realtime] broadcastKillSwitch failed (swallowed):', err)
  }
}

/* ──────────────────── subscriber_example ────────────────────
 *
 * Reference snippet a partner integration (mobile client, browser
 * extension, watch companion, third-party LLM SDK) drops in to
 * subscribe to a user's kill-switch in real time. Surface this in
 * the public UAP SDK docs.
 *
 * NOTE: requires `@supabase/supabase-js` on the client side. The
 * channel name and event name MUST match what `broadcastKillSwitch`
 * publishes above.
 */

export const subscriber_example = `
// On the client (mobile / web / extension):
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// userId is the authenticated user's id.
const channel = supabase.channel(\`uap:kill:\${userId}\`)

channel
  .on('broadcast', { event: 'kill' }, ({ payload }) => {
    // payload: { killedAt, affectedGrantIds, reason }
    //
    // What you MUST do here:
    //   1. Drop any in-flight UAP-grant-backed action.
    //   2. Refresh local grant cache from the DB (the KILLED_GLOBALLY
    //      flip is already there — this broadcast just tells you
    //      to look).
    //   3. Surface UI confirmation that the kill landed.
    //
    // The protocol guarantee: receipt of this event within 5 seconds
    // of the user pressing the kill button. v0.1.1 implementations
    // land in the hundreds of ms.
    onUAPKill(payload)
  })
  .subscribe()
`.trim()
