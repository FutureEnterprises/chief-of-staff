import 'server-only'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import type { User } from '@repo/database'

/**
 * Provider RBAC v0.1 — gates the clinician dashboard surface.
 *
 * This is the access-control core of the B2B clinical channel + GLP-1
 * prescriber play. Per the $6B Roadmap, the provider dashboard is a
 * required artifact for pharma BD diligence: prescribers (and the pharma
 * companies routing their patients to us) need a HIPAA-aware view of
 * cohort behavior — slips, danger windows, intervention hold rates,
 * weight velocity — without exposing raw patient PHI.
 *
 * v0.1 model (this file):
 *   - "Who is a provider?"  → User.planType ∈ {PRO, TEAM}. We piggy-back
 *     on the existing PlanType enum (FREE/CORE/PLUS/PREMIUM/PRO/TEAM)
 *     instead of adding a `providerOrgId` field, because schema.prisma
 *     is frozen for this milestone.
 *   - "Which patients can the provider see?"  → Patients opt in by
 *     including the magic token `providerId:<providerUserId>` in the
 *     `notes` field of any active Commitment. v0.1 of provider-patient
 *     mapping is intentionally opt-in via a shareable link — no silent
 *     org-wide enrollment.
 *
 * v0.2 (planned, NOT in this PR):
 *   - Dedicated `ProviderOrg` + `ProviderPatient` join models in
 *     schema.prisma
 *   - Multi-patient invite flows with explicit consent records
 *   - BAA-on-file flag that unlocks full-name display
 *   - Per-org permission grants (read-only vs. read+message)
 *
 * HIPAA caveat: until v0.2 ships BAA tooling, every provider-facing
 * surface MUST display first-name + last-initial only and MUST NOT
 * expose raw biometric samples (e.g. minute-by-minute weight scale
 * readings). The data routes in /api/v1/provider/* enforce this at
 * the response layer.
 */

const PROVIDER_PLAN_TYPES: ReadonlyArray<string> = ['PRO', 'TEAM']

/**
 * The opt-in token a patient adds to a Commitment.notes-equivalent
 * field to grant a specific provider read access. We use the
 * Commitment model's text fields rather than a dedicated table because
 * we're frozen out of schema changes for this milestone. The token is
 * matched case-sensitively to avoid false positives in legitimate
 * patient notes that mention the string "providerid" in passing.
 */
function buildPatientGrantToken(providerUserId: string): string {
  return `providerId:${providerUserId}`
}

/**
 * Returns true if the given DB user id is allowed to access the
 * provider dashboard. Pure plan-type gate for v0.1. Returns false for
 * unknown users so callers can render Forbidden without leaking
 * existence.
 */
export async function isProvider(userId: string): Promise<boolean> {
  if (!userId) return false
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { planType: true },
    })
    if (!user) return false
    return PROVIDER_PLAN_TYPES.includes(user.planType)
  } catch {
    return false
  }
}

/**
 * Resolves the currently-signed-in Clerk user to a DB User row AND
 * confirms they have the provider plan tier. Returns null if either
 * step fails. Use this at the top of every provider route/page.
 */
export async function getCurrentProvider(): Promise<User | null> {
  const { userId: clerkId } = await auth()
  if (!clerkId) return null

  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) return null
  if (!PROVIDER_PLAN_TYPES.includes(user.planType)) return null

  return user
}

/**
 * Returns the User rows the given provider is authorized to view.
 *
 * Authorization model (v0.1): a patient opts in by including the
 * literal string `providerId:<providerId>` somewhere in the `rule`
 * field of any active Commitment row (Commitment doesn't have a
 * dedicated `notes` column — we re-use the rule text field because
 * patients will paste the invite token here when prompted by the
 * /provider/invite/[code] flow). We pull distinct userIds matching
 * the token, then fetch the User rows.
 *
 * Returns an empty array if the provider has no patients yet.
 */
export async function getProviderPatients(providerId: string): Promise<User[]> {
  if (!providerId) return []

  const token = buildPatientGrantToken(providerId)

  // Find every active Commitment whose rule text contains the grant
  // token. `contains` is case-sensitive on Postgres by default, which
  // is what we want — the token format is deterministic.
  const grants = await prisma.commitment.findMany({
    where: {
      active: true,
      rule: { contains: token },
    },
    select: { userId: true },
    distinct: ['userId'],
  })

  if (grants.length === 0) return []

  const patientIds = grants.map((g) => g.userId)
  return prisma.user.findMany({
    where: { id: { in: patientIds } },
    orderBy: { lastSlipAt: 'desc' },
  })
}

/**
 * Hard gate. Throws if `providerId` is not a provider OR if the
 * provider is not authorized to view the given `patientId`. Use at
 * the top of every per-patient route/page.
 *
 * Note: we do NOT distinguish between "not a provider" and "not your
 * patient" in the thrown error message — both surface as a generic
 * 403 to avoid leaking patient-existence info.
 */
export async function assertProviderAccess(
  providerId: string,
  patientId: string,
): Promise<void> {
  if (!providerId || !patientId) {
    throw new Error('Forbidden')
  }

  const provider = await prisma.user.findUnique({
    where: { id: providerId },
    select: { planType: true },
  })
  if (!provider || !PROVIDER_PLAN_TYPES.includes(provider.planType)) {
    throw new Error('Forbidden')
  }

  const token = buildPatientGrantToken(providerId)
  const grant = await prisma.commitment.findFirst({
    where: {
      userId: patientId,
      active: true,
      rule: { contains: token },
    },
    select: { id: true },
  })

  if (!grant) throw new Error('Forbidden')
}

/**
 * Anonymizer for HIPAA-light display. Returns "Sam K." for a User
 * named "Sam Kowalski". Until a BAA-on-file flag is wired up in v0.2,
 * every provider-facing surface MUST run patient names through this
 * helper before rendering.
 */
export function anonymizePatientName(fullName: string): string {
  if (!fullName) return 'Anonymous'
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'Anonymous'
  const first = parts[0] ?? 'Anonymous'
  if (parts.length === 1) return first
  const lastName = parts[parts.length - 1] ?? ''
  const lastInitial = lastName.charAt(0).toUpperCase()
  return `${first} ${lastInitial}.`
}
