/**
 * Microsoft Teams Bot Framework integration helpers.
 *
 * Channel surface #1 of the Enterprise B2B funnel (Microsoft Viva). One
 * tenant = one TeamsWorkspace row. Conversation/message routing is via
 * the Bot Framework Service URL the client provides in every incoming
 * Activity — we never compute it. The bot identity (MS_BOT_APP_ID +
 * MS_BOT_APP_PASSWORD) is single-tenant per env; bots installed in N
 * tenants share the same identity.
 *
 * Cards: Adaptive Cards v1.5 (Teams supports up to 1.5 at the time of
 * write). The danger-window-interrupt cron calls sendTeamsCard with a
 * payload it shapes server-side — never let the user shape the JSON.
 */
import crypto from 'node:crypto'
import { prisma, type TeamsWorkspace } from '@repo/database'

import { encryptToken, decryptToken } from './dexcom'

export const MS_BOT_LOGIN_URL =
  'https://login.microsoftonline.com/botframework.com/oauth2/v2.0/token'
export const MS_BOT_OPENID_URL =
  'https://login.botframework.com/v1/.well-known/openidconfiguration'

export type TeamsConfig = {
  appId: string
  appPassword: string
  tenantId: string
}

/**
 * Read the singleton bot-registration credentials from env. The Teams
 * channel re-uses one Bot Framework app across all customer tenants —
 * tenant-specific state lives on TeamsWorkspace rows, not on env vars.
 *
 * Returns null when not configured so callers can translate into 503
 * `integration_not_configured` without a noisy throw.
 */
export function getTeamsConfig(): TeamsConfig | null {
  const appId = process.env.MS_BOT_APP_ID
  const appPassword = process.env.MS_BOT_APP_PASSWORD
  const tenantId = process.env.MS_BOT_TENANT_ID
  if (!appId || !appPassword || !tenantId) return null
  return { appId, appPassword, tenantId }
}

/**
 * Minimal Bot Framework Activity. We only consume a handful of fields
 * on inbound and shape the outbound ourselves; the full schema is
 * documented at https://learn.microsoft.com/azure/bot-service/rest-api/.
 */
export type TeamsActivity = {
  type: 'message' | 'conversationUpdate' | 'invoke' | string
  id?: string
  serviceUrl?: string
  channelId?: string
  from?: { id: string; name?: string; aadObjectId?: string }
  recipient?: { id: string; name?: string }
  conversation?: { id: string; tenantId?: string; conversationType?: string }
  channelData?: {
    tenant?: { id: string }
    team?: { id: string; name?: string }
  }
  text?: string
  value?: unknown
  membersAdded?: Array<{ id: string }>
  membersRemoved?: Array<{ id: string }>
  replyToId?: string
}

type CachedToken = { value: string; expiresAt: number }
let cachedBotToken: CachedToken | null = null

/**
 * Get a Bot Framework access token via client_credentials. Cached in
 * memory between invocations within a warm function instance — Vercel's
 * Fluid Compute reuses instances so this matters even at v1 scale.
 *
 * The Bot Framework login endpoint expects `scope=https://api.botframework.com/.default`.
 */
async function getBotAccessToken(): Promise<string | null> {
  const config = getTeamsConfig()
  if (!config) return null

  const now = Date.now()
  if (cachedBotToken && cachedBotToken.expiresAt > now + 60_000) {
    return cachedBotToken.value
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: config.appId,
    client_secret: config.appPassword,
    scope: 'https://api.botframework.com/.default',
  })
  const res = await fetch(MS_BOT_LOGIN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: body.toString(),
  })
  if (!res.ok) return null
  const data = (await res.json()) as {
    access_token?: string
    expires_in?: number
  }
  if (!data.access_token) return null
  cachedBotToken = {
    value: data.access_token,
    expiresAt: now + (data.expires_in ?? 3600) * 1000,
  }
  return data.access_token
}

export type AdaptiveCardPayload = {
  /** Plain-text fallback for clients that can't render cards. */
  fallbackText?: string
  /** Headline shown bold at the top of the card. */
  headline: string
  /** Optional sub-text rendered under the headline. */
  subhead?: string
  /**
   * Optional action buttons. Each becomes an Action.Submit with a `data`
   * payload that the bot receives on the `invoke` activity.
   */
  actions?: Array<{ title: string; value: string }>
}

/**
 * Build an Adaptive Card v1.5 wrapped in the Bot Framework's
 * `attachments` shape. Server-side only — never accept this JSON from
 * a client.
 */
export function buildAdaptiveCardAttachment(payload: AdaptiveCardPayload) {
  const body: Array<Record<string, unknown>> = [
    {
      type: 'TextBlock',
      text: payload.headline,
      weight: 'bolder',
      size: 'medium',
      wrap: true,
    },
  ]
  if (payload.subhead) {
    body.push({
      type: 'TextBlock',
      text: payload.subhead,
      isSubtle: true,
      wrap: true,
      spacing: 'small',
    })
  }
  const actions = (payload.actions ?? []).map((a) => ({
    type: 'Action.Submit',
    title: a.title,
    data: { action: a.value },
  }))
  return {
    contentType: 'application/vnd.microsoft.card.adaptive',
    content: {
      type: 'AdaptiveCard',
      $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
      version: '1.5',
      body,
      ...(actions.length > 0 ? { actions } : {}),
    },
  }
}

/**
 * Send an Adaptive Card to a Teams user/conversation via the Bot
 * Framework Service URL. The serviceUrl is per-conversation — we stored
 * it on the TeamsWorkspace row (or per-user mapping) when the user first
 * interacted with the bot.
 *
 * Throws on missing config so callers can fall back to another channel
 * (push, SMS). Callers must catch.
 */
export async function sendTeamsCard(
  tenantId: string,
  userId: string,
  payload: AdaptiveCardPayload,
): Promise<void> {
  const workspace = await prisma.teamsWorkspace.findUnique({
    where: { tenantId },
    select: { id: true, active: true },
  })
  if (!workspace || !workspace.active) {
    throw new Error(`teams_workspace_not_found:${tenantId}`)
  }

  // Conversation state lives on ProductivityEvent rows keyed by userId +
  // tenantId. The bot persists serviceUrl + conversationId on every
  // inbound message so we always have fresh routing info.
  const conversation = await prisma.productivityEvent.findFirst({
    where: {
      userId,
      eventValue: 'teams_conversation_ref',
      metadataJson: { path: ['tenantId'], equals: tenantId },
    },
    orderBy: { createdAt: 'desc' },
    select: { metadataJson: true },
  })
  if (!conversation) {
    throw new Error(`teams_conversation_ref_missing:${userId}:${tenantId}`)
  }
  const meta = conversation.metadataJson as {
    serviceUrl?: string
    conversationId?: string
    botId?: string
    userTeamsId?: string
  }
  if (!meta.serviceUrl || !meta.conversationId) {
    throw new Error('teams_conversation_ref_malformed')
  }

  const accessToken = await getBotAccessToken()
  if (!accessToken) throw new Error('teams_bot_token_failed')

  const base = meta.serviceUrl.endsWith('/')
    ? meta.serviceUrl.slice(0, -1)
    : meta.serviceUrl
  const url = `${base}/v3/conversations/${encodeURIComponent(meta.conversationId)}/activities`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      type: 'message',
      text: payload.fallbackText ?? payload.headline,
      attachments: [buildAdaptiveCardAttachment(payload)],
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`teams_send_failed:${res.status}:${text.slice(0, 200)}`)
  }
}

/**
 * Upsert a TeamsWorkspace row. Called from /api/v1/teams/install once we
 * have the tenantId + the IT admin's COYL userId. Idempotent — re-runs
 * just refresh workspaceName + active=true.
 */
export async function provisionTeamsWorkspace(
  tenantId: string,
  workspaceName: string,
  installedById: string,
): Promise<TeamsWorkspace> {
  return prisma.teamsWorkspace.upsert({
    where: { tenantId },
    create: {
      tenantId,
      workspaceName,
      installedById,
      active: true,
    },
    update: {
      workspaceName,
      active: true,
    },
  })
}

/**
 * Persist the conversation reference from an inbound Activity so future
 * outbound sends know where to route. Stored as a ProductivityEvent
 * (FEATURE_USED, value='teams_conversation_ref') so we don't need a
 * dedicated table for v1.
 *
 * userId here is the COYL user.id, not the Teams aadObjectId. The bot
 * webhook is responsible for mapping aadObjectId → User.id (typically
 * via the email Clerk has on file after the SSO handshake).
 */
export async function rememberTeamsConversation(
  userId: string,
  tenantId: string,
  activity: TeamsActivity,
): Promise<void> {
  if (!activity.serviceUrl || !activity.conversation?.id) return
  await prisma.productivityEvent.create({
    data: {
      userId,
      eventType: 'FEATURE_USED',
      eventValue: 'teams_conversation_ref',
      metadataJson: {
        tenantId,
        serviceUrl: activity.serviceUrl,
        conversationId: activity.conversation.id,
        botId: activity.recipient?.id ?? null,
        userTeamsId: activity.from?.id ?? null,
        aadObjectId: activity.from?.aadObjectId ?? null,
      },
    },
  })
}

/**
 * Bot Framework JWT signing keys are advertised at a well-known OpenID
 * Connect discovery URL. Production-grade verification fetches the JWKS
 * and verifies the RS256 signature against the kid embedded in the JWT
 * header.
 *
 * v0.1 implementation:
 *   - Parses the Bearer token from the Authorization header
 *   - Decodes the JWT payload (no signature check yet)
 *   - Validates `aud` matches MS_BOT_APP_ID
 *   - Validates `iss` is from the Bot Framework issuer set
 *   - Validates `exp` is in the future
 *
 * TODO(prod): pull JWKS from the openid-configuration jwks_uri, cache
 * by kid, verify signature with crypto.verify('RSA-SHA256', ...). Until
 * then this is defence-in-depth, NOT a sole auth layer — pair with
 * the proxy.ts public-matcher gate + tenant-level allow-listing.
 */
export async function verifyTeamsBotRequest(req: Request): Promise<boolean> {
  const auth = req.headers.get('authorization') ?? req.headers.get('Authorization')
  if (!auth || !auth.toLowerCase().startsWith('bearer ')) return false
  const token = auth.slice(7).trim()
  const parts = token.split('.')
  if (parts.length !== 3) return false
  const config = getTeamsConfig()
  if (!config) return false

  let payload: Record<string, unknown>
  try {
    const b64 = parts[1]!.replace(/-/g, '+').replace(/_/g, '/')
    const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4))
    const json = Buffer.from(b64 + pad, 'base64').toString('utf8')
    payload = JSON.parse(json) as Record<string, unknown>
  } catch {
    return false
  }

  const aud = payload.aud
  if (typeof aud !== 'string' || aud !== config.appId) return false

  const iss = payload.iss
  // Microsoft rotates issuer strings periodically — these are the two
  // currently advertised in the openid-configuration document.
  const allowedIssuers = new Set([
    'https://api.botframework.com',
    'https://api.botframework.com/v1.0',
  ])
  if (typeof iss !== 'string' || !allowedIssuers.has(iss)) return false

  const exp = payload.exp
  if (typeof exp !== 'number' || exp * 1000 < Date.now()) return false

  return true
}

// ────────────────────────────────────────────────────────────────────
// ARCHETYPE INTERRUPT CARDS — the four COYL-differentiated interrupts
// that ship inside Teams (and AppSource v0.2 submission).
//
// Every COYL interrupt fits one of these four classes. The card factory
// returns a fully-formed AdaptiveCardPayload that callers feed into
// sendTeamsCard(). Buttons on each card become Action.Submit posts that
// the bot route in /api/v1/teams/bot/messages already handles.
//
// Design principle: each card has at most ONE primary CTA + at most
// TWO secondary actions. Adaptive Card cognitive load research (and
// the Teams UI guidelines) put hard caps at 4 actions; we stop at 3
// to keep the surface contemplative, not busy.
//
// Class:                    For archetype:           Fires when:
//   FOCUS_DEFENDER           One-More-Tabber          15 min before a Calendar focus block
//   FOLLOW_THROUGH_PINGER    9 PM Negotiator, Spiral  Sent email with >48h no reply to ranked contact
//   MEETING_DECLINER         Capitulator              Meeting density >70% × 3 consecutive days
//   RECOVERY_COACH           Deserver, post-slip      Back-to-back heavy meetings just ended
// ────────────────────────────────────────────────────────────────────

export type InterruptClass =
  | 'FOCUS_DEFENDER'
  | 'FOLLOW_THROUGH_PINGER'
  | 'MEETING_DECLINER'
  | 'RECOVERY_COACH'

export type InterruptContext = {
  /** Optional COYL archetype slug for telemetry (the family the user pinned to). */
  archetype?: string
  /** Free-form context the card factory consumes (commitments, contact name, etc.). */
  data?: Record<string, string | number | undefined>
}

/**
 * Build a Focus Defender adaptive card.
 *
 * Fires 15 minutes before a Calendar event tagged as a focus block.
 * Pulls the user's three open commitments (lives on the Commitments
 * table) and presents them as the "what you said you'd finish" anchor.
 * Primary CTA silences Teams + auto-declines internal interrupts for
 * the duration of the focus block via the Bot's calendar permissions.
 */
export function buildFocusDefenderCard(ctx: InterruptContext = {}): AdaptiveCardPayload {
  const commitments = (ctx.data?.commitments as string) || 'Three open commitments on your list.'
  const minutesUntil = (ctx.data?.minutesUntil as number) ?? 15
  return {
    headline: `Focus block in ${minutesUntil} min.`,
    subhead: `What you said you'd finish:\n${commitments}\n\nWant me to silence Teams + decline interrupts for the duration?`,
    fallbackText: `Focus block in ${minutesUntil} min — protect it?`,
    actions: [
      { title: 'Protect the block', value: 'focus_defender.protect' },
      { title: 'Snooze 5 min', value: 'focus_defender.snooze' },
      { title: 'Cancel block', value: 'focus_defender.cancel' },
    ],
  }
}

/**
 * Build a Follow-Through Pinger adaptive card.
 *
 * Fires when an outbound email to a ranked-important contact has been
 * sitting >48h without a reply. The "9 PM Negotiator" and "Spiral
 * Extender" archetypes are the highest-leverage targets — both fold on
 * follow-through under load. The card surfaces the original message
 * snippet so the user doesn't have to context-switch back to Outlook
 * to remember what they promised.
 */
export function buildFollowThroughPingerCard(ctx: InterruptContext = {}): AdaptiveCardPayload {
  const contact = (ctx.data?.contact as string) || 'someone you care about'
  const promiseDay = (ctx.data?.promiseDay as string) || 'a few days ago'
  const snippet = (ctx.data?.snippet as string) || ''
  return {
    headline: `You promised ${contact} a response.`,
    subhead: snippet
      ? `From your sent message ${promiseDay}:\n"${snippet}"\n\nSend now while it's small?`
      : `${promiseDay}. Send now while it's small?`,
    fallbackText: `Follow-up overdue: ${contact}`,
    actions: [
      { title: 'Draft a reply', value: 'follow_through.draft' },
      { title: 'Snooze 1 day', value: 'follow_through.snooze' },
      { title: "Won't do", value: 'follow_through.decline' },
    ],
  }
}

/**
 * Build a Meeting Decliner adaptive card.
 *
 * Fires when calendar density crosses a threshold (>70% of day in
 * meetings, ≥3 days running). The "Capitulator" archetype is the
 * primary target — they fold under social/calendar pressure rather
 * than appetite or fatigue. The card pre-identifies two meetings on
 * tomorrow's calendar that can be declined without consequence (e.g.,
 * optional invitees, status meetings, meetings where the user hasn't
 * been a speaker in the last three occurrences).
 */
export function buildMeetingDeclinerCard(ctx: InterruptContext = {}): AdaptiveCardPayload {
  const density = (ctx.data?.density as string) || '78%'
  const days = (ctx.data?.days as number) ?? 3
  const candidates = (ctx.data?.candidates as string) || 'Two meetings tomorrow could be declined without consequence.'
  return {
    headline: `You've been in meetings ${density} of the last ${days} days.`,
    subhead: `${candidates}\n\nWant me to draft the declines?`,
    fallbackText: `Meeting density elevated — review tomorrow's calendar?`,
    actions: [
      { title: 'Show the candidates', value: 'meeting_decliner.show' },
      { title: 'Not today', value: 'meeting_decliner.dismiss' },
    ],
  }
}

/**
 * Build a Recovery Coach adaptive card.
 *
 * Fires after a "high cortisol" window — back-to-back heavy meetings
 * just ended, a deadline just slipped, an email exchange ran hot. The
 * "Deserver" archetype is the primary target: they reach for the
 * reward script ("I worked hard, I earned this") in exactly this
 * moment. The card offers a 60-second recovery ritual instead.
 */
export function buildRecoveryCoachCard(ctx: InterruptContext = {}): AdaptiveCardPayload {
  const trigger = (ctx.data?.trigger as string) || 'A hard window just ended.'
  const nextEvent = (ctx.data?.nextEvent as string) || 'Next thing on calendar is in a few minutes.'
  return {
    headline: trigger,
    subhead: `${nextEvent}\n\n60 seconds of recovery before the next thing — keep the reward script quiet?`,
    fallbackText: 'Recovery moment available.',
    actions: [
      { title: 'Take 60 seconds', value: 'recovery_coach.breath' },
      { title: 'Stretch instead', value: 'recovery_coach.stretch' },
      { title: 'Skip', value: 'recovery_coach.skip' },
    ],
  }
}

/**
 * Dispatch a class string to its card factory. Used by the
 * /api/v1/teams/interrupt/[tenantId] notify-by-class endpoint and any
 * future cron that wants to pick a class by signal pattern.
 */
export function buildInterruptCard(
  cls: InterruptClass,
  ctx: InterruptContext = {},
): AdaptiveCardPayload {
  switch (cls) {
    case 'FOCUS_DEFENDER':
      return buildFocusDefenderCard(ctx)
    case 'FOLLOW_THROUGH_PINGER':
      return buildFollowThroughPingerCard(ctx)
    case 'MEETING_DECLINER':
      return buildMeetingDeclinerCard(ctx)
    case 'RECOVERY_COACH':
      return buildRecoveryCoachCard(ctx)
  }
}

// Re-export encryption helpers for parity with other integration libs —
// notify routes use these when storing per-tenant secrets on event rows.
export { encryptToken, decryptToken }

/**
 * Constant-time string compare. Used by the notify route to validate
 * an optional shared-secret header in addition to Clerk admin auth —
 * defence-in-depth for the server-to-bot path.
 */
export function constantTimeEq(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return crypto.timingSafeEqual(ab, bb)
}
