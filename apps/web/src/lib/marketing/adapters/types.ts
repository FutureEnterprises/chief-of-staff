/**
 * Shared types for Phase-3 marketing platform adapters.
 *
 * Each adapter implements the same `PlatformAdapter` contract so the
 * cron / approve-and-post code paths can stay platform-agnostic.
 * `isConfigured()` is the cheap check the orchestrator runs before
 * `post()` — if it returns false, the queue stays in APPROVED status
 * and the post is left for manual handling.
 *
 * Adapters live alongside the templates so any team-mate reviewing
 * voice + posting logic can see them in one place.
 */

export type PlatformPostOpts = Record<string, unknown>

export type PostResult = {
  /** Permalink to the published post on the platform. */
  url: string
}

/**
 * Common contract every platform adapter implements.
 */
export interface PlatformAdapter {
  /**
   * Publishes `body` to the platform. Throws if posting fails or the
   * adapter isn't configured. Returns the URL of the live post.
   */
  post(body: string, opts?: PlatformPostOpts): Promise<PostResult>
  /**
   * Cheap config check — does the adapter have everything it needs
   * (env vars, OAuth tokens, etc.) to call `post()` right now? Used
   * by the orchestrator to decide whether to attempt auto-posting
   * or leave the post in APPROVED status for manual handling.
   */
  isConfigured(): boolean
}

export class AdapterNotImplementedError extends Error {
  constructor(adapterName: string) {
    super(
      `[${adapterName}] Not implemented yet — Phase 3 — see docs/marketing/automation-plan.md`,
    )
    this.name = 'AdapterNotImplementedError'
  }
}

export class AdapterNotConfiguredError extends Error {
  constructor(adapterName: string, missing: string[]) {
    super(
      `[${adapterName}] Not configured. Missing env vars: ${missing.join(', ')}`,
    )
    this.name = 'AdapterNotConfiguredError'
  }
}
