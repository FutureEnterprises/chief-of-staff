import { ImageResponse } from 'next/og'
import { prisma } from '@repo/database'
import { type NextRequest } from 'next/server'

export const runtime = 'edge'

/**
 * Shareable OG image endpoint — multiple moment types, one route.
 *
 * Each type is an emotional peak inside the product that we want people
 * to screenshot or link out with. The OG dimensions (1200x630) render
 * cleanly on Twitter, LinkedIn, iMessage, and WhatsApp previews.
 *
 * ?type=score      → default: execution score + streak (legacy behavior)
 * ?type=streak     → streak milestone card (7/30/100 day callouts)
 * ?type=recovery   → "I slipped. COYL caught me. I'm back." card
 * ?type=readme     → onboarding first-callout card (the "holy shit it
 *                    knows me" moment, captured)
 * ?type=pattern    → the callout-mode read, captured as a card
 *
 * All types fall back to score if data is missing so a shared link never 404s.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const url = new URL(req.url)
  const type = url.searchParams.get('type') ?? 'score'

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      executionScore: true,
      selfTrustScore: true,
      currentStreak: true,
      longestStreak: true,
      primaryWedge: true,
      excuseStyle: true,
    },
  })

  if (!user) {
    return new Response('Not found', { status: 404 })
  }

  const firstName = user.name?.split(' ')[0] ?? 'Someone'

  if (type === 'streak') return renderStreakCard(firstName, user.currentStreak, user.longestStreak)
  if (type === 'recovery') return renderRecoveryCard(firstName, user.currentStreak)
  if (type === 'readme') return renderReadMeCard(firstName, user.primaryWedge, user.excuseStyle)
  if (type === 'pattern') return renderPatternCard(firstName)

  // Default: legacy score card
  return renderScoreCard(firstName, user.executionScore ?? 0, user.currentStreak ?? 0)
}

// ─────────────── Card renderers ───────────────

function renderScoreCard(firstName: string, score: number, streak: number) {
  const gradeColor =
    score >= 80 ? '#22c55e' : score >= 60 ? '#ff6600' : score >= 40 ? '#eab308' : '#ef4444'

  return new ImageResponse(
    (
      <div style={baseWrap}>
        <HeaderLabel text="COYL EXECUTION REPORT" />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '140px', fontWeight: 900, color: gradeColor, lineHeight: 1 }}>
            {score}
          </span>
          <span style={{ fontSize: '40px', fontWeight: 400, color: '#666' }}>/100</span>
        </div>
        <span style={{ fontSize: '20px', color: '#888', marginBottom: '32px' }}>
          {firstName}&apos;s Execution Score
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '40px' }}>
          <span style={{ fontSize: '24px', fontWeight: 700, color: '#ff6600' }}>
            {streak}-day streak
          </span>
        </div>
        <Footer />
      </div>
    ),
    { width: 1200, height: 630 },
  )
}

function renderStreakCard(firstName: string, streak: number, longest: number) {
  return new ImageResponse(
    (
      <div style={baseWrap}>
        <HeaderLabel text="STREAK" />
        <span style={{ fontSize: '200px', fontWeight: 900, color: '#ff6600', lineHeight: 1 }}>
          {streak}
        </span>
        <span style={{ fontSize: '28px', color: '#ccc', marginTop: '8px', marginBottom: '8px' }}>
          days of not disappearing.
        </span>
        <span style={{ fontSize: '16px', color: '#666', marginBottom: '48px' }}>
          {firstName} \u00b7 longest: {longest}d
        </span>
        <Footer />
      </div>
    ),
    { width: 1200, height: 630 },
  )
}

function renderRecoveryCard(firstName: string, streak: number) {
  return new ImageResponse(
    (
      <div style={baseWrap}>
        <HeaderLabel text="RECOVERY" accent="#10b981" />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '32px',
            maxWidth: '900px',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: '64px', fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
            I slipped.
          </span>
          <span style={{ fontSize: '64px', fontWeight: 900, color: '#10b981', lineHeight: 1.1 }}>
            COYL caught me.
          </span>
          <span style={{ fontSize: '64px', fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
            I\u2019m back.
          </span>
        </div>
        <span style={{ fontSize: '18px', color: '#666', marginBottom: '32px' }}>
          {firstName} \u00b7 streak preserved: {streak}d
        </span>
        <Footer />
      </div>
    ),
    { width: 1200, height: 630 },
  )
}

function renderReadMeCard(firstName: string, wedge: string | null, excuseStyle: string | null) {
  const wedgeLabel = WEDGE_COPY[wedge ?? ''] ?? 'my autopilot'
  const excuseQuote = EXCUSE_QUOTES[excuseStyle ?? ''] ?? "I\u2019ll start tomorrow."

  return new ImageResponse(
    (
      <div style={baseWrap}>
        <HeaderLabel text="COYL JUST READ ME" />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            maxWidth: '950px',
            gap: '24px',
          }}
        >
          <span style={{ fontSize: '36px', fontWeight: 700, color: '#fff', lineHeight: 1.25 }}>
            Your autopilot runs {wedgeLabel}.
          </span>
          <span
            style={{
              fontSize: '28px',
              fontWeight: 600,
              color: '#ffa366',
              lineHeight: 1.3,
              borderLeft: '4px solid #ff6600',
              paddingLeft: '20px',
              fontStyle: 'italic',
            }}
          >
            &ldquo;{excuseQuote}&rdquo;
          </span>
          <span style={{ fontSize: '24px', color: '#999', lineHeight: 1.35 }}>
            That\u2019s the one COYL will catch.
          </span>
        </div>
        <div style={{ marginTop: '48px', display: 'flex' }}>
          <Footer />
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}

function renderPatternCard(firstName: string) {
  return new ImageResponse(
    (
      <div style={baseWrap}>
        <HeaderLabel text="PATTERN CALL" />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '920px',
            gap: '16px',
          }}
        >
          <span style={{ fontSize: '48px', fontWeight: 800, color: '#fff', lineHeight: 1.15 }}>
            COYL just read my pattern.
          </span>
          <span style={{ fontSize: '22px', color: '#999', lineHeight: 1.4 }}>
            It learns when I slip, which excuse I\u2019ll use next, and when to interrupt. {firstName}.
          </span>
        </div>
        <div style={{ marginTop: '40px', display: 'flex' }}>
          <Footer />
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}

// ─────────────── Shared pieces ───────────────

const baseWrap: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#0a0a0a',
  fontFamily: 'system-ui, sans-serif',
  padding: '60px',
  backgroundImage:
    'radial-gradient(circle at top right, rgba(255,102,0,0.12), transparent 45%), radial-gradient(circle at bottom left, rgba(239,68,68,0.08), transparent 50%)',
}

function HeaderLabel({ text, accent = '#ff6600' }: { text: string; accent?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
      <div style={{ width: '40px', height: '4px', backgroundColor: accent, borderRadius: '2px' }} />
      <span
        style={{
          fontSize: '14px',
          fontWeight: 700,
          color: accent,
          letterSpacing: '4px',
          textTransform: 'uppercase',
        }}
      >
        {text}
      </span>
      <div style={{ width: '40px', height: '4px', backgroundColor: accent, borderRadius: '2px' }} />
    </div>
  )
}

function Footer() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ fontSize: '16px', color: '#555' }}>Autopilot interruption by</span>
      <span style={{ fontSize: '22px', fontWeight: 900, color: '#ff6600' }}>coyl.ai</span>
    </div>
  )
}

// Wedge → plain-English phrase that slots into "Your autopilot runs {X}."
const WEDGE_COPY: Record<string, string> = {
  WEIGHT_LOSS: 'at night in the kitchen',
  CRAVINGS: 'on craving loops',
  DESTRUCTIVE_BEHAVIORS: 'on the scripts I said I\u2019d break',
  CONSISTENCY: 'as "I\u2019ll start Monday"',
  SPENDING: 'at checkout',
  FOCUS: 'as "I\u2019ll do it tomorrow"',
  PRODUCTIVITY: 'as avoidance',
}

const EXCUSE_QUOTES: Record<string, string> = {
  DELAY: "I\u2019ll start tomorrow.",
  REWARD: "I deserve this.",
  MINIMIZATION: "One time won\u2019t matter.",
  COLLAPSE: "I already blew it.",
  EXHAUSTION: "I\u2019m too tired tonight.",
  EXCEPTION: "This week is weird.",
  COMPENSATION: "I\u2019ll make up for it.",
  SOCIAL_PRESSURE: "I couldn\u2019t say no.",
}
