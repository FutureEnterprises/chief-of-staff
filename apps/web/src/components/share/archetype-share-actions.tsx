'use client'

import { useState } from 'react'

/**
 * Client share island for the /card/[slug] page.
 *
 * Three actions, in order of viral leverage:
 *   1. Share — Web Share API (native sheet on mobile, where Stories live).
 *      Pre-filled caption that name-drops the archetype + the audit link.
 *   2. Download card — fetches the 9:16 OG PNG and triggers a download so
 *      the user can post it to their Story directly.
 *   3. Copy link — fallback for desktop.
 *
 * Fires a PostHog event on share so we can measure the viral coefficient.
 */
export function ArchetypeShareActions({
  slug,
  name,
}: {
  slug: string
  name: string
}) {
  const [copied, setCopied] = useState(false)
  const pageUrl = `https://coyl.ai/card/${slug}`
  const imageUrl = `https://coyl.ai/api/og/archetype?slug=${slug}`
  const caption = `I'm ${name} on COYL. What's your pattern? Take the 90-second audit → coyl.ai/audit`

  function track(channel: string) {
    try {
      void import('@/lib/telemetry/posthog-client').then(({ captureMarketingEvent }) => {
        captureMarketingEvent('audit.shared', { slug, channel })
      })
    } catch {
      /* swallow — telemetry must not break sharing */
    }
  }

  async function onShare() {
    track('web_share')
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title: `I'm ${name}`, text: caption, url: pageUrl })
        return
      } catch {
        /* user cancelled or unsupported — fall through to copy */
      }
    }
    await onCopy()
  }

  async function onCopy() {
    track('copy_link')
    try {
      await navigator.clipboard.writeText(`${caption} ${pageUrl}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked — no-op */
    }
  }

  async function onDownload() {
    track('download_card')
    try {
      const res = await fetch(imageUrl)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `coyl-${slug}.png`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      /* fetch blocked — open in new tab as fallback */
      window.open(imageUrl, '_blank')
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={onShare}
        className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_24px_rgba(255,102,0,0.35)]"
      >
        Share your pattern →
      </button>
      <button
        onClick={onDownload}
        className="rounded-full border border-orange-400/40 bg-orange-500/[0.08] px-6 py-3 text-sm font-semibold text-orange-200 hover:bg-orange-500/[0.14]"
      >
        Download card
      </button>
      <button
        onClick={onCopy}
        className="rounded-full border border-white/15 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-[#cdc2ad] hover:border-white/30"
      >
        {copied ? 'Copied ✓' : 'Copy link'}
      </button>
    </div>
  )
}
