/**
 * LUXURY EDITORIAL OVERHAUL — May 2026
 * Refero references applied:
 *   - 28523918-c7ef-481b-b818-d69b6151b768 (Letter): refined editorial H1 with
 *     italic accent on "the loop you keep running."
 *   - 4784cf2e-58ed-4b0c-8e6d-8758f595d997 (Medium): the hook library and
 *     channel sections are rendered as gallery columns / hairline dispatches.
 *   - 50c47480-9451-420b-a372-eb42eda75e56 (Sequel): channel-card per-platform
 *     blocks set as editorial dispatches on top borders.
 *   - f293bacf-990b-4270-900d-90f3a565ca27 (Christopher Ireland): gallery-mast
 *     openers; CopyBlock kept as a code surface (operational tool).
 */

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Writing — behavior, AI, and habit — COYL',
  description:
    'Long-form on the behavioral interface between AI and real life. The pattern interrupt thesis, the autopilot loop, the moments behind every habit. Plus ready-to-post hooks and scripts in the COYL voice.',
}

/**
 * Content playbook — the operational counterpart to the Growth section.
 *
 * The GODMODE spec's §11 "First 1000 Users" section lists content hooks
 * and channels. This page operationalizes that: every channel gets
 * ready-to-post copy sized for its native format, plus posting
 * guidance and angle variants. Creators and the founder can copy/paste
 * directly from here.
 *
 * Intentionally public (not auth-gated) so it's shareable with contractors,
 * creator partners, and distributed teams. Linked from the wedges nav.
 */

type Variant = {
  label: string
  text: string
}

type Channel = {
  id: string
  platform: string
  tagline: string
  format: string
  length: string
  cadence: string
  scripts: Array<{
    hook: string
    body: string
    cta: string
  }>
  captions: Variant[]
  angles: string[]
}

const HOOKS = [
  // Universal — first entry is the LOCKED signature line.
  'It’s not the mistake. It’s what you do after.',
  'You don’t need more motivation. You need something that catches you.',
  // Weight-loss wedge
  "You’re not hungry. You’re running a script.",
  'Most diets die at 9 PM.',
  'One bad meal doesn’t kill your progress. The spiral does.',
  'You don’t fail at lunch. You fail at 9 PM.',
  // Work wedge (GODFILE §12)
  'You don’t fail at work. You fail when you don’t follow up.',
  '"I’ll follow up" is the most expensive sentence in sales.',
  'Waiting is not action.',
  // Craving / addiction wedge
  "You already know what you’re going to do tonight.",
  '"I’ll start tomorrow" is a sentence you’ve said for 4 years.',
]

const CHANNELS: Channel[] = [
  {
    id: 'tiktok',
    platform: 'TikTok',
    tagline: 'Short vertical. Hook in 0.8s. Pattern recognition + reveal.',
    format: 'Talking head → text overlay → product reveal',
    length: '15–30s',
    cadence: '4–5/week',
    scripts: [
      {
        hook: '"You’re not hungry. You’re running a script."',
        body:
          '*(Cut to kitchen at 9:47 PM, fridge open)*\nYou have this moment every night. Same time. Same sentence in your head — "I deserve this." *(Cut back)* That’s not hunger. That’s autopilot. *(Show phone with COYL notification: "This is the moment.")*',
        cta: 'Comment "script" and I’ll show you the app that catches it.',
      },
      {
        hook: '"Most diets die at 9 PM."',
        body:
          'Not at lunch. Not on the scale. *(Beat)* In the kitchen, after dinner, when your rational brain is off-shift. *(Show fridge scene)* I built an AI that fires at 9:47 because that’s when the script runs.',
        cta: 'Link in bio if you’ve had this exact night more than once.',
      },
      {
        hook: '"I’ll start Monday" — you’ve said that 47 times this year.',
        body:
          'I have an app that literally counts how many times you’ve used each excuse. *(Screen record: the pattern insight card showing "That’s your \'tomorrow\' excuse again — 7× this week.")* It’s uncomfortable. That’s the point.',
        cta: 'coyl.ai',
      },
    ],
    captions: [
      { label: 'Direct', text: 'Most diets die at 9 PM. I built the thing that catches it. 👇 coyl.ai' },
      { label: 'Question', text: 'What’s the sentence you say when you’re about to slip? Comment it below.' },
      { label: 'Reveal', text: 'The app that just read me: coyl.ai. I’m uncomfortable. That’s progress.' },
    ],
    angles: [
      'Duet the "healthy morning routine" trend — "now show us your 9 PM."',
      'Green-screen over a diet-culture ad — explain why it won’t work at night.',
      'Reaction to a TikTok someone posted about their night binge — "this is your script."',
      'Day-in-the-life of a COYL notification firing.',
    ],
  },
  {
    id: 'reels',
    platform: 'Instagram Reels',
    tagline: 'Slower pace than TikTok. More aesthetic. Longer retention.',
    format: 'Cinematic + caption-heavy',
    length: '20–45s',
    cadence: '3–4/week',
    scripts: [
      {
        hook: '"One bad meal doesn’t kill your progress. The spiral does."',
        body:
          '*(Slow motion fridge opening)* The slip isn’t the problem. The sentence after it is: "I already blew it." *(Cut to alarm clock 9:47 PM)* That’s the loop. *(Cut to COYL screen: "You slipped. Good — now we stop the damage.")* Recovery in the same night. Not Monday.',
        cta: 'See how → coyl.ai',
      },
      {
        hook: '"What if your phone knew your patterns?"',
        body:
          '*(Screen record: danger window notification firing at 9:47)* This isn’t a reminder. It’s an interrupt. The difference is that a reminder asks you to remember. This catches you when your autopilot forgot.',
        cta: 'coyl.ai',
      },
    ],
    captions: [
      {
        label: 'Hook-first',
        text: "You don't fail at lunch. You fail at 9 PM. COYL catches the moment before it becomes a spiral. — link in bio",
      },
      {
        label: 'Quote',
        text: '"I’ll start tomorrow" is the most expensive sentence in your life.',
      },
    ],
    angles: [
      'Before/after week with COYL notifications logged.',
      'Carousel: screenshots of real callouts the app generates (use the shareable OG images).',
      'Behind-the-scenes: "why I built this" founder post.',
    ],
  },
  {
    id: 'reddit',
    platform: 'Reddit',
    tagline: 'Long-form. Vulnerable. Subreddits: r/loseit, r/GetDisciplined, r/nosurf, r/decidingtobebetter.',
    format: 'Story or review post. No hard sell.',
    length: '300–600 words',
    cadence: '2–3/week across subs',
    scripts: [
      {
        hook: 'I built an app that tells me "that’s your \'tomorrow\' excuse again."',
        body:
          "I’ve used the sentence \"I’ll start Monday\" something like 200 times. I counted this year. I’m not exaggerating.\n\nSo I built a thing. It classifies every message I type at it. It stores each excuse by category. After 3 weeks it said: \"You’ve used the ‘deserving’ excuse 18× this month. It fires between 8:45 and 10:15 PM. Here’s what’s coming Friday.\"\n\nIt was correct on Friday. And the Friday after. I don’t know if that’s AI or pattern matching. It’s probably both. What I do know is that reading my own excuse back to me, quoted, with a count — does something dieting never did.\n\nIt’s called COYL. Not selling it. Posting here because most of what I see in this sub is willpower-pilled or macro-pilled and the thing that actually moved the needle for me was being held accountable to my own patterns in real time.",
        cta: '(Drop link in a comment if allowed by sub.)',
      },
      {
        hook: 'The night I realized my diet app was asking the wrong question.',
        body:
          "Every nutrition app asks what I ate. None ever asked why I was in the kitchen at 9:47 PM when I wasn’t hungry.\n\nI’m not going to claim I’ve solved this. What I’ve learned is that the *question* is everything. \"What did you eat\" is a post-mortem. \"What’s happening right now in your kitchen, and what’s the story you’re about to tell yourself?\" is an interruption.\n\nI’ve been using a tool called COYL that’s built around that second question. It fires unprompted at my known fail windows. It asks the uncomfortable version. It tells me — out loud — which of my 8 excuse patterns is loading in my head.\n\nThree weeks in. Still sceptical. But I’ve caught myself 11 times and not once yet at 9:47.",
        cta: 'Happy to answer questions in comments.',
      },
    ],
    captions: [
      { label: 'Title A', text: 'I built an app that reads my excuses back to me. It works.' },
      { label: 'Title B', text: 'Three weeks with COYL — my night pattern is gone.' },
      { label: 'Title C', text: 'Stop trying to be more disciplined. Try interrupting the autopilot.' },
    ],
    angles: [
      'r/loseit — frame as "the thing that finally broke my night pattern."',
      'r/GetDisciplined — frame as "willpower is a finite resource; this accounts for that."',
      'r/nosurf — frame as "an interrupt that catches me mid-scroll."',
      'r/decidingtobebetter — frame as "the follow-through tool I wish I\'d had a year ago."',
    ],
  },
  {
    id: 'x',
    platform: 'X / Twitter',
    tagline: 'Short punchy threads + one-liners. Builder-in-public angle.',
    format: 'Thread or single post',
    length: '280 chars or 4–7-tweet thread',
    cadence: '2–3/day',
    scripts: [
      {
        hook: 'Most people don’t fail because they don’t know what to do.',
        body:
          'They fail at the same time every week, running the same script, saying the same sentence in their head ("I deserve this" / "I’ll start tomorrow" / "I already blew it").\n\nCOYL is an AI that catches that specific moment. Not a coach. Not a chatbot. An interrupt.',
        cta: 'coyl.ai',
      },
      {
        hook: 'Unpopular opinion: your willpower is fine. Your *system* is broken.',
        body:
          'Willpower is finite. It runs out at 9 PM. Every nutrition study tells you this. Then they sell you another macro tracker.\n\nI built the opposite: an AI that fires at 9 PM, names your excuse, and gives you the next 10 minutes.',
        cta: 'coyl.ai',
      },
    ],
    captions: [
      { label: 'One-liner A', text: 'You don’t fail at lunch. You fail at 9 PM. coyl.ai' },
      { label: 'One-liner B', text: '"I’ll start Monday" is a 4-year-old sentence. coyl.ai' },
      { label: 'One-liner C', text: 'Most diets die at 9 PM. I built the thing that catches it.' },
    ],
    angles: [
      'Build-in-public: weekly metric threads (D7 retention, rescue rate).',
      'Quote-tweet fitness influencers with "what about 9 PM?"',
      'Reply-guy on diet tweets with "the moment you’re describing isn’t lunch."',
    ],
  },
  {
    id: 'linkedin',
    platform: 'LinkedIn',
    tagline: 'Work wedge. Sales, founders, ops folks. Follow-through framing over productivity-framing.',
    format: 'Short post or mini-thread',
    length: '100–250 words',
    cadence: '3–4/week',
    scripts: [
      {
        hook: 'You don’t fail at work. You fail when you don’t follow up.',
        body:
          "I counted the emails I said I’d send last month and didn’t. 27. Some of those were deals. One was a referral I’ve been meaning to send a friend for almost a year.\n\nWe love to say we’re \"too busy.\" It’s not the real reason. The real reason is the moment right after the meeting where I tell myself \"I’ll follow up Tuesday\" — and then Tuesday is the same week as five other \"I’ll follow up Tuesdays\" and none of them happen.\n\nThat’s a commitment problem, not a productivity problem.\n\nI’ve been using COYL — it catches that exact moment. \"You said you’d follow up on X. Did you?\" I hate it and I love it.",
        cta: 'Link in comments if you’re the kind of person who reads this and thinks: yeah, that’s me.',
      },
      {
        hook: 'The four sentences that kill deals (and careers):',
        body:
          '1. "I’ll follow up."\n2. "I’ll respond tomorrow."\n3. "No reply means stop."\n4. "I’ll get to it after lunch."\n\nEach one sounds reasonable. Each one has cost me a deal. The pattern is the same: a commitment, then a drift, then an excuse, then the thing never happens.\n\nCOYL catches that sequence the moment it starts. Not as a reminder app — as a commitment engine. The email either went out or it didn’t. Waiting is not action.',
        cta: 'coyl.ai/work',
      },
    ],
    captions: [
      { label: 'Short-form A', text: '"I’ll follow up" is the most expensive sentence in sales.' },
      { label: 'Short-form B', text: 'Your work doesn’t fail because you’re lazy. It fails because you let things slip.' },
      { label: 'Short-form C', text: 'Waiting is not action. Send the email.' },
    ],
    angles: [
      'Reply to founder threads about "productivity" with "it’s not productivity; it’s follow-through."',
      'Post a screenshot of the COYL work prompt calling you out. Self-deprecating + vulnerable.',
      'Weekly "kept vs broken" commitment audit as a series.',
      'Pitch to sales leaders: "your reps aren’t undertrained, they’re undisciplined at follow-up."',
    ],
  },
]

function CopyBlock({ children }: { children: string }) {
  return (
    <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 p-3 font-mono text-[13px] leading-relaxed text-gray-800">
      {children}
    </pre>
  )
}

export default function ContentPlaybookPage() {
  return (
    <div className="space-y-24 pb-12">
      <header className="space-y-10">
        <div className="flex items-center gap-3">
          <span className="h-px w-12 bg-orange-500" />
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            Writing
          </span>
        </div>
        <h1 className="font-serif text-6xl font-normal leading-[0.95] tracking-[-0.03em] text-gray-900 md:text-[6.5rem]">
          On behavior, AI,<br />
          <span className="italic text-orange-600">and the loop you keep running.</span>
        </h1>
        <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
          Long-form notes on the behavioral interface between AI and real life. Below:
          the hook library and channel-sized scripts that name the pattern before the
          click. Copy and ship.
        </p>
      </header>

      {/* Hooks library */}
      <section className="space-y-10 border-t border-gray-200 pt-16">
        <div className="flex items-center gap-3">
          <span className="h-px w-10 bg-orange-500" />
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            Hook library
          </span>
        </div>
        <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
          Recognition first. <span className="italic text-orange-600">Everything else after.</span>
        </h2>
        <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
          Universal hooks that work on every platform. Open every video or post with one.
        </p>
        <ul className="space-y-6 pt-4">
          {HOOKS.map((h) => (
            <li
              key={h}
              className="border-t border-gray-200 pt-5 font-serif text-2xl font-normal italic leading-[1.2] text-gray-900"
            >
              {h}
            </li>
          ))}
        </ul>
      </section>

      {/* Channel-specific plays */}
      {CHANNELS.map((c) => (
        <section
          key={c.id}
          id={c.id}
          className="space-y-10 border-t border-gray-200 pt-16"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <span className="h-px w-10 bg-orange-500" />
                <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                  Channel
                </span>
              </div>
              <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
                {c.platform}
              </h2>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-[10px] uppercase tracking-[0.25em] text-gray-600">
              <span>{c.format}</span>
              <span>{c.length}</span>
              <span>{c.cadence}</span>
            </div>
          </div>
          <p className="max-w-2xl text-base leading-[1.7] text-gray-700">{c.tagline}</p>

          <div className="pt-2">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              Scripts
            </p>
            <div className="mt-6 space-y-10">
              {c.scripts.map((s, i) => (
                <div key={i} className="border-t border-orange-500 pt-6">
                  <p className="font-serif text-xl font-normal italic leading-[1.25] text-gray-900">
                    {s.hook}
                  </p>
                  <CopyBlock>{s.body}</CopyBlock>
                  <p className="mt-4 font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                    CTA <span className="font-sans text-sm normal-case tracking-normal text-gray-700">— {s.cta}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              Captions
            </p>
            <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2">
              {c.captions.map((v, i) => (
                <div key={i} className="border-t border-gray-200 pt-5">
                  <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-gray-500">
                    {v.label}
                  </p>
                  <p className="mt-3 text-base leading-[1.55] text-gray-900">{v.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              Angles
            </p>
            <ul className="mt-6 space-y-3">
              {c.angles.map((a, i) => (
                <li key={i} className="flex gap-3 text-base leading-[1.65] text-gray-700">
                  <span className="text-orange-600">&bull;</span>
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ))}

      {/* Funnel + attribution footer */}
      <section className="space-y-8 border-t border-orange-500 pt-16">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
          The funnel
        </p>
        <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
          Hook. Landing. Onboarding. First rescue. <span className="italic text-orange-600">Hook again.</span>
        </h2>
        <ol className="space-y-4 pt-2 text-base leading-[1.7] text-gray-700">
          <li>
            <strong className="font-serif font-normal italic text-gray-900">1. Hook</strong> &mdash;
            one-line recognition from the library above.
          </li>
          <li>
            <strong className="font-serif font-normal italic text-gray-900">2. Landing</strong> &mdash;
            coyl.ai/?v=a|b|c for A/B hero variant.
          </li>
          <li>
            <strong className="font-serif font-normal italic text-gray-900">3. Onboarding</strong> &mdash;
            opens with COYL&rsquo;s guess &mdash; &ldquo;let me guess &mdash; you fail at night?&rdquo;
            &mdash; holy-shit moment lands in 10s.
          </li>
          <li>
            <strong className="font-serif font-normal italic text-gray-900">4. First rescue</strong> &mdash;
            user hits a real interrupt within first week. Triggers callout + share moment.
          </li>
          <li>
            <strong className="font-serif font-normal italic text-gray-900">5. Share</strong> &mdash;
            &ldquo;COYL just read me&rdquo; OG image lands on someone&rsquo;s feed. Loop closes.
          </li>
        </ol>
      </section>

      <section className="border-t border-gray-200 pt-16">
        <div className="flex gap-3">
          <Link
            href="/"
            className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
          >
            See the product
          </Link>
          <Link
            href="/how-it-works"
            className="rounded-full border border-gray-200 px-6 py-3 text-sm font-medium text-gray-900 transition-all hover:border-gray-900"
          >
            How it works
          </Link>
        </div>
      </section>
    </div>
  )
}
