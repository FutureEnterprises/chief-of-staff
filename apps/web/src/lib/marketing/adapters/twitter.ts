import {
  AdapterNotImplementedError,
  type PlatformAdapter,
  type PlatformPostOpts,
  type PostResult,
} from './types'

/**
 * Twitter / X posting adapter (shell — Phase 3).
 *
 * REQUIRED ENV VARS (configure in Vercel project settings + .env.local):
 *   - TWITTER_API_KEY         — consumer key (OAuth 1.0a) or v2 app key
 *   - TWITTER_API_SECRET      — consumer secret
 *   - TWITTER_ACCESS_TOKEN    — user access token (for @coyl account)
 *   - TWITTER_ACCESS_SECRET   — user access secret
 *
 * AUTH MODE: OAuth 1.0a user-context. The v2 endpoint also accepts OAuth
 * 2.0 PKCE tokens but 1.0a is simpler for a single-account scripted use.
 *
 * POSTING (from Phase 3 onwards):
 *   Single tweet:
 *     POST https://api.twitter.com/2/tweets
 *     body: { "text": "<tweet>" }
 *     Response: { data: { id, text } }
 *     URL = `https://twitter.com/coyl/status/${data.id}`
 *
 *   Thread:
 *     POST first tweet as above, capture the id.
 *     For each subsequent tweet, POST /2/tweets with body:
 *       { text, reply: { in_reply_to_tweet_id: <prev_id> } }
 *     Capture each id; the thread URL is the first tweet's URL.
 *
 * THE thread method below accepts the array verbatim and chains the
 * replies. The first element becomes the thread head.
 *
 * RATE LIMITS: 300 tweets / 3-hour window per app under the Basic
 * developer tier. The cadence in docs/marketing/automation-plan.md is
 * far below that.
 */
export type TwitterPostOpts = PlatformPostOpts & {
  /** Reply-to a specific tweet (e.g. continuing a thread or quoting). */
  inReplyToTweetId?: string
}

export type TweetThreadResult = PostResult & {
  /** All tweet IDs in posting order (head first). */
  tweetIds: string[]
}

const REQUIRED_ENV = [
  'TWITTER_API_KEY',
  'TWITTER_API_SECRET',
  'TWITTER_ACCESS_TOKEN',
  'TWITTER_ACCESS_SECRET',
] as const

export const twitterAdapter: PlatformAdapter & {
  postThread(tweets: string[]): Promise<TweetThreadResult>
} = {
  isConfigured(): boolean {
    return REQUIRED_ENV.every((k) => !!process.env[k])
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async post(_body: string, _opts?: TwitterPostOpts): Promise<PostResult> {
    throw new AdapterNotImplementedError('twitter')
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async postThread(_tweets: string[]): Promise<TweetThreadResult> {
    throw new AdapterNotImplementedError('twitter:thread')
  },
}
