/**
 * Wave-grant email — "you're in, claim your invite." Sent when the
 * founder opens a wave (admin/waitlist → grant next N). The CTA points
 * at /redeem/[code], which marks the invite redeemed, drops the access
 * cookie, and lands them in sign-up (past the gate, when it's on).
 *
 * Inline HTML + text, NEDA-safe. Mirrors the join-confirmation renderer.
 */

import { getArchetypeCard } from '@/lib/archetype-cards'

const ORANGE = '#ff6600'

function origin(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.coyl.ai').replace(/\/$/, '')
}

export function renderWaitlistGrantEmail(input: {
  inviteCode: string
  archetypeSlug: string | null
}): { subject: string; html: string; text: string } {
  const root = origin()
  const redeemUrl = `${root}/redeem/${encodeURIComponent(input.inviteCode)}`
  const card = input.archetypeSlug ? getArchetypeCard(input.archetypeSlug) : null

  const subject = `You're in — your COYL invite is ready`

  const archetypeLineHtml = card
    ? `<p style="margin: 0 0 18px; font-size: 15px; line-height: 1.6; color: #4b4438;">
         COYL opens to your pattern first — <strong style="color: #1a1714;">${escapeHtml(card.name)}</strong>.
         Your first interrupt is built around the moment it runs.
       </p>`
    : ''

  const archetypeLineText = card
    ? `COYL opens to your pattern first — ${card.name}. Your first interrupt is built around the moment it runs.\n\n`
    : ''

  const html = `<!doctype html>
<html>
  <body style="margin: 0; padding: 0; background: #faf8f4;">
    <div style="max-width: 520px; margin: 0 auto; padding: 40px 28px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <p style="margin: 0 0 8px; font-size: 11px; letter-spacing: 0.28em; text-transform: uppercase; color: ${ORANGE}; font-weight: 700;">
        COYL · Your invite is live
      </p>
      <h1 style="margin: 0 0 14px; font-size: 30px; line-height: 1.1; color: #1a1714; font-weight: 800;">
        You're in.
      </h1>
      <p style="margin: 0 0 22px; font-size: 15px; line-height: 1.6; color: #4b4438;">
        A spot opened and it's yours. Claim it now — invites are released
        in waves and this link is tied to your place in line.
      </p>

      ${archetypeLineHtml}

      <a href="${redeemUrl}" style="display: inline-block; background: linear-gradient(90deg, #ff6600, #ff3a3a); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 15px; padding: 13px 26px; border-radius: 999px;">
        Claim my invite →
      </a>

      <p style="margin: 22px 0 0; font-size: 13px; line-height: 1.6; color: #8a8170; word-break: break-all;">
        Or paste this link: <a href="${redeemUrl}" style="color: ${ORANGE};">${redeemUrl}</a>
      </p>
      <p style="margin: 28px 0 0; font-size: 12px; line-height: 1.6; color: #b3aa98;">
        COYL — the missing behavioral interface between AI and real life.
        Behavioral support, not medical treatment.
      </p>
    </div>
  </body>
</html>`

  const text = `You're in — your COYL invite is ready.

A spot opened and it's yours. Claim it now — invites are released in waves and this link is tied to your place in line.

${archetypeLineText}Claim my invite:
${redeemUrl}

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
