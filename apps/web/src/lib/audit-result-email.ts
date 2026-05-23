/**
 * Audit-result email renderer.
 *
 * Plain-HTML, no React-email — kept dependency-light because this fires
 * on a fan-out path (every /audit visitor who taps "email me my result").
 * The subject + body are deliberately calm: the family name in the
 * subject line, the three interrupts as the meat, and a single sign-up
 * CTA at the bottom. No tracker pixels, no link bait.
 *
 * Used by POST /api/v1/audit/capture.
 */
import { buildArchetype, buildInterrupts } from '@/lib/audit-archetype'
import type { WedgeId, WindowId, ScriptId } from '@/lib/audit-archetype'

export function renderAuditResultEmail(params: {
  wedge: WedgeId
  window: WindowId
  script: ScriptId
}): { subject: string; html: string; text: string } {
  const archetype = buildArchetype(params.wedge, params.window, params.script)
  const interrupts = buildInterrupts(params.wedge, params.window, params.script)

  const subject = `Your COYL archetype: ${archetype.family.name}`

  const interruptHtml = interrupts
    .map(
      (text, i) => `
        <tr>
          <td style="padding: 10px 0; border-left: 3px solid #ff6600; padding-left: 14px;">
            <div style="font-family: ui-monospace, SFMono-Regular, monospace; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: #ff6600;">
              Interrupt ${i + 1}
            </div>
            <div style="font-size: 16px; font-weight: 600; color: #111; margin-top: 4px;">
              ${escapeHtml(text)}
            </div>
          </td>
        </tr>`,
    )
    .join('')

  const html = `<!doctype html>
<html>
  <body style="margin: 0; padding: 0; background: #fafaf7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; color: #1a1814;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding: 32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background: #ffffff; border: 1px solid rgba(0,0,0,0.06); border-radius: 16px; padding: 32px;">
            <tr>
              <td>
                <div style="font-family: ui-monospace, SFMono-Regular, monospace; font-size: 10px; letter-spacing: 0.28em; text-transform: uppercase; color: #ff6600;">
                  You’re
                </div>
                <h1 style="margin: 8px 0 0; font-size: 32px; line-height: 1.1; font-weight: 800; color: #111;">
                  ${escapeHtml(archetype.family.name)}
                </h1>
                <p style="margin: 16px 0 0; font-size: 16px; line-height: 1.55; color: #444;">
                  ${escapeHtml(archetype.family.essence)}
                </p>
                <p style="margin: 16px 0 0; font-family: Georgia, serif; font-style: italic; font-size: 16px; color: #ff6600;">
                  Signature script: ${escapeHtml(archetype.family.signature)}
                </p>
                <p style="margin: 12px 0 0; font-size: 13px; color: #6b6557;">
                  ${escapeHtml(archetype.family.prevalenceCopy)}
                </p>

                <div style="margin: 28px 0 12px; padding: 14px; border: 1px solid rgba(0,0,0,0.08); border-radius: 12px; background: #fafaf7;">
                  <div style="font-family: ui-monospace, SFMono-Regular, monospace; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: #6b6557;">
                    Your specific moment
                  </div>
                  <div style="margin-top: 4px; font-size: 15px; font-weight: 700; color: #111;">
                    ${escapeHtml(archetype.specific.name)}
                  </div>
                </div>

                <div style="margin: 24px 0 8px;">
                  <div style="font-family: ui-monospace, SFMono-Regular, monospace; font-size: 10px; letter-spacing: 0.28em; text-transform: uppercase; color: #10b981;">
                    Your three interrupts
                  </div>
                </div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${interruptHtml}
                </table>

                <div style="margin-top: 32px; padding: 18px; border: 1px solid #ff6600; border-radius: 12px; background: linear-gradient(135deg, #fff6f0, #ffffff);">
                  <p style="margin: 0; font-size: 14px; color: #1a1814;">
                    These three interrupts run live inside COYL the moment your autopilot fires.
                  </p>
                  <p style="margin: 14px 0 0;">
                    <a href="https://coyl.ai/sign-up?ref=audit-email&amp;archetype=${encodeURIComponent(archetype.family.slug)}" style="display: inline-block; background: linear-gradient(90deg, #ff6600, #ff3a3a); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 10px 18px; border-radius: 999px;">
                      Lock in tonight's interrupt →
                    </a>
                  </p>
                </div>

                <p style="margin: 28px 0 0; font-size: 11px; color: #9a8f7a; font-family: ui-monospace, SFMono-Regular, monospace; letter-spacing: 0.16em; text-transform: uppercase;">
                  Sent because you took the audit at coyl.ai/audit
                </p>
                <p style="margin: 8px 0 0; font-size: 11px; color: #9a8f7a;">
                  No drip campaign. We won’t email you again unless you sign up.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

  const text = `You're ${archetype.family.name}.

${archetype.family.essence}

Signature script: ${archetype.family.signature}
${archetype.family.prevalenceCopy}

Your specific moment: ${archetype.specific.name}

Your three interrupts
  1. ${interrupts[0]}
  2. ${interrupts[1]}
  3. ${interrupts[2]}

These three interrupts run live inside COYL the moment your autopilot fires. Lock in tonight's:
https://coyl.ai/sign-up?ref=audit-email&archetype=${encodeURIComponent(archetype.family.slug)}

— COYL
Sent because you took the audit at coyl.ai/audit.
No drip campaign. We won't email you again unless you sign up.`

  return { subject, html, text }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
