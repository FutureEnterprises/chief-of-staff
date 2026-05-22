/**
 * ScopeGrant CRUD + assertion helpers.
 *
 * Per-user per-LLM-partner per-scope authorization. End users grant
 * scopes via the /api/v1/scope/grant endpoint and revoke via
 * /api/v1/scope/revoke; the EAP/PAP coordinator calls
 * assertScopeGrant() before allowing an LLM partner to act on the
 * user's behalf.
 *
 * Grants are soft-deleted (revokedAt + active=false) so the audit
 * trail outlives any single revocation; re-grants flip active back
 * to true on the existing row rather than inserting duplicates.
 */
import { prisma } from '@repo/database'
import type { ScopeGrant } from '@repo/database'

/**
 * Thrown by assertScopeGrant when the partner has no active grant
 * for the requested (user, scope) tuple. The coordinator catches
 * this and translates it into the appropriate 403 + audit entry.
 */
export class ScopeNotGrantedError extends Error {
  readonly userId: string
  readonly llmPartnerId: string
  readonly scope: string

  constructor(args: { userId: string; llmPartnerId: string; scope: string }) {
    super(
      `Scope '${args.scope}' is not granted by user ${args.userId} to partner ${args.llmPartnerId}`,
    )
    this.name = 'ScopeNotGrantedError'
    this.userId = args.userId
    this.llmPartnerId = args.llmPartnerId
    this.scope = args.scope
  }
}

export type GrantScopeArgs = {
  userId: string
  llmPartnerId: string
  scope: string
  consentScreenVersion: string
  bundleKey?: string | null
  expiresAt?: Date | null
  ipAddress?: string | null
  userAgent?: string | null
}

export type RevokeScopeArgs = {
  userId: string
  llmPartnerId: string
  scope: string
  ipAddress?: string | null
  userAgent?: string | null
}

/**
 * Assert that an active, non-expired ScopeGrant exists for
 * (userId, llmPartnerId, scope). Throws ScopeNotGrantedError if not.
 * Use this from the coordinator before every PAP/EAP action.
 */
export async function assertScopeGrant(args: {
  userId: string
  llmPartnerId: string
  scope: string
}): Promise<void> {
  const grant = await prisma.scopeGrant.findUnique({
    where: {
      userId_llmPartnerId_scope: {
        userId: args.userId,
        llmPartnerId: args.llmPartnerId,
        scope: args.scope,
      },
    },
  })

  if (!grant || !grant.active || grant.revokedAt !== null) {
    throw new ScopeNotGrantedError(args)
  }

  if (grant.expiresAt !== null && grant.expiresAt.getTime() <= Date.now()) {
    throw new ScopeNotGrantedError(args)
  }
}

/** List all active grants for a user, including the partner relation. */
export async function listActiveGrants(userId: string): Promise<
  Array<ScopeGrant & {
    llmPartner: { id: string; slug: string; name: string; publisher: string }
  }>
> {
  return prisma.scopeGrant.findMany({
    where: { userId, active: true, revokedAt: null },
    include: {
      llmPartner: {
        select: { id: true, slug: true, name: true, publisher: true },
      },
    },
    orderBy: [{ llmPartnerId: 'asc' }, { scope: 'asc' }],
  })
}

/**
 * Idempotent scope grant. If a row already exists for the
 * (userId, llmPartnerId, scope) tuple, it is flipped active=true,
 * grantedAt is refreshed (the consent was just reaffirmed), and
 * revokedAt is cleared. A fresh EAPAuditEntry is written on every
 * call so the audit trail captures re-grants too.
 */
export async function grantScope(args: GrantScopeArgs): Promise<ScopeGrant> {
  const baseData = {
    consentScreenVersion: args.consentScreenVersion,
    bundleKey: args.bundleKey ?? null,
    expiresAt: args.expiresAt ?? null,
    ipAddress: args.ipAddress ?? null,
    userAgent: args.userAgent ?? null,
    active: true,
    revokedAt: null,
  }

  const grant = await prisma.scopeGrant.upsert({
    where: {
      userId_llmPartnerId_scope: {
        userId: args.userId,
        llmPartnerId: args.llmPartnerId,
        scope: args.scope,
      },
    },
    create: {
      userId: args.userId,
      llmPartnerId: args.llmPartnerId,
      scope: args.scope,
      ...baseData,
    },
    update: {
      ...baseData,
      grantedAt: new Date(),
    },
  })

  await writeAuditEntry({
    userId: args.userId,
    llmPartnerId: args.llmPartnerId,
    eventKind: 'scope_granted',
    referenceId: grant.id,
    payloadJson: {
      scope: args.scope,
      bundleKey: args.bundleKey ?? null,
      consentScreenVersion: args.consentScreenVersion,
      userAgent: args.userAgent ?? null,
      expiresAt: args.expiresAt ? args.expiresAt.toISOString() : null,
    },
    ipAddress: args.ipAddress ?? null,
  })

  return grant
}

/**
 * Soft-revoke a scope. Sets revokedAt + active=false on the existing
 * row (no-op if the row doesn't exist — revoking what isn't granted
 * is intentionally a no-op so the route is idempotent). Writes an
 * audit entry on every successful revoke.
 */
export async function revokeScope(args: RevokeScopeArgs): Promise<void> {
  const existing = await prisma.scopeGrant.findUnique({
    where: {
      userId_llmPartnerId_scope: {
        userId: args.userId,
        llmPartnerId: args.llmPartnerId,
        scope: args.scope,
      },
    },
    select: { id: true, active: true, revokedAt: true },
  })

  if (!existing) return
  if (!existing.active && existing.revokedAt !== null) return

  await prisma.scopeGrant.update({
    where: { id: existing.id },
    data: { active: false, revokedAt: new Date() },
  })

  await writeAuditEntry({
    userId: args.userId,
    llmPartnerId: args.llmPartnerId,
    eventKind: 'scope_revoked',
    referenceId: existing.id,
    payloadJson: {
      scope: args.scope,
      userAgent: args.userAgent ?? null,
    },
    ipAddress: args.ipAddress ?? null,
  })
}

/**
 * Internal helper. Audit writes are best-effort: a failure here
 * must NOT abort the grant/revoke transaction — the user-facing
 * action already happened, and the audit trail is degraded but the
 * grant is real. We log to stderr in that case.
 */
async function writeAuditEntry(args: {
  userId: string
  llmPartnerId: string | null
  eventKind: string
  referenceId: string | null
  payloadJson: Record<string, unknown>
  ipAddress: string | null
}): Promise<void> {
  try {
    await prisma.eAPAuditEntry.create({
      data: {
        userId: args.userId,
        llmPartnerId: args.llmPartnerId,
        eventKind: args.eventKind,
        referenceId: args.referenceId,
        payloadJson: args.payloadJson as object,
        ipAddress: args.ipAddress,
      },
    })
  } catch (err) {
    console.warn('[scope-grants] failed to write audit entry', {
      err: err instanceof Error ? err.message : 'unknown',
      eventKind: args.eventKind,
    })
  }
}
