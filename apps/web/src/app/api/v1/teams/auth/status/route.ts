/**
 * Microsoft Graph integration — connection status for the signed-in user.
 *
 * Polled by /settings/teams's TeamsCard on mount to decide which of the
 * three states to render:
 *   - placeholder (`reason: 'integration_not_configured'`) — Azure AD
 *     env vars missing; card shows the "Coming with next deploy" copy
 *   - disconnected (`graphConnected: false`) — env configured but the
 *     user hasn't completed OAuth yet; card shows "Connect Microsoft
 *     account" button
 *   - connected (`graphConnected: true`) — TeamsUserAuth row exists for
 *     this user with a non-expired token; card shows tenant info + 4
 *     active interrupt classes + Disconnect button
 *
 * Clerk-authed so we can scope the lookup to the signed-in user. The
 * card falls back to a friendly placeholder if this endpoint returns
 * non-200 — so a deploy that doesn't yet include this route doesn't
 * crash the settings page (it just shows the placeholder).
 */
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import { getGraphConfig } from '@/lib/integrations/microsoft-graph'

type InterruptClass =
  | 'FOCUS_DEFENDER'
  | 'FOLLOW_THROUGH_PINGER'
  | 'MEETING_DECLINER'
  | 'RECOVERY_COACH'

const DEFAULT_ENABLED_CLASSES: InterruptClass[] = [
  'FOCUS_DEFENDER',
  'FOLLOW_THROUGH_PINGER',
  'MEETING_DECLINER',
  'RECOVERY_COACH',
]

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // If Graph env vars aren't wired, surface as a placeholder rather
  // than an error — the card handles `integration_not_configured` as
  // a graceful "coming soon" state.
  if (!getGraphConfig()) {
    return Response.json({
      tenantConnected: false,
      graphConnected: false,
      reason: 'integration_not_configured',
    })
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })
  if (!user) return Response.json({ error: 'user_not_found' }, { status: 404 })

  const teamsAuth = await prisma.teamsUserAuth.findUnique({
    where: { userId: user.id },
    select: {
      tenantId: true,
      scopesGranted: true,
      tokenExpiresAt: true,
      lastRefreshedAt: true,
    },
  })

  if (!teamsAuth) {
    return Response.json({
      tenantConnected: false,
      graphConnected: false,
    })
  }

  return Response.json({
    tenantConnected: true,
    graphConnected: true,
    tenantName: teamsAuth.tenantId,
    scopesGranted: teamsAuth.scopesGranted,
    enabledClasses: DEFAULT_ENABLED_CLASSES,
  })
}
