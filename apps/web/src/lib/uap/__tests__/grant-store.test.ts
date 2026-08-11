/**
 * UAP grant-store — decision-time rule loading.
 *
 * The load-bearing contract: loadGrantWithAllRules returns the grant
 * PLUS the merged rule set — grant-scoped rules AND user-level rules
 * (grantId=null). This is what the PRECHECK/EXECUTE routes wire into
 * the coordinator. The pre-fix routes wired plain loadGrant (Prisma
 * include: { rules: true }), which only pulls grant-scoped rows — so a
 * user-level RULE_DECLARE ("never spend more than $50", grant_id=null)
 * was accepted, persisted, and NEVER enforced. This suite fails
 * against that wiring.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

type GrantRow = {
  id: string
  userId: string
  llmPartnerId: string
  scopes: string[]
  expiresAt: Date
  status: string
  consentArtifact: unknown
  createdAt: Date
  terminatedAt: Date | null
  terminationReason: string | null
}

type RuleRow = {
  id: string
  grantId: string | null
  userId: string
  kind: string
  params: Record<string, unknown>
  createdAt: Date
}

const grantStore: Map<string, GrantRow> = new Map()
const ruleStore: Map<string, RuleRow> = new Map()

vi.mock('@repo/database', () => ({
  prisma: {
    uAPGrant: {
      findUnique: async ({
        where,
        include,
      }: {
        where: { id: string }
        include?: { rules?: boolean }
      }) => {
        const grant = grantStore.get(where.id)
        if (!grant) return null
        if (include?.rules) {
          // Prisma's include pulls ONLY rows whose FK matches this
          // grant — user-level rules (grantId null) are not related
          // rows and are never included. Modeling that faithfully is
          // the point of this suite.
          const rules = Array.from(ruleStore.values()).filter(
            (r) => r.grantId === where.id,
          )
          return { ...grant, rules }
        }
        return { ...grant }
      },
    },
    uAPRule: {
      findMany: async ({
        where,
        orderBy: _orderBy,
      }: {
        where: {
          userId: string
          OR: Array<{ grantId: string | null }>
        }
        orderBy: { createdAt: 'asc' }
      }) => {
        const wanted = where.OR.map((c) => c.grantId)
        return Array.from(ruleStore.values())
          .filter(
            (r) => r.userId === where.userId && wanted.includes(r.grantId),
          )
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      },
    },
  },
}))

import { loadGrant, loadGrantWithAllRules } from '../grant-store'

const USER = 'user_gs_test'
const GRANT = 'grant_gs_test'

beforeEach(() => {
  grantStore.clear()
  ruleStore.clear()
  grantStore.set(GRANT, {
    id: GRANT,
    userId: USER,
    llmPartnerId: 'partner_gs',
    scopes: ['proactive_purchase'],
    expiresAt: new Date(Date.now() + 86_400_000),
    status: 'ACTIVE',
    consentArtifact: {},
    createdAt: new Date(),
    terminatedAt: null,
    terminationReason: null,
  })
  ruleStore.set('rule_grant_scoped', {
    id: 'rule_grant_scoped',
    grantId: GRANT,
    userId: USER,
    kind: 'quiet_hours',
    params: {},
    createdAt: new Date(Date.now() - 2000),
  })
  ruleStore.set('rule_user_level', {
    id: 'rule_user_level',
    grantId: null,
    userId: USER,
    kind: 'spending_cap',
    params: { max_per_action_usd: 50 },
    createdAt: new Date(Date.now() - 1000),
  })
  // Another user's user-level rule must never leak into the merge.
  ruleStore.set('rule_other_user', {
    id: 'rule_other_user',
    grantId: null,
    userId: 'user_other',
    kind: 'recipient_denylist',
    params: { denied_recipients: ['x'] },
    createdAt: new Date(),
  })
})

describe('loadGrantWithAllRules', () => {
  it('returns grant-scoped AND user-level rules (FAILS when the coordinator is wired to plain loadGrant — user-level pre-declines were silently unenforced)', async () => {
    const merged = await loadGrantWithAllRules(GRANT)
    expect(merged).not.toBeNull()
    const kinds = merged!.rules.map((r) => r.kind).sort()
    expect(kinds).toEqual(['quiet_hours', 'spending_cap'])
  })

  it('does not include other users\' user-level rules', async () => {
    const merged = await loadGrantWithAllRules(GRANT)
    expect(merged!.rules.find((r) => r.kind === 'recipient_denylist')).toBeUndefined()
  })

  it('returns null for an unknown grant id', async () => {
    expect(await loadGrantWithAllRules('nope')).toBeNull()
  })

  it('documents the daylight: plain loadGrant drops the user-level rule', async () => {
    // Not a bug in loadGrant itself (its contract is grant-scoped
    // rules only) — this assertion pins WHY the routes must not use it
    // as the coordinator dep.
    const bare = await loadGrant(GRANT)
    expect(bare!.rules.map((r) => r.kind)).toEqual(['quiet_hours'])
  })
})
