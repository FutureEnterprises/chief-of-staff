/**
 * GET /api/eap/v1/audit — EAP primitive #9 Audit Log.
 *
 * User-facing audit query. Auth is Clerk-based (NOT LLM-partner) —
 * only the user themselves can read their own EAP audit trail. This
 * is the data surface the in-app /audit view (and any future Privacy
 * Center export) reads from.
 *
 * Query params:
 *   ?since=<ISO timestamp>          — clamp to entries newer than this
 *   ?kind=<eventKind>               — filter (e.g. action_allowed,
 *                                      panic_triggered, scope_granted)
 *   ?limit=<n>                      — page size, default 100, capped 500
 *   ?cursor=<lastId>                — pagination by id
 *
 * Returns:
 *   {
 *     entries: [{ id, eventKind, referenceId, payloadJson, createdAt,
 *                 llmPartnerId, ipAddress }],
 *     nextCursor: <id|null>
 *   }
 */

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma, Prisma } from '@repo/database'

export const maxDuration = 15

const DEFAULT_LIMIT = 100
const MAX_LIMIT = 500

export async function GET(req: Request) {
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

  const url = new URL(req.url)
  const sinceParam = url.searchParams.get('since')
  const kindParam = url.searchParams.get('kind')
  const limitParam = url.searchParams.get('limit')
  const cursorParam = url.searchParams.get('cursor')

  // Limit parsing — clamp to MAX_LIMIT and fall back to DEFAULT_LIMIT.
  let limit = DEFAULT_LIMIT
  if (limitParam) {
    const parsed = parseInt(limitParam, 10)
    if (!Number.isNaN(parsed) && parsed > 0) {
      limit = Math.min(parsed, MAX_LIMIT)
    }
  }

  let since: Date | undefined
  if (sinceParam) {
    const parsed = new Date(sinceParam)
    if (!Number.isNaN(parsed.getTime())) since = parsed
  }

  // Allowlist eventKind characters so we can confidently pass into
  // Prisma. The kinds are server-emitted constants ('action_allowed',
  // 'scope_granted', 'panic_triggered', etc.) — alphanumerics +
  // underscore.
  let safeKind: string | undefined
  if (kindParam) {
    if (!/^[a-z0-9_]{1,64}$/.test(kindParam)) {
      return NextResponse.json({ error: 'invalid_kind' }, { status: 400 })
    }
    safeKind = kindParam
  }

  let safeCursor: string | undefined
  if (cursorParam) {
    if (!/^[a-z0-9]{1,64}$/.test(cursorParam)) {
      return NextResponse.json({ error: 'invalid_cursor' }, { status: 400 })
    }
    safeCursor = cursorParam
  }

  const where: Prisma.EAPAuditEntryWhereInput = {
    userId: user.id,
  }
  if (since) where.createdAt = { gte: since }
  if (safeKind) where.eventKind = safeKind

  // nosemgrep
  const entries = await prisma.eAPAuditEntry.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(safeCursor ? { skip: 1, cursor: { id: safeCursor } } : {}),
    select: {
      id: true,
      eventKind: true,
      referenceId: true,
      payloadJson: true,
      createdAt: true,
      llmPartnerId: true,
      ipAddress: true,
    },
  })

  // Page-of-N+1 pattern: if we fetched limit+1, the last one is the
  // next-page sentinel.
  let nextCursor: string | null = null
  let page = entries
  if (entries.length > limit) {
    page = entries.slice(0, limit)
    nextCursor = page[page.length - 1]?.id ?? null
  }

  return NextResponse.json({
    entries: page.map((e) => ({
      id: e.id,
      eventKind: e.eventKind,
      referenceId: e.referenceId,
      payloadJson: e.payloadJson,
      createdAt: e.createdAt,
      llmPartnerId: e.llmPartnerId,
      ipAddress: e.ipAddress,
    })),
    nextCursor,
  })
}
