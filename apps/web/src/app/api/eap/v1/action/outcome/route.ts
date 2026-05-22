/**
 * POST /api/eap/v1/action/outcome — EAP primitive #7 Action Outcome.
 *
 * Fired BY the device coordinator (not by the LLM) when an action
 * completes — successfully, with user interaction, or in a failure
 * mode. The body keys off the executionToken minted at
 * /api/eap/v1/action/request time; that token is treated as a single-
 * use capability for outcome reporting (we don't require Clerk auth
 * here because the device coordinator is acting on its own behalf and
 * doesn't necessarily have a Clerk session in scope).
 *
 * Body:
 *   {
 *     executionToken: 'et_...',
 *     outcome: 'executed' | 'failed' | 'rejected' | 'expired',
 *     outcomeReason?: string,            // for failures
 *     deviceState?: Record<string, unknown>,
 *     userInteracted?: boolean,
 *     userTag?: 'caught_me' | 'snoozed' | 'ignored' | string
 *   }
 *
 * Idempotent: re-POSTing the same executionToken with the same
 * outcome returns 200 with idempotent=true. Conflict (different
 * outcome) is logged but accepted on first write only — the field-
 * shaped audit entry preserves the disagreement.
 *
 * Writes an EAPAuditEntry with eventKind='action_outcome_received'.
 */

import { NextResponse } from 'next/server'
import { prisma, Prisma } from '@repo/database'

export const maxDuration = 10

type OutcomeBody = {
  executionToken?: string
  outcome?: string
  outcomeReason?: string
  deviceState?: Record<string, unknown>
  userInteracted?: boolean
  userTag?: string
}

const ALLOWED_OUTCOMES = ['executed', 'failed', 'rejected', 'expired'] as const

export async function POST(req: Request) {
  let body: OutcomeBody
  try {
    body = (await req.json()) as OutcomeBody
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  if (!body.executionToken || typeof body.executionToken !== 'string') {
    return NextResponse.json({ error: 'missing_execution_token' }, { status: 400 })
  }
  if (!body.outcome || !ALLOWED_OUTCOMES.includes(body.outcome as (typeof ALLOWED_OUTCOMES)[number])) {
    return NextResponse.json(
      { error: 'invalid_outcome', allowed: ALLOWED_OUTCOMES },
      { status: 400 },
    )
  }
  // executionToken charset is hex; lock the shape before passing into
  // Prisma (parameterized SQL anyway, but explicit defense-in-depth).
  const safeToken = sanitizeExecutionToken(body.executionToken)
  if (!safeToken) {
    return NextResponse.json({ error: 'invalid_execution_token' }, { status: 400 })
  }

  // nosemgrep
  const existing = await prisma.actionRequest.findUnique({
    where: { executionToken: safeToken },
    select: {
      id: true,
      userId: true,
      llmPartnerId: true,
      outcome: true,
      outcomeAt: true,
      userInteracted: true,
    },
  })
  if (!existing) {
    return NextResponse.json({ error: 'execution_token_not_found' }, { status: 404 })
  }

  const now = new Date()

  // Idempotent re-post of the same terminal outcome — no-op, return 200.
  if (existing.outcome === body.outcome) {
    return NextResponse.json({
      ok: true,
      idempotent: true,
      outcome: existing.outcome,
      outcomeAt: existing.outcomeAt,
    })
  }

  // First-write-wins on the terminal outcome. If a prior outcome
  // exists and the new one differs, we log the disagreement in the
  // audit trail but don't overwrite — the first observation of the
  // device coordinator is canonical.
  if (existing.outcome && existing.outcome !== body.outcome) {
    await writeAudit({
      userId: existing.userId,
      llmPartnerId: existing.llmPartnerId,
      eventKind: 'action_outcome_conflict',
      referenceId: existing.id,
      payload: {
        existing: existing.outcome,
        incoming: body.outcome,
        userTag: body.userTag ?? null,
      },
    })
    return NextResponse.json({
      ok: true,
      conflict: true,
      outcome: existing.outcome,
    })
  }

  // No prior outcome — write it now. userInteracted is OR'd in (a
  // later device-side correction shouldn't unset an earlier true).
  const userInteractedNext =
    existing.userInteracted || body.userInteracted === true

  // nosemgrep
  await prisma.actionRequest.update({
    where: { id: existing.id },
    data: {
      outcome: body.outcome,
      outcomeReason:
        typeof body.outcomeReason === 'string' ? body.outcomeReason : null,
      outcomeAt: now,
      userInteracted: userInteractedNext,
    },
  })

  await writeAudit({
    userId: existing.userId,
    llmPartnerId: existing.llmPartnerId,
    eventKind: 'action_outcome_received',
    referenceId: existing.id,
    payload: {
      outcome: body.outcome,
      outcomeReason:
        typeof body.outcomeReason === 'string' ? body.outcomeReason : null,
      userInteracted: userInteractedNext,
      userTag: typeof body.userTag === 'string' ? body.userTag : null,
      deviceState: body.deviceState ?? null,
    },
  })

  return NextResponse.json({ ok: true, outcome: body.outcome, outcomeAt: now })
}

async function writeAudit(args: {
  userId: string
  llmPartnerId: string | null
  eventKind: string
  referenceId: string | null
  payload: Record<string, unknown>
}): Promise<void> {
  try {
    await prisma.eAPAuditEntry.create({
      data: {
        userId: args.userId,
        llmPartnerId: args.llmPartnerId,
        eventKind: args.eventKind,
        referenceId: args.referenceId,
        payloadJson: args.payload as Prisma.InputJsonValue,
      },
    })
  } catch {
    // never let audit failure break the device's outcome wire
  }
}

function sanitizeExecutionToken(input: string): string | null {
  if (!input || input.length === 0 || input.length > 128) return null
  const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789_'
  let out = ''
  for (let i = 0; i < input.length; i++) {
    const c = input.charAt(i)
    if (!ALPHABET.includes(c)) return null
    out += c
  }
  return out
}
