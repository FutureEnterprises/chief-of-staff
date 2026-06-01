import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

/**
 * /api/og/recap — the 9:16 (1080×1920) "Week in Patterns" Story card.
 *
 * The weekly retention+viral artifact. "COYL caught you 4 times this
 * week. You listened 3." Mirrors the /api/og/archetype aesthetic so the
 * two share surfaces read as one cinematic universe.
 *
 * Param-driven (edge-safe, no DB query — the /m/[slug] page already has
 * the AutopilotMapSnapshot server-side and passes the stats here, the
 * same pattern the existing /api/og card variant uses). The big-number
 * hook is generic so any data source can drive it honestly (the authed
 * AutopilotMapSnapshot passes slip/recovery framing; a future
 * interrupt-fired source could pass "caught"):
 *   ?week=Week+of+May+19
 *   &big=4                (the hero number)
 *   &bigLabel=slips       (its noun)
 *   &sub=You+recovered+3+of+4   (the line under it)
 *   &window=Wed+9–11+PM   (peak danger window)
 *   &excuse=I+deserve+this  (top excuse this week)
 *   &recovery=75          (recovery-rate %)
 *   &signature=9+PM+Negotiator:+4+slips,+3+recovered
 *
 * NEDA-safe: behavioral/pattern language only.
 */

const BG = '#0e0c0a'
const ACCENT = '#ff6600'
const ACCENT_SOFT = '#ff8a3d'
const FG = '#f5efe6'
const MUTED = '#8a7f6d'
const HAIR = 'rgba(245,239,230,0.12)'

function num(v: string | null, fallback = 0): number {
  const n = v ? parseInt(v, 10) : NaN
  return Number.isFinite(n) ? n : fallback
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const week = sp.get('week') ?? 'This week'
  const big = num(sp.get('big'))
  const bigLabel = sp.get('bigLabel') ?? 'slips'
  const sub = sp.get('sub') ?? ''
  const windowText = sp.get('window') ?? '—'
  const excuse = sp.get('excuse') ?? '—'
  const recovery = num(sp.get('recovery'))
  const signature = sp.get('signature') ?? ''

  const Stat = ({ label, value }: { label: string; value: string }) => (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div style={{ display: 'flex', fontSize: '22px', letterSpacing: '6px', color: MUTED, marginBottom: '10px' }}>
        {label}
      </div>
      <div style={{ display: 'flex', fontSize: '40px', color: FG, fontWeight: 600 }}>{value}</div>
    </div>
  )

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
        <div
          style={{
            position: 'absolute',
            top: '-200px',
            right: '-200px',
            width: '760px',
            height: '760px',
            borderRadius: '760px',
            background: 'radial-gradient(circle, rgba(255,102,0,0.22) 0%, rgba(255,102,0,0) 70%)',
            display: 'flex',
          }}
        />

        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '46px', height: '4px', background: ACCENT, display: 'flex' }} />
          <div style={{ fontSize: '26px', letterSpacing: '14px', color: ACCENT, fontWeight: 700, display: 'flex' }}>
            COYL · WEEK IN PATTERNS
          </div>
        </div>

        <div style={{ display: 'flex', fontSize: '34px', color: MUTED, marginTop: '28px' }}>{week}</div>

        <div style={{ flex: 1, display: 'flex' }} />

        {/* the hook number */}
        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '64px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '28px' }}>
            <div style={{ display: 'flex', fontSize: '180px', lineHeight: 1, fontWeight: 800, color: FG, letterSpacing: '-6px' }}>
              {big}
            </div>
            <div style={{ display: 'flex', fontSize: '52px', color: ACCENT_SOFT, fontStyle: 'italic' }}>
              {bigLabel}
            </div>
          </div>
          {sub ? (
            <div style={{ display: 'flex', fontSize: '42px', color: '#cdc2ad', marginTop: '20px' }}>
              {sub}
            </div>
          ) : null}
        </div>

        {/* stat row */}
        <div
          style={{
            display: 'flex',
            gap: '40px',
            borderTop: `2px solid ${ACCENT}`,
            paddingTop: '40px',
            marginBottom: '44px',
          }}
        >
          <Stat label="PEAK WINDOW" value={windowText} />
          <Stat label="RECOVERY" value={`${recovery}%`} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '12px' }}>
          <div style={{ display: 'flex', fontSize: '22px', letterSpacing: '6px', color: MUTED, marginBottom: '12px' }}>
            TOP EXCUSE
          </div>
          <div style={{ display: 'flex', fontSize: '46px', color: ACCENT_SOFT, fontStyle: 'italic' }}>
            “{excuse}”
          </div>
        </div>

        {signature ? (
          <div style={{ display: 'flex', fontSize: '30px', color: '#a59a87', marginTop: '24px', maxWidth: '880px' }}>
            {signature}
          </div>
        ) : null}

        {/* footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: `1px solid ${HAIR}`,
            marginTop: '60px',
            paddingTop: '36px',
          }}
        >
          <div style={{ display: 'flex', fontSize: '30px', color: MUTED }}>What caught you this week?</div>
          <div style={{ display: 'flex', fontSize: '34px', color: ACCENT, fontWeight: 700 }}>coyl.ai</div>
        </div>
      </div>
    ),
    { width: 1080, height: 1920 },
  )
}
