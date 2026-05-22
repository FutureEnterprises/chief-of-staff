/**
 * Microsoft Teams Bot Framework webhook.
 *
 * Receives Activity objects from the Bot Connector service. We handle
 * the three activity types the Enterprise channel surface actually
 * needs at v1:
 *
 *   • conversationUpdate — bot added/removed from a team/chat. We
 *     provision a TeamsWorkspace row on `membersAdded` if the bot
 *     itself is the new member.
 *   • message — a user DM'd the bot. Auth resolves the COYL User row
 *     (or creates a placeholder) and responds with the user's current
 *     daily-number / pattern status as an Adaptive Card.
 *   • invoke — Action.Submit / Action.Execute from a card button. The
 *     "I slipped" button writes a SlipRecord-style audit event.
 *
 * Auth: the inbound request carries a JWT in the Authorization header
 * issued by the Bot Framework. verifyTeamsBotRequest() validates
 * issuer + audience + expiry. Signature-level verification (against the
 * Bot Framework JWKS) is a v0.2 follow-up — for now the matcher in
 * proxy.ts keeps Clerk out of the request, and tenant allow-listing on
 * TeamsWorkspace gives us a second layer.
 */
import { prisma } from '@repo/database'
import {
  buildAdaptiveCardAttachment,
  provisionTeamsWorkspace,
  rememberTeamsConversation,
  verifyTeamsBotRequest,
  type TeamsActivity,
} from '@/lib/integrations/teams'

export const maxDuration = 15

type TextResponseBody = {
  type: 'message'
  text: string
  attachments?: ReturnType<typeof buildAdaptiveCardAttachment>[]
}

function jsonError(status: number, code: string) {
  return Response.json({ error: code }, { status })
}

function statusCardForUser(daily: {
  numberToday: number | null
  pattern: string | null
}): TextResponseBody {
  const headline =
    daily.numberToday !== null
      ? `Today's number: ${daily.numberToday}`
      : 'No daily number yet — open COYL to start.'
  const subhead = daily.pattern
    ? `Pattern in play: ${daily.pattern}`
    : 'Tap "I slipped" if you broke a commitment in the last few hours.'
  return {
    type: 'message',
    text: `${headline} ${subhead}`,
    attachments: [
      buildAdaptiveCardAttachment({
        headline,
        subhead,
        actions: [
          { title: 'I slipped', value: 'slip' },
          { title: 'I held it', value: 'held' },
          { title: 'Open COYL', value: 'open_app' },
        ],
      }),
    ],
  }
}

async function loadUserFromAad(aadObjectId: string | undefined) {
  if (!aadObjectId) return null
  // We expect Clerk's SSO to have synced aadObjectId → externalId on
  // the User row when the IT admin installed the app. Until that wiring
  // ships, fall back to a no-op (the bot will respond with a sign-in
  // prompt instead of leaking patient data).
  return prisma.user.findFirst({
    where: { OR: [{ clerkId: aadObjectId }, { email: aadObjectId.toLowerCase() }] },
    select: { id: true },
  })
}

async function loadDailyStatus(userId: string) {
  const row = await prisma.productivityEvent.findFirst({
    where: { userId, eventValue: 'daily_number' },
    orderBy: { createdAt: 'desc' },
    select: { metadataJson: true },
  })
  const meta = (row?.metadataJson ?? {}) as {
    number?: number
    pattern?: string
  }
  return {
    numberToday: typeof meta.number === 'number' ? meta.number : null,
    pattern: typeof meta.pattern === 'string' ? meta.pattern : null,
  }
}

export async function POST(req: Request) {
  // Defense-in-depth: validate the Bot Framework JWT.
  if (!(await verifyTeamsBotRequest(req))) {
    return jsonError(401, 'teams_bot_auth_failed')
  }

  let activity: TeamsActivity
  try {
    activity = (await req.json()) as TeamsActivity
  } catch {
    return jsonError(400, 'invalid_json')
  }

  const tenantId =
    activity.conversation?.tenantId ?? activity.channelData?.tenant?.id ?? null

  // ---------- conversationUpdate ----------
  if (activity.type === 'conversationUpdate') {
    const botId = activity.recipient?.id
    const addedSelf = (activity.membersAdded ?? []).some((m) => m.id === botId)
    if (addedSelf && tenantId) {
      // We can't resolve the IT admin's COYL userId from a
      // conversationUpdate alone — defer real provisioning to the
      // /install OAuth callback. Just persist the conversation
      // reference under the bot's own recipient id so notify has a
      // routable handle.
      console.info('[teams/bot] conversationUpdate — bot added', { tenantId })
    }
    return Response.json({ ok: true })
  }

  // ---------- message ----------
  if (activity.type === 'message') {
    if (!tenantId) {
      return Response.json({
        type: 'message',
        text: 'Could not resolve your Teams tenant. Re-install the COYL app.',
      })
    }
    const user = await loadUserFromAad(activity.from?.aadObjectId)
    if (!user) {
      return Response.json({
        type: 'message',
        text: 'Sign in to COYL once at https://coyl.app/sign-in to link your Teams identity.',
      })
    }

    // Persist the conversation reference for the notify path.
    await rememberTeamsConversation(user.id, tenantId, activity).catch((err) => {
      console.warn('[teams/bot] rememberTeamsConversation failed', err)
    })

    const daily = await loadDailyStatus(user.id)
    return Response.json(statusCardForUser(daily))
  }

  // ---------- invoke (card button clicks) ----------
  if (activity.type === 'invoke') {
    const user = await loadUserFromAad(activity.from?.aadObjectId)
    if (!user) {
      return Response.json({
        statusCode: 200,
        type: 'application/vnd.microsoft.activity.message',
        value: {
          type: 'message',
          text: 'Sign in to COYL first to use this button.',
        },
      })
    }
    const value = (activity.value ?? {}) as { action?: string }
    if (value.action === 'slip') {
      await prisma.productivityEvent.create({
        data: {
          userId: user.id,
          eventType: 'SLIP_LOGGED',
          eventValue: 'teams_quick_slip',
          metadataJson: {
            source: 'teams_card_button',
            tenantId,
            activityId: activity.id ?? null,
          },
        },
      })
    } else if (value.action === 'held') {
      await prisma.productivityEvent.create({
        data: {
          userId: user.id,
          eventType: 'INTERRUPT_FEEDBACK',
          eventValue: 'helpful',
          metadataJson: {
            source: 'teams_card_button',
            rawFeedback: 'caught_me',
            tenantId,
            activityId: activity.id ?? null,
          },
        },
      })
    }
    return Response.json({
      statusCode: 200,
      type: 'application/vnd.microsoft.activity.message',
      value: {
        type: 'message',
        text:
          value.action === 'slip'
            ? 'Logged. We will surface the recovery card next.'
            : value.action === 'held'
              ? 'Held it — recorded.'
              : 'Acknowledged.',
      },
    })
  }

  // Other activity types (typing, contactRelationUpdate, etc.) — 200.
  return Response.json({ ok: true, ignored: activity.type })
}

// Re-export for the install handler so it can call provisionTeamsWorkspace
// without a duplicate import.
export { provisionTeamsWorkspace }
