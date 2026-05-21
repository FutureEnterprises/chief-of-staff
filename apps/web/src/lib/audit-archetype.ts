/**
 * audit-archetype — pure functions shared between the audit UI and
 * the public /a/[slug] share page.
 *
 * The audit produces an archetype from three answers (wedge × window
 * × script). Sharing is stateless: the URL encodes the three answers
 * directly, so the public share page can recompute and re-render the
 * same archetype without a DB write at audit time.
 *
 * Slug format: `${wedge}-${window}-${script}`
 *   e.g. "weight-latenight-reward" → 🌙 Night Fridge Saboteur
 *
 * Why stateless:
 *   - No write path means no failure mode at the most viral moment.
 *   - Cacheable at the edge (each archetype URL is the same forever).
 *   - The 24 (wedge × window) combinations × 6 scripts = 144 stable
 *     URLs total — every share-card is a permalink.
 *   - View-tracking can be added later via analytics; we don't need
 *     it for v1.
 */

export type WedgeId = 'weight' | 'work' | 'destructive' | 'consistency' | 'spending' | 'focus'
export type WindowId = 'morning' | 'afternoon' | 'afterwork' | 'latenight'
export type ScriptId = 'reward' | 'delay' | 'collapse' | 'minimize' | 'exhaustion' | 'social'

const WEDGE_IDS: readonly WedgeId[] = ['weight', 'work', 'destructive', 'consistency', 'spending', 'focus']
const WINDOW_IDS: readonly WindowId[] = ['morning', 'afternoon', 'afterwork', 'latenight']
const SCRIPT_IDS: readonly ScriptId[] = ['reward', 'delay', 'collapse', 'minimize', 'exhaustion', 'social']

export type Archetype = {
  name: string
  emoji: string
  prevalenceCopy: string
  wedge: WedgeId
  window: WindowId
  script: ScriptId
}

const ARCHETYPE_TABLE: Record<string, { name: string; emoji: string }> = {
  weight_latenight: { name: 'Night Fridge Saboteur', emoji: '🌙' },
  weight_afterwork: { name: 'Post-Work Snacker', emoji: '🍿' },
  weight_afternoon: { name: 'Afternoon Crash Eater', emoji: '🍪' },
  weight_morning: { name: 'Stress Breakfast Skipper', emoji: '☕' },
  work_morning: { name: 'Inbox Avoider', emoji: '📥' },
  work_afternoon: { name: 'Two-PM Drifter', emoji: '🫥' },
  work_afterwork: { name: 'End-of-Day Bailer', emoji: '🚪' },
  work_latenight: { name: 'Promise-Tomorrow Procrastinator', emoji: '⏳' },
  focus_morning: { name: 'Morning Tab Hopper', emoji: '📑' },
  focus_afternoon: { name: 'Afternoon Doom-Scroller', emoji: '📱' },
  focus_afterwork: { name: 'Evening Couch Vortex', emoji: '🛋️' },
  focus_latenight: { name: 'Two-AM Wikipedia Spiral', emoji: '🌀' },
  spending_morning: { name: 'Morning Cart Filler', emoji: '🛒' },
  spending_afternoon: { name: 'Boredom Buyer', emoji: '💳' },
  spending_afterwork: { name: 'Reward-Spend Justifier', emoji: '🎁' },
  spending_latenight: { name: 'Late-Night Impulse Buyer', emoji: '🌃' },
  destructive_morning: { name: 'Morning Reset Resetter', emoji: '🔁' },
  destructive_afternoon: { name: 'Mid-Day Coper', emoji: '🌫️' },
  destructive_afterwork: { name: 'Post-Work Numbing Loop', emoji: '🍷' },
  destructive_latenight: { name: 'Late-Night Same-Mistake', emoji: '🔂' },
  consistency_morning: { name: 'Monday Restart Champion', emoji: '📅' },
  consistency_afternoon: { name: 'Afternoon Quit Artist', emoji: '🪂' },
  consistency_afterwork: { name: 'Evening Streak-Breaker', emoji: '🔥' },
  consistency_latenight: { name: 'Pre-Midnight Cave-In', emoji: '🌃' },
}

const SCRIPT_MODIFIER: Record<ScriptId, string> = {
  reward: '78% of you tell yourself "I deserve this."',
  delay: '82% of you say "tomorrow" at least 3x a week.',
  collapse: '74% of you fold the whole day after one slip.',
  minimize: "69% of you tell yourself \"one time won't matter.\"",
  exhaustion: '71% of you blame tiredness for the same exact choice.',
  social: '66% of you fold under social pressure, not appetite.',
}

export function buildArchetype(wedge: WedgeId, window: WindowId, script: ScriptId): Archetype {
  const key = `${wedge}_${window}`
  const entry = ARCHETYPE_TABLE[key] ?? { name: 'Autopilot Operator', emoji: '🎯' }
  return {
    name: entry.name,
    emoji: entry.emoji,
    prevalenceCopy: SCRIPT_MODIFIER[script],
    wedge,
    window,
    script,
  }
}

export function buildShareSlug(a: { wedge: WedgeId; window: WindowId; script: ScriptId }): string {
  return `${a.wedge}-${a.window}-${a.script}`
}

export function buildShareUrl(a: { wedge: WedgeId; window: WindowId; script: ScriptId }, base?: string): string {
  const slug = buildShareSlug(a)
  const root = base ?? (typeof window !== 'undefined' ? window.location.origin : 'https://coyl.ai')
  return `${root}/a/${slug}`
}

/**
 * Parse a share slug back into the three IDs. Returns null on any
 * invalid input — used at the public /a/[slug] page to validate the
 * route param before rendering.
 */
export function parseShareSlug(slug: string): { wedge: WedgeId; window: WindowId; script: ScriptId } | null {
  if (!slug || typeof slug !== 'string') return null
  const parts = slug.toLowerCase().split('-')
  if (parts.length < 3) return null

  // The wedge slug is the first segment; window the second; script the
  // third. We use explicit allow-lists rather than regex so any future
  // additions to the id sets are forced through this function.
  const wedge = parts[0]
  const window = parts[1]
  const script = parts[2]

  if (!wedge || !window || !script) return null
  if (!WEDGE_IDS.includes(wedge as WedgeId)) return null
  if (!WINDOW_IDS.includes(window as WindowId)) return null
  if (!SCRIPT_IDS.includes(script as ScriptId)) return null

  return {
    wedge: wedge as WedgeId,
    window: window as WindowId,
    script: script as ScriptId,
  }
}

/**
 * For OG image generation. The full result of the audit, compressed to
 * the lines the share card needs to display.
 */
export function buildShareCardCopy(a: Archetype): {
  title: string
  kicker: string
  prevalence: string
  emoji: string
} {
  return {
    kicker: 'My COYL autopilot',
    title: a.name,
    prevalence: a.prevalenceCopy,
    emoji: a.emoji,
  }
}
