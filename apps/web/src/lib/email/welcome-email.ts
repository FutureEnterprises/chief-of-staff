/**
 * Day-1 welcome email — the first thing COYL says after onboarding
 * completes. Confirms protection is live: COYL now watches the danger
 * windows the user just mapped, and the first interrupt fires the next
 * time they're inside one. Sets the free-tier expectation (3 interrupts
 * a week, free forever) with the upgrade path for unlimited.
 *
 * Inline HTML + plaintext (no React Email template for a single
 * transactional send) — mirrors the waitlist-email + audit-result
 * pattern.
 *
 * NEDA-safe: protection + windows + plan only. No health/body/diet
 * language. "Behavioral support, not medical treatment."
 */

const ORANGE = '#ff6600'

function origin(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.coyl.ai').replace(/\/$/, '')
}

export type WelcomeEmailInput = {
  firstName?: string | null
}

export function renderWelcomeEmail(input: WelcomeEmailInput): {
  subject: string
  html: string
  text: string
} {
  const root = origin()
  const pricingUrl = `${root}/pricing`
  const name = input.firstName?.trim() || null
  const greeting = name ? `${escapeHtml(name)}, your` : 'Your'
  const greetingText = name ? `${name}, your` : 'Your'

  const subject = 'Your protection is live — the first catch is coming'

  const html = `<!doctype html>
<html>
  <body style="margin: 0; padding: 0; background: #faf8f4;">
    <div style="max-width: 520px; margin: 0 auto; padding: 40px 28px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <p style="margin: 0 0 8px; font-size: 11px; letter-spacing: 0.28em; text-transform: uppercase; color: ${ORANGE}; font-weight: 700;">
        COYL · Protection live
      </p>
      <h1 style="margin: 0 0 6px; font-size: 30px; line-height: 1.1; color: #1a1714; font-weight: 800;">
        ${greeting} protection is set.
      </h1>
      <p style="margin: 0 0 24px; font-size: 14px; color: #8a8170;">
        COYL is now watching the danger windows you mapped. The first interrupt fires the next time you're inside one.
      </p>

      <div style="margin: 0 0 24px; padding: 20px; border: 1px solid #ece6da; border-radius: 16px; background: #ffffff;">
        <p style="margin: 0 0 6px; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #8a8170; font-weight: 700;">
          How it works now
        </p>
        <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #4b4438;">
          Nothing else to set up. When you cross into one of your windows, COYL reaches you in the moment — that's the catch. You'll feel it the first time it happens.
        </p>
        <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #4b4438;">
          Your free plan includes <strong style="color: #1a1714;">3 interrupts a week</strong>. Upgrade any time for
          <strong style="color: #1a1714;">unlimited</strong> catches.
        </p>
        <a href="${pricingUrl}" style="display: inline-block; background: linear-gradient(90deg, #ff6600, #ff3a3a); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 11px 22px; border-radius: 999px;">
          See unlimited
        </a>
      </div>

      <p style="margin: 28px 0 0; font-size: 12px; line-height: 1.6; color: #b3aa98;">
        COYL — the missing behavioral interface between AI and real life.
        Behavioral support, not medical treatment.
      </p>
    </div>
  </body>
</html>`

  const text = `${greetingText} protection is set.

COYL is now watching the danger windows you mapped. The first interrupt fires the next time you're inside one.

HOW IT WORKS NOW
Nothing else to set up. When you cross into one of your windows, COYL reaches you in the moment — that's the catch. You'll feel it the first time it happens.

Your free plan includes 3 interrupts a week. Upgrade any time for unlimited catches:
${pricingUrl}

COYL — the missing behavioral interface between AI and real life.
Behavioral support, not medical treatment.`

  return { subject, html, text }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
