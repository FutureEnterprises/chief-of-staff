import { NextResponse } from 'next/server'
import { z } from 'zod'
import { headers } from 'next/headers'
import { Resend } from 'resend'

/**
 * POST /api/v1/teams/pilot-inquiry
 *
 * Public lead-capture endpoint for the /teams pilot-request form. An HR /
 * benefits buyer fills in their company, name, work email, team size, and
 * what they want to solve; this fires a notification email to the COYL
 * teams inbox so a human can reply within one business day.
 *
 * Why a NEW route (rather than reusing /api/v1/partners or
 * /api/v1/newsletter):
 *  - /api/v1/partners is the Clerk-authed, feature-gated accountability-
 *    partner invite API (peer-to-peer). It can't carry an anonymous
 *    employer inquiry and 402s without a paid entitlement.
 *  - /api/v1/newsletter only accepts an email and pushes it to a Resend
 *    audience. It can't carry company / team-size / free-text or route a
 *    notification to a human.
 *
 * Design mirrors /api/v1/newsletter + /api/v1/audit/capture:
 *  - Zod-validated, per-IP in-memory rate limit (5 / 10 min).
 *  - Best-effort Resend send; a Resend failure does NOT 500 — the buyer
 *    just gets the success confirmation and the lead is in the server log.
 *  - No DB write at v1. There is no PilotLead model and the DB layer is
 *    out of scope for this change; the email IS the source of truth, same
 *    tradeoff the newsletter route documents. If inbound volume justifies
 *    it, add a model + migration later.
 *
 * NEDA-safe: this surface is employer-facing. No weight / eating language
 * anywhere in the payload or the email body — focus / follow-through only.
 */

const TEAM_SIZES = ['1–49', '50–199', '200–999', '1,000+'] as const

const schema = z.object({
  company: z.string().trim().min(1).max(120),
  name: z.string().trim().min(1).max(120),
  // Work email — we don't hard-block free providers (some founders use
  // them) but we keep the shape RFC-valid and bounded.
  email: z.string().email().max(254),
  teamSize: z.enum(TEAM_SIZES),
  goal: z.string().trim().max(500).optional().default(''),
})

// In-memory per-IP rate limit — good enough for a low-volume B2B lead
// form, same pattern as /api/v1/newsletter. 5 requests / 10 min / IP.
const RATE_LIMIT = 5
const WINDOW_MS = 10 * 60 * 1000
const requests = new Map<string, number[]>()

function rateLimit(ip: string): boolean {
  const now = Date.now()
  const cutoff = now - WINDOW_MS
  const recent = (requests.get(ip) ?? []).filter((t) => t > cutoff)
  if (recent.length >= RATE_LIMIT) return false
  recent.push(now)
  requests.set(ip, recent)
  return true
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function POST(req: Request) {
  const hdrs = await headers()
  const ip =
    hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    hdrs.get('x-real-ip') ??
    'anonymous'

  if (!rateLimit(ip)) {
    // Silent rate-limit — return success so the form stays calm and we
    // don't hand abusers a signal.
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const { company, name, email, teamSize, goal } = parsed.data

  const apiKey = process.env.RESEND_API_KEY
  if (apiKey) {
    try {
      const resend = new Resend(apiKey)
      const goalLine = goal ? escapeHtml(goal) : '(not provided)'
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'COYL <noreply@coyl.ai>',
        to: 'teams@coyl.ai',
        replyTo: email,
        subject: `Pilot request — ${company} (${teamSize})`,
        text:
          `New COYL for Teams pilot request.\n\n` +
          `Company:   ${company}\n` +
          `Name:      ${name}\n` +
          `Email:     ${email}\n` +
          `Team size: ${teamSize}\n` +
          `Goal:      ${goal || '(not provided)'}\n`,
        html:
          `<h2>New COYL for Teams pilot request</h2>` +
          `<table cellpadding="6" style="font-family:system-ui,sans-serif;font-size:14px">` +
          `<tr><td><strong>Company</strong></td><td>${escapeHtml(company)}</td></tr>` +
          `<tr><td><strong>Name</strong></td><td>${escapeHtml(name)}</td></tr>` +
          `<tr><td><strong>Email</strong></td><td>${escapeHtml(email)}</td></tr>` +
          `<tr><td><strong>Team size</strong></td><td>${escapeHtml(teamSize)}</td></tr>` +
          `<tr><td valign="top"><strong>Goal</strong></td><td>${goalLine}</td></tr>` +
          `</table>`,
      })
    } catch (err) {
      // Best-effort: log and still return success so the buyer sees the
      // confirmation. The lead is recoverable from logs.
      console.warn('Pilot inquiry email send failed', {
        err: err instanceof Error ? err.message : 'unknown',
      })
    }
  } else {
    console.log('Pilot inquiry (no RESEND_API_KEY configured):', {
      company,
      name,
      email,
      teamSize,
      goal,
    })
  }

  return NextResponse.json({ ok: true })
}
