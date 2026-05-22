/**
 * Server-to-Teams notify endpoint.
 *
 * Called by /api/cron/danger-window-interrupt (and any other interrupt
 * cron that wants an enterprise channel surface) when a user has a
 * TeamsWorkspace association. POSTs a JSON envelope:
 *
 *   {
 *     userId: string        // COYL User.id, NOT aadObjectId
 *     headline: string
 *     subhead?: string
 *     fallbackText?: string
 *     actions?: { title: string, value: string }[]
 *   }
 *
 * Gates:
 *   1. Clerk auth — must be an authenticated request.
 *   2. requireAdmin() — caller must be on the ADMIN_EMAILS allow-list,
 *      OR carry a CRON_SECRET Bearer token for first-party cron jobs.
 *   3. TeamsWorkspace.active must be true.
 *
 * The route lives under /api/v1/teams/(.*) which is added to proxy.ts'
 * public-route matcher so Clerk's auto-protect doesn't 302 it — but
 * we still call auth() explicitly inside the handler.
 */
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import { requireAdmin } from '@/lib/admin-auth'
import {
  constantTimeEq,
  getTeamsConfig,
  sendTeamsCard,
} from '@/lib/integrations/teams'

export const maxDuration = 30

type NotifyBody = {
  userId?: unknown
  headline?: unknown
  subhead?: unknown
  fallbackText?: unknown
  actions?: unknown
}

function isAction(v: unknown): v is { title: string; value: string } {
  return (
    !!v &&
    typeof v === 'object' &&
    typeof (v as Record<string, unknown>).title === 'string' &&
    typeof (v as Record<string, unknown>).value === 'string'
  )
}

/**
 * Cron path: server-to-server requests carry a Bearer of CRON_SECRET
 * instead of a Clerk session. We accept either here.
 */
function hasCronAuth(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const header = req.headers.get('authorization') ?? ''
  if (!header.toLowerCase().startsWith('bearer ')) return false
  return constantTimeEq(header.slice(7).trim(), secret)
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  if (!getTeamsConfig()) {
    return Response.json({ error: 'integration_not_configured' }, { status: 503 })
  }

  // Two-track auth: cron-secret OR Clerk-admin. Either is sufficient.
  let authedAs: 'cron' | 'admin' | null = null
  if (hasCronAuth(req)) {
    authedAs = 'cron'
  } else {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'unauthorized' }, { status: 401 })
    }
    try {
      await requireAdmin()
      authedAs = 'admin'
    } catch {
      return Response.json({ error: 'forbidden' }, { status: 403 })
    }
  }

  const { tenantId } = await params
  if (!tenantId) {
    return Response.json({ error: 'missing_tenant_id' }, { status: 400 })
  }

  let body: NotifyBody
  try {
    body = (await req.json()) as NotifyBody
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 })
  }

  if (typeof body.userId !== 'string' || body.userId.length === 0) {
    return Response.json({ error: 'missing_userId' }, { status: 400 })
  }
  if (typeof body.headline !== 'string' || body.headline.length === 0) {
    return Response.json({ error: 'missing_headline' }, { status: 400 })
  }

  const workspace = await prisma.teamsWorkspace.findUnique({
    where: { tenantId },
    select: { active: true, defaultPlan: true },
  })
  if (!workspace || !workspace.active) {
    return Response.json({ error: 'workspace_not_found' }, { status: 404 })
  }

  const actions = Array.isArray(body.actions)
    ? body.actions.filter(isAction)
    : undefined

  try {
    await sendTeamsCard(tenantId, body.userId, {
      headline: body.headline,
      subhead: typeof body.subhead === 'string' ? body.subhead : undefined,
      fallbackText:
        typeof body.fallbackText === 'string' ? body.fallbackText : undefined,
      actions,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[teams/notify] send failed', { tenantId, msg, authedAs })
    return Response.json({ error: 'send_failed', detail: msg }, { status: 502 })
  }

  // Audit the send so the today-view can show "delivered via Teams".
  await prisma.productivityEvent.create({
    data: {
      userId: body.userId,
      eventType: 'NOTIFICATION_OPENED',
      eventValue: 'teams_notify_sent',
      metadataJson: {
        type: 'teams_notify_sent',
        tenantId,
        headline: body.headline,
        authedAs,
      },
    },
  })

  return Response.json({ ok: true, channel: 'teams' })
}
