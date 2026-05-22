/**
 * POST /api/v1/intervention — generate a state-matched intervention payload.
 *
 * Layer 3 entry point. The caller (client-side interrupt manager, cron
 * job, native lock-screen widget) hands us either a clusterId or asks
 * for "the latest cluster for this user". We:
 *
 *   1. Load the SignalCluster.
 *   2. Pull the most recent SlipRecord (last 6h).
 *   3. Classify state (high_arousal / low_arousal / post_slip / calm).
 *   4. Apply archetype-aware mode selection + recent-mode suppression.
 *   5. Pull the user's top-ranked active RedirectChoice (when relevant).
 *   6. Render copy via pickTemplate + splitHeadline.
 *   7. If dryRun is false: persist AUTOPILOT_INTERRUPTED event +
 *      increment RedirectChoice.servedCount.
 *
 * The response shape is what UI surfaces (web, iOS Live Activity,
 * push notifications) want directly: { mode, headline, subhead,
 * redirectText, archetypeSignature, shouldFire, reason }.
 *
 * shouldFire is false when:
 *   • mode resolved to 'calm', OR
 *   • the most-recent same-mode intervention is within suppression
 *     window (selectMode already handled this by demoting to calm).
 *
 * Body:
 *   {
 *     clusterId?: string         // explicit cluster, otherwise latest
 *     archetype?: string         // family slug; otherwise inferred from user
 *     dryRun?: boolean           // if true, do not persist anything
 *   }
 */

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import {
  classifyState,
  selectMode,
  recentMode,
  lastSlip,
  type SignalSnapshot,
} from '@/lib/intervention-mode'
import { pickTemplate, splitHeadline } from '@/lib/intervention-copy'
import { getFamily, type ArchetypeFamily, FAMILY_IDS } from '@/lib/audit-archetype'

export const maxDuration = 15

type Body = {
  clusterId?: string
  archetype?: string
  dryRun?: boolean
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, primaryWedge: true },
  })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  let body: Body = {}
  try {
    body = (await req.json().catch(() => ({}))) as Body
  } catch {
    body = {}
  }
  const dryRun = body.dryRun === true

  // Load the SignalCluster: explicit id wins, otherwise newest one
  // for this user. We only consume the snapshot subset, but typing it
  // off the model keeps us honest if the schema migrates.
  const cluster = body.clusterId
    ? await prisma.signalCluster.findFirst({
        where: { id: body.clusterId, userId: user.id },
        select: {
          id: true,
          hrvDeltaPct: true,
          unlockRateDelta: true,
          weekdayStress: true,
          sedentaryMins: true,
          screenOnMins: true,
        },
      })
    : await prisma.signalCluster.findFirst({
        where: { userId: user.id },
        orderBy: { capturedAt: 'desc' },
        select: {
          id: true,
          hrvDeltaPct: true,
          unlockRateDelta: true,
          weekdayStress: true,
          sedentaryMins: true,
          screenOnMins: true,
        },
      })

  // No cluster yet → respond with calm rather than 404. The caller
  // can still get a predictable shape and decide what to do (typically
  // "wait until signals exist").
  if (!cluster) {
    return Response.json({
      mode: 'calm' as const,
      shouldFire: false,
      reason: 'no_cluster',
      clusterId: null,
    })
  }

  const snapshot: SignalSnapshot = {
    hrvDeltaPct: cluster.hrvDeltaPct,
    unlockRateDelta: cluster.unlockRateDelta,
    weekdayStress: cluster.weekdayStress,
    sedentaryMins: cluster.sedentaryMins,
    screenOnMins: cluster.screenOnMins,
  }

  const slip = await lastSlip(user.id, 6)
  const rawState = classifyState(snapshot, slip)

  const archetype = normalizeArchetype(body.archetype)
  const priorMode = await recentMode(user.id, 2)

  const { mode, reason } = selectMode({
    state: rawState,
    archetype,
    recentSlip: slip,
    recentInterventionMode: priorMode,
    suppressionHours: 2,
  })

  // Calm → no-fire response. We do NOT persist anything in calm mode
  // because there's no payload that justifies an audit event.
  if (mode === 'calm') {
    return Response.json({
      mode,
      shouldFire: false,
      reason,
      clusterId: cluster.id,
    })
  }

  // Pull top-ranked active redirect (we always include it for context,
  // even when the template doesn't carry a {redirect} slot — the UI
  // may show it as a secondary suggestion below the headline).
  // Sort by effectivenessPct first (nulls last), then rank ascending.
  const choices = await prisma.redirectChoice.findMany({
    where: { userId: user.id, active: true },
    select: {
      id: true,
      rank: true,
      text: true,
      category: true,
      effectivenessPct: true,
    },
  })
  const topChoice = pickTopChoice(choices)

  const familySignature = archetype
    ? safeFamilySignature(archetype)
    : null

  const rendered = pickTemplate({
    mode,
    archetype,
    userId: user.id,
    slots: {
      redirect: topChoice?.text,
      archetypeSignature: familySignature,
    },
  })

  // pickTemplate returns null only for calm; we already branched on
  // calm above, so this is a defensive null-guard.
  if (!rendered) {
    return Response.json({
      mode: 'calm' as const,
      shouldFire: false,
      reason: 'no_template',
      clusterId: cluster.id,
    })
  }

  const { headline, subhead } = splitHeadline(rendered)

  const payload = {
    mode,
    shouldFire: true,
    reason,
    clusterId: cluster.id,
    headline,
    subhead: subhead ?? null,
    redirectText: topChoice?.text ?? null,
    redirectChoiceId: topChoice?.id ?? null,
    archetypeSignature: familySignature,
    archetype: archetype ?? null,
  }

  if (!dryRun) {
    // Persist side effects. Wrapped in a transaction so a failure on
    // the choice-update doesn't leave a "phantom served" count without
    // an event (or vice versa).
    await prisma
      .$transaction(async (tx) => {
        await tx.productivityEvent.create({
          data: {
            userId: user.id,
            eventType: 'AUTOPILOT_INTERRUPTED',
            eventValue: mode,
            metadataJson: {
              mode,
              headline,
              subhead: subhead ?? null,
              clusterId: cluster.id,
              redirectChoiceId: topChoice?.id ?? null,
              archetype: archetype ?? null,
              reason,
            },
          },
        })
        if (topChoice?.id) {
          await tx.redirectChoice.update({
            where: { id: topChoice.id },
            data: { servedCount: { increment: 1 } },
          })
        }
      })
      .catch((err) => {
        // We don't want to fail the response if persistence hiccups —
        // the UI still needs to render the interrupt. Log + move on.
        console.warn('[intervention] persist failed', err)
      })
  }

  return Response.json(payload)
}

/**
 * Choose the best RedirectChoice for the user. Strategy:
 *   1. Highest effectivenessPct wins (nulls treated as 0).
 *   2. Tie → lowest rank (rank 1 = user's #1 priority).
 *   3. Empty list → null.
 */
function pickTopChoice<T extends { rank: number; effectivenessPct: number | null }>(
  choices: T[],
): T | null {
  if (choices.length === 0) return null
  return [...choices].sort((a, b) => {
    const ea = a.effectivenessPct ?? 0
    const eb = b.effectivenessPct ?? 0
    if (eb !== ea) return eb - ea
    return a.rank - b.rank
  })[0]!
}

/**
 * normalizeArchetype — accept arbitrary user input but only return a
 * value if it's a known ArchetypeFamily slug. Anything else returns
 * null so we don't pass garbage downstream.
 */
function normalizeArchetype(input?: string | null): ArchetypeFamily | null {
  if (!input) return null
  if (FAMILY_IDS.includes(input as ArchetypeFamily)) {
    return input as ArchetypeFamily
  }
  return null
}

function safeFamilySignature(slug: ArchetypeFamily): string | null {
  try {
    return getFamily(slug).signature ?? null
  } catch {
    return null
  }
}
