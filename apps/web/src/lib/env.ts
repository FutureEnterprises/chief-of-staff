/**
 * Runtime environment validation.
 * Import this at the top of layout.tsx or instrumentation.ts to fail fast on missing vars.
 */

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function optional(name: string): string | undefined {
  return process.env[name] || undefined
}

export const env = {
  // Auth (required in production)
  CLERK_SECRET_KEY: required('CLERK_SECRET_KEY'),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: required('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'),

  // Database
  DATABASE_URL: required('DATABASE_URL'),

  // Cron auth — reject placeholder values
  CRON_SECRET: (() => {
    const v = required('CRON_SECRET')
    if (v.length < 32 || v === 'your-cron-secret') {
      throw new Error('CRON_SECRET must be at least 32 characters and not a placeholder')
    }
    return v
  })(),

  // App URL
  NEXT_PUBLIC_APP_URL: required('NEXT_PUBLIC_APP_URL'),

  // Optional services — degrade gracefully if missing
  RESEND_API_KEY: optional('RESEND_API_KEY'),
  RESEND_FROM_EMAIL: optional('RESEND_FROM_EMAIL'),
  STRIPE_SECRET_KEY: optional('STRIPE_SECRET_KEY'),
  STRIPE_WEBHOOK_SECRET: optional('STRIPE_WEBHOOK_SECRET'),
  STRIPE_PRO_MONTHLY_PRICE_ID: optional('STRIPE_PRO_MONTHLY_PRICE_ID'),
  STRIPE_PRO_ANNUAL_PRICE_ID: optional('STRIPE_PRO_ANNUAL_PRICE_ID'),
  CLERK_WEBHOOK_SECRET: optional('CLERK_WEBHOOK_SECRET'),
  ANTHROPIC_API_KEY: optional('ANTHROPIC_API_KEY'),
} as const
