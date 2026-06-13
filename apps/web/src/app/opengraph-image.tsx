import { ImageResponse } from 'next/og'

export const alt = 'COYL — Catch yourself before you do it again.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          backgroundColor: '#0a0a0a',
          padding: '80px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Top accent line */}
        <div
          style={{
            width: '60px',
            height: '4px',
            backgroundColor: '#ff6600',
            marginBottom: '24px',
            borderRadius: '2px',
          }}
        />

        {/* Kicker */}
        <div
          style={{
            fontSize: '16px',
            fontWeight: 700,
            color: '#ff6600',
            letterSpacing: '6px',
            textTransform: 'uppercase',
            marginBottom: '32px',
          }}
        >
          COYL
        </div>

        {/* Headline — current autopilot-interruption framing */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0px',
            lineHeight: 1.0,
          }}
        >
          <div style={{ fontSize: '88px', fontWeight: 800, color: '#fff', letterSpacing: '-3px' }}>
            Catch yourself
          </div>
          <div style={{ fontSize: '88px', fontWeight: 800, color: '#fff', letterSpacing: '-3px' }}>
            before you do it
          </div>
          <div style={{ fontSize: '88px', fontWeight: 800, color: '#ff6600', letterSpacing: '-3px' }}>
            again.
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: '24px',
            color: '#aaa',
            marginTop: '36px',
            fontWeight: 400,
            maxWidth: '720px',
          }}
        >
          Real-time autopilot interruption — fires in the moment of drift, not the morning after.
        </div>

        {/* Domain */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            right: '80px',
            fontSize: '20px',
            fontWeight: 700,
            color: '#ff6600',
          }}
        >
          www.coyl.ai
        </div>
      </div>
    ),
    { ...size }
  )
}
