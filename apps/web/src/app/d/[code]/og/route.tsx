import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { prisma } from '@repo/database'
import { formatDeltaLabel } from '@/lib/daily-number'

/**
 * /d/[code]/og — Open Graph image generator for the daily-number share.
 *
 * Twitter/iMessage/Slack/Discord scrape this URL when the /d/[code]
 * page is shared. Without an OG image, link previews collapse to a
 * tiny favicon — kills social CTR per published platform benchmarks.
 *
 * Renders a 1200×630 PNG on demand using Next.js's @vercel/og-backed
 * ImageResponse. Edge runtime so it's <50ms cold.
 *
 * Layout (cream-canvas editorial, mirrors the on-page treatment):
 *
 *   ┌─────────────────────────────────────────────────────┐
 *   │                                                     │
 *   │  DAY 47.                                            │
 *   │                                                     │
 *   │  +3        You held a 9 PM moment last night.       │
 *   │                                                     │
 *   │  ─────────────────────────────────────────  COYL    │
 *   └─────────────────────────────────────────────────────┘
 *
 * No remote fonts or images — keeps the route bulletproof at edge.
 * The 1200×630 is OG-shaped; the square 1080×1080 social-share asset
 * lives at /d/[code]/social.
 */

const BG = '#f6efe4'
const ACCENT = '#ff6600'
const ACCENT_DARK = '#9a3a1a'
const TEXT = '#1a1814'
const MUTED = '#6b6557'
const SOFT = '#9a8f7a'

type RouteParams = { params: Promise<{ code: string }> }

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { code } = await params

  // Edge runtime + Prisma over Postgres: this is the same pattern the
  // rest of the codebase uses; the @repo/database client tolerates
  // edge invocation as long as DATABASE_URL points at a pooled
  // connection (Neon/Supabase pooler). If we hit edge limits in prod
  // we can downgrade this route to node runtime — the rendering side
  // is what's edge-sensitive, not the lookup.
  const daily = await prisma.dailyNumber
    .findUnique({
      where: { shareCode: code },
      select: {
        dayNumber: true,
        selfTrustDelta: true,
        identitySentence: true,
      },
    })
    .catch(() => null)

  if (!daily) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: BG,
            color: TEXT,
            fontSize: 64,
            fontFamily: 'serif',
          }}
        >
          Not found
        </div>
      ),
      { width: 1200, height: 630 },
    )
  }

  const deltaLabel = formatDeltaLabel(daily.selfTrustDelta)
  const deltaColor =
    daily.selfTrustDelta > 0
      ? ACCENT
      : daily.selfTrustDelta < 0
        ? ACCENT_DARK
        : TEXT

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: BG,
          // Soft warm radial — single accent, no decorative gloss.
          backgroundImage:
            'radial-gradient(circle at 30% 40%, rgba(255,102,0,0.08), transparent 60%)',
          padding: '72px 88px',
          position: 'relative',
        }}
      >
        {/* Top row — DAY N. mono micro */}
        <div style={{ display: 'flex' }}>
          <span
            style={{
              color: MUTED,
              fontFamily: 'monospace',
              fontSize: '22px',
              fontWeight: 500,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
            }}
          >
            Day {daily.dayNumber}.
          </span>
        </div>

        {/* Body — delta on the left, sentence on the right */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '64px',
            flex: 1,
            marginTop: '20px',
            marginBottom: '20px',
          }}
        >
          {/* Delta — the focal moment */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              minWidth: '280px',
            }}
          >
            <span
              style={{
                color: deltaColor,
                fontFamily: 'serif',
                fontSize: '240px',
                fontWeight: 400,
                lineHeight: 0.9,
                letterSpacing: '-0.04em',
              }}
            >
              {deltaLabel}
            </span>
          </div>

          {/* Identity sentence — serif large */}
          <div
            style={{
              display: 'flex',
              flex: 1,
              maxWidth: '700px',
            }}
          >
            <span
              style={{
                color: TEXT,
                fontFamily: 'serif',
                fontSize: daily.identitySentence.length > 60 ? '44px' : '54px',
                fontWeight: 400,
                lineHeight: 1.08,
                letterSpacing: '-0.012em',
              }}
            >
              {daily.identitySentence}
            </span>
          </div>
        </div>

        {/* Bottom signoff */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(26,24,20,0.10)',
            paddingTop: '24px',
          }}
        >
          <span
            style={{
              color: SOFT,
              fontFamily: 'monospace',
              fontSize: '18px',
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
            }}
          >
            &mdash; COYL
          </span>
          <span
            style={{
              color: ACCENT,
              fontFamily: 'monospace',
              fontSize: '18px',
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              fontWeight: 700,
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
