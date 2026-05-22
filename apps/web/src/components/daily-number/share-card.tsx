/**
 * <ShareCard /> — internal social-share image renderer.
 *
 * Server component that renders the 1080×1080 social-share atom as a
 * React tree so the visual is composable and testable in isolation
 * from the next/og ImageResponse pipeline.
 *
 * The /d/[code]/social route generates the actual PNG (next/og inlines
 * its own simplified style system that doesn't match Tailwind 1:1, so
 * the route uses inline styles). This component mirrors that visual
 * for in-app previews — e.g. a future Settings → "Preview your share
 * card" surface, or a developer-debug page.
 *
 * Four elements, top → bottom:
 *   1. DAY N.           mono micro, muted
 *   2. ±delta           Instrument Serif huge, single orange focal
 *   3. identitySentence Instrument Serif large, near-black
 *   4. — COYL           mono micro, soft
 *
 * Locked to 1:1 aspect. Cream canvas. Single orange accent on the
 * delta — matches the brand brief exactly.
 */

export type ShareCardProps = {
  dayNumber: number
  selfTrustDelta: number
  identitySentence: string
  /** Optional override — falls back to a server-formatted +X / −X. */
  deltaLabel?: string
  /** Override scale unit — defaults to 'auto' (responsive via cqw). */
  scale?: 'auto' | 'fixed-1080'
}

const ACCENT = '#ff6600'
const ACCENT_DARK = '#9a3a1a'
const TEXT = '#1a1814'
const MUTED = '#6b6557'
const SOFT = '#9a8f7a'
const BG = '#f6efe4'

function defaultDeltaLabel(delta: number): string {
  if (delta === 0) return '0'
  if (delta > 0) return `+${delta}`
  return `−${Math.abs(delta)}`
}

export function ShareCard({
  dayNumber,
  selfTrustDelta,
  identitySentence,
  deltaLabel,
  scale = 'auto',
}: ShareCardProps) {
  const label = deltaLabel ?? defaultDeltaLabel(selfTrustDelta)
  const deltaColor =
    selfTrustDelta > 0 ? ACCENT : selfTrustDelta < 0 ? ACCENT_DARK : TEXT

  // Fixed-1080 mode locks the pixel sizes so a downstream html-to-image
  // renderer captures a 1:1 1080×1080 PNG without scaling artifacts.
  // Auto mode uses container queries for the in-app preview which can
  // be any size.
  const isFixed = scale === 'fixed-1080'

  return (
    <div
      role="img"
      aria-label={`Day ${dayNumber}. ${label}. ${identitySentence}`}
      style={{
        width: isFixed ? '1080px' : '100%',
        height: isFixed ? '1080px' : 'auto',
        aspectRatio: '1 / 1',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: BG,
        backgroundImage:
          'radial-gradient(circle at 50% 35%, rgba(255,102,0,0.06), transparent 60%)',
        borderRadius: isFixed ? '0' : '24px',
        containerType: 'inline-size',
      }}
    >
      <div
        style={{
          position: 'relative',
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: isFixed ? '100px 96px' : '9% 9%',
        }}
      >
        {/* 1. DAY N. */}
        <p
          style={{
            color: MUTED,
            fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
            fontSize: isFixed ? '28px' : 'clamp(11px, 1.9cqw, 18px)',
            textTransform: 'uppercase',
            letterSpacing: '0.28em',
            fontWeight: 500,
            margin: 0,
          }}
        >
          Day {dayNumber}.
        </p>

        {/* 2 + 3 — delta + sentence stacked */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: isFixed ? '24px' : '2%',
          }}
        >
          {/* Delta */}
          <p
            style={{
              color: deltaColor,
              fontFamily:
                'var(--font-instrument-serif), "Instrument Serif", "Times New Roman", serif',
              fontSize: isFixed ? '320px' : 'clamp(72px, 22cqw, 256px)',
              lineHeight: 0.9,
              letterSpacing: '-0.04em',
              fontWeight: 400,
              margin: 0,
            }}
          >
            {label}
          </p>

          {/* Identity sentence */}
          <p
            style={{
              color: TEXT,
              fontFamily:
                'var(--font-instrument-serif), "Instrument Serif", "Times New Roman", serif',
              fontSize: isFixed
                ? identitySentence.length > 80
                  ? '52px'
                  : identitySentence.length > 55
                    ? '64px'
                    : '76px'
                : 'clamp(22px, 5.4cqw, 56px)',
              lineHeight: 1.08,
              letterSpacing: '-0.012em',
              fontWeight: 400,
              margin: 0,
              maxWidth: isFixed ? '880px' : '95%',
            }}
          >
            {identitySentence}
          </p>
        </div>

        {/* 4. — COYL */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(26,24,20,0.10)',
            paddingTop: isFixed ? '28px' : '3%',
          }}
        >
          <p
            style={{
              color: SOFT,
              fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
              fontSize: isFixed ? '22px' : 'clamp(11px, 1.9cqw, 18px)',
              textTransform: 'uppercase',
              letterSpacing: '0.28em',
              fontWeight: 500,
              margin: 0,
            }}
          >
            &mdash; COYL
          </p>
          <p
            style={{
              color: ACCENT,
              fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
              fontSize: isFixed ? '22px' : 'clamp(11px, 1.9cqw, 18px)',
              textTransform: 'uppercase',
              letterSpacing: '0.28em',
              fontWeight: 700,
              margin: 0,
            }}
          >
            coyl.ai
          </p>
        </div>
      </div>
    </div>
  )
}
