/**
 * Content rotation plan for the autonomous draft generator.
 *
 * The marketing-generate cron walks this rotation, generating a small
 * batch of platform-native DRAFTS each run (status DRAFT → a human
 * approves + posts via /admin/marketing). It does NOT auto-post.
 *
 * Why draft-only, especially for Reddit:
 *   Reddit (and the GLP-1 subs in particular) ban undisclosed bot
 *   promotion on sight, and the communities are actively patrolled.
 *   Auto-posting marketing links is the fastest way to get the brand
 *   shadowbanned in the exact place the launch depends on. So the
 *   agent keeps the *idea queue* full; a human does the final post,
 *   value-first, where it belongs. The Reddit recipe already enforces
 *   value-first / no-link / disclosed framing (templates.ts HARD RULES).
 *
 * NEDA-safe: every topic here is behavioral/pattern framing. No
 * calorie/weight/body/diet language. The recipes refuse off-limits
 * topics, and the cron runs a crisis-keyword gate on the output too.
 *
 * Platform mix is weighted toward the craze channels (Reddit value
 * posts + the faceless Twitter/Threads engine) over the dev-audience
 * surfaces (HN/IndieHackers/PH), which are one-shot launch-day plays,
 * not a daily cadence.
 */

import { MarketingPlatform } from '@repo/database'

export type ContentCombo = {
  platform: MarketingPlatform
  /** Template archetype focus — a family slug or a category theme. */
  archetype: string
  /** The specific angle for this draft. */
  topic: string
}

/**
 * The rotation. ~20 combos; the cron takes a few per run and cycles.
 * Keep topics evergreen + behavioral — the generator adds the voice.
 */
export const CONTENT_ROTATION: ContentCombo[] = [
  // ── Reddit: value-first, no promo (recipe enforces this) ──────────
  { platform: 'REDDIT', archetype: 'the-9pm-negotiator', topic: 'What the "3-second window" is and how to spot your own danger window before the pattern runs.' },
  { platform: 'REDDIT', archetype: 'the-spiral-extender', topic: 'Why one slip becomes the whole night — the "I already messed up" sentence is the real machinery, not the slip.' },
  { platform: 'REDDIT', archetype: 'why-now', topic: 'Behavioral programs did not slow regain after stopping GLP-1s. Here is the behavioral mechanism that actually fits the moment (no products, just the science of danger windows).' },
  { platform: 'REDDIT', archetype: 'the-deserver', topic: 'The "I deserve this" pattern: how reward-language becomes the trapdoor, and the 30-second re-route.' },

  // ── Twitter threads: founder/educator voice ──────────────────────
  { platform: 'TWITTER_THREAD', archetype: 'category-launch', topic: 'The behavioral interrupt thesis: AI for the 3 seconds before behavior happens, not the journal entry the next morning.' },
  { platform: 'TWITTER_THREAD', archetype: 'the-one-more-tabber', topic: 'Focus does not crash, it drifts — one tab, one scroll, one detour at a time. The pattern hides in the sequence.' },
  { platform: 'TWITTER_THREAD', archetype: 'why-now', topic: 'Why 2026 is the moment for a behavioral-interrupt layer: the science (JITAI) has been mature for 7 years; the consumer surface never existed.' },

  // ── Twitter single: one-liner hooks ──────────────────────────────
  { platform: 'TWITTER_SINGLE', archetype: 'the-9pm-negotiator', topic: 'The 9 PM negotiation always ends the same way. Name the pattern and you can interrupt it.' },
  { platform: 'TWITTER_SINGLE', archetype: 'the-monday-resetter', topic: 'It has been 47 Mondays. The reset feels like progress; it is the opposite.' },
  { platform: 'TWITTER_SINGLE', archetype: 'the-capitulator', topic: 'You can hold the line alone all week. The moment someone else is in the room, the line moves.' },

  // ── Threads: identity-recognition, screenshot-y ──────────────────
  { platform: 'THREADS', archetype: 'the-deserver', topic: '"I deserve this" — said within 90 minutes of finishing something hard. Which pattern is yours?' },
  { platform: 'THREADS', archetype: 'category-launch', topic: 'Take the 90-second audit and meet your autopilot archetype. Six patterns. One is yours.' },
  { platform: 'THREADS', archetype: 'the-spiral-extender', topic: 'The slip is not the cost. The spiral after it is. Same-night re-entry, no Monday reset.' },

  // ── LinkedIn: behavioral-science credibility ─────────────────────
  { platform: 'LINKEDIN', archetype: 'why-now', topic: 'Just-in-time adaptive intervention (JITAI) has been the research foundation for behavior change since 2018. Why no consumer product operationalized it until now.' },
  { platform: 'LINKEDIN', archetype: 'category-launch', topic: 'The behavioral interface between AI and real life: detecting the danger window, interrupting before the script runs, recovering same-night.' },

  // ── Newsletter: the long-form essay angle ────────────────────────
  { platform: 'NEWSLETTER', archetype: 'why-now', topic: 'Behavioral support did not slow GLP-1 regain. Here is what will — the danger-window thesis, in full.' },
]

/**
 * Deterministically pick this run's batch by rotating through the plan.
 * `dayIndex` keeps consecutive runs from regenerating the same combos.
 */
export function pickBatch(dayIndex: number, size: number): ContentCombo[] {
  const n = CONTENT_ROTATION.length
  const start = ((dayIndex % n) + n) % n
  const batch: ContentCombo[] = []
  for (let i = 0; i < Math.min(size, n); i++) {
    batch.push(CONTENT_ROTATION[(start + i) % n]!)
  }
  return batch
}
