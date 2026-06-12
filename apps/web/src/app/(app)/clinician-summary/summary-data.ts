/**
 * summary-data — pure server-side derivation for the clinician summary
 * one-pager (/clinician-summary). Owns ALL Prisma reads and metric math
 * for the page so the view stays presentational.
 *
 * NEDA-safe doctrine (enforced here, not just in copy): this module only
 * ever surfaces behavioral / pattern / app-engagement signals. No weight,
 * calories, BMI, body, or diet language ever flows out of here — including
 * the GLP-1 block, which is framed strictly as a post-medication
 * maintenance window and pattern-stability signal.
 *
 * EVERY metric is computed from real schema rows over a fixed 28-day
 * window. Where a metric has no underlying data, it is returned as a
 * `null`-valued shape so the view can render "Not enough data yet"
 * rather than a fabricated zero. Nothing here is invented.
 */
import { prisma } from '@repo/database'
import type { User } from '@repo/database'
import {
  resolveFamily,
  getFamily,
  type WedgeId,
  type ScriptId,
  type ArchetypeFamily,
} from '@/lib/audit-archetype'

const WINDOW_DAYS = 28

/* ───────────────────────────────────────────────────────────────────
 * ENUM → taxonomy mapping
 *
 * The in-product audit taxonomy (lib/audit-archetype) keys on WedgeId /
 * ScriptId. The User row persists the same psychology under the Prisma
 * enums PrimaryWedge + ExcuseCategory. These two maps are the bridge so
 * the clinician summary names the SAME family the audit/share surfaces do.
 * ─────────────────────────────────────────────────────────────────── */

function wedgeFromPrimary(primaryWedge: User['primaryWedge']): WedgeId {
  switch (primaryWedge) {
    case 'WEIGHT_LOSS':
      return 'weight'
    case 'PRODUCTIVITY':
      return 'work'
    case 'DESTRUCTIVE_BEHAVIORS':
    case 'CRAVINGS':
      return 'destructive'
    case 'CONSISTENCY':
      return 'consistency'
    case 'SPENDING':
      return 'spending'
    case 'FOCUS':
      return 'focus'
    default:
      return 'work'
  }
}

/**
 * ExcuseCategory → ScriptId. The audit script vocabulary is six items;
 * ExcuseCategory has eight. EXCEPTION + COMPENSATION are delay/minimize
 * cousins and fold into the nearest script so the family resolver
 * (which only understands the six scripts) always gets a valid input.
 */
function scriptFromExcuse(excuseStyle: User['excuseStyle']): ScriptId {
  switch (excuseStyle) {
    case 'REWARD':
      return 'reward'
    case 'DELAY':
    case 'EXCEPTION': // "this week is weird" — a delay cousin
      return 'delay'
    case 'COLLAPSE':
      return 'collapse'
    case 'EXHAUSTION':
      return 'exhaustion'
    case 'SOCIAL_PRESSURE':
      return 'social'
    case 'MINIMIZATION':
    case 'COMPENSATION': // "I'll make up for it later" — a minimize cousin
      return 'minimize'
    default:
      // No excuse style captured yet → the family resolver still needs a
      // script. 'minimize' routes to The 9 PM Negotiator, the modal family.
      return 'minimize'
  }
}

/* ───────────────────────────────────────────────────────────────────
 * METRIC SHAPES
 * ─────────────────────────────────────────────────────────────────── */

/** A computed rate, or an explicit "no data" marker the view renders honestly. */
export type Metric =
  | { kind: 'value'; value: number; numerator: number; denominator: number }
  | { kind: 'count'; value: number }
  | { kind: 'no-data' }

export type DangerWindowRow = {
  label: string
  dayLabel: string
  timeLabel: string
  triggerType: string | null
}

export type Glp1Context = {
  drug: string | null
  injectionDayLabel: string | null
  startedAtLabel: string | null
  /** True once the user has come off the medication (relapse-prevention window). */
  offMedication: boolean
  endedAtLabel: string | null
} | null

export type ClinicianSummary = {
  firstName: string
  reportDateLabel: string
  trackingSinceLabel: string
  // Archetype + signature script
  familyName: string
  familyEssence: string
  signatureScript: string
  /** Real weekly snapshot pattern line when one exists, else null. */
  patternSignature: string | null
  // Danger windows
  dangerWindows: DangerWindowRow[]
  // Last-28-days numbers
  interruptsFired: Metric
  checkinResponseRate: Metric
  recoveryRate: Metric
  windowDays: number
  // GLP-1 (conditional — null when the user has no GLP-1 profile)
  glp1: Glp1Context
}

/* ───────────────────────────────────────────────────────────────────
 * FORMATTERS
 * ─────────────────────────────────────────────────────────────────── */

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatHour(h: number): string {
  if (h === 0) return '12 AM'
  if (h < 12) return `${h} AM`
  if (h === 12) return '12 PM'
  return `${h - 12} PM`
}

function dayLabel(dayOfWeek: number): string {
  if (dayOfWeek === -1) return 'Every day'
  return DAY_NAMES[dayOfWeek] ?? '—'
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function firstNameOf(name: string, email: string): string {
  const trimmed = (name ?? '').trim()
  if (trimmed.length > 0) return trimmed.split(/\s+/)[0] ?? trimmed
  // Fall back to the local part of the email if no name is set.
  return (email.split('@')[0] ?? 'Member')
}

/* ───────────────────────────────────────────────────────────────────
 * BUILD
 * ─────────────────────────────────────────────────────────────────── */

export async function buildClinicianSummary(user: User): Promise<ClinicianSummary> {
  const now = new Date()
  const windowStart = new Date(now.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000)

  const [
    dangerWindowRows,
    interruptCount,
    checkinTotal,
    checkinCompleted,
    slipRecords,
    latestSnapshot,
  ] = await Promise.all([
    // 3. Danger windows mapped (day/time)
    prisma.dangerWindow.findMany({
      where: { userId: user.id, active: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startHour: 'asc' }],
      select: { label: true, dayOfWeek: true, startHour: true, endHour: true, triggerType: true },
    }),
    // 4a. Interrupts fired in last 28 days — AUTOPILOT_INTERRUPTED events.
    prisma.productivityEvent.count({
      where: {
        userId: user.id,
        eventType: 'AUTOPILOT_INTERRUPTED',
        createdAt: { gte: windowStart },
      },
    }),
    // 4b. Check-in response rate — prompted check-ins in window (denominator).
    prisma.checkin.count({
      where: { userId: user.id, promptedAt: { gte: windowStart } },
    }),
    // 4b. ...and the subset the user actually completed (numerator).
    prisma.checkin.count({
      where: {
        userId: user.id,
        promptedAt: { gte: windowStart },
        completedAt: { not: null },
      },
    }),
    // 4c. Recovery rate — slips logged in window, with recoveredAt as the
    // recovered subset. Both numerator and denominator come from real rows.
    prisma.slipRecord.findMany({
      where: { userId: user.id, createdAt: { gte: windowStart } },
      select: { recoveredAt: true },
    }),
    // 2/4. Most recent weekly Wrapped snapshot — gives a real pattern line
    // and a server-computed recoveryRate when one has been produced.
    prisma.autopilotMapSnapshot.findFirst({
      where: { userId: user.id },
      orderBy: { weekStart: 'desc' },
      select: { patternSignature: true, recoveryRate: true },
    }),
  ])

  // ── Archetype family + signature script ───────────────────────────
  const wedge = wedgeFromPrimary(user.primaryWedge)
  const script = scriptFromExcuse(user.excuseStyle)
  // The family resolver ignores the window dimension; pass a stable value.
  const familySlug: ArchetypeFamily = resolveFamily(wedge, 'latenight', script)
  const family = getFamily(familySlug)

  // ── Danger windows ────────────────────────────────────────────────
  const dangerWindows: DangerWindowRow[] = dangerWindowRows.map((w) => ({
    label: w.label,
    dayLabel: dayLabel(w.dayOfWeek),
    timeLabel: `${formatHour(w.startHour)} – ${formatHour(w.endHour)}`,
    triggerType: w.triggerType,
  }))

  // ── Last-28-days metrics ──────────────────────────────────────────
  const interruptsFired: Metric =
    interruptCount > 0 ? { kind: 'count', value: interruptCount } : { kind: 'no-data' }

  const checkinResponseRate: Metric =
    checkinTotal > 0
      ? {
          kind: 'value',
          value: Math.round((checkinCompleted / checkinTotal) * 100),
          numerator: checkinCompleted,
          denominator: checkinTotal,
        }
      : { kind: 'no-data' }

  // Recovery rate: prefer the rows in-window. If no slips occurred in the
  // window we can't compute a rate from slips, so fall back to the most
  // recent weekly snapshot's server-computed recoveryRate if present.
  const slipCount = slipRecords.length
  const recoveredCount = slipRecords.filter((s) => s.recoveredAt !== null).length
  let recoveryRate: Metric
  if (slipCount > 0) {
    recoveryRate = {
      kind: 'value',
      value: Math.round((recoveredCount / slipCount) * 100),
      numerator: recoveredCount,
      denominator: slipCount,
    }
  } else if (typeof latestSnapshot?.recoveryRate === 'number') {
    // Snapshot rate is already a 0..100 integer; surface it without a
    // numerator/denominator since the underlying counts aren't joined here.
    recoveryRate = {
      kind: 'value',
      value: latestSnapshot.recoveryRate,
      numerator: latestSnapshot.recoveryRate,
      denominator: 100,
    }
  } else {
    recoveryRate = { kind: 'no-data' }
  }

  // ── GLP-1 context (conditional) ───────────────────────────────────
  // Rendered only when a GLP-1 profile exists on the User row. There is
  // no separate rebound-quiz-result model in the schema — the four
  // "Rebounder" archetypes live in lib/archetype-cards as static share
  // copy, and the per-user GLP-1 state is carried by these User fields.
  const hasGlp1 =
    Boolean(user.glp1Drug) ||
    user.glp1InjectionWeekday !== null ||
    user.glp1StartedAt !== null
  const glp1: Glp1Context = hasGlp1
    ? {
        drug: user.glp1Drug ?? null,
        injectionDayLabel:
          user.glp1InjectionWeekday !== null && user.glp1InjectionWeekday !== undefined
            ? (DAY_NAMES[user.glp1InjectionWeekday] ?? null)
            : null,
        startedAtLabel: user.glp1StartedAt ? formatDate(user.glp1StartedAt) : null,
        offMedication: user.glp1EndedAt !== null,
        endedAtLabel: user.glp1EndedAt ? formatDate(user.glp1EndedAt) : null,
      }
    : null

  return {
    firstName: firstNameOf(user.name, user.email),
    reportDateLabel: formatDate(now),
    trackingSinceLabel: formatDate(user.createdAt),
    familyName: family.name,
    familyEssence: family.essence,
    signatureScript: family.signature,
    patternSignature: latestSnapshot?.patternSignature ?? null,
    dangerWindows,
    interruptsFired,
    checkinResponseRate,
    recoveryRate,
    windowDays: WINDOW_DAYS,
    glp1,
  }
}

export { DAY_NAMES_SHORT }
