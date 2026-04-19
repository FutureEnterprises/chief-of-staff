export async function register() {
  if (process.env.NODE_ENV === 'production') {
    await import('./lib/env')
  }

  // Sentry init per runtime
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config')
  }
}

// Sentry request error capture (Next.js 15+)
export async function onRequestError(...args: unknown[]) {
  const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN
  if (!dsn) return
  try {
    const Sentry = await import('@sentry/nextjs')
    // @ts-expect-error — Sentry's captureRequestError accepts Next's internal tuple
    Sentry.captureRequestError(...args)
  } catch {
    // silent
  }
}
