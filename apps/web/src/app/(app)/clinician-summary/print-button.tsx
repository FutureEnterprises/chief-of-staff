'use client'

import { Printer } from 'lucide-react'

/**
 * PrintButton — the v1 "export" affordance. Browser print-to-PDF IS the
 * export: window.print() opens the OS print dialog where the user picks
 * "Save as PDF". No PDF library, no new dependency. The print stylesheet
 * in summary-view hides this button (and the rest of the app chrome) when
 * the print media query is active, so it never appears on the page itself.
 */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      data-print-hidden
      className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50"
    >
      <Printer className="h-4 w-4" />
      Print / Save as PDF
    </button>
  )
}
