'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { getOrCreateAuditSession, fireAuditBeacon } from '@/lib/audit-session'

/**
 * The recipient's next tap — an /audit CTA for share landing pages
 * (/a/[slug], /card/[slug], /i/[code]) that closes the K-factor loop:
 *
 *  1. Forwards attribution. Shared links carry `?r={sharer-sid-hash}`
 *     (appended by buildShareUrl). This component reads it client-side
 *     (keeps the landing pages fully static — no searchParams read on
 *     the server) and forwards it onto the /audit href, where
 *     audit-view stamps it into the recipient's funnel events as
 *     `source`. That makes sharer→recipient edges — and therefore
 *     per-archetype K — computable from owned data.
 *
 *  2. Fires a `landed` beacon on mount (once), joining the recipient's
 *     own 24h audit session. landed → started → completed for the same
 *     sessionId = true recipient-side conversion, not just clicks.
 *
 * Renders a plain /audit link during SSR; upgrades after mount.
 */
export function AuditCta({
  surface,
  archetypeSlug,
  className,
  children,
}: {
  /** Which share surface this CTA lives on — becomes the source tag. */
  surface: 'a' | 'card' | 'i'
  archetypeSlug?: string
  className?: string
  children: React.ReactNode
}) {
  const [href, setHref] = useState(`/audit?src=${surface}`)
  const landedFiredRef = useRef(false)

  useEffect(() => {
    let ref = ''
    try {
      ref = new URLSearchParams(window.location.search).get('r') ?? ''
      // sid hashes are [a-z0-9] — drop anything else defensively.
      ref = ref.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)
    } catch {
      /* ignore */
    }
    if (ref) setHref(`/audit?src=${surface}&r=${ref}`)

    if (!landedFiredRef.current) {
      landedFiredRef.current = true
      const sessionId = getOrCreateAuditSession()
      if (sessionId) {
        fireAuditBeacon({
          sessionId,
          kind: 'landed',
          archetypeSlug,
          source: (ref ? `${surface}:r:${ref}` : surface).slice(0, 64),
        })
      }
    }
  }, [surface, archetypeSlug])

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
}
