/**
 * UAP — kill-switch propagation (v0.1.1 reference engine, A3).
 *
 * The global revoke layer. When a user trips the panic button, EVERY
 * active UAP grant they hold across EVERY LLM partner flips to
 * `KILLED_GLOBALLY` in one atomic Prisma transaction. Per
 * docs/protocol/UAP-0.1.md §3 (hard invariants) and §5 (wire format),
 * propagation must complete within 5 seconds; the v0.1.1 reference
 * achieves ≤1s because every active grant lives in one DB and the kill
 * is a single transactional UPDATE — no async fanout to remote surfaces
 * is required at this layer. Per-surface (EAP) propagation continues to
 * 5s; anything firing in the 1–5s window is the EXECUTE coordinator's
 * problem (see T6 in the threat model — those actions get the
 * post_kill audit flag).
 *
 * Schema constraint to remember: `UAPKillSwitchEvent` has
 * `userId @unique`. There can only be ONE row per user. We `upsert` so
 * a second kill (after the user issues fresh post-kill grants and then
 * needs to kill again) overwrites the previous propagation timestamp
 * and grant-id set. Historical kills are NOT preserved in this table
 * in v0.1.1 — the per-grant audit trail (UAPAuditEntry with
 * operation='kill') is the history of record.
 *
 * See:
 *   docs/protocol/UAP-0.1.md §3 (invariants)
 *   docs/protocol/UAP-0.1.md §5 (wire format)
 *   docs/protocol/UAP-0.1-threat-model.md T6 (kill-switch failure)
 *   apps/web/src/lib/uap/types.ts (shared contract)
 */

import { prisma } from '@repo/database'
import type { UAPKillSwitchEvent } from '@repo/database'
import { broadcastKillSwitch } from './realtime'

/* ──────────────────── initiateKillSwitch ──────────────────── */

/**
 * Atomic global revoke. Flips every ACTIVE grant for the user to
 * `KILLED_GLOBALLY`, sets `terminatedAt = now`, sets
 * `terminationReason = 'kill_switch'`, and upserts a single
 * `UAPKillSwitchEvent` row recording the affected grant IDs and the
 * propagation timestamp.
 *
 * Wrapped in `prisma.$transaction` so the grant flip and the event row
 * commit together — there is no observable state where some grants are
 * killed and others are still ACTIVE.
 *
 * The `reason` argument is recorded only via the event row's existence
 * for v0.1.1 (the schema doesn't have a `reason` column). When the
 * full audit-chain wiring lands (Wave B), per-grant kill audit entries
 * carry the reason in `decisionReason`.
 */
export async function initiateKillSwitch(params: {
  userId: string
  reason?: string // 'user_initiated' | 'admin_intervention' | 'safety_routing' | other
}): Promise<{
  event: UAPKillSwitchEvent
  affectedGrantIds: string[]
  killedAt: Date
}> {
  const { userId } = params
  const killedAt = new Date()

  const { event, affectedGrantIds } = await prisma.$transaction(async (tx) => {
    // 1. Snapshot the active grants we're about to kill.
    const activeGrants = await tx.uAPGrant.findMany({
      where: { userId, status: 'ACTIVE' },
      select: { id: true },
    })
    const grantIds = activeGrants.map((g) => g.id)

    // 2. Flip ALL active grants in a single UPDATE. updateMany scopes
    //    on `status: 'ACTIVE'` so we cannot accidentally re-kill an
    //    already-terminal grant (REVOKED_BY_USER, EXPIRED) and clobber
    //    its termination reason.
    if (grantIds.length > 0) {
      await tx.uAPGrant.updateMany({
        where: { userId, status: 'ACTIVE' },
        data: {
          status: 'KILLED_GLOBALLY',
          terminatedAt: killedAt,
          terminationReason: 'kill_switch',
        },
      })
    }

    // 3. Upsert the kill event row. `userId @unique` enforces one
    //    active kill record per user — if the user has killed before
    //    and is killing again (e.g. after issuing fresh post-kill
    //    grants), we overwrite the previous propagation timestamp and
    //    grant-id set. v0.1.1 does not preserve historical kill
    //    events in this table; the per-grant audit chain is the
    //    history of record.
    const eventRow = await tx.uAPKillSwitchEvent.upsert({
      where: { userId },
      create: {
        userId,
        initiatedAt: killedAt,
        propagatedAt: killedAt, // ≤1s in v0.1.1 (atomic txn, no async fanout)
        affectedGrantIds: grantIds,
      },
      update: {
        initiatedAt: killedAt,
        propagatedAt: killedAt,
        affectedGrantIds: grantIds,
      },
    })

    return { event: eventRow, affectedGrantIds: grantIds }
  })

  // Fire-and-forget realtime broadcast so subscribers (mobile, browser
  // extension, watch, web) react in ~hundreds of ms instead of waiting
  // for their next poll — closes the cross-surface side of the §3 5s
  // SLA. Exception-safe internally: kill MUST NOT fail if broadcast
  // plumbing is unreachable.
  void broadcastKillSwitch(userId, {
    killedAt: killedAt.toISOString(),
    affectedGrantIds,
    reason: params.reason ?? 'user_initiated',
  })

  return { event, affectedGrantIds, killedAt }
}

/* ──────────────────── isUserKilledGlobally ──────────────────── */

/**
 * Returns whether a kill event is currently "in flight" for the user.
 *
 * v0.1.1 semantic: kill is atomic at the DB layer. There is no
 * in-flight window the coordinator needs to gate against here — the
 * decision tree (see coordinator.ts) already detects killed grants via
 * `grant.status === 'KILLED_GLOBALLY'`, which the atomic transaction
 * in `initiateKillSwitch` flips inside the same instant the kill is
 * recorded. After the kill, the user is free to issue fresh grants;
 * those grants are not blocked by the historical kill event.
 *
 * This function is exposed for API symmetry with the spec and for
 * future-proofing (v0.2 may model an explicit in-flight propagation
 * window for async surface fanout). In v0.1.1 it always returns
 * `false` — callers should not depend on it for security decisions.
 *
 * @returns always `false` in v0.1.1
 */
export async function isUserKilledGlobally(_userId: string): Promise<boolean> {
  return false
}

/* ──────────────────── loadKillSwitchEvent ──────────────────── */

/**
 * Look up the current kill event for a user, or `null` if no kill has
 * ever been initiated. Pure read.
 *
 * Note: this returns the SINGLE current row from `UAPKillSwitchEvent`
 * (the table has `userId @unique`). If the user killed previously and
 * then issued fresh grants, the event row reflects the most recent
 * kill — the prior killed grants are still discoverable via
 * `UAPGrant.status = 'KILLED_GLOBALLY'`.
 */
export async function loadKillSwitchEvent(userId: string): Promise<UAPKillSwitchEvent | null> {
  return prisma.uAPKillSwitchEvent.findUnique({
    where: { userId },
  })
}

/* ──────────────────── reopenAfterKill ──────────────────── */

/**
 * Manually re-open a user's UAP authority surface after a kill.
 *
 * v0.1.1: NOT IMPLEMENTED. The schema does not model a
 * `reopenedAt` / `reopenReason` / `reviewerUserId` column on
 * `UAPKillSwitchEvent`, and adding those is a v0.2 migration. The
 * reopen path is also rare enough that manual DB intervention is
 * acceptable for the small set of users hitting it before v0.2 ships.
 *
 * The function exists in the v0.1.1 API surface so the route handler
 * compiles and so downstream callers can detect the unsupported state
 * via a clean exception rather than silent no-op. Replace with the
 * real implementation in v0.2 when the schema columns land.
 *
 * @throws Error always — v0.1.1 has no reopen path; manual ops only.
 */
export async function reopenAfterKill(_params: {
  userId: string
  reason: string
  reviewerUserId: string
}): Promise<{ reopenedAt: Date; previousEventId: string }> {
  throw new Error(
    'reopenAfterKill: not yet implemented in v0.1.1 — manual DB intervention required for reopens (v0.2 follow-up)',
  )
}
