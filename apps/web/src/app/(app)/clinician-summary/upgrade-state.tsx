import Link from 'next/link'
import { FileText, ArrowRight } from 'lucide-react'

/**
 * UpgradeState — what FREE / CORE users see at /clinician-summary. The
 * clinician summary is a Rebound-tier ($29/mo, internal PlanType PLUS)
 * artifact; below that tier we show a tasteful, honest upsell rather than
 * a paywall wall. Screen-only — this page is never printed for non-Rebound
 * users, so no print stylesheet is needed here.
 */
export function UpgradeState() {
  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 ring-1 ring-orange-500/20">
        <FileText className="h-7 w-7 text-orange-500" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-[#f5f3ee]">
        Clinician summary
      </h1>
      <p className="mt-3 text-balance text-sm leading-relaxed text-[#a8a195]">
        A clean, print-ready one-pager of your behavioral pattern data — your
        archetype, your danger windows, and your last-28-days engagement signals
        — to bring to your prescriber. It is part of{' '}
        <span className="font-semibold text-[#f5f3ee]">Rebound</span>, the
        GLP-1 maintenance tier.
      </p>
      <div className="mt-8 w-full rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#8a847a]">
          Part of Rebound
        </p>
        <p className="mt-1 text-3xl font-black text-[#f5f3ee]">
          $29<span className="text-base font-medium text-[#8a847a]">/mo</span>
        </p>
        <Link
          href="/pricing"
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
        >
          See Rebound
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <p className="mt-6 max-w-md text-pretty text-[11px] leading-relaxed text-[#6f6a61]">
        COYL provides behavioral support, not medical treatment.
      </p>
    </div>
  )
}
