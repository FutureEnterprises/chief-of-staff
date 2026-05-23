/**
 * Rebound archetypes — the four GLP-1 anti-regain families.
 *
 * The /rebound/quiz consumer funnel routes visitors through 3
 * questions and pins them in one of four rebound families. Each
 * family corresponds to WHEN the appetite (or its script) leaks
 * through after the GLP-1 medication quiets — the moment COYL
 * needs to fire the interrupt.
 *
 * Distinct from /audit (which has 6 generic-behavior archetypes:
 * The 9 PM Negotiator, The Deserver, etc.). The Rebound quiz is
 * intentionally GLP-1-specific — it asks about your medication
 * status, when the script returned, and what sentence runs in your
 * head before you fold. The result card is shareable and feeds
 * the same audit_funnel_events telemetry as the generic audit.
 *
 * Per the founder strategic decision and the May 2026 GLP-1
 * Rebound pivot: this is the consumer wedge. The 4 families are
 * intentionally narrower than the generic 6 — the math is "278K
 * paying users at $29/mo = $100M ARR" and that needs a quiz that
 * converts GLP-1 visitors, not a generic-behavior survey.
 */

import { Moon, Sun, Wind, Gift, type LucideIcon } from 'lucide-react'

export type ReboundFamily =
  | 'night-rebounder'
  | 'weekend-rebounder'
  | 'stress-rebounder'
  | 'reward-rebounder'

export type ReboundStatus =
  | 'on-medication'
  | 'tapering'
  | 'recently-stopped'
  | 'stopped-long-ago'
  | 'considering'

export type ReboundMoment =
  | 'evening'
  | 'weekend'
  | 'stress-event'
  | 'after-win'

export type ReboundScript =
  | 'shot-tomorrow'
  | 'just-once'
  | 'i-deserve'
  | 'been-so-good'

export type ReboundFamilyDef = {
  slug: ReboundFamily
  name: string
  Icon: LucideIcon
  essence: string
  description: string
  signature: string
  prevalenceCopy: string
  riskWindow: string
  interrupts: [string, string, string]
}

export type ReboundArchetype = {
  family: ReboundFamilyDef
  status: ReboundStatus
  moment: ReboundMoment
  script: ReboundScript
}

/* ───────────────────────────────────────────────────────────────────
 * The four families
 * ─────────────────────────────────────────────────────────────────── */

const FAMILIES: Record<ReboundFamily, ReboundFamilyDef> = {
  'night-rebounder': {
    slug: 'night-rebounder',
    name: 'The Night Rebounder',
    Icon: Moon,
    essence:
      'The shot is wearing off by 9 PM and your hand is in the freezer before your brain catches up.',
    description:
      'The medication keeps appetite quiet through the day. Then the dose dips, the evening cortisol arrives, and the kitchen becomes a negotiation room. The shot did the work all day; nine PM is the hour it stopped doing it for you.',
    signature: '“One snack won’t matter.”',
    prevalenceCopy:
      '64% of GLP-1 maintenance failures happen between 9 PM and midnight — the dose-trough window.',
    riskWindow: '9:00 PM – 11:30 PM',
    interrupts: [
      'At the freezer door — before the second trip.',
      'You don’t need the snack. The shot wore off; the script didn’t.',
      '10 PM follow-up: "Decisions after the dose drops aren\'t decisions. They\'re reflexes."',
    ],
  },
  'weekend-rebounder': {
    slug: 'weekend-rebounder',
    name: 'The Weekend Rebounder',
    Icon: Sun,
    essence: 'Five clean days, one collapse Saturday.',
    description:
      'Monday through Friday the structure holds — work meals, sleep schedule, the dose timing. Saturday afternoon the schedule disappears and the script returns: the brunch order, the delivery app, the "it’s the weekend" sentence. The shot doesn’t know it’s Saturday.',
    signature: '“It’s the weekend.”',
    prevalenceCopy:
      'Weekend rebounders regain 2x faster than weekday-steady patients post-taper, per the COYL maintenance protocol cohort.',
    riskWindow: 'Saturday 14:00 – Sunday 23:00',
    interrupts: [
      'At the delivery-app open — before you swipe to confirm.',
      'The weekend is not a permission slip. The pattern doesn’t take days off.',
      'Sunday 7 PM: "Tomorrow doesn\'t restart the diet. Tonight ends the script."',
    ],
  },
  'stress-rebounder': {
    slug: 'stress-rebounder',
    name: 'The Stress Rebounder',
    Icon: Wind,
    essence:
      'The shot keeps hunger quiet until something hard happens. Then the script doesn’t ask permission.',
    description:
      'A presentation, a fight, a deadline, a missed sleep — the moment your system loads, the script that was quiet for months reactivates. The medication suppressed appetite; it didn’t train the stress-eating response. That stays live, waiting for the trigger.',
    signature: '“I’ll get back on the shot tomorrow.”',
    prevalenceCopy:
      '~58% of GLP-1 maintenance slips correlate with a stress event in the preceding two hours.',
    riskWindow: 'Stress event + 2 hours',
    interrupts: [
      'Mid-stress: "The shot doesn\'t catch this. We do."',
      'You don’t need to medicate the stress. You need to name it.',
      '24 hours later: "Yesterday\'s spike was the trigger. Today is the proof you can recover same-week, not next quarter."',
    ],
  },
  'reward-rebounder': {
    slug: 'reward-rebounder',
    name: 'The Reward Rebounder',
    Icon: Gift,
    essence:
      'You finished something hard, hit a number on the scale, or had a good week. The reward language is the rebound.',
    description:
      'You give yourself permission like a manager handing out comp time. "I worked hard." "I lost five pounds." "I earned this." All true — and all the script you run before the choice you already know you’ll regret. The shot quiets the hunger; it doesn’t mute the deserver sentence.',
    signature: '“I’ve been so good. I earned this.”',
    prevalenceCopy:
      '~71% of Reward Rebounders cite a perceived win in the 60–120 minutes before their last slip.',
    riskWindow: '60–120 minutes after a perceived win',
    interrupts: [
      'At the reward trip: "You worked hard. The reward isn\'t the food."',
      'The deserver sentence is the script. Name it; it weakens.',
      '24 hours later: "What you earned this week was the streak. Not the slip."',
    ],
  },
}

/* ───────────────────────────────────────────────────────────────────
 * Question taxonomy — 3 questions, archetype mapping
 * ─────────────────────────────────────────────────────────────────── */

export const STATUS_OPTIONS: Array<{ id: ReboundStatus; label: string; copy: string }> = [
  {
    id: 'on-medication',
    label: 'On the medication, considering taper',
    copy: 'The shot is working — you’re wondering what happens when it stops.',
  },
  {
    id: 'tapering',
    label: 'Tapering or dose-reduced',
    copy: 'The dose is lower than peak; the appetite is starting to come back.',
  },
  {
    id: 'recently-stopped',
    label: 'Recently stopped (within 6 months)',
    copy: 'The shot is gone. The pattern is back.',
  },
  {
    id: 'stopped-long-ago',
    label: 'Stopped 6+ months ago',
    copy: 'You’ve been navigating maintenance for a while. The script is familiar.',
  },
  {
    id: 'considering',
    label: 'Considering starting',
    copy: 'You haven’t started yet. You want the maintenance plan ready before the shot is.',
  },
]

export const MOMENT_OPTIONS: Array<{ id: ReboundMoment; label: string; family: ReboundFamily }> = [
  {
    id: 'evening',
    label: 'After 9 PM, when the dose feels light',
    family: 'night-rebounder',
  },
  {
    id: 'weekend',
    label: 'Saturday afternoon or Sunday — when the schedule disappears',
    family: 'weekend-rebounder',
  },
  {
    id: 'stress-event',
    label: 'Right after something hard — a fight, a deadline, bad sleep',
    family: 'stress-rebounder',
  },
  {
    id: 'after-win',
    label: 'After a good week, a number on the scale, an accomplishment',
    family: 'reward-rebounder',
  },
]

export const SCRIPT_OPTIONS: Array<{ id: ReboundScript; quote: string }> = [
  { id: 'shot-tomorrow', quote: '“I’ll get back on the shot tomorrow.”' },
  { id: 'just-once', quote: '“It’s just this once.”' },
  { id: 'i-deserve', quote: '“I deserve this.”' },
  { id: 'been-so-good', quote: '“I’ve been so good this week.”' },
]

/* ───────────────────────────────────────────────────────────────────
 * Archetype builder
 *
 * The MOMENT answer is the primary axis — it maps directly to a
 * family. The STATUS and SCRIPT answers are confirmatory and inform
 * the interrupt copy + result-page tone, but don't override the
 * family assignment.
 * ─────────────────────────────────────────────────────────────────── */

export function buildReboundArchetype(
  status: ReboundStatus,
  moment: ReboundMoment,
  script: ReboundScript,
): ReboundArchetype {
  const momentDef = MOMENT_OPTIONS.find((m) => m.id === moment)
  const familySlug = momentDef?.family ?? 'night-rebounder'
  return {
    family: FAMILIES[familySlug],
    status,
    moment,
    script,
  }
}

/** All families — used by the /rebound landing page family preview. */
export function allReboundFamilies(): ReboundFamilyDef[] {
  return Object.values(FAMILIES)
}

/** Lookup by slug — used by shareable card route + archetype OG URL. */
export function familyBySlug(slug: string): ReboundFamilyDef | null {
  return FAMILIES[slug as ReboundFamily] ?? null
}

/**
 * Build the public share URL for an archetype. Lands on /rb/[family]
 * — short for "Rebound", not the existing /r/[code] referral
 * redirect. Slug encodes the family directly so every visit to
 * /rb/night-rebounder shows the Night Rebounder share card.
 */
export function buildReboundShareUrl(family: ReboundFamily, base?: string): string {
  const origin = base ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://coyl.ai'
  return `${origin}/rb/${family}`
}
