'use client'

import { useEffect } from 'react'

/**
 * Paints the <body> + <html> behind a dark-canvas route.
 *
 * The root layout's body is cream (the marketing default). Dark share
 * surfaces (/a, /card, /i) draw their canvas on a page-level div, so
 * the cream body shows through wherever the div isn't painted yet:
 * iOS rubber-band overscroll, fast programmatic scrolls, and the
 * first compositor frame all flash WHITE above/below the dark page —
 * a visible brand seam at the exact moment a share recipient lands.
 *
 * Mount this once per dark route. Restores the previous colors on
 * unmount so client-side navigation back to cream pages is clean.
 */
export function DarkCanvas({ color = '#0e0c0a' }: { color?: string }) {
  useEffect(() => {
    const prevBody = document.body.style.backgroundColor
    const prevHtml = document.documentElement.style.backgroundColor
    document.body.style.backgroundColor = color
    document.documentElement.style.backgroundColor = color
    return () => {
      document.body.style.backgroundColor = prevBody
      document.documentElement.style.backgroundColor = prevHtml
    }
  }, [color])
  return null
}
