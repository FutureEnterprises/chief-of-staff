import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { z } from 'zod'
import { isProvider } from '@/lib/provider-rbac'

/**
 * POST /api/v1/provider/invite
 *
 * Dual-mode endpoint for the GLP-1 prescriber channel:
 *
 *   Mode A — bootstrapClinic: true
 *     Called by /clinician/onboarding step 4 ("Provision the clinic").
 *     Auth: any signed-in Clerk user. The act of provisioning IS the
 *     plan-upgrade — we flip them to planType=PRO so the provider-rbac
 *     gate accepts them immediately.
 *     Side effects:
 *       - User.planType        ← PRO
 *       - User.role            ← "clinician"
 *       - User.useCase         ← population key (glp1/maintenance/behavioral)
 *       - User.biggestGoal     ← "clinic:<clinicName>|npi:<npi>|sso:<sso>"
 *         (denormalized clinic identifier; v0.2 lifts to ProviderOrg)
 *
 *   Mode B — default (no bootstrapClinic flag)
 *     Called by the provider dashboard's /provider/invite page to mint
 *     a new patient-invite code. Auth: must already be a provider
 *     (planType ∈ {PRO, TEAM}) per provider-rbac.isProvider().
 *     Side effects: writes a Commitment row owned by the provider's
 *     own User with rule="invite:<code>|providerId:<providerId>". This
 *     is the v0.1 storage trick — Commitment rows are queryable by
 *     `rule contains` and we already use the same field for
 *     provider-patient grants (see provider-rbac.ts comments).
 *
 *     Returns { code } so the client can render the shareable URL
 *     /i/provider/<code>.
 *
 * The dual-mode shape exists because schema.prisma is frozen for this
 * milestone — we can't add an `Invite` table or a `ProviderOrg` table,
 * so the onboarding flow and the invite-mint flow both write to fields
 * we already have. v0.2 splits these into two routes against real
 * models.
 */

const bootstrapSchema = z.object({
  bootstrapClinic: z.literal(true),
  clinicName: z.string().min(2).max(120),
  npi: z.string().min(8).max(20),
  population: z.enum(['glp1', 'maintenance', 'behavioral']),
  sso: z.enum(['azure', 'google', 'manual']),
})

const inviteSchema = z.object({
  bootstrapClinic: z.literal(false).optional(),
  // Optional label the provider attaches to the invite so they can
  // tell it apart from other invites in the list view. Stored in the
  // Commitment.rule alongside the code.
  label: z.string().max(80).optional(),
})

/**
 * 8-character invite code generator. Avoids ambiguous glyphs (no I/O/0/1).
 * 32^8 = ~1.1 trillion combinations — collision risk is negligible at
 * the scale we expect for v0.1.
 */
function generateInviteCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return code
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, planType: true },
  })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const rawBody = (await req.json().catch(() => null)) as unknown
  if (!rawBody || typeof rawBody !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const isBootstrap =
    (rawBody as { bootstrapClinic?: unknown }).bootstrapClinic === true

  if (isBootstrap) {
    const parsed = bootstrapSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid clinic payload' },
        { status: 400 },
      )
    }

    // Denormalized clinic identifier — v0.2 lifts this into a real
    // ProviderOrg row keyed on the NPI.
    const clinicTag = `clinic:${parsed.data.clinicName}|npi:${parsed.data.npi}|sso:${parsed.data.sso}`

    await prisma.user.update({
      where: { id: user.id },
      data: {
        planType: 'PRO',
        role: 'clinician',
        useCase: parsed.data.population,
        biggestGoal: clinicTag,
      },
    })

    return NextResponse.json({ ok: true, planType: 'PRO' })
  }

  // Mode B — patient-invite creation. Requires existing provider tier.
  const allowed = await isProvider(user.id)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const parsed = inviteSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  // Mint an invite code. Re-roll on the (unlikely) collision case —
  // up to 3 tries before giving up.
  let code = ''
  for (let attempt = 0; attempt < 3; attempt++) {
    const candidate = generateInviteCode()
    const ruleToken = `invite:${candidate}`
    const collision = await prisma.commitment.findFirst({
      where: { rule: { contains: ruleToken } },
      select: { id: true },
    })
    if (!collision) {
      code = candidate
      break
    }
  }
  if (!code) {
    return NextResponse.json(
      { error: 'Failed to mint invite code, retry' },
      { status: 500 },
    )
  }

  // Store the invite on a Commitment row owned by the PROVIDER. We use
  // the rule field to encode the invite code + the provider id so the
  // claim route can resolve provider→patient mapping later.
  const label = parsed.data.label ?? 'Patient invite'
  await prisma.commitment.create({
    data: {
      userId: user.id,
      rule: `invite:${code}|providerId:${user.id}|label:${label}|status:pending`,
      // Commitment.active=false so it doesn't pollute the provider's
      // own commitment dashboard. We only ever query it via `rule contains`.
      active: false,
      domain: 'OTHER',
      frequency: 'ONE_TIME',
    },
  })

  return NextResponse.json({ code, label })
}

/**
 * GET /api/v1/provider/invite
 *
 * Lists every invite the calling provider has minted. Drives the
 * /provider/invite list view. Each row is anonymized status:
 *   - pending  → not yet claimed
 *   - claimed  → patient accepted
 *   - revoked  → provider revoked before claim
 */
export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  const allowed = await isProvider(user.id)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const rows = await prisma.commitment.findMany({
    where: {
      userId: user.id,
      rule: { contains: 'invite:' },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  // Parse the rule encoding back into structured fields.
  const invites = rows.map((r) => {
    const parts = r.rule.split('|')
    const lookup: Record<string, string> = {}
    for (const p of parts) {
      const eq = p.indexOf(':')
      if (eq === -1) continue
      lookup[p.slice(0, eq)] = p.slice(eq + 1)
    }
    return {
      id: r.id,
      code: lookup.invite ?? '',
      label: lookup.label ?? 'Patient invite',
      status: lookup.status ?? 'pending',
      claimedBy: lookup.claimedBy ?? null,
      createdAt: r.createdAt.toISOString(),
    }
  })

  return NextResponse.json({ invites })
}
