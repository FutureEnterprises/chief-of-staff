import { Flame } from 'lucide-react'
import type { ShareCardData } from '@/lib/rescue-share'

/**
 * <AutopilotCard /> — the Instagram-native interrupt receipt.
 *
 * The Day-1 distribution engine: every successful interrupt becomes this
 * card, every card becomes a share, every share becomes acquisition. The
 * card is the product's screenshot atom — designed first for 1080×1080
 * Instagram square, with proportional fallback to inline and Story.
 *
 * Layout — four-line atom, top to bottom:
 *   1. BEHAVIOR  — sans, warm off-white, ~52px @ square (responsive scale)
 *   2. TIME      — Instrument Serif, ~96px @ square, off-white over a
 *                  subtle orange radial gradient (the focal moment)
 *   3. RESULT    — Instrument Serif italic, ~64px @ square, orange
 *   4. STREAK    — mono uppercase, tight tracking, ~24px @ square,
 *                  warm off-white
 *
 * Brand mark: a single Flame icon in the corner (Lucide, no emoji).
 * Footer: "COYL caught me · coyl.ai" in mono.
 *
 * Rendering modes via `variant`:
 *   - 'square'  — the canonical 1080×1080 atom (aspect-square)
 *   - 'inline'  — responsive width, auto height for in-product preview
 *   - 'story'   — 1080×1920 portrait for Instagram/TikTok stories
 *
 * Default is 'inline' so existing call sites in /rescue and /i keep
 * working without changes. The /i/[code] page opts into 'square'.
 *
 * No CTA on the card itself — the share-actions row + the public-page
 * sign-up button live OUTSIDE the card so screenshots stay clean.
 */

type Variant = 'square' | 'inline' | 'story'

export function AutopilotCard({
  data,
  variant = 'inline',
}: {
  data: ShareCardData
  variant?: Variant
}) {
  const behaviorLine = formatBehaviorLine(data.triggerLabel)
  const resultLine = data.streakCount > 1 ? 'Stopped. Again.' : 'Stopped.'
  const streakLine = formatStreakLine(data.streakCount)

  // Aspect + sizing per variant. The square variant uses the canonical
  // 1080×1080 — every pixel is "container-relative" so the same component
  // screenshots cleanly at any pixel density.
  const aspect =
    variant === 'square'
      ? 'aspect-square'
      : variant === 'story'
        ? 'aspect-[9/16]'
        : ''

  return (
    <div
      role="img"
      aria-label={`Autopilot Interrupted at ${data.localTimeLabel}. ${data.triggerLabel}. ${resultLine} ${streakLine}. COYL caught me.`}
      className={`relative w-full overflow-hidden rounded-3xl border border-orange-500/20 bg-[#0e0c0a] shadow-[0_0_80px_-12px_rgba(255,102,0,0.32)] ${aspect}`}
    >
      {/* Focal radial wash — anchored behind the time line. Single orange,
          no multi-color gradient (per visual discipline). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 42%, rgba(255,102,0,0.22), transparent 55%)',
        }}
      />

      {/* Hairline border accent — almost invisible, just adds depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/[0.04]"
      />

      {/* Card content — vertical-centered four-line atom */}
      <div
        className={`relative flex h-full w-full flex-col justify-between ${
          variant === 'square'
            ? 'px-[8%] py-[7%]'
            : variant === 'story'
              ? 'px-[7%] py-[10%]'
              : 'px-7 py-8 sm:px-10 sm:py-12'
        }`}
      >
        {/* Top row — brand mark + behavior label */}
        <div className="flex items-start justify-between">
          <p
            className={`max-w-[80%] font-sans font-medium leading-tight tracking-[-0.01em] text-[#f5efe6] ${
              variant === 'square'
                ? 'text-[clamp(20px,4.8cqw,52px)]'
                : variant === 'story'
                  ? 'text-[clamp(20px,4.6cqw,52px)]'
                  : 'text-xl sm:text-2xl md:text-[28px]'
            }`}
            style={{ containerType: 'inline-size' }}
          >
            {behaviorLine}
          </p>

          {/* Brand mark — single Lucide icon, no emoji, no logo blob */}
          <div
            className={`flex items-center justify-center rounded-xl bg-[#ff6600] shadow-[0_0_24px_rgba(255,102,0,0.45)] ${
              variant === 'square'
                ? 'h-[6.5%] w-[6.5%] min-h-[36px] min-w-[36px]'
                : variant === 'story'
                  ? 'h-[5.5%] w-[5.5%] min-h-[36px] min-w-[36px]'
                  : 'h-9 w-9 sm:h-10 sm:w-10'
            }`}
          >
            <Flame
              className={`text-[#0e0c0a] ${
                variant === 'square' || variant === 'story'
                  ? 'h-[55%] w-[55%]'
                  : 'h-5 w-5'
              }`}
              strokeWidth={2.5}
            />
          </div>
        </div>

        {/* Middle stack — TIME + RESULT, the focal moment */}
        <div className="flex flex-col gap-[1.5%]">
          {/* Time — the big serif number, the brand moment */}
          <p
            className={`font-serif leading-[0.95] tracking-[-0.025em] text-[#fff7eb] ${
              variant === 'square'
                ? 'text-[clamp(40px,9cqw,96px)]'
                : variant === 'story'
                  ? 'text-[clamp(40px,8.8cqw,96px)]'
                  : 'text-5xl sm:text-6xl md:text-7xl'
            }`}
          >
            {data.localTimeLabel}
          </p>

          {/* Result — italic serif, orange */}
          <p
            className={`font-serif italic leading-[1] tracking-[-0.015em] text-[#ff6600] ${
              variant === 'square'
                ? 'text-[clamp(28px,6cqw,64px)]'
                : variant === 'story'
                  ? 'text-[clamp(28px,5.8cqw,64px)]'
                  : 'text-3xl sm:text-4xl md:text-5xl'
            }`}
          >
            {resultLine}
          </p>
        </div>

        {/* Streak — mono, uppercase, tight tracking */}
        <div className="flex flex-col gap-[3%]">
          <p
            className={`font-mono font-medium uppercase leading-tight tracking-[0.16em] text-[#cdc2ad] ${
              variant === 'square'
                ? 'text-[clamp(11px,2.2cqw,24px)]'
                : variant === 'story'
                  ? 'text-[clamp(11px,2.1cqw,24px)]'
                  : 'text-xs sm:text-sm'
            }`}
          >
            {streakLine}
          </p>

          {/* Footer brand line — locked to the bottom */}
          <div className="flex items-center justify-between border-t border-white/[0.06] pt-[3%]">
            <p
              className={`font-mono uppercase tracking-[0.22em] text-[#7a7264] ${
                variant === 'square'
                  ? 'text-[clamp(9px,1.6cqw,16px)]'
                  : variant === 'story'
                    ? 'text-[clamp(9px,1.5cqw,16px)]'
                    : 'text-[10px] sm:text-[11px]'
              }`}
            >
              COYL caught me
            </p>
            <p
              className={`font-mono uppercase tracking-[0.22em] text-[#ff6600] ${
                variant === 'square'
                  ? 'text-[clamp(9px,1.6cqw,16px)]'
                  : variant === 'story'
                    ? 'text-[clamp(9px,1.5cqw,16px)]'
                    : 'text-[10px] sm:text-[11px]'
              }`}
            >
              coyl.ai
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Behavior line — turns the trigger key into the natural-language label
 * shown at the top of the card. Falls back to a generic "Autopilot
 * detected." when we have no specific trigger context.
 *
 * We append "Autopilot detected." so the line reads as a complete
 * sentence atom regardless of the trigger source.
 */
function formatBehaviorLine(triggerLabel: string): string {
  if (!triggerLabel || triggerLabel === 'The moment') {
    return 'Autopilot detected.'
  }
  return `${triggerLabel}. Autopilot detected.`
}

/**
 * Streak line — uses the streakCount to render a tight, two-clause
 * mono line. Singular vs plural handled explicitly so the card never
 * shows "1 nights" or similar gore.
 */
function formatStreakLine(n: number): string {
  if (n <= 1) return '1 night · 1 stop'
  return `${n} nights · ${n} stops`
}
