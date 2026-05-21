import type { ShareCardData } from '@/lib/rescue-share'

/**
 * <AutopilotCard /> — the visual surface of an interrupt receipt.
 *
 * Pure presentation. Renders the same data the /api/og route renders as
 * a PNG, but in HTML/CSS so it can show up inside the product (rescue-
 * view post-pull confirmation) and on the public /i/[code] share page
 * with real accessibility + selectable text.
 *
 * Design rules:
 *   - Dark background, orange accent — matches the rest of the brand
 *   - The TIME is the eyebrow (small, mono, uppercase)
 *   - The TRIGGER is the kicker line above the headline
 *   - The HEADLINE is the brand-promise sentence
 *   - The STREAK + SELF-TRUST are the proof row below
 *   - "COYL" wordmark in the bottom-right
 *
 * No CTA on the card itself — the share-actions row + the public-page
 * sign-up button live OUTSIDE the card so screenshots stay clean.
 */
export function AutopilotCard({ data }: { data: ShareCardData }) {
  return (
    <div
      role="img"
      aria-label={`Autopilot Interrupted at ${data.localTimeLabel}. ${data.triggerLabel}. COYL caught me.`}
      className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-orange-500/30 bg-[#0a0a0a] p-6 shadow-[0_0_60px_-10px_rgba(255,102,0,0.35)] md:p-8"
      style={{
        backgroundImage:
          'radial-gradient(circle at 20% 0%, rgba(255,102,0,0.14), transparent 50%), radial-gradient(circle at 80% 100%, rgba(255,68,0,0.10), transparent 50%)',
      }}
    >
      {/* Eyebrow — time + brand mark row */}
      <div className="mb-5 flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-orange-400">
          {data.localTimeLabel} &middot; Autopilot detected
        </p>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500 shadow-[0_0_18px_rgba(255,102,0,0.5)]">
          <span className="text-sm font-black text-[#0a0a0a]">C</span>
        </div>
      </div>

      {/* Kicker */}
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-400">
        {data.triggerLabel}
      </p>

      {/* Headline */}
      <h2 className="mb-6 text-3xl font-black leading-[1.05] text-white sm:text-4xl">
        I stopped.<br />
        <span className="text-orange-400">Again.</span>
      </h2>

      {/* Proof row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500">
            Streak
          </p>
          <p className="mt-1 text-2xl font-black text-white tabular-nums">
            {data.streakCount}
          </p>
          <p className="mt-0.5 text-[11px] text-gray-400">
            {data.streakCount === 1 ? 'first stop' : 'stops in a row'}
          </p>
        </div>

        <div className="rounded-2xl border border-orange-500/30 bg-orange-500/[0.05] p-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-orange-400">
            Self-Trust
          </p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <p className="text-2xl font-black text-white tabular-nums">
              {data.selfTrustScore ?? '—'}
            </p>
            {data.selfTrustDelta != null && data.selfTrustDelta !== 0 && (
              <p
                className={`text-xs font-bold ${
                  data.selfTrustDelta > 0 ? 'text-emerald-300' : 'text-red-300'
                }`}
              >
                {data.selfTrustDelta > 0 ? '↑' : '↓'}{Math.abs(data.selfTrustDelta)}
              </p>
            )}
          </div>
          <p className="mt-0.5 text-[11px] text-gray-400">
            this week
          </p>
        </div>
      </div>

      {/* Footer brand line */}
      <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
        <p className="text-sm font-bold text-white">{data.brandTagline}</p>
        <p className="font-mono text-[11px] uppercase tracking-widest text-gray-500">
          coyl.ai
        </p>
      </div>
    </div>
  )
}
