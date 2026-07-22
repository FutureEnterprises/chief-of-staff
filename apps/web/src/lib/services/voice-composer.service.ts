/**
 * voice-composer.service — composes each spoken line of a Precision
 * Interrupt Hotline call.
 *
 * Same fallback-first contract as intervention-composer.service.ts:
 * composeVoiceLine NEVER throws and NEVER blocks the call. On any
 * failure — missing ANTHROPIC_API_KEY, timeout, parse failure, unsafe
 * output — it returns a hardcoded fallback line for that step. The
 * Twilio TwiML route always gets a sayable string back.
 *
 * A phone call is a single live conversation, not a batch of 300 cron
 * users, so this has no concurrency budget — each call composes at
 * most 4 lines, sequentially, one per Twilio webhook POST.
 */

import { generateText } from 'ai'
import { AI_MODEL_FAST, SYSTEM_PROMPTS } from '@repo/ai'
import { violatesCopySafety } from '@/lib/services/intervention-composer.core'

export type VoiceStep = 'open' | 'react' | 'action' | 'commit'

export type VoiceLineContext = {
  firstName: string
  /** RescueTrigger string, or null for a proactive danger-window call. */
  trigger: string | null
  windowLabel?: string | null
  archetypeName: string | null
  archetypeSignature: string | null
  excuseStyle: string | null
  toneMode: string | null
  driveProfile: string | null
  replacementMenu: unknown
  /** Twilio SpeechResult from the prior <Gather>, if any. */
  whatTheyJustSaid: string | null
  /** Lines already spoken this call, so the model doesn't repeat itself. */
  priorLines: string[]
}

const COMPOSE_TIMEOUT_MS = 3_500
const LINE_MAX_CHARS = 240 // ~30 words spoken; generous ceiling, not a target

const STEP_NAMES: Record<VoiceStep, string> = {
  open: 'OPEN — name the pattern and the truth',
  react: 'REACT — predict what happens next, then interrupt the script',
  action: 'ACTION — give the one physical replacement move',
  commit: 'COMMIT — lock in a follow-up and end the call',
}

const STEP_INSTRUCTIONS: Record<VoiceStep, string> = {
  open:
    'Say their name. Name the loop they are in right now in one breath, then the truth underneath it — the excuse or script they are running. End this beat by making them feel caught, not attacked.',
  react:
    'Predict the next two hours if nothing changes, specific to their pattern. Then give ONE three-second command that breaks the script right now — a physical instruction, not a suggestion.',
  action:
    'Give ONE specific physical replacement for the next ten minutes. If a personal replacement item is provided in context, name that exact thing — never a generic "drink water" redirect.',
  commit:
    'Commit to checking on them again at a specific time. One sentence. Then say goodbye — this is the last thing you say before the call ends.',
}

function buildSystemPrompt(step: VoiceStep): string {
  return SYSTEM_PROMPTS.voiceRescueLine
    .replace('{STEP_NAME}', STEP_NAMES[step])
    .replace('{STEP_INSTRUCTIONS}', STEP_INSTRUCTIONS[step])
}

function buildUserPrompt(ctx: VoiceLineContext): string {
  return JSON.stringify({
    firstName: ctx.firstName,
    trigger: ctx.trigger,
    dangerWindow: ctx.windowLabel ?? null,
    archetype: ctx.archetypeName
      ? { family: ctx.archetypeName, signatureScript: ctx.archetypeSignature }
      : null,
    excuseStyle: ctx.excuseStyle,
    toneMode: ctx.toneMode,
    replacementPick: pickReplacementItem(ctx.replacementMenu, ctx.driveProfile),
    whatTheyJustSaid: ctx.whatTheyJustSaid,
    alreadySaidThisCall: ctx.priorLines,
  })
}

/**
 * Pick ONE item from the user's replacement menu — spoken lines can't
 * read a bulleted list, so unlike the text rescueFlow prompt (which gets
 * the whole menu), voice gets a single best match. Prefers an item whose
 * `drive` matches the user's driveProfile; falls back to the first item;
 * returns null when the menu is empty so the fallback line's generic
 * redirect kicks in.
 */
function pickReplacementItem(
  menu: unknown,
  driveProfile: string | null,
): { label: string; drive: string; est_minutes?: number } | null {
  if (!Array.isArray(menu) || menu.length === 0) return null
  const items = menu.filter(
    (item): item is { label: string; drive: string; est_minutes?: number } =>
      typeof item === 'object' && item !== null && typeof (item as { label?: unknown }).label === 'string',
  )
  if (items.length === 0) return null
  const matched = driveProfile ? items.find((i) => i.drive === driveProfile) : undefined
  return matched ?? items[0]!
}

function fallbackLine(step: VoiceStep, ctx: VoiceLineContext): string {
  const name = ctx.firstName || 'hey'
  switch (step) {
    case 'open':
      return ctx.windowLabel
        ? `${name}. This is ${ctx.windowLabel}. You know this window.`
        : `${name}. This is the moment you called about. Let's break it before it runs.`
    case 'react': {
      const pick = pickReplacementItem(ctx.replacementMenu, ctx.driveProfile)
      return pick
        ? `If you keep going, you already know how tonight ends. Put it down right now.`
        : `If you keep going, you already know how tonight ends. Step away from it right now.`
    }
    case 'action': {
      const pick = pickReplacementItem(ctx.replacementMenu, ctx.driveProfile)
      return pick
        ? `Do this instead, right now: ${pick.label.toLowerCase()}.`
        : `Drink some water and walk for five minutes. Do it now, not after.`
    }
    case 'commit':
      return `I'm checking on you again in two hours. Hang up and go do it.`
  }
}

/**
 * Compose one spoken line for the given call step. Returns a plain
 * string (never JSON, never markdown) — always sayable. Falls back to
 * a hardcoded line on ANY failure so the call never goes silent.
 */
export async function composeVoiceLine(step: VoiceStep, ctx: VoiceLineContext): Promise<string> {
  const fallback = fallbackLine(step, ctx)
  if (!process.env.ANTHROPIC_API_KEY) return fallback

  try {
    const { text } = await generateText({
      model: AI_MODEL_FAST,
      system: buildSystemPrompt(step),
      prompt: buildUserPrompt(ctx),
      maxOutputTokens: 120,
      abortSignal: AbortSignal.timeout(COMPOSE_TIMEOUT_MS),
    })
    const line = parseVoiceLine(text)
    if (!line) return fallback
    if (violatesCopySafety(line)) return fallback
    return line
  } catch {
    return fallback
  }
}

function parseVoiceLine(raw: string): string | null {
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
  if (!parsed || typeof parsed !== 'object') return null
  const line = (parsed as Record<string, unknown>).line
  if (typeof line !== 'string') return null
  const cleaned = line.replace(/\s+/g, ' ').trim()
  if (!cleaned || cleaned.length > LINE_MAX_CHARS) return null
  return cleaned
}
