import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { ARCHETYPE_CARDS } from '@/lib/archetype-cards'

/**
 * /api/og/archetype — the 9:16 (1080×1920) Instagram-Story archetype card.
 *
 * THE viral asset. When someone finishes the audit, this is the image
 * they screenshot and post to their story. Built to be screenshot-ready:
 * dark + amber, the archetype NAME huge, the signature quote, the user's
 * danger window, and a rarity stat that makes people tag friends.
 *
 * Distinct from /api/og (1200×630 landscape, for link previews). This is
 * portrait, sized for Stories / Reels / vertical share.
 *
 * Query: ?slug=the-9pm-negotiator
 *        (optional ?window=... to override the default danger window,
 *         e.g. when the user's specific quiz answer gives a sharper one)
 *
 * Edge runtime, no remote fonts/images — bulletproof + fast.
 *
 * NEDA-safe by construction: behavioral/pattern language only. No
 * calorie, weight, body, or diet copy anywhere in this file.
 */

// No `export const runtime = 'edge'` — Next.js 16 + cacheComponents
// rejects the route-segment runtime config here, and the existing
// /api/og route renders fine on the default runtime. ImageResponse
// works on both.

const BG = '#0e0c0a'
const ACCENT = '#ff6600'
const ACCENT_SOFT = '#ff8a3d'
const FG = '#f5efe6'
const MUTED = '#8a7f6d'
const HAIR = 'rgba(245,239,230,0.12)'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const slug = searchParams.get('slug') ?? 'the-9pm-negotiator'
  // Non-null assertion on the fallback: 'the-9pm-negotiator' is a
  // guaranteed key of ARCHETYPE_CARDS (the repo uses
  // noUncheckedIndexedAccess, so the index access is typed `| undefined`).
  const card = ARCHETYPE_CARDS[slug] ?? ARCHETYPE_CARDS['the-9pm-negotiator']!
  const windowText = searchParams.get('window') ?? card.window

  return new ImageResponse(
    (
      <div
        style={{
          width: '1080px',
          height: '1920px',
          display: 'flex',
          flexDirection: 'column',
          background: BG,
          padding: '110px 96px',
          position: 'relative',
        }}
      >
        {/* warm radial glow top-right */}
        <div
          style={{
            position: 'absolute',
            top: '-200px',
            right: '-200px',
            width: '760px',
            height: '760px',
            borderRadius: '760px',
            background:
              'radial-gradient(circle, rgba(255,102,0,0.22) 0%, rgba(255,102,0,0) 70%)',
            display: 'flex',
          }}
        />

        {/* top bar — brand + kicker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '46px', height: '4px', background: ACCENT, display: 'flex' }} />
          <div
            style={{
              fontSize: '26px',
              letterSpacing: '14px',
              color: ACCENT,
              fontWeight: 700,
              display: 'flex',
            }}
          >
            COYL · YOUR PATTERN
          </div>
        </div>

        {/* spacer */}
        <div style={{ flex: 1, display: 'flex' }} />

        {/* the name */}
        <div
          style={{
            display: 'flex',
            fontSize: '128px',
            lineHeight: 1.0,
            fontWeight: 800,
            color: FG,
            letterSpacing: '-4px',
            marginBottom: '44px',
          }}
        >
          {card.name}
        </div>

        {/* signature quote */}
        <div
          style={{
            display: 'flex',
            fontSize: '60px',
            lineHeight: 1.15,
            color: ACCENT_SOFT,
            fontStyle: 'italic',
            marginBottom: '52px',
          }}
        >
          {card.signature}
        </div>

        {/* essence */}
        <div
          style={{
            display: 'flex',
            fontSize: '40px',
            lineHeight: 1.45,
            color: '#cdc2ad',
            marginBottom: '72px',
            maxWidth: '850px',
          }}
        >
          {card.essence}
        </div>

        {/* danger window block */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            borderTop: `2px solid ${ACCENT}`,
            paddingTop: '34px',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: '24px',
              letterSpacing: '8px',
              color: MUTED,
              marginBottom: '16px',
            }}
          >
            YOUR DANGER WINDOW
          </div>
          <div style={{ display: 'flex', fontSize: '46px', color: FG, fontWeight: 600 }}>
            {windowText}
          </div>
        </div>

        {/* rarity pill */}
        <div style={{ display: 'flex' }}>
          <div
            style={{
              display: 'flex',
              fontSize: '32px',
              color: FG,
              background: 'rgba(255,102,0,0.10)',
              border: `2px solid rgba(255,102,0,0.4)`,
              borderRadius: '999px',
              padding: '20px 40px',
            }}
          >
            {card.rarity}
          </div>
        </div>

        {/* footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: `1px solid ${HAIR}`,
            marginTop: '70px',
            paddingTop: '36px',
          }}
        >
          <div style={{ display: 'flex', fontSize: '30px', color: MUTED }}>
            What’s yours? · 90-second audit
          </div>
          <div style={{ display: 'flex', fontSize: '34px', color: ACCENT, fontWeight: 700 }}>
            coyl.ai/audit
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1920 },
  )
}
