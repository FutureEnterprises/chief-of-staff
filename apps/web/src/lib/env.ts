/**
 * Runtime environment validation.
 * Warns on missing vars instead of throwing — prevents app-wide crashes.
 */

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    console.warn(`[env] Missing environment variable: ${name}`)
    return ''
  }
  return value
}

function optional(name: string): string | undefined {
  return process.env[name] || undefined
}

export const env = {
  // Auth
  CLERK_SECRET_KEY: required('CLERK_SECRET_KEY'),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: required('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'),

  // Database
  DATABASE_URL: required('DATABASE_URL'),

  // Cron auth
  CRON_SECRET: optional('CRON_SECRET'),

  // App URL
  NEXT_PUBLIC_APP_URL: required('NEXT_PUBLIC_APP_URL'),

  // Optional services
  RESEND_API_KEY: optional('RESEND_API_KEY'),
  RESEND_FROM_EMAIL: optional('RESEND_FROM_EMAIL'),
  STRIPE_SECRET_KEY: optional('STRIPE_SECRET_KEY'),
  STRIPE_WEBHOOK_SECRET: optional('STRIPE_WEBHOOK_SECRET'),
  // Price IDs read by /api/stripe/checkout — one per (tier × interval).
  //   CORE  = Rewire  ($12/mo · $99/yr)
  //   PLUS  = Rebound ($29/mo · $199/yr)
  //   PREMIUM = legacy back-compat only (not displayed on the paywall)
  // Must be set in Vercel Production/Preview or checkout returns a 503.
  STRIPE_CORE_MONTHLY_PRICE_ID: optional('STRIPE_CORE_MONTHLY_PRICE_ID'),
  STRIPE_CORE_ANNUAL_PRICE_ID: optional('STRIPE_CORE_ANNUAL_PRICE_ID'),
  STRIPE_PLUS_MONTHLY_PRICE_ID: optional('STRIPE_PLUS_MONTHLY_PRICE_ID'),
  STRIPE_PLUS_ANNUAL_PRICE_ID: optional('STRIPE_PLUS_ANNUAL_PRICE_ID'),
  STRIPE_PREMIUM_MONTHLY_PRICE_ID: optional('STRIPE_PREMIUM_MONTHLY_PRICE_ID'),
  STRIPE_PREMIUM_ANNUAL_PRICE_ID: optional('STRIPE_PREMIUM_ANNUAL_PRICE_ID'),
  // Legacy PRO_* — fall back targets for CORE_* in the checkout route.
  STRIPE_PRO_MONTHLY_PRICE_ID: optional('STRIPE_PRO_MONTHLY_PRICE_ID'),
  STRIPE_PRO_ANNUAL_PRICE_ID: optional('STRIPE_PRO_ANNUAL_PRICE_ID'),
  CLERK_WEBHOOK_SECRET: optional('CLERK_WEBHOOK_SECRET'),
  ANTHROPIC_API_KEY: optional('ANTHROPIC_API_KEY'),
} as const
