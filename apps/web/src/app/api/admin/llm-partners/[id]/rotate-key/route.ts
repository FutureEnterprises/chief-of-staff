/**
 * POST /api/admin/llm-partners/[id]/rotate-key
 *
 * Atomically invalidates the partner's current key and mints a new
 * one. The new wire-format token (coyl_pap_<id>_<keySecret>) is
 * returned in the response body ONCE; only the bcrypt hash + last
 * four chars are persisted server-side.
 *
 * Audit: writes an EAPAuditEntry with eventKind='llm_partner_key_rotated'
 * including the actor's Clerk userId and request IP so we can trace
 * who rotated which partner's credentials.
 *
 * Guarded by ADMIN_USER_IDS allowlist.
 */
import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { assertAdmin } from '@/lib/admin-auth'
import {
  generateApiKey,
  hashApiKey,
  apiKeyLastFour,
} from '@/lib/llm-partner-keys'

export const maxDuration = 15

/** Mirrors lib/llm-partner-auth.ts:TOKEN_PREFIX. */
const TOKEN_PREFIX = 'coyl_pap_'

function ipFromRequest(req: Request): string | undefined {
  // Vercel sets x-forwarded-for; trust the leftmost (origin) entry.
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]?.trim()
  const real = req.headers.get('x-real-ip')
  if (real) return real.trim()
  return undefined
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await assertAdmin(req)
  if ('error' in gate) return gate.error
  const { userId: actorId } = gate
  const { id } = await params

  const existing = await prisma.lLMPartner.findUnique({
    where: { id },
    select: { id: true, slug: true, active: true },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
  }

  // Mint fresh key. Old hash is overwritten in the same UPDATE —
  // there is no in-between window where both keys are valid.
  const keySecret = generateApiKey()
  const apiKeyHash = await hashApiKey(keySecret)
  const lastFour = apiKeyLastFour(keySecret)

  const partner = await prisma.lLMPartner.update({
    where: { id },
    data: { apiKeyHash, apiKeyLastFour: lastFour },
    select: {
      id: true,
      slug: true,
      apiKeyLastFour: true,
    },
  })

  // Audit. No FK from EAPAuditEntry -> LLMPartner so this entry
  // outlives the partner row if it's ever hard-deleted (which we
  // don't currently do — DELETE is a soft-delete).
  //
  // userId on EAPAuditEntry is non-nullable in the schema; for
  // operator-initiated events we record the actor's Clerk userId
  // there so the dashboard can attribute the action.
  await prisma.eAPAuditEntry.create({
    data: {
      userId: actorId,
      llmPartnerId: partner.id,
      eventKind: 'llm_partner_key_rotated',
      referenceId: partner.id,
      ipAddress: ipFromRequest(req),
      payloadJson: {
        actorClerkId: actorId,
        partnerSlug: partner.slug,
        newKeyLastFour: lastFour,
      },
    },
  })

  const wireToken = `${TOKEN_PREFIX}${partner.id}_${keySecret}`

  return NextResponse.json({
    apiKey: wireToken,
    apiKeyLastFour: lastFour,
  })
}
