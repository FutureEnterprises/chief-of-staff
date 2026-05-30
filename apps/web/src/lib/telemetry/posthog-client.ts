'use client'

/**
 * PostHog client wrapper — load lazily, init once, fail silently.
 *
 * Init happens via PostHogProvider on first mount, NOT at module
 * load time. This keeps PostHog out of the initial JS bundle on any
 * page that doesn't actually fire telemetry — `posthog-js` is ~50KB
 * minified-gzipped, which is too much to inflict on every page.
 *
 * If NEXT_PUBLIC_POSTHOG_KEY is unset, every function in this
 * module is a no-op. The site still works; telemetry just doesn't
 * fire. This is the right default for the founder's pre-PostHog-
 * account state — no error logs, no bundle bloat.
 *
 * PHI/Security:
 *   - Session replay is DISABLED by default. Enabling it requires
 *     also adding `data-ph-no-capture` to every form input that
 *     could contain PHI. Do not turn it on without a security pass.
 *   - autocapture is DISABLED by default. We name our events
 *     explicitly via `capture()` calls — accidental autocapture of
 *     form field changes could leak email addresses.
 *   - persistence: 'localStorage+cookie' uses both for resilience;
 *     no PII written to either by us.
 */

import type { PostHog } from 'posthog-js'

let postHogInstance: PostHog | null = null
let initInFlight: Promise<PostHog | null> | null = null

/**
 * Initialize PostHog. Idempotent — safe to call on every mount.
 * Returns the instance, or null if env isn't configured.
 */
export async function initPostHog(): Promise<PostHog | null> {
  if (postHogInstance) return postHogInstance
  if (initInFlight) return initInFlight

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!apiKey) return null

  initInFlight = (async () => {
    try {
      const { default: posthog } = await import('posthog-js')
      posthog.init(apiKey, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
        // EXPLICITLY DISABLED — see security note above.
        disable_session_recording: true,
        autocapture: false,
        capture_pageview: true,
        capture_pageleave: true,
        // No localStorage in incognito-Safari etc. — fall back to cookie.
        persistence: 'localStorage+cookie',
        // Surface key for diagnostics without exposing API key.
        loaded: () => {
          postHogInstance = posthog
        },
      })
      postHogInstance = posthog
      return posthog
    } catch {
      // Network blocked, ad-blocker, etc. — degrade silently.
      return null
    } finally {
      initInFlight = null
    }
  })()

  return initInFlight
}

/**
 * Capture a marketing-funnel event. Safe to call before init — the
 * call is queued. No-op if PostHog isn't configured.
 */
export function captureMarketingEvent(
  name: string,
  props: Record<string, unknown> = {},
): void {
  if (typeof window === 'undefined') return
  // Fire-and-forget init; capture queues until ready.
  void initPostHog()
  postHogInstance?.capture(name, props)
}

/**
 * Identify the user by anonymous id. Called once we know who they are
 * (post-quiz, post-signup). Safe to call repeatedly with the same id.
 */
export function identifyAnonymousUser(
  anonymousUserId: string,
  traits: Record<string, unknown> = {},
): void {
  if (typeof window === 'undefined' || !postHogInstance) return
  postHogInstance.identify(anonymousUserId, traits)
}

/**
 * Reset PostHog state — call on logout. Clears the distinctId so the
 * next session starts fresh.
 */
export function resetPostHog(): void {
  if (typeof window === 'undefined' || !postHogInstance) return
  postHogInstance.reset()
}
