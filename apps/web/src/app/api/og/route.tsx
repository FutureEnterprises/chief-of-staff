import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

/**
 * /api/og — dynamic Open Graph image generator.
 *
 * Every shared link on Twitter/X, Facebook, LinkedIn, iMessage, Slack,
 * and Discord requests an OG image. Without one, link previews collapse
 * to a tiny favicon — kills social CTR by 40-60% per published platform
 * benchmarks.
 *
 * This route renders a 1200×630 PNG on demand using Next.js's
 * @vercel/og-backed ImageResponse. Edge runtime so it's <50ms cold.
 *
 * Two variants:
 *
 *  1. DEFAULT (used by every page-level OG image — pricing, how-it-works,
 *     developers, marketing, etc.) Query: ?title=...&kicker=...&accent=...
 *
 *  2. CARD (used by /i/[code] interrupt receipts — the four-line atom in
 *     1200×630 OG-shaped form, mirroring the on-page <AutopilotCard />
 *     visual.) Query: ?variant=card&time=...&behavior=...&streak=...
 *
 * Keep the design honest with the rest of the brand: dark warm charcoal
 * background, single orange accent, Instrument-Serif-shaped typography
 * for the focal moment. No images or fonts loaded remotely so it stays
 * bulletproof at edge.
 */

const BG = '#0e0c0a'
const ACCENT = '#ff6600'
const FG = '#fff7eb'
const MUTED = '#7a7264'
const WARM_OFF = '#cdc2ad'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const variant = searchParams.get('variant')

  if (variant === 'card') {
    return renderInterruptCard({
      time: (searchParams.get('time') ?? '9:47 PM').slice(0, 16),
      behavior: (searchParams.get('behavior') ?? 'Autopilot detected').slice(0, 60),
      streak: Number.parseInt(searchParams.get('streak') ?? '1', 10) || 1,
    })
  }

  if (variant === 'archetype') {
    return renderArchetypeCard({
      family: (searchParams.get('family') ?? 'The 9 PM Negotiator').slice(0, 64),
      signature:
        (searchParams.get('signature') ?? '“One time won’t matter.”').slice(0, 80),
      specific: (searchParams.get('specific') ?? 'Night Fridge Saboteur').slice(0, 48),
      stat: searchParams.get('stat')?.slice(0, 90) ?? null,
      footerCta: (searchParams.get('cta') ?? 'Find your autopilot family').slice(0, 48),
      footerUrl: (searchParams.get('ctaUrl') ?? 'coyl.ai/audit').slice(0, 48),
    })
  }

  return renderDefault({
    title: (searchParams.get('title') ?? "It's not the mistake. It's what you do after.").slice(0, 140),
    kicker: (searchParams.get('kicker') ?? 'COYL').slice(0, 32),
    accent: searchParams.get('accent') ?? ACCENT,
  })
}

/**
 * Interrupt-card OG variant — the four-line atom in 1200×630.
 *
 * The square in-product version is 1080×1080. For the OG-shaped 1200×630
 * we compress: the time stays huge (it's the focal moment), behavior +
 * result sit to its left, streak + footer compress to fit.
 *
 * Layout:
 *
 *   ┌───────────────────────────────────────────────────────┐
 *   │  [Flame]                                              │
 *   │                                                       │
 *   │  Behavior label.                          ┌───────┐   │
 *   │  Autopilot detected.                      │ 9:47  │   │
 *   │                                           │  PM   │   │
 *   │  Stopped. (italic)                        └───────┘   │
 *   │                                                       │
 *   │  4 NIGHTS · 4 STOPS                                   │
 *   │ ─────────────────────────────────────────────────────│
 *   │  COYL caught me                              coyl.ai │
 *   └───────────────────────────────────────────────────────┘
 */
function renderInterruptCard({
  time,
  behavior,
  streak,
}: {
  time: string
  behavior: string
  streak: number
}) {
  const resultLine = streak > 1 ? 'Stopped. Again.' : 'Stopped.'
  const streakLine =
    streak <= 1 ? '1 NIGHT · 1 STOP' : `${streak} NIGHTS · ${streak} STOPS`
  const behaviorLine =
    !behavior || behavior === 'The moment'
      ? 'Autopilot detected.'
      : `${behavior}. Autopilot detected.`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: BG,
          // Single orange radial wash, anchored under the time numeral.
          backgroundImage:
            'radial-gradient(circle at 75% 50%, rgba(255,102,0,0.22), transparent 55%)',
          padding: '64px 72px',
          position: 'relative',
        }}
      >
        {/* Brand mark — Flame, single orange chip in the top-left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              backgroundColor: ACCENT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 28px ${ACCENT}80`,
            }}
          >
            {/* Lucide Flame SVG inlined — no remote fetch */}
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke={BG}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
            </svg>
          </div>
        </div>

        {/* Body — two-column atom: behavior + result on the left, time on the right */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            flex: 1,
            marginTop: '12px',
            marginBottom: '12px',
            gap: '48px',
          }}
        >
          {/* Left column — behavior + result */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              maxWidth: '600px',
              gap: '24px',
            }}
          >
            <span
              style={{
                color: FG,
                fontSize: '36px',
                fontWeight: 500,
                lineHeight: 1.15,
                letterSpacing: '-0.01em',
              }}
            >
              {behaviorLine}
            </span>

            <span
              style={{
                color: ACCENT,
                fontFamily: 'serif',
                fontStyle: 'italic',
                fontSize: '64px',
                fontWeight: 400,
                lineHeight: 1,
                letterSpacing: '-0.02em',
              }}
            >
              {resultLine}
            </span>
          </div>

          {/* Right column — the time, the focal moment */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
            }}
          >
            <span
              style={{
                color: FG,
                fontFamily: 'serif',
                fontSize: '156px',
                fontWeight: 400,
                lineHeight: 0.95,
                letterSpacing: '-0.04em',
                whiteSpace: 'nowrap',
              }}
            >
              {time}
            </span>
          </div>
        </div>

        {/* Streak line — mono, uppercase, tight tracking */}
        <div style={{ display: 'flex', marginTop: '8px' }}>
          <span
            style={{
              color: WARM_OFF,
              fontFamily: 'monospace',
              fontSize: '22px',
              fontWeight: 500,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}
          >
            {streakLine}
          </span>
        </div>

        {/* Footer brand line */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            paddingTop: '20px',
            marginTop: '20px',
          }}
        >
          <span
            style={{
              color: MUTED,
              fontFamily: 'monospace',
              fontSize: '16px',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
            }}
          >
            COYL caught me
          </span>
          <span
            style={{
              color: ACCENT,
              fontFamily: 'monospace',
              fontSize: '16px',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
            }}
          >
            coyl.ai
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
}

/**
 * Archetype OG variant — the viral atom for /a/[slug] shares.
 *
 * Layout (1200×630) when a stat is provided (Rebound shares):
 *
 *   ┌────────────────────────────────────────────────────────┐
 *   │  [Flame]   64% OF REGAIN HAPPENS IN THE DOSE-TROUGH    │
 *   │                                                        │
 *   │  The Night Rebounder. (huge serif italic, FG)          │
 *   │                                                        │
 *   │  "One snack won't matter."  (orange serif italic)      │
 *   │                                                        │
 *   │  9:00 PM – 11:30 PM  (mono uppercase tracked)          │
 *   │ ──────────────────────────────────────────────────────│
 *   │  Find your rebound pattern         coyl.ai/rebound...  │
 *   └────────────────────────────────────────────────────────┘
 *
 * When NO stat (generic /audit shares), the top eyebrow falls back to
 * "I'M" — the old layout. The audit's May 2026 audit note specifically
 * called for "data-driven copy will make people share it more" — so
 * when caller passes a stat, the data line replaces the generic eyebrow
 * and becomes the FIRST thing a viewer reads on the Twitter/iMessage/
 * Slack preview, instead of being buried mid-card.
 *
 * Matches the visual language of renderInterruptCard — warm dark BG,
 * single orange accent, Instrument-Serif-shaped focal type, mono for
 * metadata. No remote fonts/images so it stays edge-bulletproof.
 */
function renderArchetypeCard({
  family,
  signature,
  specific,
  stat,
  footerCta,
  footerUrl,
}: {
  family: string
  signature: string
  specific: string
  /** Optional data-driven stat rendered above the specific moment.
   *  When present, makes the share card spread (per the May 2026
   *  share-card audit: "78% of Night Rebounders lapse within 90 min
   *  of finishing something hard" is the line that drives sharing). */
  stat: string | null
  footerCta: string
  footerUrl: string
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: BG,
          backgroundImage:
            'radial-gradient(circle at 30% 40%, rgba(255,102,0,0.22), transparent 55%)',
          padding: '64px 72px',
          position: 'relative',
        }}
      >
        {/* Top row — flame chip + eyebrow. When a stat is provided
            (Rebound shares), the stat IS the eyebrow so the data is
            the first thing a viewer reads on the preview. When no
            stat (generic /audit shares), falls back to "I'M". */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              backgroundColor: ACCENT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 28px ${ACCENT}80`,
            }}
          >
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke={BG}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
            </svg>
          </div>
          <span
            style={{
              color: stat ? FG : WARM_OFF,
              fontFamily: 'monospace',
              fontSize: stat ? '20px' : '22px',
              fontWeight: stat ? 600 : 500,
              letterSpacing: stat ? '0.18em' : '0.32em',
              textTransform: 'uppercase',
              maxWidth: '900px',
              lineHeight: 1.2,
            }}
          >
            {stat ?? 'I’m'}
          </span>
        </div>

        {/* Family name — huge serif italic, the focal headline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            justifyContent: 'center',
            gap: '24px',
            marginTop: '12px',
          }}
        >
          <span
            style={{
              color: FG,
              fontFamily: 'serif',
              fontStyle: 'italic',
              fontSize: '108px',
              fontWeight: 400,
              lineHeight: 0.95,
              letterSpacing: '-0.03em',
            }}
          >
            {family}.
          </span>

          {/* Signature script — orange italic, the meme line */}
          <span
            style={{
              color: ACCENT,
              fontFamily: 'serif',
              fontStyle: 'italic',
              fontSize: '44px',
              fontWeight: 400,
              lineHeight: 1.1,
              letterSpacing: '-0.01em',
            }}
          >
            {signature}
          </span>

          {/* Specific moment — mono uppercase, the texture proof. The
              stat (when present) now lives in the eyebrow above; this
              line carries the danger-window timing only, not the
              prevalence number. */}
          <span
            style={{
              color: WARM_OFF,
              fontFamily: 'monospace',
              fontSize: '22px',
              fontWeight: 500,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
            }}
          >
            {specific}
          </span>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            paddingTop: '20px',
            marginTop: '20px',
          }}
        >
          <span
            style={{
              color: MUTED,
              fontFamily: 'monospace',
              fontSize: '16px',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
            }}
          >
            {footerCta}
          </span>
          <span
            style={{
              color: ACCENT,
              fontFamily: 'monospace',
              fontSize: '16px',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
            }}
          >
            {footerUrl}
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
}

/**
 * Default OG variant — title/kicker, for marketing + non-interrupt pages.
 * Preserved from the original implementation so every existing call site
 * (pricing, how-it-works, marketing, developers, etc.) keeps working.
 */
function renderDefault({
  title,
  kicker,
  accent,
}: {
  title: string
  kicker: string
  accent: string
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: BG,
          backgroundImage:
            'radial-gradient(circle at 20% 0%, rgba(255,102,0,0.18), transparent 50%), radial-gradient(circle at 80% 100%, rgba(255,68,0,0.12), transparent 50%)',
          padding: '72px',
          position: 'relative',
        }}
      >
        {/* Brand row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              backgroundColor: accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 32px ${accent}80`,
            }}
          >
            <span style={{ color: BG, fontSize: '28px', fontWeight: 900 }}>C</span>
          </div>
          <span
            style={{
              color: '#ffffff',
              fontSize: '24px',
              fontWeight: 800,
              letterSpacing: '-0.02em',
            }}
          >
            COYL
          </span>
        </div>

        {/* Kicker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '64px' }}>
          <div style={{ width: '40px', height: '2px', backgroundColor: accent }} />
          <span
            style={{
              color: accent,
              fontSize: '20px',
              fontWeight: 700,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
            }}
          >
            {kicker}
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            color: '#ffffff',
            fontSize: title.length > 70 ? '60px' : '72px',
            fontWeight: 900,
            letterSpacing: '-0.035em',
            lineHeight: 1.05,
            marginTop: '28px',
            maxWidth: '1000px',
            display: 'flex',
          }}
        >
          {title}
        </div>

        {/* Bottom row — tagline + URL */}
        <div
          style={{
            position: 'absolute',
            left: '72px',
            right: '72px',
            bottom: '64px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: '24px',
          }}
        >
          <span style={{ color: '#888888', fontSize: '22px', fontWeight: 500 }}>
            Catch yourself before you do it again.
          </span>
          <span style={{ color: accent, fontSize: '22px', fontWeight: 700 }}>
            coyl.ai
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
}
