import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

/**
 * /api/og — dynamic Open Graph image generator.
 *
 * Every shared link on Twitter/X, Facebook, LinkedIn, iMessage, Slack,
 * and Discord requests an OG image. Without one, link previews collapse
 * to a tiny favicon — kills social CTR by 40–60% per published platform
 * benchmarks.
 *
 * This route renders a 1200×630 PNG on demand using Next.js's
 * @vercel/og-backed ImageResponse. Edge runtime so it's <50ms cold.
 *
 * Usage from any page's Metadata:
 *   openGraph: {
 *     images: [{ url: '/api/og?title=Stop+the+9pm+kitchen&kicker=Weight+loss' }]
 *   }
 *
 * Query params:
 *   - title (required) — main headline, up to ~80 chars before clip
 *   - kicker (optional) — small uppercase pre-line (e.g. "GLP-1", "Pricing")
 *   - accent (optional) — hex color (default orange)
 *
 * Keep the design honest with the rest of the brand: dark background,
 * orange accent stripe, geist-style typography. No images or fonts loaded
 * remotely — keeps it bulletproof under load and at edge.
 */

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl

  const title = (searchParams.get('title') ?? "It's not the mistake. It's what you do after.").slice(0, 140)
  const kicker = (searchParams.get('kicker') ?? 'COYL').slice(0, 32)
  const accent = searchParams.get('accent') ?? '#ff6600'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0a0a0a',
          backgroundImage:
            `radial-gradient(circle at 20% 0%, rgba(255,102,0,0.18), transparent 50%), radial-gradient(circle at 80% 100%, rgba(255,68,0,0.12), transparent 50%)`,
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
            <span style={{ color: '#0a0a0a', fontSize: '28px', fontWeight: 900 }}>C</span>
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
            Stop the script before it runs your life.
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
