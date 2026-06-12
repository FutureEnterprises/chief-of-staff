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
 * context: "I'm a Deserver — specifically, Night Fridge Saboteur."
 *
 * URL strategy:
 *   /a/{wedge}-{window}-{script}   — specific permalink (144 stable URLs)
 *   /audit/{family-slug}           — canonical family explainer (6 URLs)
 *
 * Both are stateless. The slug encodes the archetype fully so view
 * rendering is pure server-side computation with no DB write.
 *
 * ICONOGRAPHY: each family + specific carries a `LucideIcon` (Lucide
 * React SVG component). Render-sites pull the icon and size/colour it
 * for context. This replaced an emoji-string system whose rendering
 * was inconsistent across OS vendors (Apple's gift box ≠ Google's ≠
 * Windows's) and could not take brand colour or scale crisply.
 */

import {
  Moon,
  CalendarClock,
  Gift,
  Layers,
  Repeat,
  Handshake,
  Cookie,
  Coffee,
  Inbox,
  EyeOff,
  DoorOpen,
  Hourglass,
  Smartphone,
  Armchair,
  Loader,
  ShoppingCart,
  CreditCard,
  MoonStar,
  RotateCcw,
  Cloud,
  Wine,
  Repeat2,
  CalendarDays,
  ArrowDownToLine,
  Flame,
  Target,
  type LucideIcon,
} from 'lucide-react'

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
  Icon: LucideIcon
  essence: string
  description: string
  signature: string
  prevalenceCopy: string
}

const FAMILIES: Record<ArchetypeFamily, FamilyDef> = {
  'the-9pm-negotiator': {
    slug: 'the-9pm-negotiator',
    name: 'The 9 PM Negotiator',
    Icon: Moon,
    essence: 'You bargain with yourself the moment your willpower drops.',
    description:
      'You know what you want long-term. You also know how to argue your way around it after dark. The voice in your head sounds reasonable — that\'s the trap. The negotiation always ends the same way.',
    signature: '"One time won\'t matter."',
    prevalenceCopy: '69% of you tell yourself this — and 0% of you have ever been right about it.',
  },
  'the-monday-resetter': {
    slug: 'the-monday-resetter',
    name: 'The Monday Resetter',
    Icon: CalendarClock,
    essence: 'Tomorrow is the script. Today is the break.',
    description:
      'You\'re fluent in restart-language. Tomorrow, Monday, next month, the first of the year — your plans always begin one calendar unit ahead. The reset feels like progress; it\'s the opposite.',
    signature: '"I\'ll start tomorrow."',
    prevalenceCopy: '82% of you say "tomorrow" at least 3× a week — and the average tomorrow is six tomorrows away.',
  },
  'the-deserver': {
    slug: 'the-deserver',
    name: 'The Deserver',
    Icon: Gift,
    essence: 'Reward language is your favourite trapdoor.',
    description:
      'You give yourself permission like a manager handing out comp time. "I worked hard." "I had a tough day." "I earned this." All true — and all the script you run before the same choice you already know you\'ll regret.',
    signature: '"I deserve this."',
    prevalenceCopy: '78% of you tell yourself this — most often within 90 minutes of finishing something hard.',
  },
  'the-one-more-tabber': {
    slug: 'the-one-more-tabber',
    name: 'The One-More-Tabber',
    Icon: Layers,
    essence: 'Focus dies one tab, one scroll, one tiny detour at a time.',
    description:
      'You don\'t crash out — you drift out. The first tab is innocent. The seventh tab is a problem. The fourteenth tab is the afternoon. The pattern hides because no single click feels meaningful; the meaning is in the sequence.',
    signature: '"Just one more thing."',
    prevalenceCopy: '71% of you have lost a deep-work block this week to a tab you opened "just to check."',
  },
  'the-spiral-extender': {
    slug: 'the-spiral-extender',
    name: 'The Spiral Extender',
    Icon: Repeat,
    essence: 'One slip becomes the whole night.',
    description:
      'You don\'t fold once. You fold once, then use the fold as the reason to fold for the rest of the day. The "I already messed up" sentence is the actual machinery — louder, faster, and more dangerous than the original slip.',
    signature: '"I already messed up anyway."',
    prevalenceCopy: '74% of you fold the entire day after a single slip — most of the cost is in the spiral, not the slip.',
  },
  'the-capitulator': {
    slug: 'the-capitulator',
    name: 'The Capitulator',
    Icon: Handshake,
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

type SpecificDef = { name: string; Icon: LucideIcon }

const SPECIFIC_TABLE: Record<string, SpecificDef> = {
  weight_latenight: { name: 'Night Fridge Saboteur', Icon: Moon },
  weight_afterwork: { name: 'Post-Work Snacker', Icon: Cookie },
  weight_afternoon: { name: 'Afternoon Crash Eater', Icon: Cookie },
  weight_morning: { name: 'Stress Breakfast Skipper', Icon: Coffee },
  work_morning: { name: 'Inbox Avoider', Icon: Inbox },
  work_afternoon: { name: 'Two-PM Drifter', Icon: EyeOff },
  work_afterwork: { name: 'End-of-Day Bailer', Icon: DoorOpen },
  work_latenight: { name: 'Promise-Tomorrow Procrastinator', Icon: Hourglass },
  focus_morning: { name: 'Morning Tab Hopper', Icon: Layers },
  focus_afternoon: { name: 'Afternoon Doom-Scroller', Icon: Smartphone },
  focus_afterwork: { name: 'Evening Couch Vortex', Icon: Armchair },
  focus_latenight: { name: 'Two-AM Wikipedia Spiral', Icon: Loader },
  spending_morning: { name: 'Morning Cart Filler', Icon: ShoppingCart },
  spending_afternoon: { name: 'Boredom Buyer', Icon: CreditCard },
  spending_afterwork: { name: 'Reward-Spend Justifier', Icon: Gift },
  spending_latenight: { name: 'Late-Night Impulse Buyer', Icon: MoonStar },
  destructive_morning: { name: 'Morning Reset Resetter', Icon: RotateCcw },
  destructive_afternoon: { name: 'Mid-Day Coper', Icon: Cloud },
  destructive_afterwork: { name: 'Post-Work Numbing Loop', Icon: Wine },
  destructive_latenight: { name: 'Late-Night Same-Mistake', Icon: Repeat2 },
  consistency_morning: { name: 'Monday Restart Champion', Icon: CalendarDays },
  consistency_afternoon: { name: 'Afternoon Quit Artist', Icon: ArrowDownToLine },
  consistency_afterwork: { name: 'Evening Streak-Breaker', Icon: Flame },
  consistency_latenight: { name: 'Pre-Midnight Cave-In', Icon: MoonStar },
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
  specific: SpecificDef

  // Input echo
  wedge: WedgeId
  window: WindowId
  script: ScriptId
}

export function buildArchetype(wedge: WedgeId, window: WindowId, script: ScriptId): Archetype {
  const familySlug = resolveFamily(wedge, window, script)
  const family = FAMILIES[familySlug]
  const key = `${wedge}_${window}`
  const specific: SpecificDef = SPECIFIC_TABLE[key] ?? { name: 'Autopilot Operator', Icon: Target }

  return {
    family,
    specific,
    wedge,
    window,
    script,
  }
}

/**
 * The three "interrupts" the audit result page shows for a given
 * wedge × window × script combo. Pure data, no React — usable from
 * the audit page, the email template, and any future export.
 */
export function buildInterrupts(
  wedge: WedgeId,
  window: WindowId,
  script: ScriptId,
): [string, string, string] {
  const scriptResponse: Record<ScriptId, string> = {
    reward: 'You don’t deserve this. You’re avoiding.',
    delay: 'Tomorrow is the script. Today is the break.',
    collapse: 'You didn’t blow it. You’re about to blow it. There’s a difference.',
    minimize: 'One time is the pattern. Not the exception.',
    exhaustion: 'Tired is a signal, not a verdict. 2 minutes, then decide.',
    social: 'You said yes to them. Say no to the loop.',
  }

  const wedgeMoment: Record<WedgeId, string> = {
    weight: 'At the fridge. Before the second trip.',
    work: 'In the draft. Before you close the tab.',
    destructive: 'At the trigger. Before the 3rd click.',
    consistency: 'At the restart. Before you move the start date again.',
    spending: 'At checkout. Before you hit confirm.',
    focus: 'At the tab switch. Before the 10th open of the same app.',
  }

  const windowFollowup: Record<WindowId, string> = {
    morning: '8 AM follow-up: "Yesterday’s you bet on today’s you. Show up."',
    afternoon: '2 PM check: "The afternoon fold is the one you don’t see coming."',
    afterwork: '7 PM interrupt: "This is the hour. The one you always lose."',
    latenight: '10 PM interrupt: "Decisions you make after 10 PM aren’t decisions. They’re reflexes."',
  }

  return [wedgeMoment[wedge], scriptResponse[script], windowFollowup[window]]
}

/* ───────────────────────────────────────────────────────────────────
 * URLS
 * ─────────────────────────────────────────────────────────────────── */

export function buildShareSlug(a: { wedge: WedgeId; window: WindowId; script: ScriptId }): string {
  return `${a.wedge}-${a.window}-${a.script}`
}

export function buildShareUrl(a: { wedge: WedgeId; window: WindowId; script: ScriptId }, base?: string): string {
  const slug = buildShareSlug(a)
  // Prefer the canonical host so every shared link points at the same
  // origin (no apex/preview/localhost fragmentation that splits OG cache
  // + analytics). NEXT_PUBLIC_APP_URL is inlined client-side at build.
  const root =
    base ??
    process.env.NEXT_PUBLIC_APP_URL ??
    (typeof window !== 'undefined' ? window.location.origin : 'https://www.coyl.ai')
  return `${root}/a/${slug}`
}

export function buildFamilyUrl(slug: ArchetypeFamily, base?: string): string {
  const root =
    base ??
    process.env.NEXT_PUBLIC_APP_URL ??
    (typeof window !== 'undefined' ? window.location.origin : 'https://www.coyl.ai')
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
