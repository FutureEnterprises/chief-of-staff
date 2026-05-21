/**
 * Marketing post templates — voice-locked, platform-aware.
 *
 * Each entry is a "Recipe" for an AI-generated marketing post. Recipes
 * are NOT the final post — they're the prompt scaffolding that we hand
 * to the LLM along with a topic and (optionally) an archetype focus.
 * The LLM produces the body; the recipe enforces voice, length, and
 * platform-specific conventions.
 *
 * Phase 1 ships with 8 platform recipes. Phase 2 stores the generated
 * drafts in MarketingPost (see docs/marketing/automation-plan.md).
 * Phase 3 wires platform-posting adapters.
 *
 * VOICE PRINCIPLES — applied to every template:
 *   - COYL is the missing behavioral interface between AI and real life
 *   - Short sentences. Periods. No marketing fluff.
 *   - Name the specific moment (9 PM kitchen, tab switch, "I already
 *     messed up") instead of abstract feelings
 *   - Founder-voice for Twitter/LinkedIn/IndieHackers; brand-voice for
 *     Reddit/ProductHunt
 *   - Behavioral support, not medical treatment. Never imply diagnosis,
 *     cure, or clinical outcomes
 *   - Reference the six families when relevant (Deserver, Monday
 *     Resetter, 9 PM Negotiator, etc.) — they're the meme atoms
 *   - End with a soft CTA, not a hard one. Audit > signup.
 *
 * EXCLUSIONS — applied to every template (the LLM is instructed to
 * REFUSE these unless the topic is explicitly approved):
 *   - r/stopdrinking, r/leaves, r/cripplingalcoholism (addiction-coded
 *     communities — see strategist mandate)
 *   - Any post that promises weight loss outcomes
 *   - Any post that compares COYL to therapy
 *   - First-person stories with fabricated specifics ("I lost 30 lbs")
 *   - Posts that use "destructive" — replaced by "recurring loops"
 */

export type MarketingPlatform =
  | 'reddit'
  | 'twitter-thread'
  | 'twitter-single'
  | 'threads'
  | 'linkedin'
  | 'indiehackers'
  | 'producthunt'
  | 'hackernews'
  | 'newsletter'

export type MarketingArchetype =
  | 'the-9pm-negotiator'
  | 'the-monday-resetter'
  | 'the-deserver'
  | 'the-one-more-tabber'
  | 'the-spiral-extender'
  | 'the-capitulator'
  | 'category-launch'
  | 'why-now'
  | 'product-update'

export type PostRecipe = {
  platform: MarketingPlatform
  /** Headline shown in the admin UI. */
  label: string
  /** When the founder picks this recipe, what does it produce? */
  intent: string
  /** Target length in words or tokens. LLM is asked to honor this. */
  lengthHint: string
  /** Platform-specific voice + format guidance the LLM must respect. */
  platformGuide: string
  /** The actual prompt scaffolding. {{ARCHETYPE}}, {{TOPIC}} get filled. */
  prompt: string
  /** Suggested communities or hashtags. NEVER includes the exclusion list. */
  channels: string[]
}

/* ───────────────────────────────────────────────────────────────────
 * BLESSED CHANNELS — communities we WILL post in.
 * Strategist's mandate: avoid r/stopdrinking + addiction-coded subs.
 * ─────────────────────────────────────────────────────────────────── */

const REDDIT_BLESSED = [
  'r/loseit',
  'r/glp1',
  'r/ozempic',
  'r/decidingtobebetter',
  'r/getdisciplined',
  'r/productivity',
  'r/getmotivated',
  'r/Habits',
  'r/selfimprovement',
] as const

/* ───────────────────────────────────────────────────────────────────
 * RECIPES — 9 platform × purpose combinations
 * ─────────────────────────────────────────────────────────────────── */

const VOICE_PREAMBLE = `
You are writing a marketing post for COYL — an AI app that
interrupts autopilot behavior in the 3-second window before
action. COYL is positioned as "the missing behavioral interface
between AI and real life." Not a habit tracker, not a chatbot,
not a wellness app.

VOICE: Short sentences. Periods. Name specific moments
(the 9 PM kitchen, the tab switch, the "I already messed up"
sentence). No marketing fluff. No hedge words ("perhaps",
"maybe"). No corporate "we believe…" sentences. The founder is
Iman Schrock; brand is COYL.

THE SIX FAMILIES (the meme atoms):
- The 9 PM Negotiator ("One time won't matter.")
- The Monday Resetter ("I'll start tomorrow.")
- The Deserver ("I deserve this.")
- The One-More-Tabber ("Just one more thing.")
- The Spiral Extender ("I already messed up anyway.")
- The Capitulator ("I couldn't say no.")

HARD RULES — REFUSE if the topic violates:
- No clinical claims (treatment, cure, diagnosis, weight-loss outcomes)
- No comparison to therapy or addiction treatment
- Never use the word "destructive" — use "recurring loops"
- Never imply specific weight loss or productivity gains
- Behavioral support, not medical treatment. State this when relevant.
- Never post in r/stopdrinking, r/leaves, r/cripplingalcoholism, or
  similar addiction-coded subs. If asked, refuse and suggest a
  blessed lane instead.

SOFT CTA: prefer linking to /audit ("60-second autopilot audit, no
signup") or /manifesto over /sign-up. Audit is the viral entry.
`.trim()

export const RECIPES: PostRecipe[] = [
  {
    platform: 'reddit',
    label: 'Reddit · Pattern story (1st-person founder)',
    intent: 'Founder-voice anecdote naming one specific moment and how COYL would catch it. Ends with audit link.',
    lengthHint: '180–280 words',
    platformGuide: `
Reddit rewards specifics and earned tone. Avoid links until the last
line. Use plain text — no bold, no emoji, no all-caps. Format as 2–3
short paragraphs with one paragraph break between them. Title is the
hook — under 80 chars, no question mark unless it's a real question.
Sign off as "— Iman, building COYL" only on r/decidingtobebetter or
r/getdisciplined; on /r/loseit and /r/glp1 use brand voice (no
sign-off).
`.trim(),
    prompt: `
Topic: {{TOPIC}}
Optional archetype focus: {{ARCHETYPE}}

Write a Reddit post:
1. Title (≤80 chars, no clickbait, no question marks unless real).
2. 180–280 word body — name ONE specific moment, describe what
   happens in autopilot, describe what COYL would do, link to
   coyl.ai/audit on the last line as a single soft mention.
3. Do not include the word "Edit:" or any meta-commentary.
4. Do not include hashtags.
`.trim(),
    channels: [...REDDIT_BLESSED],
  },
  {
    platform: 'twitter-thread',
    label: 'Twitter · "Which autopilot are you?" thread',
    intent: 'Multi-tweet thread walking through the six families. Designed to be quote-tweeted with "I\'m a [family name]."',
    lengthHint: '6–8 tweets, ≤280 chars each',
    platformGuide: `
First tweet is the hook — must work standalone. Each subsequent tweet
names ONE family with its signature script in quotes. Final tweet has
the audit link. Use line breaks generously within each tweet; one
short sentence per line beats long blocks. No hashtags except at the
end of the final tweet, max 2. Emoji-light — at most one per tweet.
`.trim(),
    prompt: `
Topic (optional): {{TOPIC}}

Write a Twitter thread (6–8 tweets). Numbered 1/6, 2/6, etc.

Tweet 1: A hook that makes the reader stop scrolling. Something like
"Almost every person you know belongs to one of six autopilot
families." or a more specific moment-anchored hook.

Tweets 2–7: One tweet per family. Format:
"[family name] — '[signature script]'
[1-2 sentence essence]"

Final tweet: Audit link with one-line CTA. "Which one are you? Three
questions, no signup → coyl.ai/audit"

Return raw thread text — one tweet per paragraph, separated by blank
lines. Do not add commentary.
`.trim(),
    channels: ['@coyl', 'Hashtags only at thread end: #AI #behavior (max 2)'],
  },
  {
    platform: 'twitter-single',
    label: 'Twitter · Single tweet (archetype card)',
    intent: 'One-tweet teaser anchored on a specific family or moment. Drives audit clicks.',
    lengthHint: '180–260 chars',
    platformGuide: `
One sentence + one line break + one link. The line break creates
visual rhythm. No hashtags. The link is the entire CTA.
`.trim(),
    prompt: `
Topic / archetype: {{TOPIC}} {{ARCHETYPE}}

Write a SINGLE tweet (≤260 chars) anchored on the topic/archetype.
Format:
[Specific moment line, present-tense, vivid]

[The COYL response — one sentence]

coyl.ai/audit
`.trim(),
    channels: ['@coyl'],
  },
  {
    platform: 'threads',
    label: 'Threads · Same as Twitter single (cross-post)',
    intent: 'Threads cross-post of the single-tweet format.',
    lengthHint: '180–500 chars',
    platformGuide: `
Threads allows more breathing room than Twitter. Add one more
sentence of texture between the moment line and the COYL response.
Still one paragraph, still ends with the audit link.
`.trim(),
    prompt: `
Topic / archetype: {{TOPIC}} {{ARCHETYPE}}

Write a Threads post (180–500 chars):
[Specific moment, present-tense, vivid]
[One more sentence naming the pattern or the family.]
[The COYL response — one sentence.]
coyl.ai/audit
`.trim(),
    channels: ['@coyl on threads.net'],
  },
  {
    platform: 'linkedin',
    label: 'LinkedIn · Founder note',
    intent: 'Iman in first-person, naming a specific behavior-AI insight. Builds founder credibility + category authority.',
    lengthHint: '300–500 words',
    platformGuide: `
LinkedIn rewards story + insight. Open with a specific moment or
observation (NOT a generic "I've been thinking about…"). Two short
paragraphs of texture, then the category insight, then the audit
link as a "if you want to try the audit we built" footer.
Sign-off: "— Iman | building COYL". No hashtags except #behavioralAI
and #AI (max 2, end of post).
`.trim(),
    prompt: `
Topic: {{TOPIC}}

Write a LinkedIn post as Iman, founder of COYL.
- Open with a specific moment or observation, NOT a generic preamble.
- 3–4 short paragraphs, each 1–3 sentences.
- One paragraph must name the category claim: "COYL is the missing
  behavioral interface between AI and real life" — paraphrase if it
  fits the flow better.
- Close with a soft audit CTA + "— Iman | building COYL"
- Add 2 hashtags at end: #behavioralAI #AI
`.trim(),
    channels: ['Iman personal LinkedIn'],
  },
  {
    platform: 'indiehackers',
    label: 'IndieHackers · Build-in-public update',
    intent: 'Show a specific COYL ship (audit families, manifesto, archetype share cards) + invite feedback.',
    lengthHint: '250–400 words',
    platformGuide: `
IH rewards concrete, technical specificity. Open with WHAT shipped
in one line. Two short paragraphs about WHY + the resulting numbers
(audit-takers / share-clicks / signups — honest, even if small).
End with a question for the community.
`.trim(),
    prompt: `
Recent ship: {{TOPIC}}

Write an IndieHackers build-in-public post:
1. Open with one line stating WHAT shipped this week.
2. WHY — the strategic reason in 2-3 sentences.
3. EARLY NUMBERS — honest metrics. If we don't have them, say "too
   early to tell, but…" and explain what we're measuring.
4. Ask the community one specific question (e.g., "what's the COYL
   audit / archetype reveal hitting differently for you?").
5. Sign off "— Iman, COYL"
`.trim(),
    channels: ['indiehackers.com — milestones + #ai'],
  },
  {
    platform: 'producthunt',
    label: 'ProductHunt · Launch / update',
    intent: 'High-energy ship announcement. Used for major launches (audit, manifesto, family share cards).',
    lengthHint: '120–200 words',
    platformGuide: `
PH copy is short, punchy, with two emoji max. Open with the category
claim. One paragraph of what's new. One bullet list of 3–5 features
with the most compelling first. End with the audit link.
`.trim(),
    prompt: `
Launch / update: {{TOPIC}}

Write a ProductHunt post:
1. Tagline (≤60 chars): "COYL — the [something] for [moment]"
2. Body (120–200 words):
   - Open with category claim ("first AI built for the moment before
     behavior happens")
   - One paragraph naming what's new
   - 3–5 bullet features
   - One line CTA: "Take the audit → coyl.ai/audit"
3. Max two emojis. Lean text.
`.trim(),
    channels: ['producthunt.com — launch pages'],
  },
  {
    platform: 'hackernews',
    label: 'HackerNews · Show HN / Tell HN',
    intent: 'Technical/category framing for HN. Skews developer + builder audience. Lead with what is novel.',
    lengthHint: '200–350 words',
    platformGuide: `
HN reads "Show HN: I built [X]". Title is ≤80 chars. Body is plain
text — no formatting. Lead with what is genuinely novel about the
build (the 3-second window, the family resolver, the share-URL slug
encoding, the JITAI timing). Disclose: yes, I'm the founder.
Anticipate skepticism — address one common objection in the post.
`.trim(),
    prompt: `
Show HN topic: {{TOPIC}}

Write a Show HN post:
1. Title (≤80 chars): "Show HN: [thing], the [novel framing]"
2. Body (200–350 words, plain text):
   - One paragraph: what I built + why
   - One paragraph: the technical/strategic novelty (3-second window,
     stateless share URLs, the six-family resolver, etc.)
   - One paragraph: addressing the obvious skeptic ("isn't this just
     a habit app?" "doesn't AI need to be smarter for this?" etc.)
   - Final line: "Audit takes 60 seconds, no signup: coyl.ai/audit.
     Feedback welcome."
`.trim(),
    channels: ['news.ycombinator.com'],
  },
  {
    platform: 'newsletter',
    label: 'Newsletter · Weekly playbook email',
    intent: 'Weekly email to the footer-signup list. One pattern, one COYL response, one short founder note.',
    lengthHint: '350–550 words',
    platformGuide: `
The newsletter footer copy promises: "One email a week. The pattern
playbook — late-night eating, doom-scroll loops, the post-GLP-1 regain
trap." So every email names ONE pattern (rotate weekly). Subject line
is the pattern name. Body has three sections: THE MOMENT, THE SCRIPT,
THE INTERRUPT. Signed by Iman.
`.trim(),
    prompt: `
Pattern of the week: {{TOPIC}}

Write a weekly newsletter email:
Subject: [Pattern name] — the moment + the interrupt
Body sections:
  THE MOMENT — 2 paragraphs describing one specific instance of the
    pattern (time, place, sentence in head). Present tense, vivid.
  THE SCRIPT — 1 paragraph naming what's running. Reference the
    family if one fits.
  THE INTERRUPT — 1 paragraph describing what COYL would do in that
    exact 3-second window. Concrete; what gets said, what gets done.
  PS — 1 line linking to /audit for new readers.
Sign off "— Iman, COYL"
`.trim(),
    channels: ['hello@coyl.ai (Resend audience)'],
  },
]

/* ───────────────────────────────────────────────────────────────────
 * Helpers
 * ─────────────────────────────────────────────────────────────────── */

export function getRecipe(platform: MarketingPlatform): PostRecipe | undefined {
  return RECIPES.find((r) => r.platform === platform)
}

export function listPlatforms(): MarketingPlatform[] {
  return RECIPES.map((r) => r.platform)
}

export function getVoicePreamble(): string {
  return VOICE_PREAMBLE
}

/**
 * Compose the full prompt sent to the LLM. The voice preamble is
 * ALWAYS prefixed so every generation is anchored.
 */
export function composePrompt(
  recipe: PostRecipe,
  vars: { topic: string; archetype?: MarketingArchetype | string },
): string {
  const filled = recipe.prompt
    .replaceAll('{{TOPIC}}', vars.topic)
    .replaceAll('{{ARCHETYPE}}', vars.archetype ?? '(no specific archetype)')

  return [
    VOICE_PREAMBLE,
    '',
    '--- PLATFORM GUIDE ---',
    recipe.platformGuide,
    '',
    `Length target: ${recipe.lengthHint}`,
    '',
    '--- TASK ---',
    filled,
  ].join('\n')
}
