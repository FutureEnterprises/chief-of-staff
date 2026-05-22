/**
 * Slack integration helpers.
 *
 * Channel surface #2 of the Enterprise B2B funnel. Slack apps are
 * installed per-workspace, OAuth-style: the install flow lands a
 * bot_token + team_id which we persist (encrypted) on a ProductivityEvent
 * row. Outbound sends use the Web API's chat.postMessage with a Block
 * Kit payload; inbound events arrive via the Events API which is HMAC-
 * signed with SLACK_SIGNING_SECRET.
 *
 * We deliberately do NOT use @slack/web-api or @slack/bolt — keeps the
 * function bundle small and avoids the lazy-init / dynamic-import
 * footguns those libraries have on the edge. Raw fetch is enough.
 */
import crypto from 'node:crypto'
import { prisma } from '@repo/database'

import { encryptToken, decryptToken, getEncryptionKey } from './dexcom'

export const SLACK_OAUTH_AUTHORIZE_URL = 'https://slack.com/oauth/v2/authorize'
export const SLACK_OAUTH_ACCESS_URL = 'https://slack.com/api/oauth.v2.access'
export const SLACK_POST_MESSAGE_URL = 'https://slack.com/api/chat.postMessage'

export type SlackAppConfig = {
  clientId: string
  clientSecret: string
  signingSecret: string
  redirectUri: string
}

/**
 * Read the Slack app credentials from env. Returns null if any required
 * value is missing — callers translate to 503 `integration_not_configured`.
 *
 * SLACK_REDIRECT_URI defaults to `${NEXT_PUBLIC_APP_URL}/api/v1/slack/install`
 * to match Vercel preview/prod environments without manual reconfig.
 */
export function getSlackConfig(): SlackAppConfig | null {
  const clientId = process.env.SLACK_CLIENT_ID
  const clientSecret = process.env.SLACK_CLIENT_SECRET
  const signingSecret = process.env.SLACK_SIGNING_SECRET
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coyl.app'
  const redirectUri =
    process.env.SLACK_REDIRECT_URI ?? `${appUrl}/api/v1/slack/install`
  if (!clientId || !clientSecret || !signingSecret) return null
  return { clientId, clientSecret, signingSecret, redirectUri }
}

/**
 * Build the install URL for "Add to Slack". Bot scopes are the minimum
 * needed for direct-message-based interrupts:
 *   chat:write          — post messages
 *   im:write            — open a DM channel with a user
 *   im:history          — read message.im events
 *   users:read          — resolve user.id ↔ team identity
 */
export function buildSlackInstallUrl(state: string): string | null {
  const config = getSlackConfig()
  if (!config) return null
  const params = new URLSearchParams({
    client_id: config.clientId,
    scope: 'chat:write,im:write,im:history,users:read',
    redirect_uri: config.redirectUri,
    state,
  })
  return `${SLACK_OAUTH_AUTHORIZE_URL}?${params.toString()}`
}

export type SlackOAuthResponse = {
  ok: boolean
  error?: string
  access_token?: string // bot user oauth token (xoxb-...)
  token_type?: string
  scope?: string
  bot_user_id?: string
  app_id?: string
  team?: { id: string; name?: string }
  authed_user?: { id: string; scope?: string; access_token?: string }
}

/**
 * Exchange the OAuth code for a bot token + workspace metadata.
 */
export async function exchangeSlackCode(
  code: string,
): Promise<SlackOAuthResponse | null> {
  const config = getSlackConfig()
  if (!config) return null
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    redirect_uri: config.redirectUri,
  })
  const res = await fetch(SLACK_OAUTH_ACCESS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: body.toString(),
  })
  if (!res.ok) return null
  const data = (await res.json()) as SlackOAuthResponse
  return data
}

export type SlackBlock = Record<string, unknown>

export type SlackMessagePayload = {
  /** Fallback text for notifications & screen-readers. */
  text: string
  /** Optional Block Kit blocks (preferred for richer rendering). */
  blocks?: SlackBlock[]
}

/**
 * Build a basic Block Kit message from the same shape used by Teams
 * cards. Keeps the interrupt-payload shape symmetrical across channels.
 */
export function buildBlockKitMessage(payload: {
  headline: string
  subhead?: string
  actions?: Array<{ title: string; value: string }>
  fallbackText?: string
}): SlackMessagePayload {
  const blocks: SlackBlock[] = [
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*${payload.headline}*` },
    },
  ]
  if (payload.subhead) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: payload.subhead },
    })
  }
  if (payload.actions && payload.actions.length > 0) {
    blocks.push({
      type: 'actions',
      elements: payload.actions.map((a, i) => ({
        type: 'button',
        text: { type: 'plain_text', text: a.title },
        action_id: `coyl_${a.value}_${i}`,
        value: a.value,
      })),
    })
  }
  return {
    text: payload.fallbackText ?? payload.headline,
    blocks,
  }
}

/**
 * Look up a stored bot token for a given Slack team_id. Returns null
 * when the workspace has uninstalled / never installed.
 */
async function loadSlackBotToken(teamId: string): Promise<string | null> {
  const row = await prisma.productivityEvent.findFirst({
    where: {
      eventValue: 'slack_install',
      metadataJson: { path: ['teamId'], equals: teamId },
    },
    orderBy: { createdAt: 'desc' },
    select: { metadataJson: true },
  })
  if (!row) return null
  const meta = row.metadataJson as { botToken?: string; uninstalledAt?: string }
  if (!meta.botToken || meta.uninstalledAt) return null
  try {
    return decryptToken(meta.botToken)
  } catch {
    return null
  }
}

/**
 * Look up the Slack DM channel for a COYL user inside a given team. The
 * channel id is recorded on the `slack_user_link` event row when the
 * user first DMs the bot or the install flow resolves it via users.list.
 */
async function loadSlackChannel(
  teamId: string,
  userId: string,
): Promise<string | null> {
  const row = await prisma.productivityEvent.findFirst({
    where: {
      userId,
      eventValue: 'slack_user_link',
      metadataJson: { path: ['teamId'], equals: teamId },
    },
    orderBy: { createdAt: 'desc' },
    select: { metadataJson: true },
  })
  if (!row) return null
  const meta = row.metadataJson as { channelId?: string }
  return meta.channelId ?? null
}

/**
 * Send a Slack message to a user via chat.postMessage. Resolves the
 * stored bot token + DM channel for (teamId, userId). Throws when the
 * workspace isn't installed or the channel isn't yet known.
 */
export async function sendSlackMessage(
  teamId: string,
  userId: string,
  payload: SlackMessagePayload,
): Promise<void> {
  const token = await loadSlackBotToken(teamId)
  if (!token) throw new Error(`slack_bot_token_missing:${teamId}`)
  const channel = await loadSlackChannel(teamId, userId)
  if (!channel) throw new Error(`slack_channel_missing:${teamId}:${userId}`)

  const res = await fetch(SLACK_POST_MESSAGE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      channel,
      text: payload.text,
      ...(payload.blocks ? { blocks: payload.blocks } : {}),
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`slack_post_http_${res.status}:${text.slice(0, 200)}`)
  }
  const data = (await res.json()) as { ok: boolean; error?: string }
  if (!data.ok) throw new Error(`slack_post_api:${data.error ?? 'unknown'}`)
}

/**
 * HMAC-SHA256 signature verification per Slack's Events API contract:
 *   sig_basestring = `v0:${timestamp}:${rawBody}`
 *   expected = `v0=${HMAC_SHA256(signingSecret, sig_basestring)}`
 *
 * The 5-minute timestamp window guards against replay attacks; reject
 * any request older than 300 s.
 *
 * IMPORTANT: this function MUST be called with the raw request body
 * (req.text()), not the parsed JSON — JSON re-serialization changes
 * whitespace and breaks the signature. The caller is responsible for
 * threading the raw body through.
 */
export async function verifySlackRequest(req: Request): Promise<boolean> {
  const config = getSlackConfig()
  if (!config) return false
  const timestamp = req.headers.get('x-slack-request-timestamp')
  const signature = req.headers.get('x-slack-signature')
  if (!timestamp || !signature) return false

  const ts = Number.parseInt(timestamp, 10)
  if (!Number.isFinite(ts)) return false
  // 5-minute window — Slack docs explicitly recommend this guard.
  if (Math.abs(Date.now() / 1000 - ts) > 60 * 5) return false

  const raw = await req.clone().text()
  const base = `v0:${timestamp}:${raw}`
  const mac = crypto
    .createHmac('sha256', config.signingSecret)
    .update(base, 'utf8')
    .digest('hex')
  const expected = `v0=${mac}`

  const sigBuf = Buffer.from(signature)
  const expBuf = Buffer.from(expected)
  if (sigBuf.length !== expBuf.length) return false
  return crypto.timingSafeEqual(sigBuf, expBuf)
}

/**
 * Same signature check but takes the already-read raw body. Use this
 * inside the events route after you've read req.text() — you can't
 * read the body twice on every runtime.
 */
export function verifySlackSignatureWithBody(
  headers: Headers,
  rawBody: string,
): boolean {
  const config = getSlackConfig()
  if (!config) return false
  const timestamp = headers.get('x-slack-request-timestamp')
  const signature = headers.get('x-slack-signature')
  if (!timestamp || !signature) return false

  const ts = Number.parseInt(timestamp, 10)
  if (!Number.isFinite(ts)) return false
  if (Math.abs(Date.now() / 1000 - ts) > 60 * 5) return false

  const base = `v0:${timestamp}:${rawBody}`
  const mac = crypto
    .createHmac('sha256', config.signingSecret)
    .update(base, 'utf8')
    .digest('hex')
  const expected = `v0=${mac}`

  const sigBuf = Buffer.from(signature)
  const expBuf = Buffer.from(expected)
  if (sigBuf.length !== expBuf.length) return false
  return crypto.timingSafeEqual(sigBuf, expBuf)
}

/**
 * Persist (or refresh) a Slack workspace install. Stores team_id +
 * bot_user_id on a fresh ProductivityEvent row with the bot token
 * encrypted via INTEGRATION_ENCRYPTION_KEY. Matches the convention
 * used by the Withings/Dexcom/Libre token rows.
 *
 * installedByUserId is the COYL User.id of the admin who clicked
 * "Add to Slack" — used for admin-side ops queries.
 */
export async function rememberSlackInstall(
  installedByUserId: string,
  oauth: SlackOAuthResponse,
): Promise<void> {
  if (!oauth.access_token || !oauth.team?.id) {
    throw new Error('slack_install_missing_fields')
  }
  if (!getEncryptionKey()) {
    throw new Error('integration_encryption_key_missing')
  }
  await prisma.productivityEvent.create({
    data: {
      userId: installedByUserId,
      eventType: 'FEATURE_USED',
      eventValue: 'slack_install',
      metadataJson: {
        type: 'slack_install',
        teamId: oauth.team.id,
        teamName: oauth.team.name ?? null,
        botUserId: oauth.bot_user_id ?? null,
        appId: oauth.app_id ?? null,
        scope: oauth.scope ?? null,
        botToken: encryptToken(oauth.access_token),
        installedAt: new Date().toISOString(),
      },
    },
  })
}

/**
 * Persist the (userId ↔ slack channel/user) mapping the first time we
 * see a DM from a user. Future server-to-Slack sends look this up so
 * we can deliver without an extra conversations.open round-trip.
 */
export async function rememberSlackUserLink(
  userId: string,
  teamId: string,
  slackUserId: string,
  channelId: string,
): Promise<void> {
  await prisma.productivityEvent.create({
    data: {
      userId,
      eventType: 'FEATURE_USED',
      eventValue: 'slack_user_link',
      metadataJson: {
        type: 'slack_user_link',
        teamId,
        slackUserId,
        channelId,
      },
    },
  })
}

export { encryptToken, decryptToken }
