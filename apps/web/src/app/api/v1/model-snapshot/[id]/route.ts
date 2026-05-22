/**
 * GET /api/v1/model-snapshot/[id] — JSON for the in-app snapshot
 * page render.
 *
 * `id` is the ProductivityEvent.id of the WEEKLY_REPORT_SENT row
 * whose metadataJson.type === 'model_snapshot' (written by the
 * model-snapshot cron). The snapshot itself rides on
 * metadataJson.snapshot, so we just read the row and return that
 * blob.
 *
 * Auth: Clerk Bearer token, same pattern as the rest of the v1
 * surface. Owners only — we 404 to anyone else to avoid leaking
 * which snapshot ids exist.
 *
 * Note: this route returns JSON only. The eventual /snapshot/[id]
 * page (owned by the snapshot UI agent) fetches from here, then
 * renders via <SnapshotCard />.
 */

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import type { ModelSnapshot } from '@/lib/model-snapshot'

export const maxDuration = 10

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  if (!id) {
    return Response.json({ error: 'missing_snapshot_id' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })
  if (!user) return Response.json({ error: 'user_not_found' }, { status: 404 })

  const event = await prisma.productivityEvent.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      createdAt: true,
      eventValue: true,
      metadataJson: true,
    },
  })

  // 404 to non-owners and to events that aren't snapshots — same
  // status code keeps existence opaque.
  if (!event || event.userId !== user.id) {
    return Response.json({ error: 'snapshot_not_found' }, { status: 404 })
  }

  const meta =
    event.metadataJson && typeof event.metadataJson === 'object' && !Array.isArray(event.metadataJson)
      ? (event.metadataJson as Record<string, unknown>)
      : null

  if (!meta || meta.type !== 'model_snapshot' || !meta.snapshot) {
    return Response.json({ error: 'snapshot_not_found' }, { status: 404 })
  }

  // Trust the writer: the cron persisted a ModelSnapshot here.
  // Cast at the boundary; downstream renderers can apply zod if they
  // want a runtime check (and any drift would surface there cleanly).
  const snapshot = meta.snapshot as ModelSnapshot
  const periodDays = typeof meta.periodDays === 'number' ? meta.periodDays : null

  return Response.json({
    id: event.id,
    generatedAt: event.createdAt.toISOString(),
    periodDays,
    snapshot,
  })
}
