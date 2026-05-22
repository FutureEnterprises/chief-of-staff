import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import type { CommitmentDomain, PrimaryWedge } from '@repo/database'
import {
  ARCHETYPE_DEFAULTS,
  extractWindowsFromAnswers,
  type DefaultDangerWindow,
  type SuggestedCommitment,
} from '@/lib/archetype-defaults'
import { FAMILY_IDS, type ArchetypeFamily } from '@/lib/audit-archetype'

/**
 * POST /api/v1/audit/finalize
 *
 * Audit-completion handoff — the highest-leverage point in the input-
 * dependence funnel. Before this endpoint existed, finishing the audit
 * captured the archetype but left the user to set up windows + commitments
 * manually (huge drop-off). Now: archetype reveal also pre-builds 2-3
 * inferred DangerWindow rows and returns 2-3 suggested Commitments the
 * user can one-tap activate.
 *
 * What it does (in order):
 *   1. Clerk auth → resolve DB user row.
 *   2. Persist primaryWedge if changed.
 *   3. Build DangerWindow rows from the deterministic archetype-defaults
 *      table (per-family). Optionally append regex-extracted extras from
 *      free-text auditAnswers (if any). Mark all source='inferred'.
 *   4. Return suggested commitments untouched — the user activates them
 *      via /api/v1/commitments (POST). We don't create them here on
 *      purpose: confirmation keeps the trust contract honest.
 *   5. Telemetry: ProductivityEvent ASSESSMENT_RUN with counts so we
 *      can measure lift on the input-dependence funnel.
 *
 * Idempotency note: re-finalize is benign — windows are de-duped by
 * (userId, label) before insert so re-running the audit doesn't blow up
 * the DangerWindow table.
 *
 * Latency: sub-100ms target. No AI calls in the hot path; defaults are
 * a constants table. See lib/archetype-defaults.ts for the why.
 */

const VALID_PRIMARY_WEDGES: PrimaryWedge[] = [
  'PRODUCTIVITY',
  'WEIGHT_LOSS',
  'CRAVINGS',
  'DESTRUCTIVE_BEHAVIORS',
  'CONSISTENCY',
  'SPENDING',
  'FOCUS',
]

const schema = z.object({
  archetypeSlug: z.string().min(1).max(64),
  primaryWedge: z.string().min(1).max(32),
  auditAnswers: z
    .array(
      z.object({
        q: z.string().min(1).max(500),
        a: z.string().min(1).max(2000),
      }),
    )
    .max(20)
    .default([]),
  timezone: z.string().min(1).max(64).optional(),
})

function isValidFamily(slug: string): slug is ArchetypeFamily {
  return (FAMILY_IDS as readonly string[]).includes(slug)
}

function isValidPrimaryWedge(value: string): value is PrimaryWedge {
  return (VALID_PRIMARY_WEDGES as readonly string[]).includes(value)
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, primaryWedge: true },
  })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { archetypeSlug, primaryWedge, auditAnswers } = parsed.data

  if (!isValidFamily(archetypeSlug)) {
    return NextResponse.json({ error: 'Unknown archetype slug' }, { status: 400 })
  }
  if (!isValidPrimaryWedge(primaryWedge)) {
    return NextResponse.json({ error: 'Unknown primaryWedge' }, { status: 400 })
  }

  // Persist primaryWedge if it changed. Cheap update; skip if unchanged.
  if (user.primaryWedge !== primaryWedge) {
    await prisma.user
      .update({
        where: { id: user.id },
        data: { primaryWedge: primaryWedge as PrimaryWedge },
      })
      .catch(() => {})
  }

  // Build the candidate window set: archetype defaults + regex-extracted
  // extras from raw audit answers. De-dupe by label so re-finalize is
  // idempotent against the existing DangerWindow rows for this user.
  const defaults = ARCHETYPE_DEFAULTS[archetypeSlug]
  const extras: DefaultDangerWindow[] = extractWindowsFromAnswers(auditAnswers)
  const candidates: DefaultDangerWindow[] = [...defaults.defaultWindows, ...extras]

  // Pull existing window labels for this user — skip any candidate whose
  // label collides. This is the cheapest correct dedupe: defaults all
  // have stable labels, extras are time-stamped. Re-running the audit
  // never multiplies rows.
  const existing = await prisma.dangerWindow.findMany({
    where: { userId: user.id },
    select: { label: true },
  })
  const existingLabels = new Set(existing.map((w) => w.label))
  const toCreate = candidates.filter((c) => !existingLabels.has(c.label))

  let dangerWindowsCreated: Array<{
    id: string
    label: string
    dayOfWeek: number
    startHour: number
    endHour: number
    source: 'inferred'
  }> = []

  if (toCreate.length > 0) {
    // createMany doesn't return rows on Postgres without `Prisma.skipDuplicates`
    // returning the created set — so we issue individual creates to get
    // back ids for the response. Small N (<= 6); fine.
    const created = await Promise.all(
      toCreate.map((w) =>
        prisma.dangerWindow.create({
          data: {
            userId: user.id,
            label: w.label,
            dayOfWeek: w.dayOfWeek,
            startHour: w.startHour,
            endHour: w.endHour,
            triggerType: w.triggerType,
            source: 'inferred',
            active: true,
          },
          select: {
            id: true,
            label: true,
            dayOfWeek: true,
            startHour: true,
            endHour: true,
          },
        }),
      ),
    )
    dangerWindowsCreated = created.map((c) => ({ ...c, source: 'inferred' as const }))
  }

  const suggestedCommitments: SuggestedCommitment[] = defaults.suggestedCommitments

  // Telemetry: capture archetype + counts so we can measure the lift
  // this endpoint delivers on the input-dependence funnel. Fire-and-
  // forget — telemetry failure must not break the audit handoff.
  prisma.productivityEvent
    .create({
      data: {
        userId: user.id,
        eventType: 'ASSESSMENT_RUN',
        eventValue: archetypeSlug,
        metadataJson: {
          archetypeSlug,
          primaryWedge,
          dangerWindowsCreated: dangerWindowsCreated.length,
          suggestedCommitments: suggestedCommitments.length,
          extrasFromAnswers: extras.length,
        },
      },
    })
    .catch(() => {})

  return NextResponse.json({
    dangerWindowsCreated,
    suggestedCommitments: suggestedCommitments.map((s) => ({
      rule: s.rule,
      domain: s.domain as CommitmentDomain,
      rationale: s.rationale,
    })),
    nextStep: '/today',
  })
}
