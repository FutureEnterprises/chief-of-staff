'use server'
/**
 * Admin action — open a waitlist wave. Grants access to the next N
 * people (by effective position) and emails each their claim link.
 * requireAdmin() is the security boundary; the page is just UI.
 */

import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'
import { requireAdmin } from '@/lib/admin/is-admin'
import { grantNextWave, markGrantEmailSent } from '@/lib/waitlist'
import { renderWaitlistGrantEmail } from '@/lib/email/waitlist-grant-email'

export type GrantWaveResult = {
  granted: number
  emailed: number
  errors: number
  emailConfigured: boolean
}

/** Cap a single wave so an accidental huge number can't blast the list. */
const MAX_WAVE = 500

export async function grantWave(count: number): Promise<GrantWaveResult> {
  await requireAdmin()

  const n = Math.max(0, Math.min(MAX_WAVE, Math.floor(count || 0)))
  const granted = await grantNextWave(n)

  const resendKey = process.env.RESEND_API_KEY
  const resend = resendKey && !resendKey.startsWith('re_...') ? new Resend(resendKey) : null

  let emailed = 0
  let errors = 0
  if (resend) {
    for (const g of granted) {
      try {
        const { subject, html, text } = renderWaitlistGrantEmail({
          inviteCode: g.inviteCode,
          archetypeSlug: g.archetypeSlug,
        })
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? 'COYL <hello@coyl.ai>',
          to: g.email,
          subject,
          html,
          text,
        })
        await markGrantEmailSent(g.id)
        emailed++
      } catch (err) {
        errors++
        console.warn('[admin/waitlist] grant email failed', {
          err: err instanceof Error ? err.message : 'unknown',
        })
      }
    }
  }

  revalidatePath('/admin/waitlist')
  return { granted: granted.length, emailed, errors, emailConfigured: Boolean(resend) }
}
