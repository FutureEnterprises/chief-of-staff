/**
 * audit-archetype — pure functions shared between the audit UI, the
 * public /a/[slug] specific-result page, and the canonical
 * /audit/[code] family-archetype page.
 *
 * STRATEGY: two-tier archetype model.
 *
 *   FAMILY   = one of six named identities the strategist mandated.
 *              These are the meme-shaped headline ("I'm a Deserver")
 *              that travels through screenshots and link previews.
 *              Six total, fixed forever — small enough that fans
 *              learn the full set, large enough to feel personal.
 *
 *   SPECIFIC = a wedge × window combination ("Night Fridge Saboteur")
 *              that names the user's exact moment. Adds the texture
 *              that a generic family name can't.
 *
 * The share card leads with the FAMILY and uses the SPECIFIC as
 * context: "I'm a Deserver — specifically, a 🌙 Night Fridge Saboteur."
 *
 * URL strategy:
 *   /a/{wedge}-{window}-{script}   — specific permalink (144 stable URLs)
 *   /audit/{family-slug}           — canonical family explainer (6 URLs)
 *
 * Both are stateless. The slug encodes the archetype fully so view
 * rendering is pure server-side computation with no DB write.
 */

export type WedgeId = 'weight' | 'work' | 'destructive' | 'consistency' | 'spending' | 'focus'
export type WindowId = 'morning' | 'afternoon' | 'afterwork' | 'latenight'
export type ScriptId = 'reward' | 'delay' | 'collapse' | 'minimize' | 'exhaustion' | 'social'

const WEDGE_IDS: readonly WedgeId[] = ['weight', 'work', 'destructive', 'consistency', 'spending', 'focus']
const WINDOW_IDS: readonly WindowId[] = ['morning', 'afternoon', 'afterwork', 'latenight']
const SCRIPT_IDS: readonly ScriptId[] = ['reward', 'delay', 'collapse', 'minimize', 'exhaustion', 'social']

/* ───────────────────────────────────────────────────────────────────
 * FAMILIES — the six named archetypes
 *
 * Five from the strategist's May 2026 virality dispatch:
 *   The 9 PM Negotiator
 *   The Monday Resetter
 *   The Deserver
 *   The One-More-Tabber
 *   The Spiral Extender
 *
 * Plus one additional (The Capitulator) to cover the social-pressure
 * script which doesn't fit cleanly into the five — keeping the audit
 * honest about a real distinct psychology rather than miscategorising.
 * ─────────────────────────────────────────────────────────────────── */

export type ArchetypeFamily =
  | 'the-9pm-negotiator'
  | 'the-monday-resetter'
  | 'the-deserver'
  | 'the-one-more-tabber'
  | 'the-spiral-extender'
  | 'the-capitulator'

export const FAMILY_IDS: readonly ArchetypeFamily[] = [
  'the-9pm-negotiator',
  'the-monday-resetter',
  'the-deserver',
  'the-one-more-tabber',
  'the-spiral-extender',
  'the-capitulator',
]

type FamilyDef = {
  slug: ArchetypeFamily
  name: string
  emoji: string
  essence: string
  description: string
  signature: string
  prevalenceCopy: string
}

const FAMILIES: Record<ArchetypeFamily, FamilyDef> = {
  'the-9pm-negotiator': {
    slug: 'the-9pm-negotiator',
    name: 'The 9 PM Negotiator',
    emoji: '🌙',
    essence: 'You bargain with yourself the moment your willpower drops.',
    description:
      'You know what you want long-term. You also know how to argue your way around it after dark. The voice in your head sounds reasonable — that\'s the trap. The negotiation always ends the same way.',
    signature: '"One time won\'t matter."',
    prevalenceCopy: '69% of you tell yourself this — and 0% of you have ever been right about it.',
  },
  'the-monday-resetter': {
    slug: 'the-monday-resetter',
    name: 'The Monday Resetter',
    emoji: '📅',
    essence: 'Tomorrow is the script. Today is the break.',
    description:
      'You\'re fluent in restart-language. Tomorrow, Monday, next month, the first of the year — your plans always begin one calendar unit ahead. The reset feels like progress; it\'s the opposite.',
    signature: '"I\'ll start tomorrow."',
    prevalenceCopy: '82% of you say "tomorrow" at least 3× a week — and the average tomorrow is six tomorrows away.',
  },
  'the-deserver': {
    slug: 'the-deserver',
    name: 'The Deserver',
    emoji: '🎁',
    essence: 'Reward language is your favourite trapdoor.',
    description:
      'You give yourself permission like a manager handing out comp time. "I worked hard." "I had a tough day." "I earned this." All true — and all the script you run before the same choice you already know you\'ll regret.',
    signature: '"I deserve this."',
    prevalenceCopy: '78% of you tell yourself this — most often within 90 minutes of finishing something hard.',
  },
  'the-one-more-tabber': {
    slug: 'the-one-more-tabber',
    name: 'The One-More-Tabber',
    emoji: '📑',
    essence: 'Focus dies one tab, one scroll, one "quick check" at a time.',
    description:
      'You don\'t crash out — you drift out. The first tab is innocent. The seventh tab is a problem. The fourteenth tab is the afternoon. The pattern hides because no single click feels meaningful; the meaning is in the sequence.',
    signature: '"Just one more thing."',
    prevalenceCopy: '71% of you have lost a deep-work block this week to a tab you opened "just to check."',
  },
  'the-spiral-extender': {
    slug: 'the-spiral-extender',
    name: 'The Spiral Extender',
    emoji: '🔂',
    essence: 'One slip becomes the whole night.',
    description:
      'You don\'t fold once. You fold once, then use the fold as the reason to fold for the rest of the day. The "I already messed up" sentence is the actual machinery — louder, faster, and more dangerous than the original slip.',
    signature: '"I already messed up anyway."',
    prevalenceCopy: '74% of you fold the entire day after a single slip — most of the cost is in the spiral, not the slip.',
  },
  'the-capitulator': {
    slug: 'the-capitulator',
    name: 'The Capitulator',
    emoji: '🤝',
    essence: 'Other people\'s presence is your override switch.',
    description:
      'You can hold the line alone all week. The moment someone else is in the room, the line moves. It isn\'t weakness — it\'s a separate psychology: social context dissolves the rule that made sense in isolation.',
    signature: '"I couldn\'t say no."',
    prevalenceCopy: '66% of you fold under social pressure, not appetite — and most of you don\'t notice the difference.',
  },
}

/* ───────────────────────────────────────────────────────────────────
 * SPECIFIC ARCHETYPES — the wedge × window texture
 * ─────────────────────────────────────────────────────────────────── */

const SPECIFIC_TABLE: Record<string, { name: string; emoji: string }> = {
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

/* ───────────────────────────────────────────────────────────────────
 * RESOLUTION — which family does this user belong to?
 *
 * Precedence (first match wins):
 *   1. Focus wedge → One-More-Tabber       (context overrides script)
 *   2. Collapse script → Spiral Extender   (script defines)
 *   3. Reward script → Deserver
 *   4. Delay script → Monday Resetter
 *   5. Social script → Capitulator
 *   6. Minimize / exhaustion → 9 PM Negotiator
 * ─────────────────────────────────────────────────────────────────── */

export function resolveFamily(wedge: WedgeId, _window: WindowId, script: ScriptId): ArchetypeFamily {
  if (wedge === 'focus') return 'the-one-more-tabber'
  if (script === 'collapse') return 'the-spiral-extender'
  if (script === 'reward') return 'the-deserver'
  if (script === 'delay') return 'the-monday-resetter'
  if (script === 'social') return 'the-capitulator'
  // minimize + exhaustion both flow to The 9 PM Negotiator — both
  // are bargaining scripts, just with different bargain language.
  return 'the-9pm-negotiator'
}

export function getFamily(slug: ArchetypeFamily): FamilyDef {
  return FAMILIES[slug]
}

export function allFamilies(): FamilyDef[] {
  return FAMILY_IDS.map((id) => FAMILIES[id])
}

/* ───────────────────────────────────────────────────────────────────
 * ARCHETYPE OBJECT — what audit-view + share pages render from
 * ─────────────────────────────────────────────────────────────────── */

export type Archetype = {
  // Family identity (the meme-shaped headline)
  family: FamilyDef

  // Specific texture (the wedge × window detail)
  specific: {
    name: string
    emoji: string
  }

  // Input echo
  wedge: WedgeId
  window: WindowId
  script: ScriptId
}

export function buildArchetype(wedge: WedgeId, window: WindowId, script: ScriptId): Archetype {
  const familySlug = resolveFamily(wedge, window, script)
  const family = FAMILIES[familySlug]
  const key = `${wedge}_${window}`
  const specific = SPECIFIC_TABLE[key] ?? { name: 'Autopilot Operator', emoji: '🎯' }

  return {
    family,
    specific,
    wedge,
    window,
    script,
  }
}

/* ───────────────────────────────────────────────────────────────────
 * URLS
 * ─────────────────────────────────────────────────────────────────── */

export function buildShareSlug(a: { wedge: WedgeId; window: WindowId; script: ScriptId }): string {
  return `${a.wedge}-${a.window}-${a.script}`
}

export function buildShareUrl(a: { wedge: WedgeId; window: WindowId; script: ScriptId }, base?: string): string {
  const slug = buildShareSlug(a)
  const root = base ?? (typeof window !== 'undefined' ? window.location.origin : 'https://coyl.ai')
  return `${root}/a/${slug}`
}

export function buildFamilyUrl(slug: ArchetypeFamily, base?: string): string {
  const root = base ?? (typeof window !== 'undefined' ? window.location.origin : 'https://coyl.ai')
  return `${root}/audit/${slug}`
}

export function parseShareSlug(slug: string): { wedge: WedgeId; window: WindowId; script: ScriptId } | null {
  if (!slug || typeof slug !== 'string') return null
  const parts = slug.toLowerCase().split('-')
  if (parts.length < 3) return null

  const w = parts[0]
  const win = parts[1]
  const s = parts[2]
  if (!w || !win || !s) return null

  if (!WEDGE_IDS.includes(w as WedgeId)) return null
  if (!WINDOW_IDS.includes(win as WindowId)) return null
  if (!SCRIPT_IDS.includes(s as ScriptId)) return null

  return {
    wedge: w as WedgeId,
    window: win as WindowId,
    script: s as ScriptId,
  }
}

export function parseFamilySlug(slug: string): ArchetypeFamily | null {
  if (!slug || typeof slug !== 'string') return null
  const candidate = slug.toLowerCase()
  if (FAMILY_IDS.includes(candidate as ArchetypeFamily)) {
    return candidate as ArchetypeFamily
  }
  return null
}
