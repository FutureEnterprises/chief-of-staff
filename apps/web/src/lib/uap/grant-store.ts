/**
 * UAP grant-store — persistence layer for the User-Authority Protocol
 * (UAP v0.1.1) standing-authority engine. CRUD over UAPGrant + UAPRule
 * with explicit, audited status transitions.
 *
 * The reference engine treats grants as the unit of standing authority:
 * a user issues a UAPGrant to an LLM partner with a fixed scope list,
 * an expiry (≤90 days, caller-validated per UAP-0.1.md §4), and an
 * immutable consentArtifact capturing the UI surface + version that
 * elicited the grant. Grants flow through four statuses (ACTIVE,
 * REVOKED_BY_USER, EXPIRED, KILLED_GLOBALLY) and every transition out
 * of ACTIVE writes `terminatedAt` + `terminationReason` for audit.
 *
 * UAPRule is the per-grant (or user-level, when grantId=null) policy
 * row that the coordinator evaluates at PRECHECK/EXECUTE time:
 * spending caps, quiet hours, recipient allowlists, irreversibility
 * floor overrides, etc. User-level rules apply to every grant the user
 * holds — the coordinator merges both sets via loadRulesForGrant.
 *
 * Strict separation: this module does NOT decide whether an action is
 * allowed (that's the UAP coordinator) and does NOT write audit rows
 * (that's the audit module). It just owns the row lifecycle.
 *
 * See docs/protocol/UAP-0.1.md and apps/web/src/lib/uap/types.ts.
 */

import { prisma } from '@repo/database'
import type { UAPGrant, UAPRule, UAPScope, UAPRuleKind } from './types'

/* ──────────────────── createGrant ──────────────────── */

/**
 * Persist a new UAPGrant (status=ACTIVE) plus any inline rules.
 *
 * Caller is responsible for:
 *   - validating expiresAt is within 90 days of now (UAP-0.1.md §4)
 *   - validating every scope is in UAP_SCOPES (rejected at GRANT time
 *     with `unknown_scope` — caller does the scope check before us)
 *   - constructing the consentArtifact with the real UI surface +
 *     version + timestamp the user actually saw
 *
 * The consentArtifact is stored verbatim as Json so a Trust & Safety
 * reviewer can later replay exactly what UI elicited the grant.
 */
export async function createGrant(params: {
  llmPartnerId: string
  userId: string
  scopes: UAPScope[]
  expiresAt: Date
  rules?: Array<{ kind: UAPRuleKind; params: Record<string, unknown> }>
  consentArtifact: {
    version: string
    shownToUserAt: Date
    userResponse: 'explicit_grant'
    uiSurface: string
  }
}): Promise<UAPGrant> {
  const grant = await prisma.uAPGrant.create({
    data: {
      userId: params.userId,
      llmPartnerId: params.llmPartnerId,
      scopes: params.scopes as string[],
      expiresAt: params.expiresAt,
      consentArtifact: {
        version: params.consentArtifact.version,
        shownToUserAt: params.consentArtifact.shownToUserAt.toISOString(),
        userResponse: params.consentArtifact.userResponse,
        uiSurface: params.consentArtifact.uiSurface,
      },
      rules: params.rules && params.rules.length > 0
        ? {
            create: params.rules.map((r) => ({
              userId: params.userId,
              kind: r.kind,
              params: r.params as object,
            })),
          }
        : undefined,
    },
  })

  return grant
}

/* ──────────────────── loadGrant ──────────────────── */

/**
 * Fetch a single grant by id, with its grant-specific rules eagerly
 * loaded. Returns null when no row matches — callers translate that
 * into the `grant_not_found` denial reason themselves.
 *
 * Note: this does NOT load user-level rules (grantId=null). Use
 * loadRulesForGrant for the merged set the coordinator actually needs.
 */
export async function loadGrant(
  grantId: string,
): Promise<(UAPGrant & { rules: UAPRule[] }) | null> {
  const grant = await prisma.uAPGrant.findUnique({
    where: { id: grantId },
    include: { rules: true },
  })
  return grant
}

/* ──────────────────── revokeGrant ──────────────────── */

/**
 * Flip a grant to REVOKED_BY_USER. Idempotent on already-terminal
 * grants (returns the existing row unchanged) so duplicate revoke
 * requests from a flaky client don't error.
 *
 * Authorization: throws when the grant exists but belongs to a
 * different user. We deliberately surface the "Forbidden" string
 * verbatim — the API layer maps it to a 403; the audit-log layer
 * records the attempt. We do NOT throw for a missing grant — the
 * not-found case is callers' to handle via loadGrant first.
 */
export async function revokeGrant(params: {
  grantId: string
  userId: string
  reason?: string
}): Promise<UAPGrant> {
  const existing = await prisma.uAPGrant.findUnique({
    where: { id: params.grantId },
  })

  if (!existing) {
    throw new Error(`Grant not found: ${params.grantId}`)
  }

  if (existing.userId !== params.userId) {
    throw new Error('Forbidden — grant does not belong to user')
  }

  // Idempotent: already-terminal grants return as-is. ACTIVE is the
  // only status we transition out of; any other status means the row
  // has already been terminated by user revoke, expiry sweep, or the
  // global kill switch and re-revoking would clobber terminatedAt.
  if (existing.status !== 'ACTIVE') {
    return existing
  }

  const revoked = await prisma.uAPGrant.update({
    where: { id: params.grantId },
    data: {
      status: 'REVOKED_BY_USER',
      terminatedAt: new Date(),
      terminationReason: params.reason ?? 'user_revoked',
    },
  })

  return revoked
}

/* ──────────────────── listActiveGrantsForUser ──────────────────── */

/**
 * All grants this user currently holds that are usable RIGHT NOW —
 * status === ACTIVE AND expiresAt is still in the future. Used by the
 * /settings UI to render the standing-authority list and by the
 * coordinator when it needs to enumerate every grant a user has open
 * (e.g. global kill switch fans across all of them).
 *
 * Does NOT load rules — call loadRulesForGrant per grant for that.
 */
export async function listActiveGrantsForUser(
  userId: string,
): Promise<UAPGrant[]> {
  const grants = await prisma.uAPGrant.findMany({
    where: {
      userId,
      status: 'ACTIVE',
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  })
  return grants
}

/* ──────────────────── listActiveGrantsForPartner ──────────────────── */

/**
 * Every ACTIVE grant an LLM partner currently holds across all users.
 * Used for partner-side dashboards and for the partner-deauthorization
 * flow: when a partner is suspended, we need to enumerate the blast
 * radius before flipping every grant to KILLED_GLOBALLY.
 *
 * NOTE: deliberately does not filter on expiresAt — partner-side
 * reporting wants to see soon-to-expire grants too. The coordinator
 * still checks expiry independently at decision time.
 */
export async function listActiveGrantsForPartner(
  llmPartnerId: string,
): Promise<UAPGrant[]> {
  const grants = await prisma.uAPGrant.findMany({
    where: {
      llmPartnerId,
      status: 'ACTIVE',
    },
    orderBy: { createdAt: 'desc' },
  })
  return grants
}

/* ──────────────────── expireGrants ──────────────────── */

/**
 * Sweep helper: flip every ACTIVE grant whose expiresAt has passed to
 * status=EXPIRED, writing terminatedAt + a canonical termination
 * reason. Returns the number of rows flipped.
 *
 * One updateMany so the cron stays O(1) round-trips no matter how
 * many grants expire in the same tick. Caller (the expiry cron) owns
 * the scheduling cadence — typically every 5 minutes.
 */
export async function expireGrants(now: Date): Promise<number> {
  const result = await prisma.uAPGrant.updateMany({
    where: {
      status: 'ACTIVE',
      expiresAt: { lte: now },
    },
    data: {
      status: 'EXPIRED',
      terminatedAt: now,
      terminationReason: 'expired',
    },
  })
  return result.count
}

/* ──────────────────── addRule ──────────────────── */

/**
 * Attach a new UAPRule. When grantId is null the rule is user-level
 * and applies to every grant the user holds (current + future) — used
 * for global preferences like "never spend more than $50 without
 * confirmation" or "quiet hours 10pm–7am".
 *
 * The rule's `params` shape is kind-specific and validated by the
 * coordinator at evaluation time, not here. We deliberately keep this
 * module dumb about rule semantics so adding a new UAPRuleKind doesn't
 * require touching the persistence layer.
 */
export async function addRule(params: {
  userId: string
  grantId: string | null
  kind: UAPRuleKind
  params: Record<string, unknown>
}): Promise<UAPRule> {
  const rule = await prisma.uAPRule.create({
    data: {
      userId: params.userId,
      grantId: params.grantId,
      kind: params.kind,
      params: params.params as object,
    },
  })
  return rule
}

/* ──────────────────── loadRulesForGrant ──────────────────── */

/**
 * Merged rule set the coordinator evaluates against a single grant:
 * BOTH the grant-specific rules (grantId === <this grant>) AND the
 * user-level rules (grantId === null) belonging to the same user.
 *
 * The userId argument is load-bearing — it scopes the user-level
 * pull. We don't trust the grant's userId alone because the caller
 * may be checking a grant they don't own (e.g. partner-side reporting);
 * forcing the caller to pass the userId they THINK owns the grant
 * keeps the merge correct under those access patterns.
 *
 * Returns rules in creation order so the coordinator can apply them
 * deterministically when two rules of the same kind compete.
 */
export async function loadRulesForGrant(
  grantId: string,
  userId: string,
): Promise<UAPRule[]> {
  const rules = await prisma.uAPRule.findMany({
    where: {
      userId,
      OR: [{ grantId }, { grantId: null }],
    },
    orderBy: { createdAt: 'asc' },
  })
  return rules
}
