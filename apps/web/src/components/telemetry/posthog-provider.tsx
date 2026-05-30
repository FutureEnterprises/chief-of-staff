'use client'

/**
 * PostHogProvider — wraps the app, initializes PostHog on first mount.
 *
 * Why this is a component, not a hook:
 *   We want PostHog to init exactly once per app load, regardless of
 *   which page is mounted. A provider at the root of the app
 *   guarantees that. A hook in every page would either over-init
 *   or be forgotten on a new page.
 *
 * Why it renders nothing visible:
 *   It's pure side-effect. No layout impact.
 *
 * Why useEffect not the body:
 *   initPostHog dynamically imports posthog-js (50KB). Doing that in
 *   the render path would block initial paint. useEffect lets it
 *   happen after hydration when the user can't tell.
 */

import { useEffect, type ReactNode } from 'react'
import {
  initPostHog,
  identifyAnonymousUser,
} from '@/lib/telemetry/posthog-client'
import { getOrCreateAnonymousUserIdClient } from '@/lib/telemetry/anonymous-user-id'

export function PostHogProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    void (async () => {
      const ph = await initPostHog()
      if (!ph) return // PostHog not configured — no-op
      const anonymousId = getOrCreateAnonymousUserIdClient()
      if (anonymousId) identifyAnonymousUser(anonymousId)
    })()
  }, [])

  return <>{children}</>
}
