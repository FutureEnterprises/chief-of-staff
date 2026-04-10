import { ImageResponse } from 'next/og'
import { prisma } from '@repo/database'
import { type NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, executionScore: true, currentStreak: true, longestStreak: true },
  })

  if (!user) {
    return new Response('Not found', { status: 404 })
  }

  const firstName = user.name?.split(' ')[0] ?? 'User'
  const score = user.executionScore ?? 0
  const streak = user.currentStreak ?? 0

  const gradeColor = score >= 80 ? '#22c55e' : score >= 60 ? '#ff6600' : score >= 40 ? '#eab308' : '#ef4444'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#0a0a0a',
          fontFamily: 'system-ui, sans-serif',
          padding: '60px',
        }}
      >
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          <div style={{ width: '40px', height: '4px', backgroundColor: '#ff6600', borderRadius: '2px' }} />
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#ff6600', letterSpacing: '4px', textTransform: 'uppercase' }}>
            COYL EXECUTION REPORT
          </span>
          <div style={{ width: '40px', height: '4px', backgroundColor: '#ff6600', borderRadius: '2px' }} />
        </div>

        {/* Score */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '140px', fontWeight: 900, color: gradeColor, lineHeight: 1 }}>
            {score}
          </span>
          <span style={{ fontSize: '40px', fontWeight: 400, color: '#666' }}>/100</span>
        </div>

        <span style={{ fontSize: '20px', color: '#888', marginBottom: '32px' }}>
          {firstName}&apos;s Execution Score
        </span>

        {/* Streak */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '40px' }}>
          <span style={{ fontSize: '24px' }}>🔥</span>
          <span style={{ fontSize: '24px', fontWeight: 700, color: '#ff6600' }}>
            {streak}-day streak
          </span>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '16px', color: '#555' }}>
            Behavior enforcement by
          </span>
          <span style={{ fontSize: '20px', fontWeight: 900, color: '#ff6600' }}>coyl.ai</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
