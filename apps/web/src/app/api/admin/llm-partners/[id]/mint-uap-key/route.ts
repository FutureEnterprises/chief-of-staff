/**
 * POST /api/admin/llm-partners/[id]/mint-uap-key
 *
 * Issues (or re-issues) the UAP-protocol API key for an existing
 * LLMPartner row. UAP keys live in a SEPARATE column (uapApiKeyHash)
 * from the PAP key (apiKeyHash), so:
 *
 *   • A partner row can independently carry a PAP key, a UAP key, or
 *     both — minting one never touches the other.
 *   • A subsequent POST to this endpoint rotates the UAP key in place
 *     (the prior UAP secret is invalidated atomically in the same
 *     UPDATE; PAP credential is untouched).
 *
 * The wire-format token the response returns is
 *   coyl_uap_<llmPartnerId>_<keySecret>
 * — the only place it appears in cleartext is in this response. The
 * server-side persistence is the bcrypt hash only.
 *
 * Audit: an EAPAuditEntry with eventKind='llm_partner_uap_key_minted'
 * is written so the dashboard can attribute the action to the actor's
 * Clerk userId + IP. Same shape as llm_partner_key_rotated (the PAP
 * equivalent) for queryability symmetry.
 *
 * Auth: ADMIN_USER_IDS allowlist via assertAdmin. Mirrors mint-key
 * (the new-partner POST) and rotate-key (the PAP rotation endpoint).
 */
import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { assertAdmin } from '@/lib/admin-auth'
import {
  generateApiKey,
  hashApiKey,
} from '@/lib/llm-partner-keys'

export const maxDuration = 15

/** Mirrors lib/uap/uap-partner-auth.ts:TOKEN_PREFIX. */
const TOKEN_PREFIX = 'coyl_uap_'

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
    select: { id: true, slug: true, active: true, uapApiKeyHash: true },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
  }

  // Mint a fresh UAP secret. If a prior UAP key existed, this UPDATE
  // overwrites the hash in place — there is no in-between window
  // where both old and new keys are valid. The PAP key
  // (apiKeyHash / apiKeyLastFour) is intentionally not touched.
  const keySecret = generateApiKey()
  const uapApiKeyHash = await hashApiKey(keySecret)

  const partner = await prisma.lLMPartner.update({
    where: { id },
    data: { uapApiKeyHash },
    select: {
      id: true,
      slug: true,
    },
  })

  // Audit. Distinct eventKind from PAP rotations so the admin
  // dashboard can break out UAP issuance/rotation independently.
  // Whether this is the FIRST UAP mint or a re-mint is captured in
  // payloadJson so a future timeline view can render "minted" vs
  // "rotated" without a schema change.
  await prisma.eAPAuditEntry.create({
    data: {
      userId: actorId,
      llmPartnerId: partner.id,
      eventKind: 'llm_partner_uap_key_minted',
      referenceId: partner.id,
      ipAddress: ipFromRequest(req),
      payloadJson: {
        actorClerkId: actorId,
        partnerSlug: partner.slug,
        protocol: 'uap',
        wasRotation: existing.uapApiKeyHash !== null,
      },
    },
  })

  const wireToken = `${TOKEN_PREFIX}${partner.id}_${keySecret}`

  // The plaintext secret leaves the server here exactly once.
  return NextResponse.json(
    {
      apiKey: wireToken,
      wasRotation: existing.uapApiKeyHash !== null,
    },
    { status: 201 },
  )
}
