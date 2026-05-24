import { NextResponse } from 'next/server'
import { verifyCronAuth } from '@/lib/cron-auth'
import { prisma } from '@repo/database'
import { classifyAndStoreExcuse } from '@/lib/services/excuse-detection.service'

export const maxDuration = 60

/**
 * GET /api/cron/inbound-process
 *
 * Worker for the inbound check-in loop. Registered in apps/web/vercel.json
 * on a 5-minute tick (`*\/5 * * * *`). Wakes, picks every InboundMessage
 * row with processed=false, routes the body through the same
 * excuse-detection service that backs /api/chat, and flips processed=true.
 *
 * Why this matters: inbound replies are the cheapest signal we get from
 * a user — they're literally answering the question we just asked. Until
 * now those messages were dropped on the floor. Wiring them through the
 * excuse-detection classifier means an SMS reply ("not tonight, too
 * tired") writes an Excuse row + ProductivityEvent the same way an
 * in-app chat message does — feeding the autopilot interrupt model,
 * the danger-window learner, and the identity-state machine.
 *
 * Failure model: per-row try/catch. A classifier failure on one row
 * flips processed=true anyway with an error marker in metadata, so the
 * cron doesn't lock up retrying the same poison row every 5 minutes.
 * The classifier itself is best-effort (returns null on internal failure)
 * so this almost never throws.
 */
export async function GET(req: Request) {
  const authError = verifyCronAuth(req)
  if (authError) return authError

  // Lookback cap — only consider rows from the last 24h. Older
  // unprocessed rows are likely poison (signature-failed, malformed)
  // and shouldn't keep getting retried.
  const lookbackHours = 24
  const since = new Date(Date.now() - lookbackHours * 60 * 60 * 1000)

  const pending = await prisma.inboundMessage.findMany({
    where: {
      processed: false,
      receivedAt: { gte: since },
    },
    orderBy: { receivedAt: 'asc' },
    take: 100,
    select: {
      id: true,
      userId: true,
      channel: true,
      body: true,
      originScheduleId: true,
      metadata: true,
    },
  })

  let processed = 0
  let detected = 0
  let errored = 0

  for (const row of pending) {
    try {
      const result = await classifyAndStoreExcuse(row.userId, row.body, 'CHECKIN')
      if (result?.detected) detected++

      const existing =
        row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
          ? (row.metadata as Record<string, unknown>)
          : {}

      await prisma.inboundMessage.update({
        where: { id: row.id },
        data: {
          processed: true,
          metadata: {
            ...existing,
            processedAt: new Date().toISOString(),
            excuseDetected: result?.detected ?? false,
            excuseCategory: result?.category ?? null,
            channelAtProcess: row.channel,
            originScheduleId: row.originScheduleId,
          },
        },
      })

      processed++
    } catch (err) {
      errored++
      // Mark processed so a poison row doesn't loop forever — but record
      // the error in metadata so an operator can audit.
      try {
        const existing =
          row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
            ? (row.metadata as Record<string, unknown>)
            : {}
        await prisma.inboundMessage.update({
          where: { id: row.id },
          data: {
            processed: true,
            metadata: {
              ...existing,
              processedAt: new Date().toISOString(),
              processError: err instanceof Error ? err.message : 'unknown',
            },
          },
        })
      } catch {
        // If even the error-marker write fails, leave the row alone and
        // let the next tick retry — but cap retries via the 24h lookback.
      }
    }
  }

  return NextResponse.json({
    ok: true,
    candidates: pending.length,
    processed,
    detected,
    errored,
  })
}
