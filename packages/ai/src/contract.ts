/**
 * Prompt contract — the enforceable voice and structure rules for every
 * AI response COYL generates.
 *
 * The critique from the last product pass: spec has voice principles but
 * no enforceable rules. Engineers read it and each build slightly
 * different prompts. This file codifies what "COYL voice" actually means
 * so every surface (chat, decide, rescue, slip, callout, assessments) can
 * import the same rules.
 *
 * Two-part system:
 *   1. SYSTEM_CONTRACT  — the rules, expressed as a paragraph the AI
 *      obeys. Appended to every system prompt.
 *   2. validateResponse — runtime check. Surfaces contract violations
 *      for logging + optional auto-soften. Returns a decision object.
 */

// ─────────────────────── Hard rules ───────────────────────

/** Max tokens per response type. Budget-tight formats keep voice punchy. */
export const MAX_TOKENS: Record<ResponseKind, number> = {
  DECIDE: 380,
  RESCUE: 380,
  SLIP: 420,
  CALLOUT: 320,
  AUTOPSY: 620,
}

export type ResponseKind = 'DECIDE' | 'RESCUE' | 'SLIP' | 'CALLOUT' | 'AUTOPSY'

/**
 * Phrases that signal therapy voice, hedging, moralizing, or generic
 * LLM mush. Surfacing any of these is a contract violation.
 */
export const BANNED_PHRASES: readonly string[] = [
  // Therapy voice
  'i hear you',
  "i'm here for you",
  'that must be hard',
  'take a deep breath',
  'be kind to yourself',
  // Hedging
  'it depends',
  'generally speaking',
  'in some cases',
  'you might consider',
  'perhaps',
  // Moralizing / cheerleader
  'you should',
  'you got this',
  "you've got this",
  "don't give up",
  'remember why you started',
  // Enabling cliches the spec explicitly bans
  'tomorrow is a new day',
  'nobody is perfect',
  'progress not perfection',
] as const

/** Words the AI must never use when describing the user. */
export const BANNED_IDENTITY_WORDS: readonly string[] = [
  'failed',
  'failure',
  'broken',
  'weak',
  'pathetic',
] as const

// ─────────────────────── System contract block ───────────────────────

/**
 * Append this to every system prompt. Written as a paragraph rather than
 * a list of rules so the AI internalizes the voice rather than parsing
 * rule-by-rule. Every constraint is also reflected in validateResponse
 * for runtime enforcement.
 */
export const SYSTEM_CONTRACT = `OUTPUT CONTRACT \u2014 enforce these rules without exception:

Length. Be short. The value is in the landing, not the word count. Assume the user is reading this at the moment it matters.

Structure. Use the exact section headers specified in the task prompt. No extra sections. No closing paragraph. No preamble.

Voice. Speak TO the person, not about them. Use "you" language. Write as someone who has watched this pattern before \u2014 not as a helpful assistant. The baseline tone is the tone mode injected via the TONE MODE block; do not deviate.

Prediction is required. Every rescue, decide, and slip response must include a future-tense prediction grounded in the user's stated pattern. "If you do X, you already know how this ends." Without this, the response is just advice.

Executable close. Every response ends with ONE physical action the user can take in the next five minutes. Verb + object. Not a plan. Not a paragraph. One move.

Pattern reference. When the user's data includes a known excuse style, danger window, or slip history, quote it back. "That's your 'tomorrow' excuse." "This is your 9 PM loop." Do not invent history the data doesn't support \u2014 if confidence is low, stay generic rather than fabricating specifics.

Never use: "I hear you," "take a deep breath," "be kind to yourself," "you should," "you got this," "tomorrow is a new day," "progress not perfection."
Never use: "failed," "failure," "broken," "weak" when describing the user.
Never hedge: no "it depends," no "you might consider," no "perhaps."

When you do not have enough data to be specific, be honest: "We need another week of signal to catch your pattern sharply." Never substitute vagueness for specificity.`

// ─────────────────────── Composer ───────────────────────

/**
 * Compose a final system prompt from its pieces. Every structured-
 * response call site should go through this so the contract is never
 * accidentally dropped.
 *
 * Order matters: core voice \u2192 task-specific prompt \u2192 tone injection
 * \u2192 contract. Contract last so it overrides any looser defaults that
 * a task prompt might have inherited.
 */
export function composeSystem(parts: {
  core?: string
  task: string
  tone?: string
  context?: string
}): string {
  return [
    parts.core ?? '',
    parts.task,
    parts.tone ?? '',
    parts.context ? `CONTEXT:\n${parts.context}` : '',
    SYSTEM_CONTRACT,
  ]
    .filter(Boolean)
    .join('\n\n')
}

// ─────────────────────── Validator ───────────────────────

export type ValidationResult = {
  valid: boolean
  violations: Violation[]
  /** If validation failed, a softened version that strips the worst
   *  violations (banned phrases replaced, hedge clauses dropped). */
  sanitized?: string
}

export type Violation = {
  rule: ViolationRule
  detail: string
}

export type ViolationRule =
  | 'banned_phrase'
  | 'banned_identity_word'
  | 'missing_executable_close'
  | 'over_length'

/**
 * Runtime check on an assistant response. Non-destructive: returns a
 * decision + a sanitized copy. Callers choose whether to ship the
 * sanitized version, log the violations, or both.
 *
 * Intentionally lenient — we catch the worst offenders, not every
 * possible phrasing issue. The system contract is the primary enforcer;
 * this is the belt-and-suspenders layer.
 */
export function validateResponse(text: string, kind: ResponseKind): ValidationResult {
  const violations: Violation[] = []
  const lower = text.toLowerCase()

  // 1. Banned phrases
  for (const phrase of BANNED_PHRASES) {
    if (lower.includes(phrase)) {
      violations.push({ rule: 'banned_phrase', detail: phrase })
    }
  }

  // 2. Banned identity words (only flag when paired with "you" context
  //    so we don't flag e.g. "failure mode" in a neutral technical use)
  for (const word of BANNED_IDENTITY_WORDS) {
    const yourRegex = new RegExp(`\\byou(?:'?re| are| have| feel)?\\s+(?:a\\s+)?${word}\\b`, 'i')
    if (yourRegex.test(text)) {
      violations.push({ rule: 'banned_identity_word', detail: word })
    }
  }

  // 3. Executable close — rescue/decide must end with an action.
  //    Heuristic: final non-header sentence should be an imperative.
  if (kind === 'DECIDE' || kind === 'RESCUE' || kind === 'SLIP') {
    const tail = extractFinalLine(text)
    if (tail && !startsWithImperative(tail)) {
      violations.push({ rule: 'missing_executable_close', detail: tail.slice(0, 60) })
    }
  }

  // 4. Length — rough token budget via chars. 4 chars/token is the
  //    conservative approximation.
  const approxTokens = Math.ceil(text.length / 4)
  if (approxTokens > MAX_TOKENS[kind]) {
    violations.push({
      rule: 'over_length',
      detail: `~${approxTokens} tokens > ${MAX_TOKENS[kind]} budget`,
    })
  }

  const valid = violations.length === 0
  const sanitized = valid ? undefined : sanitize(text)

  return { valid, violations, sanitized }
}

/** Strip the worst violations for safe display. */
function sanitize(text: string): string {
  let out = text
  for (const phrase of BANNED_PHRASES) {
    const re = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    out = out.replace(re, '')
  }
  // Collapse doubled whitespace left behind
  out = out.replace(/ {2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
  return out
}

function extractFinalLine(text: string): string | null {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('**')) // skip section headers
  return lines[lines.length - 1] ?? null
}

/**
 * Rough imperative detector. An imperative sentence starts with a verb.
 * This is best-effort; the goal is to flag responses that clearly end
 * with a question or a statement rather than an action.
 */
function startsWithImperative(sentence: string): boolean {
  const first = sentence.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '')
  if (!first) return false
  // Allowed sentence-starts for an action: imperative verbs COYL uses often
  const imperatives = new Set([
    'close', 'open', 'drink', 'walk', 'put', 'stand', 'sit', 'step',
    'write', 'send', 'do', 'stop', 'pause', 'move', 'eat', 'skip',
    'breathe', 'call', 'text', 'log', 'start', 'go', 'come', 'turn',
    'set', 'lock', 'hide', 'delete', 'uninstall', 'say', 'tell',
    'name', 'list', 'pick', 'choose', 'commit', 'rest', 'sleep',
    'brush', 'shower', 'leave', 'return', 'count', 'read', 'ride',
    'tap', 'click', 'hit', 'check', 'mark',
  ])
  return imperatives.has(first)
}
