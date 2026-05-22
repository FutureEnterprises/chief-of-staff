/**
 * /api/admin/llm-partners/[id]
 *
 *   GET    → partner row + 30-day usage snapshot
 *   PATCH  → update mutable fields: active, rateLimitPerHour,
 *            pricingTier, bundledScopes (slug/name/publisher are
 *            intentionally immutable — those are identity, not config)
 *   DELETE → soft-delete (active=false). Hard delete is intentionally
 *            absent: ScopeGrant / PAPProposal / ActionRequest / etc.
 *            rows reference this partner via ON DELETE CASCADE, and
 *            we want forensic preservation of every action the
 *            partner ever fired.
 *
 * All verbs require an ADMIN_USER_IDS-allowlisted Clerk user.
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@repo/database'
import { assertAdmin } from '@/lib/admin-auth'

export const maxDuration = 15

const PRICING_TIERS = ['free', 'usage', 'enterprise', 'strategic'] as const

const patchSchema = z
  .object({
    active: z.boolean().optional(),
    rateLimitPerHour: z.number().int().min(1).max(1_000_000).optional(),
    pricingTier: z.enum(PRICING_TIERS).optional(),
    bundledScopes: z.array(z.string().min(1).max(80)).max(64).optional(),
  })
  .refine(
    (v) =>
      v.active !== undefined ||
      v.rateLimitPerHour !== undefined ||
      v.pricingTier !== undefined ||
      v.bundledScopes !== undefined,
    { message: 'At least one mutable field is required' },
  )

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await assertAdmin(req)
  if ('error' in gate) return gate.error
  const { id } = await params

  const partner = await prisma.lLMPartner.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      name: true,
      publisher: true,
      active: true,
      pricingTier: true,
      rateLimitPerHour: true,
      apiKeyLastFour: true,
      bundledScopes: true,
      createdAt: true,
      updatedAt: true,
    },
  })
  if (!partner) {
    return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const [proposals30d, actions30d, activeScopeGrants] = await Promise.all([
    prisma.pAPProposal.count({
      where: { llmPartnerId: id, createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.actionRequest.count({
      where: { llmPartnerId: id, createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.scopeGrant.count({ where: { llmPartnerId: id, active: true } }),
  ])

  return NextResponse.json({
    partner,
    usage: {
      proposals30d,
      actions30d,
      activeScopeGrants,
      windowDays: 30,
    },
  })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await assertAdmin(req)
  if ('error' in gate) return gate.error
  const { id } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid body' },
      { status: 400 },
    )
  }

  const existing = await prisma.lLMPartner.findUnique({
    where: { id },
    select: { id: true },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
  }

  const partner = await prisma.lLMPartner.update({
    where: { id },
    data: parsed.data,
    select: {
      id: true,
      slug: true,
      name: true,
      publisher: true,
      active: true,
      pricingTier: true,
      rateLimitPerHour: true,
      apiKeyLastFour: true,
      bundledScopes: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return NextResponse.json({ partner })
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await assertAdmin(req)
  if ('error' in gate) return gate.error
  const { id } = await params

  const existing = await prisma.lLMPartner.findUnique({
    where: { id },
    select: { id: true, active: true },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
  }

  // Soft delete: flip active=false. Existing ScopeGrants etc. remain
  // for audit; the key continues to fail at the bearer-auth layer
  // because lib/llm-partner-auth.ts checks partner.active.
  const partner = await prisma.lLMPartner.update({
    where: { id },
    data: { active: false },
    select: {
      id: true,
      slug: true,
      active: true,
    },
  })

  return NextResponse.json({ partner })
}
