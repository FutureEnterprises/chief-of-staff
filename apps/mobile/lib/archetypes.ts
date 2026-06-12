/**
 * Archetype model for the consumer quiz flow — UNIFIED with the web audit.
 *
 * This is a faithful port of apps/web/src/lib/audit-archetype.ts so the mobile
 * quiz and the web /audit funnel resolve to the exact same families, slugs, and
 * user-facing strings. The mobile quiz collects the same three signals the web
 * model takes — a wedge, a window, and a script — and resolves them with the
 * identical `resolveFamily` precedence. Share links therefore point at the same
 * canonical permalink the web app serves:
 *
 *   https://www.coyl.ai/a/{wedge}-{window}-{script}
 *
 * Mobile-specific divergences from the web module (intentional):
 *   • No Lucide icons. The web model carries a `LucideIcon` per family/specific;
 *     lucide-react is a web-only (DOM SVG) dependency. The reveal card here uses
 *     the family name + copy as the screenshot-worthy asset, so icons are
 *     dropped rather than re-mapped to @expo/vector-icons.
 *   • Adds the three quiz QUESTIONS + a tap-driven answer resolver on top of the
 *     pure model, since the mobile surface is the quiz itself (the web side
 *     gathers wedge/window/script through its own audit UI).
 *
 * NEDA-SAFETY: every string here is behavioural / pattern framing. There is
 * deliberately no calorie / weight / body / diet language anywhere — this is a
 * self-knowledge artefact, not a health tool. (The `weight` WEDGE id is an
 * internal slug shared with web for URL stability; its user-facing options never
 * mention the body — they name the *moment*, e.g. "at the fridge.")
 */

/* ───────────────────────────────────────────────────────────────────
 * MODEL IDS — kept byte-identical to web so slugs round-trip 1:1.
 * ─────────────────────────────────────────────────────────────────── */

export type WedgeId = 'weight' | 'work' | 'destructive' | 'consistency' | 'spending' | 'focus'
export type WindowId = 'morning' | 'afternoon' | 'afterwork' | 'latenight'
export type ScriptId = 'reward' | 'delay' | 'collapse' | 'minimize' | 'exhaustion' | 'social'

const WEDGE_IDS: readonly WedgeId[] = ['weight', 'work', 'destructive', 'consistency', 'spending', 'focus']
const WINDOW_IDS: readonly WindowId[] = ['morning', 'afternoon', 'afterwork', 'latenight']
const SCRIPT_IDS: readonly ScriptId[] = ['reward', 'delay', 'collapse', 'minimize', 'exhaustion', 'social']

/* ───────────────────────────────────────────────────────────────────
 * FAMILIES — the six named archetypes (copied from web audit-archetype.ts;
 * user-facing strings mirrored exactly).
 * ─────────────────────────────────────────────────────────────────── */

export type FamilySlug =
  | 'the-9pm-negotiator'
  | 'the-monday-resetter'
  | 'the-deserver'
  | 'the-one-more-tabber'
  | 'the-spiral-extender'
  | 'the-capitulator'

export const FAMILY_SLUGS: readonly FamilySlug[] = [
  'the-9pm-negotiator',
  'the-monday-resetter',
  'the-deserver',
  'the-one-more-tabber',
  'the-spiral-extender',
  'the-capitulator',
]

export type Family = {
  slug: FamilySlug
  name: string
  essence: string
  signature: string
  description: string
}

export const FAMILIES: Record<FamilySlug, Family> = {
  'the-9pm-negotiator': {
    slug: 'the-9pm-negotiator',
    name: 'The 9 PM Negotiator',
    essence: 'You bargain with yourself the moment your willpower drops.',
    signature: '"One time won\'t matter."',
    description:
      'You know what you want long-term. You also know how to argue your way around it after dark. The voice in your head sounds reasonable — that\'s the trap. The negotiation always ends the same way.',
  },
  'the-monday-resetter': {
    slug: 'the-monday-resetter',
    name: 'The Monday Resetter',
    essence: 'Tomorrow is the script. Today is the break.',
    signature: '"I\'ll start tomorrow."',
    description:
      'You\'re fluent in restart-language. Tomorrow, Monday, next month, the first of the year — your plans always begin one calendar unit ahead. The reset feels like progress; it\'s the opposite.',
  },
  'the-deserver': {
    slug: 'the-deserver',
    name: 'The Deserver',
    essence: 'Reward language is your favourite trapdoor.',
    signature: '"I deserve this."',
    description:
      'You give yourself permission like a manager handing out comp time. "I worked hard." "I had a tough day." "I earned this." All true — and all the script you run before the same choice you already know you\'ll regret.',
  },
  'the-one-more-tabber': {
    slug: 'the-one-more-tabber',
    name: 'The One-More-Tabber',
    essence: 'Focus dies one tab, one scroll, one tiny detour at a time.',
    signature: '"Just one more thing."',
    description:
      'You don\'t crash out — you drift out. The first tab is innocent. The seventh tab is a problem. The fourteenth tab is the afternoon. The pattern hides because no single click feels meaningful; the meaning is in the sequence.',
  },
  'the-spiral-extender': {
    slug: 'the-spiral-extender',
    name: 'The Spiral Extender',
    essence: 'One slip becomes the whole night.',
    signature: '"I already messed up anyway."',
    description:
      'You don\'t fold once. You fold once, then use the fold as the reason to fold for the rest of the day. The "I already messed up" sentence is the actual machinery — louder, faster, and more dangerous than the original slip.',
  },
  'the-capitulator': {
    slug: 'the-capitulator',
    name: 'The Capitulator',
    essence: 'Other people\'s presence is your override switch.',
    signature: '"I couldn\'t say no."',
    description:
      'You can hold the line alone all week. The moment someone else is in the room, the line moves. It isn\'t weakness — it\'s a separate psychology: social context dissolves the rule that made sense in isolation.',
  },
}

export function isFamilySlug(value: unknown): value is FamilySlug {
  return typeof value === 'string' && (FAMILY_SLUGS as readonly string[]).includes(value)
}

/* ───────────────────────────────────────────────────────────────────
 * SPECIFIC ARCHETYPES — the wedge × window texture (names mirror web).
 * ─────────────────────────────────────────────────────────────────── */

export type Specific = { name: string }

const SPECIFIC_TABLE: Record<string, Specific> = {
  weight_latenight: { name: 'Night Fridge Saboteur' },
  weight_afterwork: { name: 'Post-Work Snacker' },
  weight_afternoon: { name: 'Afternoon Crash Eater' },
  weight_morning: { name: 'Stress Breakfast Skipper' },
  work_morning: { name: 'Inbox Avoider' },
  work_afternoon: { name: 'Two-PM Drifter' },
  work_afterwork: { name: 'End-of-Day Bailer' },
  work_latenight: { name: 'Promise-Tomorrow Procrastinator' },
  focus_morning: { name: 'Morning Tab Hopper' },
  focus_afternoon: { name: 'Afternoon Doom-Scroller' },
  focus_afterwork: { name: 'Evening Couch Vortex' },
  focus_latenight: { name: 'Two-AM Wikipedia Spiral' },
  spending_morning: { name: 'Morning Cart Filler' },
  spending_afternoon: { name: 'Boredom Buyer' },
  spending_afterwork: { name: 'Reward-Spend Justifier' },
  spending_latenight: { name: 'Late-Night Impulse Buyer' },
  destructive_morning: { name: 'Morning Reset Resetter' },
  destructive_afternoon: { name: 'Mid-Day Coper' },
  destructive_afterwork: { name: 'Post-Work Numbing Loop' },
  destructive_latenight: { name: 'Late-Night Same-Mistake' },
  consistency_morning: { name: 'Monday Restart Champion' },
  consistency_afternoon: { name: 'Afternoon Quit Artist' },
  consistency_afterwork: { name: 'Evening Streak-Breaker' },
  consistency_latenight: { name: 'Pre-Midnight Cave-In' },
}

/* ───────────────────────────────────────────────────────────────────
 * RESOLUTION — which family does this user belong to?
 *
 * Precedence (first match wins) — IDENTICAL to web's resolveFamily:
 *   1. Focus wedge → One-More-Tabber       (context overrides script)
 *   2. Collapse script → Spiral Extender   (script defines)
 *   3. Reward script → Deserver
 *   4. Delay script → Monday Resetter
 *   5. Social script → Capitulator
 *   6. Minimize / exhaustion → 9 PM Negotiator
 * ─────────────────────────────────────────────────────────────────── */

export function resolveFamily(wedge: WedgeId, _window: WindowId, script: ScriptId): FamilySlug {
  if (wedge === 'focus') return 'the-one-more-tabber'
  if (script === 'collapse') return 'the-spiral-extender'
  if (script === 'reward') return 'the-deserver'
  if (script === 'delay') return 'the-monday-resetter'
  if (script === 'social') return 'the-capitulator'
  // minimize + exhaustion both flow to The 9 PM Negotiator — both
  // are bargaining scripts, just with different bargain language.
  return 'the-9pm-negotiator'
}

/* ───────────────────────────────────────────────────────────────────
 * ARCHETYPE OBJECT — what the reveal card renders from.
 * ─────────────────────────────────────────────────────────────────── */

export type Archetype = {
  family: Family
  specific: Specific
  wedge: WedgeId
  window: WindowId
  script: ScriptId
}

export function buildArchetype(wedge: WedgeId, window: WindowId, script: ScriptId): Archetype {
  const familySlug = resolveFamily(wedge, window, script)
  const family = FAMILIES[familySlug]
  const key = `${wedge}_${window}`
  const specific: Specific = SPECIFIC_TABLE[key] ?? { name: 'Autopilot Operator' }

  return { family, specific, wedge, window, script }
}

/**
 * Derives the "danger window" copy shown on the reveal card from the chosen
 * window id. Mirrors the time-band labels the web reveal surfaces so a result
 * reads the same whether it was produced on web or mobile.
 */
const WINDOW_LABELS: Record<WindowId, string> = {
  morning: 'Mid-morning · 11:00 AM, the first detour',
  afternoon: 'Afternoon · 2:00 PM, the quiet fold',
  afterwork: 'After a hard day · 6:00 – 9:00 PM',
  latenight: '9:00 PM – 11:30 PM · Thu–Sat',
}

export function windowLabel(window: WindowId): string {
  return WINDOW_LABELS[window]
}

/* ───────────────────────────────────────────────────────────────────
 * URLS — slug format matches web's buildShareSlug / buildShareUrl exactly:
 *   /a/{wedge}-{window}-{script}
 * ─────────────────────────────────────────────────────────────────── */

const CANONICAL_BASE = 'https://www.coyl.ai'

export function buildShareSlug(a: { wedge: WedgeId; window: WindowId; script: ScriptId }): string {
  return `${a.wedge}-${a.window}-${a.script}`
}

export function buildShareUrl(a: { wedge: WedgeId; window: WindowId; script: ScriptId }): string {
  return `${CANONICAL_BASE}/a/${buildShareSlug(a)}`
}

export function parseShareSlug(
  slug: string,
): { wedge: WedgeId; window: WindowId; script: ScriptId } | null {
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

  return { wedge: w as WedgeId, window: win as WindowId, script: s as ScriptId }
}

/* ───────────────────────────────────────────────────────────────────
 * QUIZ — the three tap-only questions that collect (wedge, window, script).
 *
 * Q1 → wedge   ("Where does it usually happen?")
 * Q2 → window  ("When does it usually hit?")
 * Q3 → script  ("What's the voice in your head?")
 *
 * Each option is a tap target; the value is one of the model ids above, so the
 * resolved slug is always a valid /a/{wedge}-{window}-{script} permalink.
 * NEDA-safe: every label names a *moment* or an *inner-voice line*, never a
 * body / diet outcome.
 * ─────────────────────────────────────────────────────────────────── */

export type WedgeOption = { id: string; label: string; value: WedgeId }
export type WindowOption = { id: string; label: string; value: WindowId }
export type ScriptOption = { id: string; label: string; value: ScriptId }

export type QuizQuestion =
  | { id: 'wedge'; prompt: string; options: WedgeOption[] }
  | { id: 'window'; prompt: string; options: WindowOption[] }
  | { id: 'script'; prompt: string; options: ScriptOption[] }

const WEDGE_QUESTION: { id: 'wedge'; prompt: string; options: WedgeOption[] } = {
  id: 'wedge',
  prompt: 'Where does the moment you regret usually happen?',
  options: [
    { id: 'wedge-weight', label: 'At the fridge, before the second trip', value: 'weight' },
    { id: 'wedge-work', label: 'In the draft, before you close the tab', value: 'work' },
    { id: 'wedge-focus', label: 'At the tab switch, one more open', value: 'focus' },
    { id: 'wedge-spending', label: 'At checkout, before you confirm', value: 'spending' },
    { id: 'wedge-consistency', label: 'At the restart, moving the start date again', value: 'consistency' },
    { id: 'wedge-destructive', label: 'At the trigger, before the third click', value: 'destructive' },
  ],
}

const WINDOW_QUESTION: { id: 'window'; prompt: string; options: WindowOption[] } = {
  id: 'window',
  prompt: 'When does it usually hit?',
  options: [
    { id: 'window-morning', label: 'Mid-morning, the first detour', value: 'morning' },
    { id: 'window-afternoon', label: 'The afternoon, the quiet fold', value: 'afternoon' },
    { id: 'window-afterwork', label: 'After a hard day', value: 'afterwork' },
    { id: 'window-latenight', label: 'Late at night', value: 'latenight' },
  ],
}

const SCRIPT_QUESTION: { id: 'script'; prompt: string; options: ScriptOption[] } = {
  id: 'script',
  prompt: "What's the voice in your head right before?",
  options: [
    { id: 'script-minimize', label: '"One time won\'t matter."', value: 'minimize' },
    { id: 'script-delay', label: '"I\'ll start tomorrow."', value: 'delay' },
    { id: 'script-reward', label: '"I deserve this."', value: 'reward' },
    { id: 'script-collapse', label: '"I already messed up anyway."', value: 'collapse' },
    { id: 'script-social', label: '"I couldn\'t say no."', value: 'social' },
    { id: 'script-exhaustion', label: '"I\'m too tired to fight it."', value: 'exhaustion' },
  ],
}

export const QUESTIONS: QuizQuestion[] = [WEDGE_QUESTION, WINDOW_QUESTION, SCRIPT_QUESTION]

/**
 * Answers keyed by question id; value is the chosen *model id* (not the option
 * id) so the resolver and slug-builder consume them directly. Partial because
 * the quiz fills it in one tap at a time.
 */
export type QuizAnswers = {
  wedge?: WedgeId
  window?: WindowId
  script?: ScriptId
}

/**
 * Resolves the answers into a full archetype. Falls back to a coherent default
 * for any missing answer so the reveal always renders something valid even if
 * the flow is somehow entered mid-way (deep link, retake race).
 */
export function resolveAnswers(answers: QuizAnswers): Archetype {
  const wedge = answers.wedge ?? 'weight'
  const window = answers.window ?? 'latenight'
  const script = answers.script ?? 'minimize'
  return buildArchetype(wedge, window, script)
}
