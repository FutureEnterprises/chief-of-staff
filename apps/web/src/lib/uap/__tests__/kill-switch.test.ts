/**
 * UAP kill-switch — global revoke tests.
 *
 * Covers UAP-0.1.md §3 (hard invariants — kill atomicity) + the
 * implementation contract in kill-switch.ts:
 *   - initiateKillSwitch flips every ACTIVE grant for the user to
 *     KILLED_GLOBALLY in a single transaction
 *   - returns the affected grant ids
 *   - isUserKilledGlobally exposes the v0.1.1 boolean state read
 *   - calling kill twice is idempotent (no duplicate event row;
 *     UAPKillSwitchEvent.userId is @unique, so upsert overwrites)
 *
 * Strategy:
 *   - vi.mock('@repo/database') exposes an in-memory grant table and
 *     kill-event table, plus a `$transaction` impl that hands the
 *     callback a `tx` proxy with the same methods. The kill code uses
 *     `prisma.$transaction(async tx => { ... })` so we mirror that
 *     shape directly.
 *   - We never persist anywhere — every assertion reads from the
 *     in-memory Maps after the function returns.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

/* ──────────────────── In-memory tables ──────────────────── */

type Grant = {
  id: string
  userId: string
  llmPartnerId: string
  status: 'ACTIVE' | 'REVOKED_BY_USER' | 'EXPIRED' | 'KILLED_GLOBALLY'
  terminatedAt: Date | null
  terminationReason: string | null
}

type KillEvent = {
  id: string
  userId: string
  initiatedAt: Date
  propagatedAt: Date | null
  affectedGrantIds: string[]
}

const grantStore: Map<string, Grant> = new Map()
const killStore: Map<string, KillEvent> = new Map() // keyed by userId (unique)

let nextGrantId = 1
let nextEventId = 1

vi.mock('@repo/database', () => {
  // The `tx` object handed to the $transaction callback is the same
  // shape as `prisma` — the kill-switch implementation uses tx.uAPGrant
  // and tx.uAPKillSwitchEvent, so we expose both on both objects.

  const makeProxy = () => ({
    uAPGrant: {
      findMany: async ({
        where,
        select: _select,
      }: {
        where: { userId: string; status?: string }
        select?: Record<string, boolean>
      }) => {
        return Array.from(grantStore.values())
          .filter(
            (g) =>
              g.userId === where.userId &&
              (where.status === undefined || g.status === where.status),
          )
          .map((g) => ({ ...g }))
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: { userId: string; status?: string }
        data: Partial<Grant>
      }) => {
        let count = 0
        for (const g of grantStore.values()) {
          if (
            g.userId === where.userId &&
            (where.status === undefined || g.status === where.status)
          ) {
            Object.assign(g, data)
            count++
          }
        }
        return { count }
      },
    },
    uAPKillSwitchEvent: {
      upsert: async ({
        where,
        create,
        update,
      }: {
        where: { userId: string }
        create: Omit<KillEvent, 'id'>
        update: Partial<KillEvent>
      }) => {
        const existing = killStore.get(where.userId)
        if (existing) {
          // Update path — overwrites in place, keeps the same row id.
          // This is the upsert-on-conflict semantic Prisma exposes:
          // there is ONLY one row per user (userId @unique), and a
          // re-kill mutates the existing event rather than appending.
          Object.assign(existing, update)
          return { ...existing }
        }
        const row: KillEvent = {
          id: `evt_${nextEventId++}`,
          ...create,
        }
        killStore.set(where.userId, row)
        return { ...row }
      },
      findUnique: async ({ where }: { where: { userId: string } }) => {
        const row = killStore.get(where.userId)
        return row ? { ...row } : null
      },
    },
  })

  const prismaProxy = {
    ...makeProxy(),
    $transaction: async <T,>(
      fn: (tx: ReturnType<typeof makeProxy>) => Promise<T>,
    ): Promise<T> => {
      // Simple-but-correct: hand the callback a proxy with the same
      // methods. Real Prisma wraps in BEGIN/COMMIT — our in-memory
      // store has no rollback to model, so the callback runs against
      // the live maps. The atomicity guarantee is preserved at the
      // test layer because every callback runs synchronously to
      // completion before we inspect state.
      return fn(makeProxy())
    },
  }

  return { prisma: prismaProxy }
})

import {
  initiateKillSwitch,
  isUserKilledGlobally,
  loadKillSwitchEvent,
} from '../kill-switch'

/* ──────────────────── Fixtures ──────────────────── */

const USER_KILL = 'user_kill_test'

function makeGrant(overrides: Partial<Grant> = {}): Grant {
  const id = `grant_${nextGrantId++}`
  return {
    id,
    userId: USER_KILL,
    llmPartnerId: 'partner_kill_test',
    status: 'ACTIVE',
    terminatedAt: null,
    terminationReason: null,
    ...overrides,
  }
}

function seedGrant(overrides: Partial<Grant> = {}): Grant {
  const g = makeGrant(overrides)
  grantStore.set(g.id, g)
  return g
}

beforeEach(() => {
  grantStore.clear()
  killStore.clear()
  nextGrantId = 1
  nextEventId = 1
})

/* ──────────────────── Atomic flip ──────────────────── */

describe('initiateKillSwitch — atomic flip of active grants', () => {
  it('flips every ACTIVE grant for the user to KILLED_GLOBALLY', async () => {
    seedGrant() // grant_1
    seedGrant() // grant_2
    seedGrant() // grant_3

    await initiateKillSwitch({ userId: USER_KILL })

    for (const g of grantStore.values()) {
      expect(g.status).toBe('KILLED_GLOBALLY')
      expect(g.terminationReason).toBe('kill_switch')
      expect(g.terminatedAt).toBeInstanceOf(Date)
    }
  })

  it('does NOT touch grants that are already terminal (REVOKED_BY_USER, EXPIRED)', async () => {
    // updateMany scopes on `status: 'ACTIVE'` so terminal grants keep
    // their original termination reason — kill cannot clobber a
    // user-initiated revoke.
    seedGrant({ status: 'ACTIVE' })
    seedGrant({
      status: 'REVOKED_BY_USER',
      terminationReason: 'user_revoked',
      terminatedAt: new Date('2026-01-01T00:00:00Z'),
    })
    seedGrant({
      status: 'EXPIRED',
      terminationReason: 'cron_expired',
      terminatedAt: new Date('2026-02-01T00:00:00Z'),
    })

    await initiateKillSwitch({ userId: USER_KILL })

    const grants = Array.from(grantStore.values())
    const killed = grants.filter((g) => g.status === 'KILLED_GLOBALLY')
    const revoked = grants.find((g) => g.status === 'REVOKED_BY_USER')
    const expired = grants.find((g) => g.status === 'EXPIRED')

    expect(killed.length).toBe(1)
    expect(revoked?.terminationReason).toBe('user_revoked')
    expect(expired?.terminationReason).toBe('cron_expired')
  })

  it('does not affect grants belonging to other users', async () => {
    const ours = seedGrant({ userId: USER_KILL })
    const theirs = seedGrant({ userId: 'user_other' })

    await initiateKillSwitch({ userId: USER_KILL })

    expect(grantStore.get(ours.id)?.status).toBe('KILLED_GLOBALLY')
    expect(grantStore.get(theirs.id)?.status).toBe('ACTIVE')
  })
})

/* ──────────────────── Returned ids ──────────────────── */

describe('initiateKillSwitch — returns the affected grant ids', () => {
  it('returns the ids of every ACTIVE grant that was flipped', async () => {
    const g1 = seedGrant()
    const g2 = seedGrant()
    const g3 = seedGrant()

    const result = await initiateKillSwitch({ userId: USER_KILL })

    expect(result.affectedGrantIds.sort()).toEqual([g1.id, g2.id, g3.id].sort())
  })

  it('returns an empty array when the user has no active grants', async () => {
    // No grants seeded — kill should still complete cleanly and return
    // [], because the kill-event row records "kill was initiated"
    // regardless of how many grants existed at the time.
    const result = await initiateKillSwitch({ userId: USER_KILL })
    expect(result.affectedGrantIds).toEqual([])
    expect(result.event).toBeDefined()
  })

  it('returns the killedAt timestamp', async () => {
    seedGrant()
    const result = await initiateKillSwitch({ userId: USER_KILL })
    expect(result.killedAt).toBeInstanceOf(Date)
  })
})

/* ──────────────────── Idempotency ──────────────────── */

describe('initiateKillSwitch — idempotency', () => {
  it('two consecutive kills do not create a duplicate event row', async () => {
    // UAPKillSwitchEvent.userId is @unique — the schema enforces "one
    // active kill per user." Real Prisma uses upsert; our mock honors
    // the same contract: a second kill overwrites the first row in
    // place, no new row is appended.
    seedGrant()
    seedGrant()

    await initiateKillSwitch({ userId: USER_KILL })
    expect(killStore.size).toBe(1)
    const firstId = killStore.get(USER_KILL)!.id

    // Issue a fresh active grant post-kill (simulates the user re-
    // granting after a kill), then re-kill. The kill table should
    // still have exactly one row — the same one, overwritten in
    // place.
    seedGrant() // grant_3 (active, post-kill)
    await initiateKillSwitch({ userId: USER_KILL })

    expect(killStore.size).toBe(1)
    expect(killStore.get(USER_KILL)!.id).toBe(firstId)
  })

  it('the second kill overwrites the affectedGrantIds list with the new active set', async () => {
    seedGrant() // grant_1
    seedGrant() // grant_2
    await initiateKillSwitch({ userId: USER_KILL })
    const first = killStore.get(USER_KILL)!
    expect(first.affectedGrantIds.length).toBe(2)

    // Now issue a third grant and re-kill — the kill-event should
    // reflect ONLY grant_3 (the previously-killed grants are now
    // terminal and not picked up by the ACTIVE filter).
    const g3 = seedGrant() // grant_3 (status ACTIVE)
    await initiateKillSwitch({ userId: USER_KILL })
    const second = killStore.get(USER_KILL)!
    expect(second.affectedGrantIds).toEqual([g3.id])
  })

  it('two kills on a user with no grants both succeed and both upsert the same row', async () => {
    await initiateKillSwitch({ userId: USER_KILL })
    await initiateKillSwitch({ userId: USER_KILL })
    expect(killStore.size).toBe(1)
  })
})

/* ──────────────────── isUserKilledGlobally ──────────────────── */

describe('isUserKilledGlobally — v0.1.1 contract', () => {
  it('returns false before any kill', async () => {
    // v0.1.1 semantic: this function ALWAYS returns false (the gate is
    // satisfied by grant.status === KILLED_GLOBALLY, not by a separate
    // in-flight check). Documented in kill-switch.ts.
    expect(await isUserKilledGlobally(USER_KILL)).toBe(false)
  })

  it('returns false after a kill (the v0.1.1 contract)', async () => {
    seedGrant()
    await initiateKillSwitch({ userId: USER_KILL })
    // The function exposes an API-symmetric "always false" in v0.1.1;
    // the kill is observable via grant.status flips and the
    // loadKillSwitchEvent row, not via this primitive.
    expect(await isUserKilledGlobally(USER_KILL)).toBe(false)
  })
})

/* ──────────────────── loadKillSwitchEvent ──────────────────── */

describe('loadKillSwitchEvent — read path', () => {
  it('returns null when the user has never been killed', async () => {
    const evt = await loadKillSwitchEvent(USER_KILL)
    expect(evt).toBeNull()
  })

  it('returns the kill event after a kill', async () => {
    seedGrant()
    await initiateKillSwitch({ userId: USER_KILL })
    const evt = await loadKillSwitchEvent(USER_KILL)
    expect(evt).toBeDefined()
    expect(evt?.userId).toBe(USER_KILL)
    expect(evt?.affectedGrantIds.length).toBe(1)
  })
})
