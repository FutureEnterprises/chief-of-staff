'use client'

import { useState } from 'react'
import { Copy, Check, Send } from 'lucide-react'

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
 */
export function ShareActions({
  shareUrl,
  shareText,
}: {
  shareUrl: string
  shareText: string
}) {
  const [copied, setCopied] = useState(false)
  const supportsNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // clipboard blocked — fall back to URL display only
    }
  }

  async function nativeShare() {
    if (!supportsNativeShare) return
    try {
      await navigator.share({ title: 'COYL caught me.', text: shareText, url: shareUrl })
    } catch {
      // user cancelled — ignore
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <button
        onClick={copy}
        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 text-sm font-bold text-white shadow-[0_0_16px_-3px_rgba(255,102,0,0.4)]"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? 'Copied' : 'Copy link'}
      </button>

      {supportsNativeShare && (
        <button
          onClick={nativeShare}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-sm font-semibold text-foreground hover:bg-white/[0.05]"
        >
          <Send className="h-3.5 w-3.5" /> Share
        </button>
      )}

      <a
        href={`mailto:?subject=${encodeURIComponent('COYL caught me.')}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        Email
      </a>
    </div>
  )
}
