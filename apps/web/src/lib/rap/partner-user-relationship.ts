/**
 * Partner ↔ user relationship check, shared by the RAP partner-facing
 * routes (status / assess / escalation).
 *
 * RAP state is health-adjacent: "coaching path closed" means the user
 * was crisis- or emergency-classified inside the active window, and a
 * partner-written assessment CLOSES that path (denying the user's
 * whole UAP/EAP surface for the window). Neither reading nor writing
 * that state is something an arbitrary authenticated partner should be
 * able to do for an arbitrary user id. The documented contract on all
 * three routes is "for users they have grants on" — this helper is
 * that contract, enforced.
 *
 * A relationship exists when the partner holds EITHER:
 *   - an ACTIVE, unexpired UAP grant from the user, OR
 *   - an active, unrevoked, unexpired EAP ScopeGrant from the user.
 *
 * Takes the prisma client as an argument so route-level tests can pass
 * their mocked client without this module importing @repo/database at
 * load time in a second place.
 */

type PrismaLike = {
  uAPGrant: {
    findFirst: (args: {
      where: {
        userId: string
        llmPartnerId: string
        status: 'ACTIVE'
        expiresAt: { gt: Date }
      }
      select: { id: true }
    }) => Promise<{ id: string } | null>
  }
  scopeGrant: {
    findFirst: (args: {
      where: {
        userId: string
        llmPartnerId: string
        active: true
        revokedAt: null
        OR: Array<{ expiresAt: null } | { expiresAt: { gt: Date } }>
      }
      select: { id: true }
    }) => Promise<{ id: string } | null>
  }
}

export async function partnerHasRelationshipWithUser(
  prisma: PrismaLike,
  llmPartnerId: string,
  userId: string,
): Promise<boolean> {
  const now = new Date()
  const [uapGrant, scopeGrant] = await Promise.all([
    prisma.uAPGrant.findFirst({
      where: {
        userId,
        llmPartnerId,
        status: 'ACTIVE',
        expiresAt: { gt: now },
      },
      select: { id: true },
    }),
    prisma.scopeGrant.findFirst({
      where: {
        userId,
        llmPartnerId,
        active: true,
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: { id: true },
    }),
  ])
  return uapGrant !== null || scopeGrant !== null
}
