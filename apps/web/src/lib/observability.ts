import * as Sentry from '@sentry/nextjs'

/**
 * Capture an error and return it for re-throwing. Safe if Sentry isn't configured.
 */
export function captureError(err: unknown, context?: Record<string, unknown>): void {
  const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN
  if (!dsn) return
  try {
    Sentry.captureException(err, { extra: context })
  } catch {
    // silent — never fail a handler because telemetry failed
  }
}

/**
 * Wrap a route handler so uncaught errors get sent to Sentry AND return a
 * JSON 500 instead of crashing the fn.
 */
export function withSentry<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T | Response> {
  return fn().catch((err) => {
    captureError(err, { handler: name })
    console.warn('[%s] Uncaught: %s', name, (err as Error).message)
    return Response.json({ error: 'Internal error' }, { status: 500 }) as unknown as T
  })
}
