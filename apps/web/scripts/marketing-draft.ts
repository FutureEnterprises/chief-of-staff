#!/usr/bin/env tsx
/**
 * marketing-draft — CLI to generate a single COYL marketing post draft.
 *
 * Phase 1 of the marketing automation plan (see
 * docs/marketing/automation-plan.md). Loads a voice-locked recipe from
 * apps/web/src/lib/marketing/templates.ts, composes the full prompt,
 * calls Claude via the existing AI SDK, and prints the draft to stdout.
 *
 * USAGE
 *   pnpm tsx apps/web/scripts/marketing-draft.ts <platform> [options]
 *
 * EXAMPLES
 *   pnpm tsx apps/web/scripts/marketing-draft.ts reddit \
 *     --topic "post-GLP-1 weight regain anxiety" \
 *     --archetype the-9pm-negotiator
 *
 *   pnpm tsx apps/web/scripts/marketing-draft.ts twitter-thread \
 *     --topic "Which autopilot are you?"
 *
 *   pnpm tsx apps/web/scripts/marketing-draft.ts linkedin \
 *     --topic "Why AI hasn't fixed human behavior yet"
 *
 * PLATFORMS
 *   reddit | twitter-thread | twitter-single | threads | linkedin |
 *   indiehackers | producthunt | hackernews | newsletter
 *
 * The output is just text — copy/paste it into the platform manually.
 * Phase 2 will add database persistence + an admin queue UI; Phase 3
 * will add platform-API posting.
 *
 * REQUIREMENTS
 *   - ANTHROPIC_API_KEY in env (or load .env via the dotenv side-effect)
 *   - Run from repo root: pnpm tsx apps/web/scripts/marketing-draft.ts
 */

import { generateText } from 'ai'
import { AI_MODEL, AI_MODEL_FAST } from '@repo/ai'
import {
  composePrompt,
  getRecipe,
  listPlatforms,
  type MarketingArchetype,
  type MarketingPlatform,
} from '../src/lib/marketing/templates'

// Model constants live in packages/ai (claude-sonnet-4-6 / claude-haiku-4-5).
// We re-use those instead of inlining slugs here so when the project upgrades
// its model pin every script + route picks it up in one place.

type CliArgs = {
  platform: MarketingPlatform
  topic: string
  archetype?: MarketingArchetype | string
  model: 'sonnet' | 'haiku'
}

function parseArgs(argv: string[]): CliArgs {
  const args = argv.slice(2)
  const platform = args[0] as MarketingPlatform | undefined

  if (!platform) {
    bail(`No platform specified. Available: ${listPlatforms().join(' | ')}`)
  }
  if (!listPlatforms().includes(platform)) {
    bail(`Unknown platform "${platform}". Available: ${listPlatforms().join(' | ')}`)
  }

  let topic = '(no topic supplied)'
  let archetype: string | undefined
  let model: 'sonnet' | 'haiku' = 'sonnet'

  for (let i = 1; i < args.length; i++) {
    const flag = args[i]
    const value = args[i + 1]
    if (flag === '--topic' && value) {
      topic = value
      i++
    } else if (flag === '--archetype' && value) {
      archetype = value
      i++
    } else if (flag === '--model' && value) {
      if (value !== 'sonnet' && value !== 'haiku') {
        bail(`--model must be "sonnet" or "haiku" (got "${value}")`)
      }
      model = value
      i++
    } else if (flag === '--help' || flag === '-h') {
      printHelp()
      process.exit(0)
    }
  }

  return { platform, topic, archetype, model }
}

function bail(message: string): never {
  console.error(`✗ ${message}\n`)
  printHelp()
  process.exit(1)
}

function printHelp() {
  console.error(`
marketing-draft — generate a single COYL post draft

USAGE
  pnpm tsx apps/web/scripts/marketing-draft.ts <platform> [options]

PLATFORMS
  ${listPlatforms().join('\n  ')}

OPTIONS
  --topic "<seed text>"        Required for non-trivial output
  --archetype <family-slug>    Optional. e.g. the-deserver, the-monday-resetter
  --model sonnet|haiku         Default: sonnet
  --help, -h                   Show this message

EXAMPLES
  pnpm tsx apps/web/scripts/marketing-draft.ts reddit \\
    --topic "the 9 PM kitchen" --archetype the-9pm-negotiator

  pnpm tsx apps/web/scripts/marketing-draft.ts twitter-thread \\
    --topic "Which autopilot are you?"
`.trim())
}

async function main() {
  const { platform, topic, archetype, model } = parseArgs(process.argv)

  if (!process.env.ANTHROPIC_API_KEY) {
    bail('ANTHROPIC_API_KEY is not set. Add it to your env or .env.local.')
  }

  const recipe = getRecipe(platform)
  if (!recipe) {
    bail(`No recipe for platform "${platform}"`)
  }

  const prompt = composePrompt(recipe, { topic, archetype })

  // Print run header to stderr so stdout stays clean (pipe-able to a
  // file or clipboard).
  console.error(`\n┌─ COYL marketing-draft`)
  console.error(`│  Platform : ${recipe.label}`)
  console.error(`│  Topic    : ${topic}`)
  if (archetype) console.error(`│  Archetype: ${archetype}`)
  console.error(`│  Model    : ${model === 'sonnet' ? 'AI_MODEL (sonnet)' : 'AI_MODEL_FAST (haiku)'}`)
  console.error(`│  Length   : ${recipe.lengthHint}`)
  console.error(`└──\n`)

  const result = await generateText({
    model: model === 'sonnet' ? AI_MODEL : AI_MODEL_FAST,
    prompt,
    // Length is controlled by the recipe's `lengthHint` baked into the
    // prompt (e.g. "180–280 words"). Token caps are intentionally
    // omitted — the project convention (see api/v1/decide, rescue,
    // callout routes) lets prompts govern length so the LLM can finish
    // sentences cleanly rather than getting cut off at an arbitrary cap.
  })

  console.log(result.text)

  // Channel hints to stderr after the draft, again so stdout stays
  // pure post text.
  console.error(`\n┌─ Suggested channels for ${recipe.platform}`)
  for (const c of recipe.channels) {
    console.error(`│  · ${c}`)
  }
  console.error(`└──`)
  console.error(`\nNext: review, edit if needed, then paste into the platform.\n`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
