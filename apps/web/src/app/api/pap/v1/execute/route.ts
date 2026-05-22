/**
 * POST /api/pap/v1/execute — finalize execution of an allowed proposal.
 *
 * Primitive #3 of the Proactive AI Protocol. The LLM has received an
 * executionToken from /proposal; calling /execute with that token tells
 * the coordinator to actually fire through to the user's preferred
 * modality.
 *
 * Token semantics:
 *   - executionToken is unique + single-use. Re-using a token after
 *     executedAt is set returns 409.
 *   - Tokens expire 15 minutes after their proposal's scheduledFor —
 *     past that we 410, forcing the LLM to emit a fresh proposal.
 *
 * Firing:
 *   - In v0.1 the surface is push (Expo / APNs) via the same
 *     ActionRequest + action-executor pipeline EAP uses. We mint an
 *     ActionRequest row pointing at the user's primary active device
 *     and dispatch through executeAction(). This keeps the PAP and EAP
 *     audit + outcome flows unified.
 *   - When the user has no paired device we fail-soft: mark the
 *     proposal executedAt anyway (the LLM tried; firing failed at the
 *     transport layer, not the protocol layer) and return ok=true with
 *     a fallbackReason field so the LLM knows to back off.
 */

import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'
import { authenticateLLMPartner } from '@/lib/llm-partner-auth'
import { executeAction } from '@/lib/eap/action-executor'

export const maxDuration = 25

/**
 * Hard ceiling between mint + redemption. 15 minutes covers the
 * typical "LLM proposes → coordinator approves → LLM fires" round trip
 * with plenty of buffer; past that the user state has moved on and the
 * intervention should be re-justified.
 */
const EXECUTION_TOKEN_TTL_MS = 15 * 60 * 1000

type Body = {
  executionToken?: string
}

export async function POST(req: Request) {
  const authResult = await authenticateLLMPartner(req)
  if (authResult.error) return authResult.error
  const partner = authResult.partner

  let body: Body = {}
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const token = body.executionToken
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'missing_execution_token' }, { status: 400 })
  }

  const proposal = await prisma.pAPProposal.findUnique({
    where: { executionToken: token },
    select: {
      id: true,
      llmPartnerId: true,
      userId: true,
      decision: true,
      scheduledFor: true,
      executedAt: true,
      actionJson: true,
      scopeRequested: true,
    },
  })

  if (!proposal) {
    return NextResponse.json({ error: 'token_not_found' }, { status: 404 })
  }
  // Lock the redemption to the partner that minted it.
  if (proposal.llmPartnerId !== partner.id) {
    return NextResponse.json({ error: 'token_partner_mismatch' }, { status: 403 })
  }
  if (proposal.decision !== 'allowed') {
    return NextResponse.json(
      { error: 'token_not_redeemable', decision: proposal.decision },
      { status: 409 },
    )
  }
  if (proposal.executedAt) {
    return NextResponse.json(
      {
        error: 'already_executed',
        executedAt: proposal.executedAt.toISOString(),
      },
      { status: 409 },
    )
  }

  const now = new Date()
  if (
    proposal.scheduledFor &&
    now.getTime() - proposal.scheduledFor.getTime() > EXECUTION_TOKEN_TTL_MS
  ) {
    return NextResponse.json(
      { error: 'token_expired', scheduledFor: proposal.scheduledFor.toISOString() },
      { status: 410 },
    )
  }

  // Read the action payload the LLM proposed. We don't trust shape
  // past Record<string, unknown> — same posture the action-executor
  // takes with its own params blob.
  const action = readJson(proposal.actionJson)
  const modality = typeof action.modality === 'string' ? action.modality : null
  const mode = typeof action.mode === 'string' ? action.mode : null
  const headline = typeof action.headline === 'string' ? action.headline : null
  const subhead = typeof action.subhead === 'string' ? action.subhead : null

  // Pick the user's primary device. v0.1 strategy: most recently seen
  // paired device. Future versions can pick per modality preference.
  const device = await prisma.device.findFirst({
    where: { userId: proposal.userId, paired: true },
    orderBy: { lastSeenAt: 'desc' },
  })

  // The PAP action mirrors the EAP shape so action-executor handles
  // both transparently. Actuator is the proposal's modality, mapped
  // onto EAP's actuator taxonomy.
  const actuator = mapModalityToActuator(modality)
  const scopeForAction = proposal.scopeRequested[0] ?? 'proactive_generic'

  // Mark executedAt FIRST so a slow Expo response can't double-fire if
  // the LLM retries during dispatch.
  await prisma.pAPProposal.update({
    where: { id: proposal.id },
    data: { executedAt: now },
  })

  let fallbackReason: string | null = null

  if (device) {
    // Mint an ActionRequest pointing at the chosen device + actuator
    // and dispatch through the shared executor. We DON'T wait for the
    // outcome here; the device coordinator POSTs back later via
    // /api/pap/v1/outcome.
    const actionKey = `pap_${proposal.id}`
    const actionRequest = await prisma.actionRequest.create({
      data: {
        actionKey,
        llmPartnerId: partner.id,
        userId: proposal.userId,
        deviceId: device.id,
        actuator,
        paramsJson: {
          headline,
          subhead,
          mode,
          modality,
          proposalId: proposal.id,
          // Pass-through so widget templates can read additional fields
          ...action,
        } as object,
        scopeRequested: scopeForAction,
        reasoning: subhead ?? headline ?? `PAP intervention (${mode ?? 'unspecified'})`,
        decision: 'allowed',
        executionToken: `pap_${proposal.id}_${now.getTime()}`,
      },
    })

    // Fire-and-forget — executor swallows its own errors and updates
    // the ActionRequest row.
    executeAction(actionRequest, device).catch((err) => {
      console.warn('[pap/execute] executor failed', {
        err: err instanceof Error ? err.message : 'unknown',
        actionRequestId: actionRequest.id,
      })
    })
  } else {
    fallbackReason = 'no_paired_device'
  }

  // Audit the execute event.
  await writeAudit({
    userId: proposal.userId,
    llmPartnerId: partner.id,
    referenceId: proposal.id,
    payload: {
      kind: 'pap_proposal_executed',
      modality,
      mode,
      fallbackReason,
    },
    req,
  })

  return NextResponse.json({
    ok: true,
    executedAt: now.toISOString(),
    ...(fallbackReason ? { fallbackReason } : {}),
  })
}

// ──────────────────────── helpers ────────────────────────

/**
 * Map a PAP proposal.modality into the EAP actuator taxonomy. EAP's
 * actuator strings are what the device bridges interpret; PAP modality
 * names are higher-level ("voice", "haptic", "push"). We translate at
 * the boundary so the LLM API stays clean.
 */
function mapModalityToActuator(modality: string | null): string {
  switch (modality) {
    case 'voice':
      return 'voice_tts'
    case 'haptic':
      return 'haptic'
    case 'live_activity':
      return 'live_activity'
    case 'open_url':
      return 'open_url'
    case 'push':
    case null:
    case undefined:
    default:
      return 'push_notification'
  }
}

function readJson(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  return raw as Record<string, unknown>
}

async function writeAudit(args: {
  userId: string
  llmPartnerId: string
  referenceId: string
  payload: Record<string, unknown>
  req: Request
}) {
  try {
    await prisma.eAPAuditEntry.create({
      data: {
        userId: args.userId,
        llmPartnerId: args.llmPartnerId,
        eventKind: 'pap_proposal_executed',
        referenceId: args.referenceId,
        payloadJson: args.payload as object,
        ipAddress: extractIp(args.req),
      },
    })
  } catch (err) {
    console.warn('[pap/execute] failed to write audit entry', {
      err: err instanceof Error ? err.message : 'unknown',
    })
  }
}

function extractIp(req: Request): string | null {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  return req.headers.get('x-real-ip')
}
