/**
 * DECISION 4 — binding the decision to the effect.
 *
 * Pre-change none of this existed: /execute recorded a decision and
 * returned, and an ALLOW was advisory. There was no action hash, no
 * receipt, and no consumption record, so a partner could ignore a
 * denial or replay one approval indefinitely and nothing in the system
 * could tell.
 *
 * Every test in this file fails to even compile/resolve against the
 * pre-change tree (the module is new). What they pin is the behavior
 * that makes the receipt worth having:
 *   • hash covers exactly (user, grant, kind, params, decision id)
 *   • a receipt for one effect cannot be spent on another
 *   • expired / forged / foreign-partner receipts are refused
 *   • redemption is once-only, and a refused presentation does NOT
 *     burn the receipt
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.hoisted(() => {
  process.env.UAP_EXECUTION_RECEIPT_KEY = 'test-receipt-key-not-a-real-secret'
  process.env.UAP_AUDIT_SIGNING_KEY_PRIVATE =
    'MC4CAQAwBQYDK2VwBCIEIJB8TMa9k5P/XEZN6vgivB/4Ogw1bX3FQLWp0qWnCK3j'
  process.env.UAP_AUDIT_SIGNING_KEY_PUBLIC =
    'MCowBQYDK2VwAyEA3McU9iTU6uFWl68n3sKRLLRqrKQ0SG6g0QAN4WKSeYo='
})

/** Consumption rows land in the audit table; model just enough of it. */
const store = new Map<string, Record<string, unknown>>()
let seq = 0

const { PRISMA_JSON_NULL } = vi.hoisted(() => ({
  PRISMA_JSON_NULL: Symbol('Prisma.JsonNull'),
}))

vi.mock('@repo/database', () => {
  const model = {
    findFirst: async ({ where }: { where: { userId: string } }) => {
      const rows = Array.from(store.values()).filter(
        (r) => r.userId === where.userId,
      )
      return rows[rows.length - 1] ?? null
    },
    findUnique: async ({ where }: { where: { id: string } }) =>
      store.get(where.id) ?? null,
    findMany: async () => Array.from(store.values()),
    count: async () => 0,
    create: async ({ data }: { data: Record<string, unknown> }) => {
      const id = (data.id as string | undefined) ?? `row_${++seq}`
      if (store.has(id)) {
        throw Object.assign(new Error('Unique constraint failed'), {
          code: 'P2002',
        })
      }
      const row = { ...data, id }
      store.set(id, row)
      return row
    },
  }
  return {
    Prisma: { JsonNull: PRISMA_JSON_NULL },
    prisma: {
      uAPAuditEntry: model,
      $transaction: async <T,>(fn: (tx: unknown) => Promise<T>): Promise<T> =>
        fn({ $queryRaw: async () => [], uAPAuditEntry: model }),
    },
  }
})

import {
  computeActionHash,
  consumeExecutionReceipt,
  consumptionRowId,
  decodeExecutionReceipt,
  issueExecutionReceipt,
  verifyExecutionReceipt,
  EXECUTION_RECEIPT_TTL_SECONDS,
} from '../execution-receipt'

const BASE = {
  auditId: 'aud_abc123abc123abc123abc123',
  userId: 'user_rcpt',
  grantId: 'grant_rcpt',
  partnerId: 'partner_rcpt',
  actionKind: 'food_intervention',
  actionParams: { actuator: 'haptic', deviceId: 'dev1', params: { pattern: 'x' } },
}

beforeEach(() => {
  store.clear()
  seq = 0
})

/* ──────────────────── The hash ──────────────────── */

describe('computeActionHash', () => {
  it('is stable across key ordering — the same action hashes the same', () => {
    const a = computeActionHash({
      userId: 'u',
      grantId: 'g',
      actionKind: 'k',
      actionParams: { b: 2, a: 1, nested: { z: 1, y: 2 } },
      decisionId: 'd',
    })
    const b = computeActionHash({
      decisionId: 'd',
      actionParams: { nested: { y: 2, z: 1 }, a: 1, b: 2 },
      actionKind: 'k',
      grantId: 'g',
      userId: 'u',
    })
    expect(a).toBe(b)
  })

  it('changes when ANY of the five inputs changes', () => {
    const base = {
      userId: 'u',
      grantId: 'g',
      actionKind: 'k',
      actionParams: { amount: 1 },
      decisionId: 'd',
    }
    const h = computeActionHash(base)
    expect(computeActionHash({ ...base, userId: 'u2' })).not.toBe(h)
    expect(computeActionHash({ ...base, grantId: 'g2' })).not.toBe(h)
    expect(computeActionHash({ ...base, actionKind: 'k2' })).not.toBe(h)
    expect(computeActionHash({ ...base, actionParams: { amount: 2 } })).not.toBe(h)
    expect(computeActionHash({ ...base, decisionId: 'd2' })).not.toBe(h)
  })

  it('binds to the DECISION, so two authorizations of the same action differ', () => {
    const a = issueExecutionReceipt({ ...BASE, auditId: 'aud_1' })
    const b = issueExecutionReceipt({ ...BASE, auditId: 'aud_2' })
    expect(a.actionHash).not.toBe(b.actionHash)
  })
})

/* ──────────────────── Stateless verification ──────────────────── */

describe('verifyExecutionReceipt', () => {
  it('accepts the exact effect it authorized', () => {
    const r = issueExecutionReceipt(BASE)
    const v = verifyExecutionReceipt({
      receiptId: r.receiptId,
      actionHash: r.actionHash,
      partnerId: BASE.partnerId,
    })
    expect(v.ok).toBe(true)
  })

  it('refuses a DIFFERENT effect with action_hash_mismatch — the substitution attack', () => {
    const r = issueExecutionReceipt(BASE)
    // Same decision, swapped effect: a receipt obtained for a haptic
    // nudge presented against a different actuator.
    const swapped = computeActionHash({
      userId: BASE.userId,
      grantId: BASE.grantId,
      actionKind: BASE.actionKind,
      actionParams: { ...BASE.actionParams, actuator: 'open_url' },
      decisionId: BASE.auditId,
    })
    const v = verifyExecutionReceipt({
      receiptId: r.receiptId,
      actionHash: swapped,
    })
    expect(v.ok).toBe(false)
    expect(v.ok === false && v.reason).toBe('action_hash_mismatch')
  })

  it('refuses after expiry', () => {
    const now = new Date('2026-05-24T15:00:00Z')
    const r = issueExecutionReceipt({ ...BASE, now, ttlSeconds: 60 })
    const v = verifyExecutionReceipt({
      receiptId: r.receiptId,
      actionHash: r.actionHash,
      now: new Date(now.getTime() + 61_000),
    })
    expect(v.ok === false && v.reason).toBe('receipt_expired')
  })

  it('refuses a receipt whose claims were tampered with', () => {
    const r = issueExecutionReceipt(BASE)
    const [claims, mac] = r.receiptId.slice('rcpt_'.length).split('.')
    const forgedClaims = Buffer.from(
      Buffer.from(claims!, 'base64url')
        .toString('utf8')
        .replace(BASE.userId, 'user_victim'),
      'utf8',
    ).toString('base64url')
    const v = verifyExecutionReceipt({
      receiptId: `rcpt_${forgedClaims}.${mac}`,
      actionHash: r.actionHash,
    })
    expect(v.ok === false && v.reason).toBe('receipt_signature_invalid')
  })

  it('refuses redemption by a different partner', () => {
    const r = issueExecutionReceipt(BASE)
    const v = verifyExecutionReceipt({
      receiptId: r.receiptId,
      actionHash: r.actionHash,
      partnerId: 'partner_someone_else',
    })
    expect(v.ok === false && v.reason).toBe('receipt_partner_mismatch')
  })

  it('refuses garbage', () => {
    for (const junk of ['', 'nope', 'rcpt_', 'rcpt_abc', 'rcpt_.mac']) {
      const v = verifyExecutionReceipt({ receiptId: junk, actionHash: 'x' })
      expect(v.ok).toBe(false)
    }
  })

  it('carries the authorized action kind inside the MAC so a redeemer never has to trust the caller for it', () => {
    const r = issueExecutionReceipt(BASE)
    const decoded = decodeExecutionReceipt(r.receiptId)
    expect(decoded.ok).toBe(true)
    if (!decoded.ok) throw new Error('unreachable')
    expect(decoded.claims.ak).toBe(BASE.actionKind)
    expect(decoded.claims.gid).toBe(BASE.grantId)
    expect(decoded.claims.aud).toBe(BASE.auditId)
  })

  it('defaults to a bounded TTL', () => {
    const now = new Date('2026-05-24T15:00:00Z')
    const r = issueExecutionReceipt({ ...BASE, now })
    expect(r.expiresAt.getTime() - now.getTime()).toBe(
      EXECUTION_RECEIPT_TTL_SECONDS * 1000,
    )
  })
})

/* ──────────────────── Consumption ──────────────────── */

describe('consumeExecutionReceipt', () => {
  it('redeems once and writes a consumption record into the audit chain', async () => {
    const r = issueExecutionReceipt(BASE)
    const first = await consumeExecutionReceipt({
      receiptId: r.receiptId,
      actionHash: r.actionHash,
      partnerId: BASE.partnerId,
    })
    expect(first.ok).toBe(true)
    if (!first.ok) throw new Error('unreachable')
    expect(first.consumptionAuditId).toBe(consumptionRowId(r.receiptId))

    const row = store.get(first.consumptionAuditId) as Record<string, unknown>
    expect(row.operation).toBe('consume')
    expect(row.grantId).toBe(BASE.grantId)
    expect(row.userId).toBe(BASE.userId)
    expect(String(row.decisionReason)).toContain(BASE.auditId)
  })

  it('REFUSES the second redemption — single use', async () => {
    const r = issueExecutionReceipt(BASE)
    await consumeExecutionReceipt({
      receiptId: r.receiptId,
      actionHash: r.actionHash,
    })
    const second = await consumeExecutionReceipt({
      receiptId: r.receiptId,
      actionHash: r.actionHash,
    })
    expect(second.ok).toBe(false)
    expect(second.ok === false && second.reason).toBe('receipt_already_consumed')
    // Exactly one consumption record, not two.
    expect(store.size).toBe(1)
  })

  it('two CONCURRENT redemptions of one receipt: exactly one wins', async () => {
    const r = issueExecutionReceipt(BASE)
    const [a, b] = await Promise.all([
      consumeExecutionReceipt({ receiptId: r.receiptId, actionHash: r.actionHash }),
      consumeExecutionReceipt({ receiptId: r.receiptId, actionHash: r.actionHash }),
    ])
    expect([a.ok, b.ok].filter(Boolean)).toHaveLength(1)
    expect(store.size).toBe(1)
  })

  it('a MISMATCHED presentation does not burn the receipt', async () => {
    const r = issueExecutionReceipt(BASE)
    const wrong = await consumeExecutionReceipt({
      receiptId: r.receiptId,
      actionHash: 'f'.repeat(64),
    })
    expect(wrong.ok === false && wrong.reason).toBe('action_hash_mismatch')
    expect(store.size).toBe(0)

    // The legitimate effect still redeems.
    const right = await consumeExecutionReceipt({
      receiptId: r.receiptId,
      actionHash: r.actionHash,
    })
    expect(right.ok).toBe(true)
  })

  it('an expired receipt is refused without writing anything', async () => {
    const now = new Date('2026-05-24T15:00:00Z')
    const r = issueExecutionReceipt({ ...BASE, now, ttlSeconds: 30 })
    const res = await consumeExecutionReceipt({
      receiptId: r.receiptId,
      actionHash: r.actionHash,
      now: new Date(now.getTime() + 31_000),
    })
    expect(res.ok === false && res.reason).toBe('receipt_expired')
    expect(store.size).toBe(0)
  })

  it('the consumption row id does not leak the receipt', () => {
    const r = issueExecutionReceipt(BASE)
    const id = consumptionRowId(r.receiptId)
    expect(id.startsWith('rcp_')).toBe(true)
    expect(r.receiptId).not.toContain(id.slice(4))
    // And it stays outside the `aud_<24 hex>` shape the public
    // provenance verifier will look up.
    expect(/^aud_[a-f0-9]{24}$/.test(id)).toBe(false)
  })
})
