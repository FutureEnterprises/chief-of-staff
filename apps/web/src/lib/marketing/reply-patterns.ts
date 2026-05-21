/**
 * Reply-pattern matcher (Phase 3.5 of the marketing automation plan).
 *
 * Pure functions only — NO HTTP calls, NO auto-posting. This library
 * inspects a third-party post (Reddit comment, tweet, Threads reply,
 * Instagram mention) and proposes a draft reply that the founder must
 * approve before anything is sent.
 *
 * Two entry points:
 *   - matchEscalation(text)  → "should this be human-reviewed first?"
 *                              Crisis / clinical language short-circuits
 *                              everything else.
 *   - matchReply(text)       → "if it's safe to draft, what's the draft?"
 *                              Returns null when no high-confidence
 *                              pattern fires. When in doubt, return null.
 *
 * Voice rules mirror templates.ts:
 *   - Short sentences. Periods. No fluff.
 *   - Name the specific moment, not the abstract feeling.
 *   - Audit-first CTA (coyl.ai/audit), never a hard "sign up" push.
 *   - Never imply diagnosis, cure, or weight-loss outcomes.
 *
 * Every suggestion ends with a specific engagement hook — a question or
 * an invitation — rather than a generic "thanks for the comment".
 */

import { containsCrisisKeyword } from './safety-words'

/* ───────────────────────────────────────────────────────────────────
 * Types
 * ─────────────────────────────────────────────────────────────────── */

export type ArchetypeFamily =
  | 'the-9pm-negotiator'
  | 'the-monday-resetter'
  | 'the-deserver'
  | 'the-one-more-tabber'
  | 'the-spiral-extender'
  | 'the-capitulator'

export type ReplyKind =
  | 'archetype'
  | 'wedge'
  | 'audit-curious'
  | 'positive-mention'

export type ReplyMatch = {
  kind: ReplyKind
  suggestion: string
  reasoning: string
  familySlug?: ArchetypeFamily
}

export type EscalationMatch = {
  escalate: true
  reason: string
}

/* ───────────────────────────────────────────────────────────────────
 * Archetype pattern table
 * Each archetype has multiple self-id phrases; matching any one fires
 * the archetype branch.
 * ─────────────────────────────────────────────────────────────────── */

type ArchetypeRow = {
  slug: ArchetypeFamily
  /** Human-readable name used in the suggestion body. */
  display: string
  /** Slug used in URL: coyl.ai/audit/{auditSlug}. */
  auditSlug: string
  /** Self-identification phrases — substring, case-insensitive. */
  phrases: readonly string[]
}

const ARCHETYPES: readonly ArchetypeRow[] = [
  {
    slug: 'the-deserver',
    display: 'The Deserver',
    auditSlug: 'the-deserver',
    phrases: [
      "i'm the deserver",
      'im the deserver',
      "i'm a deserver",
      'im a deserver',
      'i am the deserver',
      'i am a deserver',
    ],
  },
  {
    slug: 'the-9pm-negotiator',
    display: 'The 9 PM Negotiator',
    auditSlug: 'the-9pm-negotiator',
    phrases: [
      "i'm the 9pm negotiator",
      'im the 9pm negotiator',
      "i'm a 9pm negotiator",
      'im a 9pm negotiator',
      "i'm the 9 pm negotiator",
      'im the 9 pm negotiator',
      "i'm a 9 pm negotiator",
      'im a 9 pm negotiator',
      'i am the 9pm negotiator',
      'i am a 9pm negotiator',
    ],
  },
  {
    slug: 'the-monday-resetter',
    display: 'The Monday Resetter',
    auditSlug: 'the-monday-resetter',
    phrases: [
      "i'm the monday resetter",
      'im the monday resetter',
      "i'm a monday resetter",
      'im a monday resetter',
      'i am the monday resetter',
      'i am a monday resetter',
    ],
  },
  {
    slug: 'the-one-more-tabber',
    display: 'The One-More-Tabber',
    auditSlug: 'the-one-more-tabber',
    phrases: [
      "i'm the one more tabber",
      'im the one more tabber',
      "i'm a one more tabber",
      'im a one more tabber',
      "i'm the one-more-tabber",
      'im the one-more-tabber',
      "i'm a one-more-tabber",
      'im a one-more-tabber',
      'i am the one more tabber',
      'i am a one more tabber',
    ],
  },
  {
    slug: 'the-spiral-extender',
    display: 'The Spiral Extender',
    auditSlug: 'the-spiral-extender',
    phrases: [
      "i'm the spiral extender",
      'im the spiral extender',
      "i'm a spiral extender",
      'im a spiral extender',
      'i am the spiral extender',
      'i am a spiral extender',
    ],
  },
  {
    slug: 'the-capitulator',
    display: 'The Capitulator',
    auditSlug: 'the-capitulator',
    phrases: [
      "i'm the capitulator",
      'im the capitulator',
      "i'm a capitulator",
      'im a capitulator',
      'i am the capitulator',
      'i am a capitulator',
    ],
  },
] as const

/* ───────────────────────────────────────────────────────────────────
 * Wedge signals — interest indicators that map to a vertical
 * ─────────────────────────────────────────────────────────────────── */

type WedgeRow = {
  /** Wedge slug used internally. */
  wedge: 'glp1' | 'procrastination' | 'monday-reset'
  /** Substring triggers, case-insensitive. */
  triggers: readonly string[]
  suggestion: string
  reasoning: string
}

const WEDGES: readonly WedgeRow[] = [
  {
    wedge: 'glp1',
    triggers: [
      'glp-1',
      'glp1',
      'ozempic',
      'wegovy',
      'mounjaro',
      'zepbound',
      'late-night eating',
      'late night eating',
      'post-glp',
      'post glp',
      'glp regain',
    ],
    suggestion:
      'The GLP-1 + behavior gap is exactly the wedge COYL was built for. The med quiets the urge; the autopilot script is still running at 9 PM in the kitchen. We catch that 3-second window before the freezer opens. 60-second audit, no signup: coyl.ai/audit. What time of day is the loudest for you?',
    reasoning:
      'Mentions GLP-1 / late-night eating wedge. Lead with the behavioral gap, link audit, ask one question.',
  },
  {
    wedge: 'procrastination',
    triggers: [
      'doom-scroll',
      'doomscroll',
      'doom scroll',
      'tab switch',
      'tab-switch',
      'deep work',
      'procrastinate',
      'procrastination',
      'focus loop',
    ],
    suggestion:
      'The tab-switch and the doom-scroll are the same script — the One-More-Tabber. COYL intercepts in the 3 seconds before the next tab opens. Audit takes 60 seconds, no signup: coyl.ai/audit. What does your switch usually look like?',
    reasoning:
      'Mentions procrastination/focus wedge — frame as the One-More-Tabber family, audit CTA, ask one question.',
  },
  {
    wedge: 'monday-reset',
    triggers: [
      "i'll start monday",
      'ill start monday',
      'start monday',
      'start tomorrow',
      'restart',
      'fresh start',
      'reset on monday',
    ],
    suggestion:
      "The Monday-restart loop is one of the six autopilot families we mapped. The fix isn't more willpower — it's catching the script in the 3 seconds before \"I'll start Monday\" gets said. 60-second audit, no signup: coyl.ai/audit. When does the script usually run for you — Sunday night?",
    reasoning:
      'Mentions Monday-reset language — Monday Resetter family. Audit CTA + Sunday-night hook question.',
  },
] as const

/* ───────────────────────────────────────────────────────────────────
 * Audit-curious patterns
 * ─────────────────────────────────────────────────────────────────── */

const AUDIT_CURIOUS_TRIGGERS: readonly string[] = [
  'what is coyl',
  "what's coyl",
  'whats coyl',
  'what does coyl do',
  'how does coyl work',
  'how coyl works',
  'is this a habit app',
  'is coyl a habit app',
  'is this addiction treatment',
  'is coyl addiction treatment',
  'is this therapy',
  'is coyl therapy',
  'what category is coyl',
] as const

const CATEGORY_QUESTION_TRIGGERS: readonly string[] = [
  'what category is coyl',
  'is this a habit app',
  'is coyl a habit app',
  'is this addiction treatment',
  'is coyl addiction treatment',
  'is this therapy',
  'is coyl therapy',
] as const

/* ───────────────────────────────────────────────────────────────────
 * Positive-mention patterns
 * ─────────────────────────────────────────────────────────────────── */

const POSITIVE_TRIGGERS: readonly string[] = [
  'love this',
  'love coyl',
  'this is great',
  'this is awesome',
  'this is cool',
  'interesting idea',
  'interesting concept',
  'really like this',
  'really cool',
  'love the idea',
  'this is brilliant',
  'genius idea',
  'love what',
] as const

/* ───────────────────────────────────────────────────────────────────
 * Helpers
 * ─────────────────────────────────────────────────────────────────── */

function lc(s: string): string {
  return s.toLowerCase()
}

function includesAny(text: string, triggers: readonly string[]): string | null {
  for (const t of triggers) {
    if (text.includes(t)) return t
  }
  return null
}

/* ───────────────────────────────────────────────────────────────────
 * Public API
 * ─────────────────────────────────────────────────────────────────── */

/**
 * Inspect text for crisis / clinical language. If anything fires, the
 * caller MUST escalate to the founder. matchReply will already return
 * null on these, but this function exists separately so the founder UI
 * can show "look at this one manually — here's why".
 */
export function matchEscalation(text: string): EscalationMatch | null {
  const probe = containsCrisisKeyword(text)
  if (!probe.hit || !probe.matched) return null
  return {
    escalate: true,
    reason: `Crisis/clinical keyword present: "${probe.matched}". Behavioral support tool — never auto-reply on this language. Founder must review.`,
  }
}

/**
 * Inspect text and return a draft reply if a high-confidence pattern
 * fires. Returns null when ambiguous — we'd rather skip a reply than
 * post a wrong one.
 *
 * Priority order:
 *   1. Crisis short-circuit  → return null
 *   2. Archetype self-id     → highest signal, fire first
 *   3. Wedge interest        → vertical-specific hook
 *   4. Audit-curious         → category explanation
 *   5. Positive mention      → thank + invite to the audit
 */
export function matchReply(text: string): ReplyMatch | null {
  if (typeof text !== 'string' || text.trim().length === 0) return null

  // 1. Crisis short-circuit. NEVER auto-reply.
  if (containsCrisisKeyword(text).hit) {
    return null
  }

  const normalized = lc(text)

  // 2. Archetype self-identification.
  for (const a of ARCHETYPES) {
    if (includesAny(normalized, a.phrases)) {
      return {
        kind: 'archetype',
        familySlug: a.slug,
        suggestion: `That resonates. ${a.display} page is at coyl.ai/audit/${a.auditSlug} — deeper breakdown there, plus a "what COYL does about it" section. What time of day usually fires it for you?`,
        reasoning: `Self-identified as ${a.display}. Suggest deeper archetype page + ask one engagement question.`,
      }
    }
  }

  // 3. Wedge interest.
  // 3a. "tried [coyl/this/it] for [glp-1/weight/late-night eating]"
  //     This is a higher-confidence wedge signal — handle first.
  const triedForGlp1 =
    /tried\s+(?:coyl|this|it)\s+for\s+(?:glp-?1|weight|late[\s-]?night\s+eating)/.test(
      normalized,
    )
  if (triedForGlp1) {
    const row = WEDGES.find((w) => w.wedge === 'glp1')
    if (row) {
      return {
        kind: 'wedge',
        suggestion: row.suggestion,
        reasoning: `Direct trial signal — "tried [coyl/this/it] for ${'GLP-1/weight/late-night eating'}". GLP-1 wedge.`,
      }
    }
  }

  // 3b. General wedge triggers.
  for (const w of WEDGES) {
    const hit = includesAny(normalized, w.triggers)
    if (hit) {
      return {
        kind: 'wedge',
        suggestion: w.suggestion,
        reasoning: w.reasoning + ` (trigger: "${hit}")`,
      }
    }
  }

  // 4. Audit-curious. If they asked the category question specifically,
  //    route them to the manifesto for the worldview answer; otherwise
  //    point at the audit.
  const categoryHit = includesAny(normalized, CATEGORY_QUESTION_TRIGGERS)
  if (categoryHit) {
    return {
      kind: 'audit-curious',
      suggestion: `Short answer: no. COYL isn't a habit app, isn't addiction treatment, isn't therapy. It's the behavioral interface — it interrupts the 3-second window before autopilot fires. Manifesto here: coyl.ai/manifesto. Audit if you want to see your own pattern: coyl.ai/audit.`,
      reasoning: `Category-framing question — point at manifesto for the worldview, audit for the lived test. (trigger: "${categoryHit}")`,
    }
  }

  const auditCuriousHit = includesAny(normalized, AUDIT_CURIOUS_TRIGGERS)
  if (auditCuriousHit) {
    return {
      kind: 'audit-curious',
      suggestion: `COYL is the behavioral interface between AI and real life. It catches autopilot in the 3 seconds before action — the 9 PM kitchen, the next tab, the "I already messed up" sentence. 60-second audit, no signup, shows you which of the six families is loudest: coyl.ai/audit. What kicked off the curiosity?`,
      reasoning: `Audit-curious — explain category in one sentence, link audit, ask one question. (trigger: "${auditCuriousHit}")`,
    }
  }

  // 5. Positive mention.
  const positiveHit = includesAny(normalized, POSITIVE_TRIGGERS)
  if (positiveHit) {
    return {
      kind: 'positive-mention',
      suggestion: `Appreciate it. If you want the lived version: the 60-second audit names which of the six autopilot families is loudest for you. No signup: coyl.ai/audit. Curious which one lands.`,
      reasoning: `Positive sentiment — thank + invite to take the audit + ask which family lands. (trigger: "${positiveHit}")`,
    }
  }

  // No high-confidence pattern — better to skip than guess.
  return null
}
