'use client'

import { useState } from 'react'
import { Copy, Check, Send } from 'lucide-react'
import { readAuditSession, fireAuditBeacon } from '@/lib/audit-session'

/**
 * Share-actions row. Lives below the <AutopilotCard /> on the public
 * share page + inside the rescue-view pulled-through confirmation.
 *
 * Three affordances:
 *   - Copy link (always available)
 *   - Native share sheet (mobile only, feature-detected)
 *   - Mailto fallback for desktop without clipboard permission
 *
 * Honest framing: the share button is small. The card does the heavy
 * lifting; this is just the plumbing to get it into the world.
 *
 * Telemetry: fires `shared` on completed actions only (a cancelled
 * native sheet is NOT a share). `trackId` scopes the sessionId for
 * surfaces with no audit cookie (e.g. /i/[code] passes `i:{code}`).
 */
export function ShareActions({
  shareUrl,
  shareText,
  trackId,
  tone = 'dark',
}: {
  shareUrl: string
  shareText: string
  trackId?: string
  /** Canvas the row sits on. The warm-dark unification hardcoded
   *  dark-surface colors; cream pages (/d, /m) pass 'light' so the
   *  secondary buttons stay readable. */
  tone?: 'dark' | 'light'
}) {
  const [copied, setCopied] = useState(false)
  const supportsNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function'
  const secondary =
    tone === 'light'
      ? 'border border-black/15 bg-black/[0.04] text-[#6b6557] hover:border-black/30'
      : 'border border-white/15 bg-white/[0.04] text-[#cdc2ad] hover:border-white/30'

  function track(channel: string) {
    const sessionId = (readAuditSession() || trackId || '').slice(0, 64)
    if (!sessionId) return
    fireAuditBeacon({
      sessionId,
      kind: 'shared',
      source: `${trackId ? 'i' : 'rescue'}_${channel}`.slice(0, 64),
    })
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
      track('copy_link')
    } catch {
      // clipboard blocked — fall back to URL display only
    }
  }

  async function nativeShare() {
    if (!supportsNativeShare) return
    try {
      await navigator.share({ title: 'COYL caught me.', text: shareText, url: shareUrl })
      track('web_share')
    } catch (err) {
      // User cancelled (AbortError) — ignore, and do NOT count it as a
      // share. A genuine share failure falls back to copying the link
      // so the tap still produces something shareable.
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        void copy()
      }
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <button
        onClick={copy}
        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 text-sm font-bold text-white shadow-[0_0_24px_rgba(255,102,0,0.35)]"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? 'Copied' : 'Copy link'}
      </button>

      {supportsNativeShare && (
        <button
          onClick={nativeShare}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${secondary}`}
        >
          <Send className="h-3.5 w-3.5" /> Share
        </button>
      )}

      <a
        href={`mailto:?subject=${encodeURIComponent('COYL caught me.')}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ${secondary}`}
      >
        Email
      </a>
    </div>
  )
}
