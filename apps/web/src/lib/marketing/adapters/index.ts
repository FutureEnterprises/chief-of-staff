import type { MarketingPlatform } from '@repo/database'
import { redditAdapter } from './reddit'
import { twitterAdapter } from './twitter'
import {
  AdapterNotConfiguredError,
  AdapterNotImplementedError,
  type PlatformAdapter,
} from './types'

/**
 * Adapter registry — maps Prisma platform enum → adapter implementation.
 *
 * For platforms without an API (IndieHackers, HackerNews) we register
 * a "manual" sentinel adapter that always throws AdapterNotImplemented.
 * The orchestrator should never call .post() on these — they remain in
 * APPROVED status forever until a human flips them to POSTED with the
 * URL field populated.
 *
 * As Phase 3 progresses, each adapter file gets fleshed out. The shell
 * exists now so the contract is stable.
 */

const manualAdapter: PlatformAdapter = {
  isConfigured: () => false,
  post: async () => {
    throw new AdapterNotImplementedError('manual')
  },
}

const REGISTRY: Record<MarketingPlatform, PlatformAdapter> = {
  REDDIT: redditAdapter,
  TWITTER_THREAD: twitterAdapter,
  TWITTER_SINGLE: twitterAdapter,
  THREADS: manualAdapter,
  LINKEDIN: manualAdapter,
  INDIEHACKERS: manualAdapter,
  PRODUCTHUNT: manualAdapter,
  HACKERNEWS: manualAdapter,
  NEWSLETTER: manualAdapter,
}

/**
 * Returns the adapter for a given platform. Throws if the platform's
 * adapter exists but isn't fully configured (missing env vars). Callers
 * should catch AdapterNotConfiguredError and leave the post in
 * APPROVED status instead of moving it to ERRORED.
 */
export function getAdapter(platform: MarketingPlatform): PlatformAdapter {
  const adapter = REGISTRY[platform]
  if (!adapter) {
    throw new AdapterNotConfiguredError(platform, ['<no adapter registered>'])
  }
  return adapter
}

export {
  redditAdapter,
  twitterAdapter,
  AdapterNotConfiguredError,
  AdapterNotImplementedError,
}
export type { PlatformAdapter } from './types'
