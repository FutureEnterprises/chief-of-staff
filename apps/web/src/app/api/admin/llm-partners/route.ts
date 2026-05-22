/**
 * /api/admin/llm-partners
 *
 *   GET  → paginated list of LLMPartner rows (active first, then by
 *          createdAt desc).
 *   POST → create a new partner + mint its first API key. Returns
 *          { partner, apiKey } where apiKey is the wire-format token
 *          (coyl_pap_<id>_<keySecret>) — visible ONCE, then only the
 *          hash + last four are persisted.
 *
 * Both verbs require an ADMIN_USER_IDS-allowlisted Clerk user. The
 * (admin)/layout email gate is the first line of defense; this
 * second gate stops cross-admin scope creep (a future second admin
 * without LLM-partner privs is still blocked at the API).
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@repo/database'
import { assertAdmin } from '@/lib/admin-auth'
import {
  generateApiKey,
  hashApiKey,
  apiKeyLastFour,
} from '@/lib/llm-partner-keys'

export const maxDuration = 15

/** Token prefix mirrors lib/llm-partner-auth.ts:TOKEN_PREFIX. */
const TOKEN_PREFIX = 'coyl_pap_'

const PRICING_TIERS = ['free', 'usage', 'enterprise', 'strategic'] as const

const createSchema = z.object({
  slug: z
    .string()
    .min(3)
    .max(80)
    .regex(/^[a-z0-9][a-z0-9.\-]+$/, {
      message: 'slug must be lowercase alphanumeric / dots / hyphens',
    }),
  name: z.string().min(2).max(120),
  publisher: z.string().min(2).max(80),
  pricingTier: z.enum(PRICING_TIERS).default('usage'),
  rateLimitPerHour: z.number().int().min(1).max(1_000_000).default(1000),
  bundledScopes: z.array(z.string().min(1).max(80)).max(64).default([]),
})

export async function GET(req: Request) {
  const gate = await assertAdmin(req)
  if ('error' in gate) return gate.error

  const url = new URL(req.url)
  const take = Math.min(
    Math.max(parseInt(url.searchParams.get('take') ?? '50', 10) || 50, 1),
    200,
  )
  const skip = Math.max(parseInt(url.searchParams.get('skip') ?? '0', 10) || 0, 0)

  const [partners, total] = await Promise.all([
    prisma.lLMPartner.findMany({
      orderBy: [{ active: 'desc' }, { createdAt: 'desc' }],
      take,
      skip,
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
    }),
    prisma.lLMPartner.count(),
  ])

  return NextResponse.json({ partners, total, take, skip })
}

export async function POST(req: Request) {
  const gate = await assertAdmin(req)
  if ('error' in gate) return gate.error

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid body' },
      { status: 400 },
    )
  }
  const input = parsed.data

  // Pre-flight uniqueness check — better error message than the
  // Prisma P2002 surface.
  const existing = await prisma.lLMPartner.findUnique({
    where: { slug: input.slug },
    select: { id: true },
  })
  if (existing) {
    return NextResponse.json(
      { error: `A partner with slug '${input.slug}' already exists` },
      { status: 409 },
    )
  }

  // Mint key. The 64-char hex secret is bcrypt-hashed; the wire
  // format the partner uses is coyl_pap_<id>_<keySecret>.
  const keySecret = generateApiKey()
  const apiKeyHash = await hashApiKey(keySecret)

  const partner = await prisma.lLMPartner.create({
    data: {
      slug: input.slug,
      name: input.name,
      publisher: input.publisher,
      pricingTier: input.pricingTier,
      rateLimitPerHour: input.rateLimitPerHour,
      bundledScopes: input.bundledScopes,
      apiKeyHash,
      apiKeyLastFour: apiKeyLastFour(keySecret),
      active: true,
    },
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

  const wireToken = `${TOKEN_PREFIX}${partner.id}_${keySecret}`

  // This is the one and only time apiKey leaves the server.
  return NextResponse.json(
    { partner, apiKey: wireToken },
    { status: 201 },
  )
}
