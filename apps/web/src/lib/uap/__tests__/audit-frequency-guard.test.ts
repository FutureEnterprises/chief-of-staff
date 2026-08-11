/**
 * DECISION 2 (race) — the count-then-write pair is serialized.
 *
 * The coordinator counts the trailing window BEFORE the audit row
 * exists and outside any transaction. Two concurrent EXECUTEs at the
 * cap boundary both read `count = max - 1`, both pass, and both append:
 * the cap is exceeded by exactly the concurrency. The pre-existing
 * per-user advisory lock does not cover this — it serializes the two
 * APPENDS (keeping the hash chain valid) but both COUNTS already
 * happened before either lock was taken.
 *
 * writeAuditEntry now re-counts INSIDE that lock when the caller
 * supplies `frequencyGuards`, and throws UAPFrequencyCapExceededError
 * instead of appending.
 *
 * Failing-first: `writeAuditEntry` took no options argument at all
 * pre-change, so "two parallel writes at the boundary both land" was
 * the observed behavior. The mock below models Postgres advisory-lock
 * semantics (one holder per key, released at transaction end), so the
 * race is real inside the test, not simulated by ordering.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.hoisted(() => {
  process.env.UAP_AUDIT_SIGNING_KEY_PRIVATE =
    'MC4CAQAwBQYDK2VwBCIEIJB8TMa9k5P/XEZN6vgivB/4Ogw1bX3FQLWp0qWnCK3j'
  process.env.UAP_AUDIT_SIGNING_KEY_PUBLIC =
    'MCowBQYDK2VwAyEA3McU9iTU6uFWl68n3sKRLLRqrKQ0SG6g0QAN4WKSeYo='
})

type StoredRow = {
  id: string
  grantId: string
  userId: string
  llmPartnerId: string
  operation: string
  actionKind: string | null
  decision: string
  decisionReason: string | null
  postTermination: boolean
  signature: string
  prevHash: string | null
  createdAt: Date
  [k: string]: unknown
}

const store: Map<string, StoredRow> = new Map()
let seq = 0

const { PRISMA_JSON_NULL } = vi.hoisted(() => ({
  PRISMA_JSON_NULL: Symbol('Prisma.JsonNull'),
}))

vi.mock('@repo/database', () => {
  const lockTails = new Map<string, Promise<void>>()

  const model = {
    findFirst: async ({ where }: { where: { userId: string } }) => {
      const rows = Array.from(store.values())
        .filter((r) => r.userId === where.userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      return rows[0] ?? null
    },
    findUnique: async ({ where }: { where: { id: string } }) =>
      store.get(where.id) ?? null,
    findMany: async () => Array.from(store.values()),
    count: async ({
      where,
    }: {
      where: {
        userId: string
        grantId: string
        actionKind: string
        operation: string
        decision: string
        createdAt: { gte: Date }
      }
    }) =>
      Array.from(store.values()).filter(
        (r) =>
          r.userId === where.userId &&
          r.grantId === where.grantId &&
          r.actionKind === where.actionKind &&
          r.operation === where.operation &&
          r.decision === where.decision &&
          r.createdAt.getTime() >= where.createdAt.gte.getTime(),
      ).length,
    create: async ({ data }: { data: Record<string, unknown> }) => {
      const id = (data.id as string | undefined) ?? `row_${++seq}`
      if (store.has(id)) {
        throw Object.assign(
          new Error('Unique constraint failed on the fields: (`id`)'),
          { code: 'P2002' },
        )
      }
      const row = {
        ...data,
        provenancePayload:
          (data.provenancePayload as unknown) === PRISMA_JSON_NULL
            ? null
            : data.provenancePayload,
        id,
      } as unknown as StoredRow
      store.set(id, row)
      return row
    },
  }

  const makeTx = () => {
    const held: Array<() => void> = []
    const tx = {
      $queryRaw: async (
        _s: TemplateStringsArray,
        ...values: unknown[]
      ): Promise<unknown[]> => {
        const key = String(values[0] ?? '')
        const prevTail = lockTails.get(key) ?? Promise.resolve()
        let release!: () => void
        const mine = new Promise<void>((r) => {
          release = r
        })
        lockTails.set(
          key,
          prevTail.then(() => mine),
        )
        await prevTail
        held.push(release)
        return []
      },
      uAPAuditEntry: model,
    }
    return { tx, releaseAll: () => held.forEach((r) => r()) }
  }

  return {
    Prisma: { JsonNull: PRISMA_JSON_NULL },
    prisma: {
      uAPAuditEntry: model,
      $transaction: async <T,>(fn: (tx: unknown) => Promise<T>): Promise<T> => {
        const { tx, releaseAll } = makeTx()
        try {
          return await fn(tx)
        } finally {
          releaseAll()
        }
      },
    },
  }
})

import { writeAuditEntry, UAPFrequencyCapExceededError } from '../audit'
import type { UAPAuditInput } from '../types'
import type { FrequencyGuard } from '../rule-params'

const USER = 'user_guard'
const GRANT = 'grant_guard'
const PARTNER = 'partner_guard'
const KIND = 'food_intervention'

function input(overrides: Partial<UAPAuditInput> = {}): UAPAuditInput {
  return {
    grantId: GRANT,
    userId: USER,
    llmPartnerId: PARTNER,
    operation: 'execute',
    actionKind: KIND,
    decision: 'allowed',
    postTermination: false,
    ...overrides,
  }
}

const guard: FrequencyGuard = {
  grantId: GRANT,
  actionKind: KIND,
  max: 2,
  windowSeconds: 3600,
}

beforeEach(() => {
  store.clear()
  seq = 0
})

describe('writeAuditEntry — atomic frequency guard', () => {
  it('appends normally while under the cap', async () => {
    await writeAuditEntry(input(), { frequencyGuards: [guard] })
    await writeAuditEntry(input(), { frequencyGuards: [guard] })
    expect(store.size).toBe(2)
  })

  it('refuses the append at the cap instead of writing', async () => {
    await writeAuditEntry(input(), { frequencyGuards: [guard] })
    await writeAuditEntry(input(), { frequencyGuards: [guard] })
    await expect(
      writeAuditEntry(input(), { frequencyGuards: [guard] }),
    ).rejects.toBeInstanceOf(UAPFrequencyCapExceededError)
    // The refused write left NOTHING behind — the transaction rolled back.
    expect(store.size).toBe(2)
  })

  it('two CONCURRENT executes at the boundary cannot both land (pre-change: writeAuditEntry had no guard, so both appended and the cap was exceeded by the concurrency)', async () => {
    // Seed one allowed execute; cap is 2, so exactly one of the two
    // racers may win.
    await writeAuditEntry(input())

    const results = await Promise.allSettled([
      writeAuditEntry(input(), { frequencyGuards: [guard] }),
      writeAuditEntry(input(), { frequencyGuards: [guard] }),
    ])

    const fulfilled = results.filter((r) => r.status === 'fulfilled')
    const rejected = results.filter((r) => r.status === 'rejected')
    expect(fulfilled).toHaveLength(1)
    expect(rejected).toHaveLength(1)
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(
      UAPFrequencyCapExceededError,
    )
    // 1 seeded + 1 winner. Never 3.
    expect(store.size).toBe(2)
  })

  it('DENIED rows do not consume the cap and are always recordable', async () => {
    await writeAuditEntry(input())
    await writeAuditEntry(input())
    // A denial written with no guards lands even though the cap is met.
    await writeAuditEntry(
      input({ decision: 'denied', decisionReason: 'frequency_cap_exceeded' }),
    )
    expect(store.size).toBe(3)
    // ... and it did not count toward the window: a guard check still
    // sees exactly the two ALLOWED rows.
    await expect(
      writeAuditEntry(input(), { frequencyGuards: [guard] }),
    ).rejects.toMatchObject({ count: 2 })
  })

  it('a different action kind has its own budget', async () => {
    await writeAuditEntry(input())
    await writeAuditEntry(input())
    const other = await writeAuditEntry(input({ actionKind: 'focus_callout' }), {
      frequencyGuards: [{ ...guard, actionKind: 'focus_callout' }],
    })
    expect(other.id).toBeDefined()
  })

  it('rows older than the window do not count', async () => {
    await writeAuditEntry(input())
    await writeAuditEntry(input())
    // Age both rows past the window.
    for (const row of store.values()) {
      row.createdAt = new Date(Date.now() - 7200_000)
    }
    const fresh = await writeAuditEntry(input(), { frequencyGuards: [guard] })
    expect(fresh.id).toBeDefined()
  })
})
