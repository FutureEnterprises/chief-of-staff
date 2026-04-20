import { streamText, convertToModelMessages } from 'ai'
import { SYSTEM_PROMPTS, AI_MODEL_FAST } from '@repo/ai'
import { checkRateLimit } from '@/lib/rate-limit'
import type { UIMessage } from 'ai'

export const maxDuration = 30

// Public no-auth rescue demo for the landing page.
// Rate-limited by IP to keep AI costs bounded; plain-text streaming keeps
// the client-side parser trivial (no SSE/UIMessage protocol drift).
const DEMO_TRIGGERS = [
  'FRIDGE_STARE',
  'CART_HOVER',
  'SPIRALING',
  'ALREADY_SLIPPED',
  'SKIP_WORKOUT',
] as const
type DemoTrigger = (typeof DEMO_TRIGGERS)[number]

// Triggers represent caught-moments — hesitation, retroactive, pre-action
// temptation — not "I'm about to do the thing" metacognitive-control framings.
const TRIGGER_CONTEXT: Record<DemoTrigger, string> = {
  FRIDGE_STARE:
    'The user is standing at the open fridge, not hungry — restless. This is the moment of hesitation before the autopilot script resumes. Interrupt it.',
  CART_HOVER:
    'The user\'s cart is full and their finger is on checkout. Something in them is asking if they really want this. Name the pattern and give them a clean out.',
  SPIRALING:
    'The user already slipped once tonight and is about to let it cascade into a lost night. Stop the spiral. No shame.',
  ALREADY_SLIPPED:
    'The user folded last night and is waking up to the shame. It\'s retroactive — the moment to prevent the slip is gone. Now the work is: don\'t let one slip become a week.',
  SKIP_WORKOUT:
    'The user is tempted to skip today\'s movement. The story they\'re telling themselves is writing itself. Interrupt the story.',
}

export async function POST(req: Request) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  const rl = await checkRateLimit('demo', ip)
  if (rl.limited) {
    return Response.json({ error: 'Rate limit — try again in a minute' }, { status: 429 })
  }

  let body: { trigger?: string }
  try {
    body = (await req.json()) as { trigger?: string }
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const trigger = body.trigger
  if (!trigger || !DEMO_TRIGGERS.includes(trigger as DemoTrigger)) {
    return Response.json({ error: 'Invalid trigger' }, { status: 400 })
  }

  const typedTrigger = trigger as DemoTrigger
  const context = TRIGGER_CONTEXT[typedTrigger]

  const systemPrompt =
    SYSTEM_PROMPTS.rescueFlow
      .replace('{TRIGGER}', typedTrigger)
      .replace('{WEDGE}', 'WEIGHT_LOSS')
      .replace('{EXCUSE_STYLE}', 'REWARD')
      .replace('{TONE_MODE}', 'MENTOR') +
    '\n\n' +
    SYSTEM_PROMPTS.toneMentor +
    `\n\nCONTEXT: ${context}` +
    '\n\nDEMO MODE: Keep output tight — 3 to 4 sections, max 2 sentences per section. ' +
    'Use **Section Name** headers exactly. Speak TO the person, not ABOUT them.'

  const baseMessages: UIMessage[] = [
    {
      id: 'demo',
      role: 'user',
      parts: [{ type: 'text', text: `Trigger: ${typedTrigger}. Respond now.` }],
    } as UIMessage,
  ]

  try {
    const modelMessages = await convertToModelMessages(baseMessages)
    const result = streamText({
      model: AI_MODEL_FAST,
      system: systemPrompt,
      messages: modelMessages,
    })
    // Plain-text stream = raw string chunks, no protocol framing.
    // Client just concatenates decoded bytes — no JSON parsing, no failure modes.
    return result.toTextStreamResponse()
  } catch (err) {
    console.error('[demo/rescue] streamText failed:', err)
    // Graceful fallback — a scripted response per trigger so the demo never
    // shows a broken-looking error. Better to show SOMETHING than nothing.
    return new Response(FALLBACK_RESPONSES[typedTrigger], {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}

// Scripted fallbacks — used only when the AI gateway is unreachable.
// Follow the same **Section** markdown structure as the real prompt so
// the StructuredResponse component renders them correctly.
const FALLBACK_RESPONSES: Record<DemoTrigger, string> = {
  FRIDGE_STARE: `**Pause**
Close the door. Count to ten before you decide anything.

**What's actually happening**
You're not hungry. You're looking for a state change. Food is the habit, not the need.

**Least-damaging move right now**
Drink a full glass of water. Walk out of the kitchen. Come back in ten minutes if you still want something.

**Pattern**
This is the 9 PM loop. It runs on autopilot. You noticed — that's the interruption.`,

  CART_HOVER: `**Pause**
Don't click. Close the tab. You can always come back.

**What's actually happening**
The cart is a reward you're handing yourself for surviving the day. That's the pattern.

**Least-damaging move right now**
Walk away for ten minutes. Come back and ask: would I buy this if it were full price with no hurry?

**Pattern**
This is reward-based compensation. The feeling that made you open the app is the one worth naming.`,

  SPIRALING: `**Stop the spiral**
One slip is one slip. A spiral is a choice to keep going.

**What's actually happening**
You're telling yourself "I already blew it." That sentence is what turns one slip into a lost night.

**Least-damaging move right now**
Drink water. Brush your teeth. Go to bed thirty minutes early. That's it.

**Tomorrow re-entry**
Tomorrow isn't "starting over." It's the next rep. Do the same thing you'd do if tonight hadn't happened.`,

  ALREADY_SLIPPED: `**No shame, no spiral**
You slipped. That's one data point. It's not who you are.

**What NOT to do**
Don't skip today. Don't compensate with a punishment workout. Don't make a grand new plan.

**Next 2 hours**
Eat your normal breakfast. Drink water. Move for ten minutes. Small, normal, boring.

**Pattern note**
The slip is useful. What happened in the hour before it? That's where the real interruption lives.`,

  SKIP_WORKOUT: `**Pause**
Don't decide yet. The want-to-skip story is running on autopilot.

**What's actually happening**
You're tired and the easier story is "I'll do it tomorrow." Tomorrow is a worse version of today.

**Replacement move**
Five minutes. That's the deal. Put on shoes. Do five minutes. If you still want to stop at five, stop.

**Pattern**
This is the pre-quit story. It always sounds reasonable. It's almost never true.`,
}
