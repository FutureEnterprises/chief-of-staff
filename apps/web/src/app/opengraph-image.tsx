import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'COYL — AI Willpower. Control Over Your Life.'
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

        {/* AI Willpower label */}
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
          AI WILLPOWER
        </div>

        {/* COYL big text */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0px',
            lineHeight: 0.9,
          }}
        >
          <div style={{ fontSize: '120px', fontWeight: 900, color: '#fff', letterSpacing: '-4px' }}>
            <span style={{ color: '#ff6600' }}>CO</span>ntrol
          </div>
          <div style={{ fontSize: '120px', fontWeight: 900, color: '#fff', letterSpacing: '-4px', marginLeft: '48px' }}>
            <span style={{ color: '#ff6600' }}>Y</span>our
          </div>
          <div style={{ fontSize: '120px', fontWeight: 900, color: '#fff', letterSpacing: '-4px', marginLeft: '96px' }}>
            <span style={{ color: '#ff6600' }}>L</span>ife
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: '22px',
            color: '#888',
            marginTop: '40px',
            fontWeight: 400,
            maxWidth: '500px',
          }}
        >
          The AI that hounds your a$$ until it&apos;s done.
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
          coyl.ai
        </div>
      </div>
    ),
    { ...size }
  )
}
