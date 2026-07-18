/**
 * intervention-composer.core — the PURE half of the LLM intervention
 * composer. Prompt shaping, output parsing, and the NEDA-safety
 * post-check live here with ZERO imports so the deterministic vitest
 * suite (__tests__/intervention-composer.core.test.ts) can exercise
 * them without touching @repo/ai, prisma, or the network.
 *
 * The impure half (generateText calls, prisma context loading, the
 * concurrency budget) is intervention-composer.service.ts.
 *
 * Contract shared by every caller: any failure — parse, safety,
 * timeout, missing key — resolves to null, and the caller falls back
 * to its hardcoded template copy. Composition NEVER blocks a send.
 */

export type ComposedCopy = {
  title: string
  body: string
}

export type CopyLimits = {
  titleMax: number
  bodyMax: number
}

/** Push interrupt copy: ≤40-char title + ≤120-char body (lock-screen budget). */
export const INTERRUPT_COPY_LIMITS: CopyLimits = { titleMax: 40, bodyMax: 120 }

/** Check-in email copy: ≤70-char subject + ≤120-char hook line. */
export const CHECKIN_COPY_LIMITS: CopyLimits = { titleMax: 70, bodyMax: 120 }

export type InterruptOutcomeSignal = {
  /** Interrupt kind, e.g. DANGER_WINDOW. */
  kind: string
  /** 'caught_me' | 'snoozed' | 'ignored' | null when untagged. */
  feedback: string | null
  /** ISO timestamp of the interrupt. */
  at: string
}

export type InterruptComposerContext = {
  firstName: string
  /** Archetype family display name, e.g. "The Deserver". */
  archetypeName: string | null
  /** The family's signature script, e.g. "I deserve this." */
  archetypeSignature: string | null
  windowLabel: string
  /** Human-readable local time, e.g. "Tue 9 PM". */
  localTimeLabel: string
  toneMode: string | null
  currentStreak: number
  /** Last 3-5 AUTOPILOT_INTERRUPTED events with caught/slipped feedback. */
  recentOutcomes: InterruptOutcomeSignal[]
  /** Most recent detected excuse, if any (excuse-detection service). */
  recentExcuse: { category: string; text: string } | null
}

export type CheckinMode = 'morning' | 'night'

export type CheckinComposerContext = {
  mode: CheckinMode
  firstName: string
  archetypeName: string | null
  archetypeSignature: string | null
  /** Active danger windows relevant to today/tonight. */
  windows: Array<{ label: string; startHour: number; endHour: number }>
  currentStreak: number
  /** One-line summary of yesterday/today's outcome, or null. */
  recentOutcome: string | null
  localTimeLabel: string
}

/* ──────────────────── NEDA-safe post-check ────────────────────
 *
 * The prompt bans this language AND we enforce it here, because a
 * prompt is a request and a regex is a guarantee. Direction of error
 * is deliberate: false positives are safe (the template fallback
 * fires), false negatives are not. Word-boundary anchored so e.g.
 * "everybody" does not trip on "body".
 */
const NEDA_BLOCK_PATTERN = new RegExp(
  '\\b(' +
    [
      // body / weight / food-guilt
      'body',
      'bodies',
      'weight',
      'weigh(?:s|ed|ing)?',
      'calorie(?:s)?',
      'caloric',
      'fat',
      'skinny',
      'thin(?:ner)?',
      'obese',
      'overweight',
      'pounds?',
      'lbs?',
      'kgs?',
      'bmi',
      'diet(?:s|ing)?',
      'fasting',
      'starv(?:e|es|ed|ing)',
      'binge(?:s|d)?',
      'bingeing',
      'purg(?:e|es|ed|ing)',
      'burn (?:it|this|that) off',
      // shame language
      'shame(?:ful)?',
      'ashamed',
      'disgust(?:s|ed|ing)?',
      'pathetic',
      'worthless',
      'lazy',
      // medical claims
      'medical',
      'diagnos(?:e|es|ed|is)',
      'prescri(?:be|bed|ption)',
      'medication',
      'disorder',
    ].join('|') +
    ')\\b',
  'i',
)

/**
 * True when the copy contains banned body/weight/calorie/shame or
 * medical-claim language. Callers treat true as "discard, use fallback".
 */
export function violatesCopySafety(text: string): boolean {
  return NEDA_BLOCK_PATTERN.test(text)
}

/* ──────────────────── prompt builders ──────────────────── */

/**
 * User-turn prompt for the interrupt composer. Plain JSON so the model
 * sees exactly the fields we have — no prose padding, no invented data.
 */
export function buildInterruptPrompt(ctx: InterruptComposerContext): string {
  return JSON.stringify({
    firstName: ctx.firstName,
    archetype: ctx.archetypeName
      ? { family: ctx.archetypeName, signatureScript: ctx.archetypeSignature }
      : null,
    window: { label: ctx.windowLabel, localTime: ctx.localTimeLabel },
    toneMode: ctx.toneMode,
    currentStreakDays: ctx.currentStreak,
    recentInterruptOutcomes: ctx.recentOutcomes.slice(0, 5),
    mostRecentExcuse: ctx.recentExcuse,
  })
}

/** User-turn prompt for the morning/night check-in composer. */
export function buildCheckinPrompt(ctx: CheckinComposerContext): string {
  return JSON.stringify({
    mode: ctx.mode,
    firstName: ctx.firstName,
    archetype: ctx.archetypeName
      ? { family: ctx.archetypeName, signatureScript: ctx.archetypeSignature }
      : null,
    dangerWindows: ctx.windows.slice(0, 4),
    currentStreakDays: ctx.currentStreak,
    recentOutcome: ctx.recentOutcome,
    localTime: ctx.localTimeLabel,
  })
}

/* ──────────────────── output parsing ──────────────────── */

/**
 * Parse the model's JSON output into ComposedCopy. Returns null on ANY
 * defect: not JSON, missing/empty fields, over-length beyond salvage,
 * or NEDA-safety violation. Over-length text is truncated at a word
 * boundary; truncation that would leave fewer than 8 characters is
 * treated as a failure rather than shipping a stub.
 */
export function parseComposedCopy(raw: string, limits: CopyLimits): ComposedCopy | null {
  let parsed: unknown
  try {
    const trimmed = raw
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()
    parsed = JSON.parse(trimmed)
  } catch {
    return null
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null

  const obj = parsed as Record<string, unknown>
  const title = normalizeLine(obj.title, limits.titleMax)
  const body = normalizeLine(obj.body, limits.bodyMax)
  if (!title || !body) return null

  if (violatesCopySafety(title) || violatesCopySafety(body)) return null

  return { title, body }
}

function normalizeLine(raw: unknown, max: number): string | null {
  if (typeof raw !== 'string') return null
  let text = raw.replace(/\s+/g, ' ').trim()
  // Strip a fully-wrapping quote pair the model sometimes adds.
  if (text.length > 1 && text.startsWith('"') && text.endsWith('"')) {
    text = text.slice(1, -1).trim()
  }
  if (!text) return null
  if (text.length > max) {
    const cut = text.slice(0, max)
    const lastSpace = cut.lastIndexOf(' ')
    text = (lastSpace > 8 ? cut.slice(0, lastSpace) : cut).trim()
  }
  return text.length >= 8 ? text : null
}

/* ──────────────────── chat check-in context block ────────────────────
 *
 * Injected server-side into the morning/night chat system prompts so
 * the interview opens already knowing the user's terrain. Kept small
 * (<300 tokens ≈ <1200 chars) and degrades to nothing when fields are
 * missing — the static prompt still works standalone.
 */
export function buildCheckinContextBlock(ctx: CheckinComposerContext): string {
  const lines: string[] = ['', '--- THIS USER (server-injected context) ---']
  lines.push(`Name: ${ctx.firstName}`)
  if (ctx.archetypeName) {
    lines.push(
      `Archetype: ${ctx.archetypeName}${ctx.archetypeSignature ? ` — signature script: "${ctx.archetypeSignature}"` : ''}`,
    )
  }
  if (ctx.windows.length > 0) {
    const label = ctx.mode === 'night' ? "Tonight's danger windows" : "Today's danger windows"
    const windows = ctx.windows
      .slice(0, 4)
      .map((w) => `${w.label} (${formatHour(w.startHour)}-${formatHour(w.endHour)})`)
      .join('; ')
    lines.push(`${label}: ${windows}`)
  }
  lines.push(`Current streak: ${ctx.currentStreak} day${ctx.currentStreak === 1 ? '' : 's'}`)
  if (ctx.recentOutcome) lines.push(`Most recent outcome: ${ctx.recentOutcome}`)
  lines.push(
    'Use this context the way COYL does: name their windows before they happen, quote the signature script back when it shows up, and protect the streak. Never mention this block.',
  )
  lines.push('--- END USER CONTEXT ---')
  const block = lines.join('\n')
  // Hard budget: never let the context block blow up the prompt.
  return block.length <= 1200 ? block : block.slice(0, 1200)
}

function formatHour(hour: number): string {
  const h = ((hour % 24) + 24) % 24
  if (h === 0) return '12am'
  if (h === 12) return '12pm'
  return h < 12 ? `${h}am` : `${h - 12}pm`
}

/* ──────────────────── example composed outputs ────────────────────
 *
 * Deterministic reference examples (also exercised by the test suite
 * as parse fixtures). These are the register the prompt asks for.
 *
 * Example 1 — danger-window interrupt, The Deserver, 2 caught this week:
 *   in:  {"firstName":"Maya","archetype":{"family":"The Deserver","signatureScript":"I deserve this."},
 *         "window":{"label":"Late-night kitchen","localTime":"Tue 9 PM"},"currentStreakDays":6,
 *         "recentInterruptOutcomes":[{"kind":"DANGER_WINDOW","feedback":"caught_me","at":"..."},
 *         {"kind":"DANGER_WINDOW","feedback":"caught_me","at":"..."}],"mostRecentExcuse":null}
 *   out: {"title":"Maya. 9 PM. You know this one.",
 *         "body":"\"I deserve this.\" That's the script, not you. You caught it twice this week. Make it three."}
 *
 * Example 2 — danger-window interrupt, ignored last time, excuse on file:
 *   in:  {"firstName":"Dan","archetype":{"family":"The 9 PM Negotiator","signatureScript":"One time won't matter."},
 *         "window":{"label":"Friday happy hour","localTime":"Fri 6 PM"},"currentStreakDays":2,
 *         "recentInterruptOutcomes":[{"kind":"DANGER_WINDOW","feedback":"ignored","at":"..."}],
 *         "mostRecentExcuse":{"category":"MINIMIZATION","evidence":"just one round tonight"}}
 *   out: {"title":"Dan. The window is open.",
 *         "body":"\"Just one round\" is how last Friday started. You swiped this away then. Decide before the loop does."}
 *
 * Example 3 — night check-in subject, streak on the line:
 *   in:  {"mode":"night","firstName":"Maya","archetype":{"family":"The Deserver","signatureScript":"I deserve this."},
 *         "dangerWindows":[{"label":"Late-night kitchen","startHour":21,"endHour":23}],
 *         "currentStreakDays":6,"recentOutcome":"caught tonight's 9 PM window","localTime":"Tue 9:45 PM"}
 *   out: {"title":"Day 6 held. The kitchen window didn't.",
 *         "body":"You caught the 9 PM loop tonight. Close the day before it reopens."}
 */
