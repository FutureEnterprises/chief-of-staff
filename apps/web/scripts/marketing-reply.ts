#!/usr/bin/env tsx
/**
 * marketing-reply — CLI for the reply-pattern matcher.
 *
 * Paste in a Reddit comment, tweet, or Threads reply; get back the
 * suggested COYL reply (or an escalation flag, or a "no match" signal
 * if nothing fires). Useful right now while the platform adapters
 * (Phase 3) aren't wired yet — founder triages mentions manually and
 * uses this to draft the response.
 *
 * USAGE
 *   pnpm tsx apps/web/scripts/marketing-reply.ts "<the post text>"
 *   pnpm tsx apps/web/scripts/marketing-reply.ts < some-post.txt
 *   echo "I'm a Deserver" | pnpm tsx apps/web/scripts/marketing-reply.ts
 *
 * BEHAVIOR
 *   - Crisis / clinical / dependency keywords → ESCALATE (no auto-reply)
 *   - Recognized pattern → suggested reply + reasoning
 *   - Nothing fires → "no match — manual triage" (don't auto-respond
 *     when not sure)
 *
 * Pure local — no API calls, no network, no AI generation. The reply
 * suggestions are templated from `apps/web/src/lib/marketing/reply-
 * patterns.ts`, which is itself voice-anchored to templates.ts.
 */

import { matchReply, matchEscalation } from '../src/lib/marketing/reply-patterns'

function readInput(): string {
  const cliText = process.argv.slice(2).join(' ').trim()
  if (cliText) return cliText
  // Read from stdin if no CLI args.
  const chunks: Buffer[] = []
  // Synchronous-ish read via Buffer; tsx runs us with a TTY-ish env.
  try {
    const stdin = process.stdin
    const data = (stdin as unknown as { read: () => string | null }).read?.()
    if (typeof data === 'string') return data.trim()
  } catch {
    // fall through
  }
  return ''
}

async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) return ''
  return new Promise((resolve) => {
    let buf = ''
    process.stdin.setEncoding('utf-8')
    process.stdin.on('data', (chunk) => {
      buf += chunk
    })
    process.stdin.on('end', () => resolve(buf.trim()))
    process.stdin.on('error', () => resolve(''))
  })
}

function divider(label: string) {
  return `\n─── ${label} ───`
}

async function main() {
  let text = process.argv.slice(2).join(' ').trim()
  if (!text) {
    text = await readStdin()
  }

  if (!text) {
    console.error(`
marketing-reply — suggest a COYL reply for a third-party post

USAGE
  pnpm tsx apps/web/scripts/marketing-reply.ts "<post text>"
  echo "<post text>" | pnpm tsx apps/web/scripts/marketing-reply.ts

EXAMPLES
  pnpm tsx apps/web/scripts/marketing-reply.ts \\
    "I'm definitely The Deserver. The 'I earned it' script runs at 9pm every night."

  pnpm tsx apps/web/scripts/marketing-reply.ts \\
    "What is COYL? Is this another habit app?"
`.trim())
    process.exit(1)
  }

  console.error(divider('INPUT'))
  console.error(text.length > 240 ? `${text.slice(0, 240)}…` : text)

  const escalation = matchEscalation(text)
  if (escalation) {
    console.error(divider('ESCALATE — DO NOT AUTO-REPLY'))
    console.error(`Reason: ${escalation.reason}`)
    console.error('\nRoute this mention to a human reviewer.\nIf the person is in crisis, point them at the SafetyBanner targets (988 / SAMHSA / your doctor / 911).')
    process.exit(0)
  }

  const match = matchReply(text)
  if (!match) {
    console.error(divider('NO MATCH'))
    console.error('No high-confidence pattern fired. Triage manually.\nWhen in doubt, do not auto-reply.')
    process.exit(0)
  }

  console.error(divider(`SUGGESTED REPLY (kind: ${match.kind})`))
  console.log(match.suggestion)

  console.error(divider('REASONING'))
  console.error(match.reasoning)

  if (match.familySlug) {
    console.error(`Family: ${match.familySlug}`)
    console.error(`Deep link: https://coyl.ai/audit/${match.familySlug}`)
  }

  console.error('\nReview, edit if needed, then paste into the platform.\n')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
