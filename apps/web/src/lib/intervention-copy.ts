/**
 * intervention-copy — templates per intervention mode.
 *
 * The voice is the same compressed editorial register the audit uses:
 *   • short, declarative
 *   • second-person
 *   • permission to feel without permission to act
 *   • the user's archetype signature script can be quoted back to them
 *
 * Each template may contain three slot tokens:
 *   {redirect}            — the user's chosen redirect text
 *   {scenario}            — short context phrase (e.g. "at the fridge")
 *   {archetype_signature} — the family's signature line ("I deserve this.")
 *
 * pickTemplate fills only the slots that have data; missing slots are
 * replaced with safe fallbacks so we never ship a literal "{redirect}"
 * to the user.
 */

import type { ArchetypeFamily } from '@/lib/audit-archetype'
import { getFamily } from '@/lib/audit-archetype'
import type { InterventionMode } from '@/lib/intervention-mode'

/**
 * Templates per mode. Calm has none — by design we do not fire in
 * calm. The selection helper picks one by hashing user+mode+day so the
 * user gets variety across the week without the system feeling random.
 */
const TEMPLATES: Record<Exclude<InterventionMode, 'calm'>, string[]> = {
  high_arousal: [
    'Stop. Hand on the counter. Four breaths. That is it.',
    'You are wound up, not hungry. Step away for 90 seconds, then decide.',
    'The thing you are about to do is the body talking, not you. {redirect}.',
    'Pulse first. Decision second. Set a 2-minute timer and walk.',
    'You can do this in five minutes from a calmer body. Five minutes.',
    'The pattern fires before the thought does. You are inside the pattern right now.',
    '{archetype_signature} — that is the voice. Not the truth.',
    'Stand up. Drink water. Read one full paragraph of anything. Then choose.',
  ],
  low_arousal: [
    'You are not hungry. You are bored. {redirect}.',
    'The fridge fills an emptiness. Not a craving. {redirect}.',
    'You have been horizontal for ninety minutes. Stand up first, decide second.',
    'The couch is the trap, not the food. {redirect}.',
    'Two minutes of motion changes the chemistry. {redirect}.',
    'The drift wants you. Pick one tiny lever: {redirect}.',
    'You did not earn this slump. You did not earn the snack either. {redirect}.',
    'Boredom asking for fuel is the oldest lie. {redirect}.',
  ],
  post_slip: [
    'One slip. Not the night. What is one thing, right now, that ends the story here?',
    'You did not blow it. You are about to blow it. Different thing. {redirect}.',
    '{archetype_signature} — that is the spiral talking. Cut it now.',
    'The slip was a moment. The spiral is the actual cost. Stop here.',
    'You are 30 seconds from the second slip. Move once before then.',
    'One mistake does not unlock the whole night. {redirect}.',
    'The sentence "I already messed up" is the trap. Not the slip itself.',
    'Drink a full glass of water. Sit somewhere different. Then decide what is next.',
  ],
}

/**
 * Slot data the caller assembles. All optional — pickTemplate degrades
 * gracefully to remove unfilled tokens.
 */
export type TemplateSlots = {
  redirect?: string | null
  scenario?: string | null
  archetypeSignature?: string | null
}

/**
 * Stable per-day index picker. Uses a small deterministic hash of
 * userId+mode+date so the user sees a different template across the
 * week but a stable one within the same day (no flicker if they reload
 * the same intervention). Falls back to index 0 when userId is absent.
 */
function pickIndex(userId: string | undefined, mode: string, total: number): number {
  if (total <= 0) return 0
  const day = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const key = `${userId ?? 'anon'}|${mode}|${day}`
  let h = 5381
  for (let i = 0; i < key.length; i++) {
    h = ((h << 5) + h + key.charCodeAt(i)) | 0
  }
  return Math.abs(h) % total
}

/**
 * pickTemplate — chooses a template for the given mode and fills its
 * slots. Returns null for `calm` (the caller should treat null as
 * "don't fire").
 */
export function pickTemplate(args: {
  mode: InterventionMode
  archetype?: ArchetypeFamily | string | null
  slots?: TemplateSlots
  userId?: string
}): string | null {
  const { mode, archetype, slots, userId } = args
  if (mode === 'calm') return null

  const pool = TEMPLATES[mode]
  if (!pool || pool.length === 0) return null

  const idx = pickIndex(userId, mode, pool.length)
  const template = pool[idx] ?? pool[0]
  if (!template) return null

  const signature = slots?.archetypeSignature ?? signatureForArchetype(archetype)
  const redirect = (slots?.redirect ?? '').trim()
  const scenario = (slots?.scenario ?? '').trim()

  return fillSlots(template, {
    redirect: redirect || fallbackRedirect(mode),
    scenario: scenario || fallbackScenario(mode),
    archetype_signature: signature ?? fallbackSignature(mode),
  })
}

/**
 * Look up the family's signature script string. Safe with arbitrary
 * input — returns null if the slug isn't a known family.
 */
function signatureForArchetype(slug?: ArchetypeFamily | string | null): string | null {
  if (!slug) return null
  try {
    const fam = getFamily(slug as ArchetypeFamily)
    return fam.signature ?? null
  } catch {
    return null
  }
}

function fallbackRedirect(mode: InterventionMode): string {
  if (mode === 'low_arousal') return 'Stand up and walk for two minutes'
  if (mode === 'post_slip') return 'Brush your teeth and drink a full glass of water'
  return 'Step away for ninety seconds'
}

function fallbackScenario(mode: InterventionMode): string {
  if (mode === 'post_slip') return 'after the slip'
  if (mode === 'low_arousal') return 'in the drift'
  return 'in the moment'
}

function fallbackSignature(mode: InterventionMode): string {
  if (mode === 'post_slip') return '"I already messed up anyway."'
  if (mode === 'low_arousal') return '"I am just bored."'
  return '"One time won’t matter."'
}

/**
 * Render a headline + subhead from the chosen template. The first
 * sentence is the headline; the remainder is the subhead. Falls back
 * gracefully if there's no period.
 */
export function splitHeadline(rendered: string): { headline: string; subhead?: string } {
  const trimmed = rendered.trim()
  const firstStop = trimmed.search(/[.!?]\s/)
  if (firstStop === -1) return { headline: trimmed }
  const cut = firstStop + 1
  const headline = trimmed.slice(0, cut).trim()
  const subhead = trimmed.slice(cut).trim()
  return subhead ? { headline, subhead } : { headline }
}

/**
 * fillSlots — replace every {token} substring. Unfilled tokens are
 * stripped (along with any trailing punctuation orphan) so the output
 * never reads like a debug template.
 */
function fillSlots(template: string, values: Record<string, string>): string {
  let out = template
  for (const [key, value] of Object.entries(values)) {
    const re = new RegExp(`\\{${key}\\}`, 'g')
    out = out.replace(re, value)
  }
  // Clean any unfilled tokens.
  out = out.replace(/\s*\{[a-z_]+\}/g, '')
  return out.trim()
}

/**
 * archetypeDefaultRedirects — cold-start menu per archetype family.
 * Used by the audit step so the user does not stare at three empty
 * inputs. The user can edit or replace each before saving.
 *
 * The categories follow the four buckets in schema.prisma RedirectChoice
 * comment: connection / creative / physical / rest. ("other" is allowed
 * but we don't pre-populate it.)
 */
export const ARCHETYPE_DEFAULT_REDIRECTS: Record<
  ArchetypeFamily,
  Array<{ text: string; category: 'connection' | 'creative' | 'physical' | 'rest' }>
> = {
  'the-9pm-negotiator': [
    { text: 'Brush teeth and drink a full glass of water', category: 'rest' },
    { text: 'Text the person I have been meaning to text', category: 'connection' },
    { text: 'Read 5 pages of a book in another room', category: 'rest' },
  ],
  'the-monday-resetter': [
    { text: 'Do the smallest version for 2 minutes — only 2', category: 'physical' },
    { text: 'Write tomorrow’s first step on paper, now', category: 'creative' },
    { text: 'Walk around the block. No phone. No plan.', category: 'physical' },
  ],
  'the-deserver': [
    { text: 'Make a hot drink and sit somewhere different', category: 'rest' },
    { text: 'Text someone I am proud of and say so', category: 'connection' },
    { text: '10 push-ups or 10 squats — anywhere, right now', category: 'physical' },
  ],
  'the-one-more-tabber': [
    { text: 'Close every tab except the one that matters', category: 'creative' },
    { text: 'Stand up. Walk to a window. 60 seconds.', category: 'physical' },
    { text: 'Write the next sentence by hand on paper', category: 'creative' },
  ],
  'the-spiral-extender': [
    { text: 'Drink a full glass of water and brush teeth', category: 'rest' },
    { text: 'Call or voice-memo one person — any topic', category: 'connection' },
    { text: 'Put on shoes and walk to the corner', category: 'physical' },
  ],
  'the-capitulator': [
    { text: 'Step outside and call one steady friend', category: 'connection' },
    { text: 'Excuse yourself for 90 seconds — bathroom, fresh air', category: 'physical' },
    { text: 'Write the boundary sentence in Notes before returning', category: 'creative' },
  ],
}

/**
 * defaultRedirectsFor — safe lookup that falls back to a generic set
 * when the archetype is unknown or unset.
 */
export function defaultRedirectsFor(
  archetype?: ArchetypeFamily | string | null,
): Array<{ text: string; category: 'connection' | 'creative' | 'physical' | 'rest' }> {
  if (archetype && archetype in ARCHETYPE_DEFAULT_REDIRECTS) {
    return ARCHETYPE_DEFAULT_REDIRECTS[archetype as ArchetypeFamily]
  }
  return [
    { text: 'Drink a full glass of water and step outside for 90 seconds', category: 'physical' },
    { text: 'Text one person — anything', category: 'connection' },
    { text: 'Read 5 pages of a book in a different room', category: 'rest' },
  ]
}
