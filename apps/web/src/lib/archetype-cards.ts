/**
 * Archetype card data — the share-surface single source of truth.
 *
 * Pure data (no Lucide icons, no Node APIs) so it can be imported from
 * BOTH the edge OG route (/api/og/archetype) and the /card/[slug]
 * landing page. Keep in sync with:
 *   - lib/audit-archetype.ts (the in-product taxonomy)
 *   - apps/mobile/lib/archetypes.ts (the native app copy)
 *
 * NEDA-safe by construction: behavioral / pattern language only. No
 * calorie, weight, body, or diet copy anywhere.
 *
 * 6 general families + 4 Rebound (GLP-1) families = 10 shareable cards.
 */

export type ArchetypeCard = {
  slug: string
  name: string
  /** The internal-justification one-liner. Italic on the card. */
  signature: string
  /** One-line behavioral essence. */
  essence: string
  /** Default danger window (time/context). Quiz can override per-user. */
  window: string
  /** Rarity / prevalence line — the "tag a friend" hook. */
  rarity: string
  /** Which taxonomy: the general autopilot audit or the Rebound quiz. */
  family: 'general' | 'rebound'
}

export const ARCHETYPE_CARDS: Record<string, ArchetypeCard> = {
  'the-9pm-negotiator': {
    slug: 'the-9pm-negotiator',
    name: 'The 9 PM Negotiator',
    signature: '“One time won’t matter.”',
    essence: 'You bargain with yourself the moment your willpower drops.',
    window: '9:00 PM – 11:30 PM · Thu–Sat',
    rarity: '1 in 4 people run this pattern.',
    family: 'general',
  },
  'the-monday-resetter': {
    slug: 'the-monday-resetter',
    name: 'The Monday Resetter',
    signature: '“I’ll start tomorrow.”',
    essence: 'Tomorrow is the script. Today is the break.',
    window: 'Sunday evening · the night before every “fresh start”',
    rarity: 'Only 17% reset this often.',
    family: 'general',
  },
  'the-deserver': {
    slug: 'the-deserver',
    name: 'The Deserver',
    signature: '“I deserve this.”',
    essence: 'Reward language is your favourite trapdoor.',
    window: 'After a hard day · 6:00 – 9:00 PM',
    rarity: '1 in 5 people are Deservers.',
    family: 'general',
  },
  'the-one-more-tabber': {
    slug: 'the-one-more-tabber',
    name: 'The One-More-Tabber',
    signature: '“Just one more thing.”',
    essence: 'Focus dies one tab, one scroll, one tiny detour at a time.',
    window: 'Mid-morning · 11 AM, the first detour',
    rarity: 'The most common pattern of 2026.',
    family: 'general',
  },
  'the-spiral-extender': {
    slug: 'the-spiral-extender',
    name: 'The Spiral Extender',
    signature: '“I already messed up anyway.”',
    essence: 'One slip becomes the whole night.',
    window: 'Right after the first slip · any time',
    rarity: 'Only 8% are Spiral Extenders.',
    family: 'general',
  },
  'the-capitulator': {
    slug: 'the-capitulator',
    name: 'The Capitulator',
    signature: '“I couldn’t say no.”',
    essence: 'Other people’s presence is your override switch.',
    window: 'Whenever you’re not alone',
    rarity: '1 in 7 fold under the room, not the urge.',
    family: 'general',
  },
  'night-rebounder': {
    slug: 'night-rebounder',
    name: 'The Night Rebounder',
    signature: '“The day was good. The night is mine.”',
    essence: 'Your old pattern waits for the quiet hours to return.',
    window: 'Late evening · post-taper window',
    rarity: '1 in 3 rebounders run nights.',
    family: 'rebound',
  },
  'weekend-rebounder': {
    slug: 'weekend-rebounder',
    name: 'The Weekend Rebounder',
    signature: '“Monday I’m back on it.”',
    essence: 'Structure holds Monday to Friday. The weekend dissolves it.',
    window: 'Friday night → Sunday',
    rarity: 'The most common rebound shape.',
    family: 'rebound',
  },
  'stress-rebounder': {
    slug: 'stress-rebounder',
    name: 'The Stress Rebounder',
    signature: '“I just need to take the edge off.”',
    essence: 'Pressure reopens the door the drug used to hold shut.',
    window: 'Peak-stress windows · any day',
    rarity: '1 in 4 rebound under stress.',
    family: 'rebound',
  },
  'reward-rebounder': {
    slug: 'reward-rebounder',
    name: 'The Reward Rebounder',
    signature: '“I earned a little.”',
    essence: 'Accomplishment becomes the permission slip.',
    window: 'After every win · evenings',
    rarity: '1 in 5 reward their way back.',
    family: 'rebound',
  },
}

export const ALL_CARD_SLUGS = Object.keys(ARCHETYPE_CARDS)

export function getArchetypeCard(slug: string): ArchetypeCard | null {
  return ARCHETYPE_CARDS[slug] ?? null
}
