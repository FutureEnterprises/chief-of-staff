import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { prisma } from '@repo/database'
import { formatDeltaLabel } from '@/lib/daily-number'

/**
 * /d/[code]/social — 1080×1080 social-share PNG.
 *
 * Used by share-card.tsx + native share sheets to fetch a square image
 * for Instagram, X, threads, Pinterest. Distinct from /d/[code]/og
 * (which is 1200×630 OG-shaped); the platforms that show square crops
 * (Instagram especially) cut a 1200×630 in half. This route gives them
 * the native square aspect.
 *
 * Identical typographic treatment to the on-page card — full-bleed
 * editorial: DAY N (mono micro) / +X (serif huge) / identity sentence
 * (serif large) / — COYL (mono micro). Cream canvas, single orange
 * accent on the delta.
 *
 * Edge runtime so cold-start latency is <50ms.
 */

export const runtime = 'edge'

const BG = '#f6efe4'
const ACCENT = '#ff6600'
const ACCENT_DARK = '#9a3a1a'
const TEXT = '#1a1814'
const MUTED = '#6b6557'
const SOFT = '#9a8f7a'

type RouteParams = { params: Promise<{ code: string }> }

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { code } = await params

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
      { width: 1080, height: 1080 },
    )
  }

  const deltaLabel = formatDeltaLabel(daily.selfTrustDelta)
  const deltaColor =
    daily.selfTrustDelta > 0
      ? ACCENT
      : daily.selfTrustDelta < 0
        ? ACCENT_DARK
        : TEXT
  const sentence = daily.identitySentence
  // Type-size auto-fit for the identity sentence so long variants stay
  // inside the canvas without breaking the rhythm.
  const sentenceFontSize =
    sentence.length > 80 ? '52px' : sentence.length > 55 ? '64px' : '76px'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: BG,
          backgroundImage:
            'radial-gradient(circle at 50% 35%, rgba(255,102,0,0.08), transparent 60%)',
          padding: '100px 96px',
          position: 'relative',
        }}
      >
        {/* 1. DAY N — mono micro top */}
        <div style={{ display: 'flex' }}>
          <span
            style={{
              color: MUTED,
              fontFamily: 'monospace',
              fontSize: '28px',
              fontWeight: 500,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
            }}
          >
            Day {daily.dayNumber}.
          </span>
        </div>

        {/* 2 + 3 — delta huge, sentence large, stacked */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            marginTop: '40px',
            marginBottom: '40px',
          }}
        >
          <span
            style={{
              color: deltaColor,
              fontFamily: 'serif',
              fontSize: '320px',
              fontWeight: 400,
              lineHeight: 0.9,
              letterSpacing: '-0.04em',
            }}
          >
            {deltaLabel}
          </span>

          <span
            style={{
              color: TEXT,
              fontFamily: 'serif',
              fontSize: sentenceFontSize,
              fontWeight: 400,
              lineHeight: 1.08,
              letterSpacing: '-0.012em',
              maxWidth: '880px',
            }}
          >
            {sentence}
          </span>
        </div>

        {/* 4. — COYL — mono micro bottom */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(26,24,20,0.10)',
            paddingTop: '28px',
          }}
        >
          <span
            style={{
              color: SOFT,
              fontFamily: 'monospace',
              fontSize: '22px',
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
              fontSize: '22px',
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
      width: 1080,
      height: 1080,
    },
  )
}
