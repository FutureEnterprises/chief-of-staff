import {
  AdapterNotImplementedError,
  type PlatformAdapter,
  type PlatformPostOpts,
  type PostResult,
} from './types'

/**
 * Reddit posting adapter (shell — Phase 3).
 *
 * REQUIRED ENV VARS (configure in Vercel project settings + .env.local):
 *   - REDDIT_CLIENT_ID        — script-app client ID from reddit.com/prefs/apps
 *   - REDDIT_CLIENT_SECRET    — the matching secret
 *   - REDDIT_REFRESH_TOKEN    — long-lived refresh token for the COYL account
 *   - REDDIT_USER_AGENT       — e.g. "coyl-marketing/0.1 by u/iman_coyl"
 *
 * OAUTH FLOW (one-time, on the founder's machine):
 *   1. Build a Reddit "script" app at https://www.reddit.com/prefs/apps
 *      (redirect URI can be http://localhost — script flow does not use it)
 *   2. Use the password-grant flow once to exchange username/password for
 *      a refresh token, store that in REDDIT_REFRESH_TOKEN.
 *   3. At runtime, hit https://www.reddit.com/api/v1/access_token with
 *      grant_type=refresh_token to get a short-lived access_token.
 *
 * POSTING (from Phase 3 onwards):
 *   POST https://oauth.reddit.com/api/submit
 *     headers: Authorization: Bearer <access_token>, User-Agent: <ua>
 *     body: sr=<subreddit>&kind=self&title=<title>&text=<markdown body>
 *           &api_type=json
 *   Response JSON includes data.url and data.id which we combine into the
 *   permalink:  https://reddit.com/r/${sub}/comments/${id}
 *
 * RATE LIMITS: 60 requests per minute per OAuth token. The cron should
 * never burst — see docs/marketing/automation-plan.md §"Phase 4 — Cadence".
 *
 * SAFETY: never post in r/stopdrinking, r/leaves, r/cripplingalcoholism, or
 * any addiction-coded subreddit. The strategist mandate is enforced upstream
 * in templates.ts; this adapter additionally refuses if the subreddit is in
 * the BLOCKLIST. Edit BLOCKLIST in templates.ts (REDDIT_BLESSED is the
 * inverse list — we should be posting only there).
 */
export type RedditPostOpts = PlatformPostOpts & {
  /** Subreddit name without the leading "r/" (e.g. "loseit"). */
  subreddit: string
  /** Post title — Reddit submission requires this separately from body. */
  title: string
}

const REQUIRED_ENV = [
  'REDDIT_CLIENT_ID',
  'REDDIT_CLIENT_SECRET',
  'REDDIT_REFRESH_TOKEN',
  'REDDIT_USER_AGENT',
] as const

export const redditAdapter: PlatformAdapter = {
  isConfigured(): boolean {
    return REQUIRED_ENV.every((k) => !!process.env[k])
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async post(_body: string, _opts?: RedditPostOpts): Promise<PostResult> {
    throw new AdapterNotImplementedError('reddit')
  },
}
