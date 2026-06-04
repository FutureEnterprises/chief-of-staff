/**
 * Waitlist confirmation email — the email that activates the referral
 * loop. Sent once, on a genuinely new join (never on re-join), so the
 * new member leaves with their position, their invite link, and the
 * line-jump mechanic spelled out.
 *
 * Inline HTML + plaintext (no React Email template needed for a single
 * transactional send) — mirrors the audit-result email pattern in
 * api/v1/audit/capture.
 *
 * NEDA-safe: position + invite + archetype only. No health/body/diet
 * language. The archetype is referenced by its public card, nothing
 * clinical.
 */

import { SPOTS_PER_REFERRAL } from '@/lib/waitlist'
import { getArchetypeCard } from '@/lib/archetype-cards'

const ORANGE = '#ff6600'

function origin(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? 'https://coyl.ai').replace(/\/$/, '')
}

export type WaitlistEmailInput = {
  position: number
  total: number
  inviteCode: string
  archetypeSlug: string | null
}

export function renderWaitlistEmail(input: WaitlistEmailInput): {
  subject: string
  html: string
  text: string
} {
  const root = origin()
  const inviteUrl = `${root}/waitlist?ref=${encodeURIComponent(input.inviteCode)}`
  const card = input.archetypeSlug ? getArchetypeCard(input.archetypeSlug) : null
  const cardUrl = input.archetypeSlug ? `${root}/card/${encodeURIComponent(input.archetypeSlug)}` : null

  const subject = `You're #${input.position} on the COYL waitlist`

  const archetypeLineHtml = card
    ? `<p style="margin: 0 0 18px; font-size: 15px; line-height: 1.6; color: #4b4438;">
         We saved your pattern — <strong style="color: #1a1714;">${escapeHtml(card.name)}</strong>.
         When your invite lands, COYL opens to your archetype first.
         <a href="${cardUrl}" style="color: ${ORANGE}; text-decoration: underline;">See your card →</a>
       </p>`
    : ''

  const archetypeLineText = card
    ? `We saved your pattern — ${card.name}. When your invite lands, COYL opens to your archetype first.\nSee your card: ${cardUrl}\n\n`
    : ''

  const html = `<!doctype html>
<html>
  <body style="margin: 0; padding: 0; background: #faf8f4;">
    <div style="max-width: 520px; margin: 0 auto; padding: 40px 28px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <p style="margin: 0 0 8px; font-size: 11px; letter-spacing: 0.28em; text-transform: uppercase; color: ${ORANGE}; font-weight: 700;">
        COYL · You're in
      </p>
      <h1 style="margin: 0 0 6px; font-size: 30px; line-height: 1.1; color: #1a1714; font-weight: 800;">
        You're #${input.position}.
      </h1>
      <p style="margin: 0 0 24px; font-size: 14px; color: #8a8170;">
        ${input.total.toLocaleString('en-US')} ${input.total === 1 ? 'person has' : 'people have'} requested access. COYL opens to new members in waves.
      </p>

      ${archetypeLineHtml}

      <div style="margin: 0 0 24px; padding: 20px; border: 1px solid #ece6da; border-radius: 16px; background: #ffffff;">
        <p style="margin: 0 0 6px; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #8a8170; font-weight: 700;">
          Jump the line
        </p>
        <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #4b4438;">
          Every friend who joins with your link moves you up
          <strong style="color: #1a1714;">${SPOTS_PER_REFERRAL} spots</strong>. Share it:
        </p>
        <p style="margin: 0 0 16px; font-size: 14px; word-break: break-all;">
          <a href="${inviteUrl}" style="color: ${ORANGE}; text-decoration: none; font-weight: 600;">${inviteUrl}</a>
        </p>
        <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(90deg, #ff6600, #ff3a3a); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 11px 22px; border-radius: 999px;">
          Copy my invite link
        </a>
      </div>

      <p style="margin: 0 0 6px; font-size: 13px; line-height: 1.6; color: #8a8170;">
        Your invite code: <strong style="color: #1a1714;">${escapeHtml(input.inviteCode)}</strong>
      </p>
      <p style="margin: 28px 0 0; font-size: 12px; line-height: 1.6; color: #b3aa98;">
        COYL — the missing behavioral interface between AI and real life.
        Behavioral support, not medical treatment.
      </p>
    </div>
  </body>
</html>`

  const text = `You're #${input.position} on the COYL waitlist.

${input.total.toLocaleString('en-US')} ${input.total === 1 ? 'person has' : 'people have'} requested access. COYL opens to new members in waves.

${archetypeLineText}JUMP THE LINE
Every friend who joins with your link moves you up ${SPOTS_PER_REFERRAL} spots. Share it:
${inviteUrl}

Your invite code: ${input.inviteCode}

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
