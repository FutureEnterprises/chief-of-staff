import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Content playbook — COYL',
  description:
    'Ready-to-post content hooks, scripts, and angles for TikTok, Reels, Reddit, and X. Built from the COYL voice.',
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
  "You\u2019re not hungry. You\u2019re running a script.",
  'Most diets die at 9 PM.',
  'One bad meal doesn\u2019t kill your progress. The spiral does.',
  'You don\u2019t fail at lunch. You fail at 9 PM.',
  'Your willpower isn\u2019t broken. Your system is.',
  'You already know what you\u2019re going to do tonight.',
  'Stop trying to be disciplined. Interrupt the autopilot.',
  '"I\u2019ll start tomorrow" is a sentence you\u2019ve said for 4 years.',
]

const CHANNELS: Channel[] = [
  {
    id: 'tiktok',
    platform: 'TikTok',
    tagline: 'Short vertical. Hook in 0.8s. Pattern recognition + reveal.',
    format: 'Talking head \u2192 text overlay \u2192 product reveal',
    length: '15\u201330s',
    cadence: '4\u20135/week',
    scripts: [
      {
        hook: '"You\u2019re not hungry. You\u2019re running a script."',
        body:
          '*(Cut to kitchen at 9:47 PM, fridge open)*\nYou have this moment every night. Same time. Same sentence in your head \u2014 "I deserve this." *(Cut back)* That\u2019s not hunger. That\u2019s autopilot. *(Show phone with COYL notification: "This is the moment.")*',
        cta: 'Comment "script" and I\u2019ll show you the app that catches it.',
      },
      {
        hook: '"Most diets die at 9 PM."',
        body:
          'Not at lunch. Not on the scale. *(Beat)* In the kitchen, after dinner, when your rational brain is off-shift. *(Show fridge scene)* I built an AI that fires at 9:47 because that\u2019s when the script runs.',
        cta: 'Link in bio if you\u2019ve had this exact night more than once.',
      },
      {
        hook: '"I\u2019ll start Monday" \u2014 you\u2019ve said that 47 times this year.',
        body:
          'I have an app that literally counts how many times you\u2019ve used each excuse. *(Screen record: the pattern insight card showing "That\u2019s your \'tomorrow\' excuse again \u2014 7\u00d7 this week.")* It\u2019s uncomfortable. That\u2019s the point.',
        cta: 'coyl.ai',
      },
    ],
    captions: [
      { label: 'Direct', text: 'Most diets die at 9 PM. I built the thing that catches it. \ud83d\udc47 coyl.ai' },
      { label: 'Question', text: 'What\u2019s the sentence you say when you\u2019re about to slip? Comment it below.' },
      { label: 'Reveal', text: 'The app that just read me: coyl.ai. I\u2019m uncomfortable. That\u2019s progress.' },
    ],
    angles: [
      'Duet the "healthy morning routine" trend \u2014 "now show us your 9 PM."',
      'Green-screen over a diet-culture ad \u2014 explain why it won\u2019t work at night.',
      'Reaction to a TikTok someone posted about their night binge \u2014 "this is your script."',
      'Day-in-the-life of a COYL notification firing.',
    ],
  },
  {
    id: 'reels',
    platform: 'Instagram Reels',
    tagline: 'Slower pace than TikTok. More aesthetic. Longer retention.',
    format: 'Cinematic + caption-heavy',
    length: '20\u201345s',
    cadence: '3\u20134/week',
    scripts: [
      {
        hook: '"One bad meal doesn\u2019t kill your progress. The spiral does."',
        body:
          '*(Slow motion fridge opening)* The slip isn\u2019t the problem. The sentence after it is: "I already blew it." *(Cut to alarm clock 9:47 PM)* That\u2019s the loop. *(Cut to COYL screen: "You slipped. Good \u2014 now we stop the damage.")* Recovery in the same night. Not Monday.',
        cta: 'See how \u2192 coyl.ai',
      },
      {
        hook: '"What if your phone knew your patterns?"',
        body:
          '*(Screen record: danger window notification firing at 9:47)* This isn\u2019t a reminder. It\u2019s an interrupt. The difference is that a reminder asks you to remember. This catches you when your autopilot forgot.',
        cta: 'coyl.ai',
      },
    ],
    captions: [
      {
        label: 'Hook-first',
        text: "You don't fail at lunch. You fail at 9 PM. COYL catches the moment before it becomes a spiral. \u2014 link in bio",
      },
      {
        label: 'Quote',
        text: '"I\u2019ll start tomorrow" is the most expensive sentence in your life.',
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
    tagline: 'Long-form. Vulnerable. Subreddits: r/loseit, r/GetDisciplined, r/stopdrinking, r/nosurf.',
    format: 'Story or review post. No hard sell.',
    length: '300\u2013600 words',
    cadence: '2\u20133/week across subs',
    scripts: [
      {
        hook: 'I built an app that tells me "that\u2019s your \'tomorrow\' excuse again."',
        body:
          "I\u2019ve used the sentence \"I\u2019ll start Monday\" something like 200 times. I counted this year. I\u2019m not exaggerating.\n\nSo I built a thing. It classifies every message I type at it. It stores each excuse by category. After 3 weeks it said: \"You\u2019ve used the \u2018deserving\u2019 excuse 18\u00d7 this month. It fires between 8:45 and 10:15 PM. Here\u2019s what\u2019s coming Friday.\"\n\nIt was correct on Friday. And the Friday after. I don\u2019t know if that\u2019s AI or pattern matching. It\u2019s probably both. What I do know is that reading my own excuse back to me, quoted, with a count \u2014 does something dieting never did.\n\nIt\u2019s called COYL. Not selling it. Posting here because most of what I see in this sub is willpower-pilled or macro-pilled and the thing that actually moved the needle for me was being held accountable to my own patterns in real time.",
        cta: '(Drop link in a comment if allowed by sub.)',
      },
      {
        hook: 'The night I realized my diet app was asking the wrong question.',
        body:
          "Every nutrition app asks what I ate. None ever asked why I was in the kitchen at 9:47 PM when I wasn\u2019t hungry.\n\nI\u2019m not going to claim I\u2019ve solved this. What I\u2019ve learned is that the *question* is everything. \"What did you eat\" is a post-mortem. \"What\u2019s happening right now in your kitchen, and what\u2019s the story you\u2019re about to tell yourself?\" is an interruption.\n\nI\u2019ve been using a tool called COYL that\u2019s built around that second question. It fires unprompted at my known fail windows. It asks the uncomfortable version. It tells me \u2014 out loud \u2014 which of my 8 excuse patterns is loading in my head.\n\nThree weeks in. Still sceptical. But I\u2019ve caught myself 11 times and not once yet at 9:47.",
        cta: 'Happy to answer questions in comments.',
      },
    ],
    captions: [
      { label: 'Title A', text: 'I built an app that reads my excuses back to me. It works.' },
      { label: 'Title B', text: 'Three weeks with COYL \u2014 my night pattern is gone.' },
      { label: 'Title C', text: 'Stop trying to be more disciplined. Try interrupting the autopilot.' },
    ],
    angles: [
      'r/loseit \u2014 frame as "the thing that finally broke my night pattern."',
      'r/GetDisciplined \u2014 frame as "willpower is a finite resource; this accounts for that."',
      'r/stopdrinking \u2014 frame as "urge-surfing assistant, not another tracker." (Use respectful voice; abstain from sales pitch, rely on community rules.)',
      'r/nosurf \u2014 frame as "an interrupt that catches me mid-scroll."',
    ],
  },
  {
    id: 'x',
    platform: 'X / Twitter',
    tagline: 'Short punchy threads + one-liners. Builder-in-public angle.',
    format: 'Thread or single post',
    length: '280 chars or 4\u20137-tweet thread',
    cadence: '2\u20133/day',
    scripts: [
      {
        hook: 'Most people don\u2019t fail because they don\u2019t know what to do.',
        body:
          'They fail at the same time every week, running the same script, saying the same sentence in their head ("I deserve this" / "I\u2019ll start tomorrow" / "I already blew it").\n\nCOYL is an AI that catches that specific moment. Not a coach. Not a chatbot. An interrupt.',
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
      { label: 'One-liner A', text: 'You don\u2019t fail at lunch. You fail at 9 PM. coyl.ai' },
      { label: 'One-liner B', text: '"I\u2019ll start Monday" is a 4-year-old sentence. coyl.ai' },
      { label: 'One-liner C', text: 'Most diets die at 9 PM. I built the thing that catches it.' },
    ],
    angles: [
      'Build-in-public: weekly metric threads (D7 retention, rescue rate).',
      'Quote-tweet fitness influencers with "what about 9 PM?"',
      'Reply-guy on diet tweets with "the moment you\u2019re describing isn\u2019t lunch."',
    ],
  },
]

function CopyBlock({ children }: { children: string }) {
  return (
    <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-lg border border-white/10 bg-black/40 p-3 text-[13px] leading-relaxed text-gray-200">
      {children}
    </pre>
  )
}

export default function ContentPlaybookPage() {
  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <span className="h-px w-8 bg-orange-500" />
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500">
          Content playbook
        </span>
      </div>
      <h1 className="mb-4 text-4xl font-black leading-[1.05] text-white md:text-5xl">
        The first 1000 users<br />don\u2019t come from ads.
      </h1>
      <p className="mb-12 max-w-2xl text-lg text-gray-400">
        They come from content that names the pattern before they click. Ready-to-post
        scripts, captions, and angles, sized per channel. Copy and ship.
      </p>

      {/* Hooks library \u2014 the recognition-first one-liners */}
      <section className="mb-16">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-orange-500">
          <span className="h-2 w-2 rounded-sm bg-orange-500" />
          Hook library
        </h2>
        <p className="mb-6 max-w-2xl text-sm text-gray-400">
          Universal hooks that work on every platform. Open every video or post with one.
          Recognition first. Everything else comes after.
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {HOOKS.map((h) => (
            <div
              key={h}
              className="rounded-xl border-l-[3px] border-orange-500/50 bg-gradient-to-r from-orange-500/5 to-transparent p-4"
            >
              <p className="text-sm font-semibold text-white">{h}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Channel-specific plays */}
      {CHANNELS.map((c) => (
        <section
          key={c.id}
          id={c.id}
          className="mb-16 rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent p-6 md:p-8"
        >
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-2xl font-bold text-white">{c.platform}</h2>
            <div className="flex flex-wrap gap-2 text-[11px] text-gray-500">
              <span className="rounded-full border border-white/10 px-2 py-0.5">{c.format}</span>
              <span className="rounded-full border border-white/10 px-2 py-0.5">{c.length}</span>
              <span className="rounded-full border border-white/10 px-2 py-0.5">{c.cadence}</span>
            </div>
          </div>
          <p className="mb-6 text-sm text-gray-400">{c.tagline}</p>

          <h3 className="mb-3 text-xs font-mono uppercase tracking-widest text-orange-500">Scripts</h3>
          <div className="mb-8 space-y-5">
            {c.scripts.map((s, i) => (
              <div key={i} className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
                <p className="text-base font-bold text-white">{s.hook}</p>
                <CopyBlock>{s.body}</CopyBlock>
                <p className="mt-3 text-xs uppercase tracking-widest text-orange-400">
                  CTA: <span className="normal-case text-gray-300">{s.cta}</span>
                </p>
              </div>
            ))}
          </div>

          <h3 className="mb-3 text-xs font-mono uppercase tracking-widest text-orange-500">Captions</h3>
          <div className="mb-8 grid grid-cols-1 gap-2 md:grid-cols-2">
            {c.captions.map((v, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500">{v.label}</p>
                <p className="mt-1 text-sm text-gray-200">{v.text}</p>
              </div>
            ))}
          </div>

          <h3 className="mb-3 text-xs font-mono uppercase tracking-widest text-orange-500">Angles</h3>
          <ul className="space-y-1.5">
            {c.angles.map((a, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-300">
                <span className="text-orange-500">\u2022</span>
                {a}
              </li>
            ))}
          </ul>
        </section>
      ))}

      {/* Funnel + attribution footer */}
      <section className="mb-12 rounded-3xl border border-orange-500/20 bg-orange-500/5 p-8">
        <h2 className="mb-3 text-xl font-bold text-white">The funnel</h2>
        <p className="mb-4 text-sm text-gray-300">Hook \u2192 Landing \u2192 Onboarding \u2192 First rescue \u2192 Hook (share)</p>
        <ol className="space-y-2 text-sm text-gray-400">
          <li>
            <span className="font-bold text-orange-400">1. Hook</span> \u2014 one-line recognition from the library above.
          </li>
          <li>
            <span className="font-bold text-orange-400">2. Landing</span> \u2014 coyl.ai/?v=a|b|c for A/B hero variant.
          </li>
          <li>
            <span className="font-bold text-orange-400">3. Onboarding</span> \u2014 opens with COYL\u2019s guess \u2014 "let me guess \u2014 you fail at night?" \u2014 holy-shit moment lands in 10s.
          </li>
          <li>
            <span className="font-bold text-orange-400">4. First rescue</span> \u2014 user hits a real interrupt within first week. Triggers callout + share moment.
          </li>
          <li>
            <span className="font-bold text-orange-400">5. Share</span> \u2014 "COYL just read me" OG image lands on someone\u2019s feed. Loop closes.
          </li>
        </ol>
      </section>

      <div className="flex gap-3">
        <Link
          href="/"
          className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white"
        >
          See the product
        </Link>
        <Link
          href="/how-it-works"
          className="rounded-full border border-white/10 px-6 py-3 text-sm text-gray-200"
        >
          How it works
        </Link>
      </div>
    </>
  )
}
