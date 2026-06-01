'use client'

import { useEffect, useState } from 'react'

/**
 * Live rarity pill for the /card page.
 *
 * Renders the curated copy immediately (server-shell parity, no layout
 * shift), then upgrades to the LIVE "1 in N people are X" stat once the
 * archetype-rarity API responds — but only when that slug has enough
 * completed audits to be meaningful (minSample). Below that, the curated
 * copy stays. The data flywheel without the cold-start ugliness.
 */
export function ArchetypeRarityPill({
  slug,
  name,
  fallback,
}: {
  slug: string
  name: string
  fallback: string
}) {
  const [live, setLive] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const r = await fetch('/api/v1/archetype-rarity')
        if (!r.ok) return
        const d = (await r.json()) as {
          minSample: number
          bySlug: Record<string, { count: number; oneInN: number; pct: number }>
        }
        const row = d.bySlug?.[slug]
        if (!cancelled && row && row.count >= (d.minSample ?? 50) && row.oneInN >= 2) {
          // Strip a leading "The " so it reads "1 in 4 people are 9 PM Negotiators"
          const label = name.replace(/^The\s+/i, '')
          setLive(`1 in ${row.oneInN} people are ${label}s.`)
        }
      } catch {
        /* keep the curated fallback */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [slug, name])

  return (
    <span className="inline-block rounded-full border border-orange-400/40 bg-orange-500/[0.10] px-3 py-1.5 text-[11px]">
      {live ?? fallback}
    </span>
  )
}
