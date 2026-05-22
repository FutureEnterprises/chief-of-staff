/**
 * POST /api/pap/v1/outcome — outcome webhook receiver.
 *
 * Primitive #4 of the Proactive AI Protocol. Two flows ride on this
 * endpoint:
 *
 *   INBOUND (device → COYL)
 *     The device coordinator (iOS Live Activity tap, Apple Watch
 *     button, browser extension click) POSTs the user-tagged outcome
 *     back here. We update the PAPProposal row and fan out to any
 *     'outcome'-kind SensorSubscriptions so the proposing LLM partner
 *     gets the outcome via webhook.
 *
 *   OUTBOUND (cron → LLM partner)
 *     A separate cron (not this route) will iterate active
 *     SensorSubscriptions and POST signed payloads to webhookUrl. The
 *     fanOutToSubscribers() helper below is also used inline when an
 *     inbound outcome arrives so the LLM sees it immediately.
 *
 * Body shape (inbound):
 *   {
 *     executionToken: string
 *     outcome: 'caught_me' | 'ignored' | 'snoozed' | 'helped' | 'not_helpful' | ...
 *     outcomeSource?: 'user_tag' | 'inferred' | 'system_timeout'
 *     outcomeMetadata?: Record<string, unknown>
 *   }
 *
 * Auth: same partner Bearer as the rest of PAP. Inbound device
 * coordinators relay through the user's authenticated COYL session;
 * out-of-app device bridges proxy through the partner key.
 */

import { NextResponse } from 'next/server'
import { createHmac } from 'node:crypto'
import { prisma } from '@repo/database'
import { authenticateLLMPartner } from '@/lib/llm-partner-auth'

export const maxDuration = 20

type Body = {
  executionToken?: string
  outcome?: string
  outcomeSource?: string
  outcomeMetadata?: Record<string, unknown>
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
  const outcome = body.outcome
  if (!outcome || typeof outcome !== 'string') {
    return NextResponse.json({ error: 'missing_outcome' }, { status: 400 })
  }

  const proposal = await prisma.pAPProposal.findUnique({
    where: { executionToken: token },
    select: {
      id: true,
      userId: true,
      llmPartnerId: true,
      executedAt: true,
      outcome: true,
    },
  })
  if (!proposal) {
    return NextResponse.json({ error: 'token_not_found' }, { status: 404 })
  }

  // Outcome can only be set once per proposal (or refreshed when the
  // source is more authoritative — system_timeout overridable by
  // user_tag, etc.). v0.1 takes the simpler stance: first-write wins
  // for user_tag; system_timeout can be overwritten by user_tag.
  const now = new Date()
  const source = body.outcomeSource ?? 'user_tag'
  if (proposal.outcome && source !== 'user_tag') {
    return NextResponse.json(
      { ok: true, alreadyTagged: true, outcome: proposal.outcome },
      { status: 200 },
    )
  }

  await prisma.pAPProposal.update({
    where: { id: proposal.id },
    data: {
      outcome,
      outcomeSource: source,
      outcomeAt: now,
    },
  })

  await writeAudit({
    userId: proposal.userId,
    llmPartnerId: partner.id,
    referenceId: proposal.id,
    payload: {
      kind: 'pap_outcome_received',
      outcome,
      outcomeSource: source,
      outcomeMetadata: body.outcomeMetadata ?? null,
      // The proposing partner may differ from the partner relaying
      // the outcome (e.g. a coordinator forwarding on behalf of the
      // device); capture both for the audit trail.
      proposingPartnerId: proposal.llmPartnerId,
    },
    req,
  })

  // Fan out to any 'outcome'-kind SensorSubscriptions for this user.
  // This is fire-and-forget — webhook failures don't break the inbound
  // outcome write, and a subsequent cron retries failed deliveries.
  fanOutToSubscribers({
    userId: proposal.userId,
    proposalId: proposal.id,
    executionToken: token,
    outcome,
    outcomeSource: source,
    outcomeAt: now,
    outcomeMetadata: body.outcomeMetadata ?? null,
  }).catch((err) => {
    console.warn('[pap/outcome] fanout failed', {
      err: err instanceof Error ? err.message : 'unknown',
    })
  })

  return NextResponse.json({
    ok: true,
    outcome,
    outcomeAt: now.toISOString(),
  })
}

// ──────────────────────── fanout ────────────────────────

/**
 * fanOutToSubscribers — POST signed outcome envelopes to any active
 * 'outcome'-kind SensorSubscription rows for this user. Each request
 * is HMAC-signed with the subscription's webhookSecret so the partner
 * can verify provenance.
 *
 * Per-subscription failures increment failureCount. A separate cron
 * deactivates subscriptions whose failureCount crosses a threshold —
 * we keep the threshold logic out of here so this hot path stays
 * thin.
 */
async function fanOutToSubscribers(args: {
  userId: string
  proposalId: string
  executionToken: string
  outcome: string
  outcomeSource: string
  outcomeAt: Date
  outcomeMetadata: Record<string, unknown> | null
}): Promise<void> {
  const subs = await prisma.sensorSubscription.findMany({
    where: {
      userId: args.userId,
      sensor: 'outcome',
      active: true,
    },
    select: {
      id: true,
      webhookUrl: true,
      webhookSecret: true,
      failureCount: true,
    },
  })

  if (subs.length === 0) return

  const envelope = {
    type: 'pap.outcome',
    proposalId: args.proposalId,
    executionToken: args.executionToken,
    outcome: args.outcome,
    outcomeSource: args.outcomeSource,
    outcomeAt: args.outcomeAt.toISOString(),
    outcomeMetadata: args.outcomeMetadata,
  }
  const bodyStr = JSON.stringify(envelope)

  await Promise.all(
    subs.map(async (sub) => {
      const signature = createHmac('sha256', sub.webhookSecret)
        .update(bodyStr)
        .digest('hex')

      try {
        const res = await fetch(sub.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-COYL-Signature': `sha256=${signature}`,
            'X-COYL-Event': 'pap.outcome',
          },
          body: bodyStr,
        })

        if (!res.ok) {
          await prisma.sensorSubscription
            .update({
              where: { id: sub.id },
              data: { failureCount: { increment: 1 } },
            })
            .catch(() => {})
        } else {
          await prisma.sensorSubscription
            .update({
              where: { id: sub.id },
              data: { lastFiredAt: new Date(), failureCount: 0 },
            })
            .catch(() => {})
        }
      } catch (err) {
        await prisma.sensorSubscription
          .update({
            where: { id: sub.id },
            data: { failureCount: { increment: 1 } },
          })
          .catch(() => {})
        console.warn('[pap/outcome] webhook delivery failed', {
          subscriptionId: sub.id,
          err: err instanceof Error ? err.message : 'unknown',
        })
      }
    }),
  )
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
        eventKind: 'pap_outcome_received',
        referenceId: args.referenceId,
        payloadJson: args.payload as object,
        ipAddress: extractIp(args.req),
      },
    })
  } catch (err) {
    console.warn('[pap/outcome] failed to write audit entry', {
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
