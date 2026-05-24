/**
 * Server-to-Teams notify-by-class endpoint — the COYL-differentiated
 * interrupt surface inside Microsoft Teams.
 *
 * Distinct from /api/v1/teams/notify/[tenantId] (free-form headline +
 * subhead). This route accepts an InterruptClass + structured context
 * and dispatches to the right archetype card factory in
 * lib/integrations/teams.ts. Callers don't shape adaptive-card JSON;
 * they say "fire a FOCUS_DEFENDER with these three commitments" and
 * the layer below builds the card.
 *
 * Typical caller: /api/cron/teams-graph-pull (when shipped) discovers
 * a focus block 15 min from now and POSTs:
 *
 *   {
 *     userId: 'usr_abc',
 *     interruptClass: 'FOCUS_DEFENDER',
 *     context: {
 *       archetype: 'the-one-more-tabber',
 *       data: {
 *         minutesUntil: 15,
 *         commitments: '• Ship the Q3 review\n• Reply to Sam\n• Code review PR #482',
 *       },
 *     },
 *   }
 *
 * Gates:
 *   1. Cron-secret OR Clerk admin (same two-track auth as the free-form
 *      /notify route).
 *   2. TeamsWorkspace.active must be true.
 *   3. InterruptClass must be one of the four factory-supported values.
 *
 * On success, audits the send as a NOTIFICATION_OPENED productivity
 * event tagged 'teams_interrupt_sent' so the Today view shows the
 * delivery and downstream cohort analytics can attribute outcomes to
 * the right interrupt class.
 */
import { z } from 'zod'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import { requireAdmin } from '@/lib/admin-auth'
import {
  buildInterruptCard,
  constantTimeEq,
  getTeamsConfig,
  sendTeamsCard,
  type InterruptClass,
  type InterruptContext,
} from '@/lib/integrations/teams'

export const maxDuration = 30

const tenantIdSchema = z
  .string()
  .min(8)
  .max(64)
  .regex(/^[a-zA-Z0-9-]+$/, 'tenant_id_invalid')

const interruptClassSchema = z.enum([
  'FOCUS_DEFENDER',
  'FOLLOW_THROUGH_PINGER',
  'MEETING_DECLINER',
  'RECOVERY_COACH',
])

const userIdSchema = z.string().regex(/^c[a-z0-9]{20,}$/i, 'user_id_invalid')

const interruptBodySchema = z.object({
  userId: userIdSchema,
  interruptClass: interruptClassSchema,
  context: z
    .object({
      archetype: z.string().max(64).optional(),
      data: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
    })
    .optional(),
})

function hasCronAuth(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const header = req.headers.get('authorization') ?? ''
  if (!header.toLowerCase().startsWith('bearer ')) return false
  return constantTimeEq(header.slice(7).trim(), secret)
}

/**
 * Extract + validate the tenantId path param. Returns a CUID-shaped
 * string OR a Response. Keeping this at the handler surface (rather
 * than inside the DB helper) breaks the taint chain that a strict
 * scanner sees from ctx.params → prisma. Same pattern the
 * checkin-schedules CRUD route uses.
 */
async function extractValidatedTenantId(
  ctx: { params: Promise<{ tenantId: string }> },
): Promise<string | Response> {
  const params = await ctx.params
  const rawTenantId: unknown = params?.tenantId
  const parsed = tenantIdSchema.safeParse(rawTenantId)
  if (!parsed.success) {
    return Response.json({ error: 'tenant_id_invalid' }, { status: 400 })
  }
  return parsed.data
}

/**
 * All DB work lives here behind plain validated strings — no ctx,
 * no path-param surface. Returns either a success body or an error
 * Response. Authed-as is propagated for the audit-trail metadata.
 */
async function dispatchInterrupt(args: {
  validatedTenantId: string
  validatedUserId: string
  interruptClass: InterruptClass
  interruptContext: InterruptContext
  authedAs: 'cron' | 'admin'
}): Promise<Response> {
  const { validatedTenantId, validatedUserId, interruptClass, interruptContext, authedAs } = args

  const workspace = await prisma.teamsWorkspace.findUnique({
    where: { tenantId: validatedTenantId },
    select: { active: true },
  })
  if (!workspace || !workspace.active) {
    return Response.json({ error: 'workspace_not_found' }, { status: 404 })
  }

  const card = buildInterruptCard(interruptClass, interruptContext)

  try {
    await sendTeamsCard(validatedTenantId, validatedUserId, card)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[teams/interrupt] send failed', {
      tenantId: validatedTenantId,
      class: interruptClass,
      msg,
      authedAs,
    })
    return Response.json({ error: 'send_failed', detail: msg }, { status: 502 })
  }

  // Audit the send so the Today view can show "delivered via Teams"
  // and downstream cohort analytics can attribute outcomes (hold-rate
  // by interrupt class).
  await prisma.productivityEvent.create({
    data: {
      userId: validatedUserId,
      eventType: 'NOTIFICATION_OPENED',
      eventValue: 'teams_interrupt_sent',
      metadataJson: {
        type: 'teams_interrupt_sent',
        tenantId: validatedTenantId,
        interruptClass,
        archetype: interruptContext.archetype ?? null,
        headline: card.headline,
        authedAs,
      },
    },
  })

  return Response.json({
    ok: true,
    channel: 'teams',
    interruptClass,
    cardHeadline: card.headline,
  })
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ tenantId: string }> },
) {
  if (!getTeamsConfig()) {
    return Response.json({ error: 'integration_not_configured' }, { status: 503 })
  }

  // Two-track auth: cron-secret (server-to-server) or Clerk admin.
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

  // Extract + validate path param FIRST, at the handler surface.
  // Downstream helpers receive a plain validated string — never ctx.
  const tenantIdOrError = await extractValidatedTenantId(ctx)
  if (tenantIdOrError instanceof Response) return tenantIdOrError
  const validatedTenantId: string = tenantIdOrError

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 })
  }
  const parsed = interruptBodySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'invalid_body', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  return dispatchInterrupt({
    validatedTenantId,
    validatedUserId: parsed.data.userId,
    interruptClass: parsed.data.interruptClass,
    interruptContext: parsed.data.context ?? {},
    authedAs,
  })
}
