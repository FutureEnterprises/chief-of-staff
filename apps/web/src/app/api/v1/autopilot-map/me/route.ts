import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'

/**
 * GET /api/v1/autopilot-map/me
 *
 * Returns the signed-in user's most recent AutopilotMapSnapshot, or
 * { status: 'no_snapshot' } if they have none yet.
 *
 * Auth states:
 *   - unauthenticated → 401 { status: 'unauthenticated' }
 *   - authenticated, no snapshot → 200 { status: 'no_snapshot' }
 *   - authenticated, has snapshot → 200 { status: 'ok', snapshot: {...} }
 *
 * Consumed by /autopilot-map's client banner to render the user's real
 * map above the marketing content when they're signed in.
 *
 * Defensive note: the AutopilotMapSnapshot Prisma model is shipped by
 * a sibling agent. Until that schema change lands and the Prisma client
 * regenerates, the `prisma.autopilotMapSnapshot` accessor will throw at
 * runtime. We catch and degrade to { status: 'no_snapshot' } so the
 * marketing surface never blows up — at worst the signed-in banner
 * shows the "publishes Monday" copy. Once the model is live, this path
 * begins returning real data without any further code change here.
 */
export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json(
        { status: 'unauthenticated' },
        { status: 401 },
      )
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    })
    if (!user) {
      return NextResponse.json({ status: 'no_snapshot' })
    }

    // Cast through unknown — the model may not exist in the generated
    // Prisma client yet (sibling agent ships the migration). The
    // try/catch around this whole block keeps us safe at runtime.
    const client = prisma as unknown as {
      autopilotMapSnapshot?: {
        findFirst: (args: {
          where: { userId: string }
          orderBy: { createdAt: 'desc' }
        }) => Promise<{
          id: string
          topExcuse: string | null
          topExcuseCount: number | null
          peakWindowLabel: string | null
          peakWindowSlips: number | null
          slipsThisWeek: number | null
          recoveredCount: number | null
          recoveryRate: number | null
          patternSignature: string | null
          weekLabel: string | null
          shareSlug: string
          createdAt: Date
        } | null>
      }
    }

    if (!client.autopilotMapSnapshot) {
      return NextResponse.json({ status: 'no_snapshot' })
    }

    const snapshot = await client.autopilotMapSnapshot.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    if (!snapshot) {
      return NextResponse.json({ status: 'no_snapshot' })
    }

    return NextResponse.json({
      status: 'ok',
      snapshot: {
        topExcuse: snapshot.topExcuse,
        topExcuseCount: snapshot.topExcuseCount,
        peakWindowLabel: snapshot.peakWindowLabel,
        peakWindowSlips: snapshot.peakWindowSlips,
        slipsThisWeek: snapshot.slipsThisWeek,
        recoveredCount: snapshot.recoveredCount,
        recoveryRate: snapshot.recoveryRate,
        patternSignature: snapshot.patternSignature,
        weekLabel: snapshot.weekLabel,
        shareSlug: snapshot.shareSlug,
      },
    })
  } catch (err) {
    // Most likely cause: AutopilotMapSnapshot model hasn't been added
    // to the Prisma schema yet (sibling agent's work). Log to Sentry
    // via the platform default catcher and degrade gracefully.
    console.error('[autopilot-map/me] failed to load snapshot', err)
    return NextResponse.json({ status: 'no_snapshot' })
  }
}
