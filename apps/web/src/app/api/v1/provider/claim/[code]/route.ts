import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { z } from 'zod'

/**
 * POST /api/v1/provider/claim/[code]
 *
 * Patient-side claim endpoint. Two decisions:
 *
 *   accept  — patient grants the issuing provider read access to their
 *             pattern data. We:
 *               1. require a Clerk session (so we know who's accepting)
 *               2. mark the invite Commitment row as
 *                  status:claimed | claimedBy:<patientUserId>
 *               3. append `providerId:<providerId>` to the patient's
 *                  most-recent active Commitment.rule — this is the
 *                  v0.1 grant token the provider-rbac.ts helpers
 *                  scan for. If the patient has no active Commitment
 *                  yet (new account), we create a placeholder one
 *                  carrying just the grant token.
 *
 *   decline — anonymous; we mark the invite revoked so the link can't
 *             be re-used. No patient session required.
 *
 * Why we append to Commitment.rule instead of creating a join row:
 * schema.prisma is frozen for this milestone — see the v0.1/v0.2 plan
 * in lib/provider-rbac.ts. v0.2 ships a real ProviderPatient table
 * with explicit consent timestamps + per-grant revocation; this
 * route gets rewritten then.
 */

const bodySchema = z.object({
  decision: z.enum(['accept', 'decline']),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params
  if (!code || code.length < 4) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }
  const { decision } = parsed.data

  // Find the invite. It's stored as a Commitment row on the provider's
  // own User with `rule contains invite:<code>`.
  const invite = await prisma.commitment.findFirst({
    where: { rule: { contains: `invite:${code}` } },
  })
  if (!invite) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
  }

  // Parse the rule encoding so we can rewrite the status segment.
  const parts = invite.rule.split('|')
  const lookup: Record<string, string> = {}
  for (const p of parts) {
    const eq = p.indexOf(':')
    if (eq === -1) continue
    lookup[p.slice(0, eq)] = p.slice(eq + 1)
  }
  const currentStatus = lookup.status ?? 'pending'
  if (currentStatus !== 'pending') {
    return NextResponse.json(
      { error: `Invite is already ${currentStatus}` },
      { status: 409 },
    )
  }

  const providerId = lookup.providerId
  if (!providerId) {
    return NextResponse.json(
      { error: 'Invite missing providerId' },
      { status: 500 },
    )
  }

  if (decision === 'decline') {
    // Anonymous decline — just flip the status and persist.
    lookup.status = 'revoked'
    const newRule = serializeLookup(lookup)
    await prisma.commitment.update({
      where: { id: invite.id },
      data: { rule: newRule },
    })
    return NextResponse.json({ ok: true, status: 'revoked' })
  }

  // Accept — requires Clerk session so we know who's granting.
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const patient = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })
  if (!patient) {
    return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
  }

  // Defense-in-depth: a provider can't claim their own invite.
  if (patient.id === providerId) {
    return NextResponse.json(
      { error: 'Cannot claim your own invite' },
      { status: 400 },
    )
  }

  // 1. Append the provider grant token to the patient's most-recent
  //    active Commitment. If none exists, create a placeholder
  //    Commitment so the grant token has a home — the patient will
  //    overwrite it with a real commitment during onboarding, and the
  //    token survives the rewrite because we only append, never
  //    replace.
  const grantToken = `providerId:${providerId}`
  const recent = await prisma.commitment.findFirst({
    where: { userId: patient.id, active: true },
    orderBy: { createdAt: 'desc' },
  })

  if (recent) {
    // Only append if the token isn't already in there — idempotent.
    if (!recent.rule.includes(grantToken)) {
      await prisma.commitment.update({
        where: { id: recent.id },
        data: { rule: `${recent.rule} | ${grantToken}` },
      })
    }
  } else {
    await prisma.commitment.create({
      data: {
        userId: patient.id,
        // Carry-only placeholder — patient onboarding will create
        // real commitments above this one.
        rule: `clinician grant | ${grantToken}`,
        active: true,
        domain: 'OTHER',
        frequency: 'DAILY',
      },
    })
  }

  // 2. Mark the invite as claimed.
  lookup.status = 'claimed'
  lookup.claimedBy = patient.id
  await prisma.commitment.update({
    where: { id: invite.id },
    data: { rule: serializeLookup(lookup) },
  })

  // 3. ProductivityEvent for the audit trail — best-effort, doesn't
  //    fail the claim if the event write errors.
  await prisma.productivityEvent
    .create({
      data: {
        userId: patient.id,
        eventType: 'FEATURE_USED',
        eventValue: 'provider_invite_claimed',
        metadataJson: { providerId, inviteCode: code },
      },
    })
    .catch(() => {})

  return NextResponse.json({ ok: true, status: 'claimed' })
}

/**
 * Re-serialize the rule lookup back into the pipe-delimited form the
 * other helpers parse. Order is stable for diffability: invite first,
 * then providerId, then everything else.
 */
function serializeLookup(lookup: Record<string, string>): string {
  const orderedKeys = ['invite', 'providerId', 'label', 'status', 'claimedBy']
  const out: string[] = []
  for (const k of orderedKeys) {
    if (k in lookup) out.push(`${k}:${lookup[k]}`)
  }
  for (const [k, v] of Object.entries(lookup)) {
    if (!orderedKeys.includes(k)) out.push(`${k}:${v}`)
  }
  return out.join('|')
}
