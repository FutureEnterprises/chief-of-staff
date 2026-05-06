import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'

/**
 * Personal data export — GDPR Article 15 ("right of access"), CCPA, and
 * App Store privacy requirements. Returns a single JSON file containing
 * everything we hold for the requesting user. Streamed as a download
 * via Content-Disposition: attachment.
 *
 * What's included:
 *   • User profile fields
 *   • Commitments + slip records + excuses + decision logs + rescues
 *   • Danger window records
 *   • Productivity events (last 365d cap to bound payload size)
 *   • AI interactions (last 365d cap)
 *
 * What's NOT included:
 *   • Other users' data even when surfaced in shared contexts (partners,
 *     pods) — privacy of the peer overrides the requester's "give me
 *     everything" claim
 *   • Internal cron-derived signals that aren't tied to user-input data
 *   • Clerk-side identity records (the user can export those from Clerk
 *     directly)
 *
 * Format: a single JSON payload. Easier to consume than CSV for nested
 * data; the schema is documented inline in `_meta` so a recipient can
 * understand the shape without reading our codebase.
 */
export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const yearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)

  const [
    commitments,
    slipRecords,
    excuses,
    decisionLogs,
    rescueSessions,
    dangerWindowRecords,
    productivityEvents,
    aiInteractions,
    scenarios,
    checkins,
  ] = await Promise.all([
    prisma.commitment.findMany({ where: { userId: user.id } }),
    prisma.slipRecord.findMany({ where: { userId: user.id } }),
    prisma.excuse.findMany({ where: { userId: user.id } }),
    prisma.decisionLog.findMany({ where: { userId: user.id } }),
    prisma.rescueSession.findMany({ where: { userId: user.id } }),
    prisma.dangerWindow.findMany({ where: { userId: user.id } }),
    prisma.productivityEvent.findMany({
      where: { userId: user.id, createdAt: { gte: yearAgo } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.aiInteraction.findMany({
      where: { userId: user.id, createdAt: { gte: yearAgo } },
      orderBy: { createdAt: 'desc' },
      // 1-year cap on AI interactions — older ones are functionally
      // archival noise and bloat the export. User can request older
      // history via support if needed.
    }),
    prisma.scenarioSim.findMany({ where: { userId: user.id } }),
    prisma.checkin.findMany({ where: { userId: user.id } }),
  ])

  const payload = {
    _meta: {
      exportedAt: new Date().toISOString(),
      formatVersion: '1.0',
      userId: user.id,
      schema:
        'https://coyl.ai/docs/user-data-export.json — single JSON document, all dates ISO-8601 UTC, all relations flattened to arrays grouped by primary entity',
    },
    profile: user,
    commitments,
    slipRecords,
    excuses,
    decisionLogs,
    rescueSessions,
    dangerWindowRecords,
    scenarios,
    checkins,
    productivityEvents,
    aiInteractions,
  }

  const filename = `coyl-data-export-${new Date().toISOString().slice(0, 10)}.json`

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      // Don't cache — data export should always reflect current state.
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}
