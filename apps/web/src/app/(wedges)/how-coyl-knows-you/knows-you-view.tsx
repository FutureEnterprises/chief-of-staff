'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import {
  Clock,
  Calendar,
  HeartPulse,
  Globe,
  AppWindow,
  MapPin,
  Brain,
  Quote,
  Flame,
  ListChecks,
  MessageSquareReply,
  Settings,
  ChevronRight,
} from 'lucide-react'

type SignalKind = 'passive' | 'active'

type Signal = {
  kind: SignalKind
  Icon: typeof Clock
  label: string
  detail: string
}

const SIGNALS: Signal[] = [
  // Passive — what we know without you telling us
  {
    kind: 'passive',
    Icon: Clock,
    label: 'Time of day',
    detail: 'Your local clock. Day, hour, minute. The cheapest signal we have — and it carries half the pattern.',
  },
  {
    kind: 'passive',
    Icon: Calendar,
    label: 'Day of week',
    detail: 'Monday-Resetters do not behave like 9PM-Negotiators. The week shape matters.',
  },
  {
    kind: 'passive',
    Icon: HeartPulse,
    label: 'HRV / stress proxies',
    detail: "If you connect Apple Health. We never write — we only read HRV, sleep, steps. Stress proxies, not biometrics.",
  },
  {
    kind: 'passive',
    Icon: Globe,
    label: 'Timezone',
    detail: 'Travel collapses windows. The 9 PM Negotiator pattern in NYC fires at 6 PM in LA. We adjust.',
  },
  {
    kind: 'passive',
    Icon: AppWindow,
    label: 'Browser tab opens',
    detail: 'Only if you install the extension. Counts opens per domain, never reads page content.',
  },
  {
    kind: 'passive',
    Icon: MapPin,
    label: 'Location (optional)',
    detail: "Kitchen vs office vs car. Permission-gated. You can run COYL forever without granting this.",
  },

  // Active — what we know because you told us
  {
    kind: 'active',
    Icon: Brain,
    label: 'Your archetype',
    detail: 'From the 60-second audit. The 6 families. Cold start: this is the only signal we have for the first week.',
  },
  {
    kind: 'active',
    Icon: Settings,
    label: 'Your danger windows',
    detail: 'After the audit we auto-create 2-3 inferred windows. You can edit, add, archive. We mark inferred vs user-set.',
  },
  {
    kind: 'active',
    Icon: ListChecks,
    label: 'Your commitments',
    detail: '"No food after 9 PM." "Three hours of deep work before noon." The rules you choose to live by.',
  },
  {
    kind: 'active',
    Icon: Flame,
    label: 'Your slips',
    detail: "You have to confess them. One-tap slip logging gets this down to a single button. We need the timestamp + context.",
  },
  {
    kind: 'active',
    Icon: Quote,
    label: 'Your excuses',
    detail: 'The story your psyche told you right before the slip. We classify into 8 categories. The taxonomy is the moat.',
  },
  {
    kind: 'active',
    Icon: MessageSquareReply,
    label: 'Interrupt feedback',
    detail: '"Caught me." "Wrong time." "Too soft." Two-tap rating after each interrupt. Trains the model on your real-time judgment.',
  },
]

type ArcStop = {
  label: string
  ratio: number // % active dependence
  body: string
  exemplar: string
}

const ARC: ArcStop[] = [
  {
    label: 'Week 1',
    ratio: 95,
    body: 'You teach us everything. The audit gives us your archetype. The first inferred windows are scaffolding, not predictions. The interrupt copy is family-level, not you-level.',
    exemplar: 'Tuesday 9:43 PM, kitchen. We fire because the 9PM-Negotiator window says we should. Not because we know YOU yet.',
  },
  {
    label: 'Month 1',
    ratio: 70,
    body: 'Your slip timestamps cluster. Your excuse categories repeat. The model notices your actual windows are 21:30-22:45, not the generic 21:00-23:00. The interrupt timing tightens.',
    exemplar: 'Tuesday 9:38 PM. We fire 5 minutes earlier than last month — your data said the gesture starts before the kitchen walk.',
  },
  {
    label: 'Month 3',
    ratio: 45,
    body: 'Passive signals are now feeding the model. HRV spike + 9 PM + location:kitchen + your specific excuse pattern = interrupt. You log slips less because the interrupts are landing. The model is sharper than your self-report.',
    exemplar: 'Tuesday 9:34 PM. HRV jumped at 9:31. Location entered kitchen at 9:33. We fired at 9:34:12 with copy that named your Monday excuse — without you logging anything today.',
  },
  {
    label: 'Year 1',
    ratio: 25,
    body: 'We know your pattern better than your conscious mind. The model predicts windows you have not noticed are windows. Your input shifts from "logging" to "confirming what we already saw." Your slip count is half what it was at month 1.',
    exemplar: '"COYL fired at 9:34 about Wednesday\'s presentation. I had not connected the dots. It was right."',
  },
  {
    label: 'Year 2+',
    ratio: 10,
    body: 'Pre-conscious prediction. The model sees the drift before you do. Interrupts fire ahead of the urge surfacing. The behavioral context object — exported to any LLM you use — makes Claude or GPT-4o psyche-aware on your behalf.',
    exemplar: 'Your Claude integration: "Why is the user about to delay this meeting?" Claude reads your context object. Answers in your voice. Routes around your actual blocker.',
  },
]

type Layer = {
  time: string
  signal: string
  kind: 'passive' | 'active' | 'derived'
}

const LAYERS_947: Layer[] = [
  { time: '9:31:04 PM', signal: 'HRV drops 18% — Apple Health webhook', kind: 'passive' },
  { time: '9:31:11 PM', signal: 'Location: enters kitchen (geofence)', kind: 'passive' },
  { time: '9:32:00 PM', signal: 'Active danger window: "Late-night kitchen" (Mon-Sun, 21-23)', kind: 'active' },
  { time: '9:32:00 PM', signal: 'Current archetype: 9PM Negotiator', kind: 'active' },
  { time: '9:32:18 PM', signal: 'Excuse model predicts: DESERVER ("I had a long day") at 71%', kind: 'derived' },
  { time: '9:32:18 PM', signal: 'Active commitment: "No food after 9 PM" (kept 14 of 18 days)', kind: 'active' },
  { time: '9:32:19 PM', signal: 'COYL fires: "9:32. You said no food after 9. The day was hard. That is the story. Drink water. Brush teeth. Decide at 9:47."', kind: 'derived' },
  { time: '9:47:00 PM', signal: 'Outcome window closes. You tag: "Caught me — I went to bed."', kind: 'active' },
  { time: '9:47:01 PM', signal: 'Behavioral model updates: this exact sequence now weights +2.3% as a high-leverage interrupt for your profile.', kind: 'derived' },
]

const RISKS = [
  {
    title: 'Onboarding drop-off',
    body: 'Users who quit before logging 3 slips never get the magic. Their interrupts stay family-level, not you-level. The dataset never starts.',
    shippingFix:
      "90-second onboarding (shipped). Auto-create initial danger windows + suggested commitments at audit completion (shipped). First-hour scheduled interrupt fires before the user has time to forget us (shipped).",
  },
  {
    title: 'Quiet users',
    body: 'Someone who uses COYL daily but never tags interrupt feedback never trains the model. They get worse-than-average interrupts forever — the model has no judgment signal from them.',
    shippingFix:
      "Two-tap interrupt feedback at the moment of the interrupt itself, not the next morning (shipping). Auto-tag fallback after 5 minutes of no response with a single follow-up (shipping).",
  },
  {
    title: 'The chicken and egg',
    body: 'Good interrupts need data. Data needs the user to trust us enough to log slips. New users have to take leap-of-faith logging before the interrupts get good. This is the hardest one.',
    shippingFix:
      "One-tap slip via /api/v1/slip/quick (shipping today). Browser extension auto-detects tab thrash (shipped v0.1). iOS live-activity-driven prompts skip the form entirely (next quarter).",
  },
]

export function KnowsYouView() {
  const [filter, setFilter] = useState<'all' | 'passive' | 'active'>('all')
  const [arcIndex, setArcIndex] = useState(0)
  const [layersRevealed, setLayersRevealed] = useState(1)
  const [openRisk, setOpenRisk] = useState<number | null>(null)

  const filtered = useMemo(() => {
    if (filter === 'all') return SIGNALS
    return SIGNALS.filter((s) => s.kind === filter)
  }, [filter])

  const passiveCount = SIGNALS.filter((s) => s.kind === 'passive').length
  const activeCount = SIGNALS.filter((s) => s.kind === 'active').length

  const arc = ARC[arcIndex]!
  const passiveRatio = 100 - arc.ratio

  return (
    <div className="space-y-24 pb-12">
      {/* HEADER */}
      <header className="space-y-10">
        <div className="flex items-center gap-3">
          <span className="h-px w-12 bg-orange-500" />
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            The honest answer
          </span>
        </div>
        <h1 className="font-serif text-5xl font-normal leading-[0.95] tracking-[-0.03em] text-gray-900 md:text-[5.5rem]">
          How COYL <span className="italic text-orange-600">knows you.</span>
        </h1>
        <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
          Today, about 80% of what COYL knows comes from what you tell us. The audit, the
          commitments, the slip logs, the interrupt feedback — all you. That is the cold
          start. Here is the arc that changes it, and why the input dependence is precisely
          the moat no LLM can synthesize.
        </p>
      </header>

      {/* SIGNAL FILTER */}
      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <span className="h-px w-10 bg-orange-500" />
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            What we know
          </span>
        </div>
        <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
          Two columns. <span className="italic text-orange-600">Wildly different sizes.</span>
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'passive', 'active'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              className={`rounded-full border px-4 py-2 font-mono text-[10px] font-medium uppercase tracking-[0.18em] transition-all ${
                filter === k
                  ? 'border-orange-500 bg-orange-500 text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
              aria-pressed={filter === k}
            >
              {k === 'all'
                ? `All · ${SIGNALS.length}`
                : k === 'passive'
                  ? `Passive · ${passiveCount}`
                  : `Active · ${activeCount}`}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((s) => (
              <motion.div
                key={s.label}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6"
              >
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      s.kind === 'passive' ? 'bg-orange-50 text-orange-600' : 'bg-gray-900 text-white'
                    }`}
                  >
                    <s.Icon className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <div className="flex-1">
                    <p className="font-mono text-[9px] font-medium uppercase tracking-[0.22em] text-gray-400">
                      {s.kind === 'passive' ? 'Passive · no input' : 'Active · you tell us'}
                    </p>
                    <p className="mt-1 font-serif text-xl font-normal leading-[1.15] text-gray-900">
                      {s.label}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-[1.6] text-gray-600">{s.detail}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-gray-500">
          The active column is longer on purpose. We are honest about it.
        </p>
      </section>

      {/* ARC */}
      <section className="space-y-10 border-t border-gray-200 pt-16">
        <div className="flex items-center gap-3">
          <span className="h-px w-10 bg-orange-500" />
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            The arc
          </span>
        </div>
        <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
          80% active today.<br />
          <span className="italic text-orange-600">10% active in year two.</span>
        </h2>

        {/* Scrubber */}
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            {ARC.map((a, i) => (
              <button
                key={a.label}
                type="button"
                onClick={() => setArcIndex(i)}
                className={`rounded-full border px-4 py-2 font-mono text-[10px] font-medium uppercase tracking-[0.18em] transition-all ${
                  arcIndex === i
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
                aria-pressed={arcIndex === i}
              >
                {a.label}
              </button>
            ))}
          </div>

          {/* Ratio bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-gray-500">
              <span>Active · you tell us</span>
              <span>Passive · we infer</span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <motion.div
                layout
                initial={false}
                animate={{ width: `${arc.ratio}%` }}
                transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
                className="absolute left-0 top-0 h-full bg-gray-900"
              />
              <motion.div
                layout
                initial={false}
                animate={{ width: `${passiveRatio}%`, left: `${arc.ratio}%` }}
                transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
                className="absolute top-0 h-full bg-orange-500"
              />
            </div>
            <div className="flex items-center justify-between font-mono text-[11px] font-medium uppercase tracking-[0.22em]">
              <span className="text-gray-900">{arc.ratio}%</span>
              <span className="text-orange-600">{passiveRatio}%</span>
            </div>
          </div>

          {/* Stop detail */}
          <AnimatePresence mode="wait">
            <motion.div
              key={arc.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 gap-6 border-t border-gray-200 pt-8 md:grid-cols-12 md:gap-10"
            >
              <div className="md:col-span-4">
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                  At this stop
                </p>
                <p className="mt-4 font-serif text-4xl font-normal leading-[1] tracking-[-0.02em] text-gray-900 md:text-5xl">
                  {arc.label}
                </p>
              </div>
              <div className="space-y-6 md:col-span-8">
                <p className="text-lg leading-[1.7] text-gray-700">{arc.body}</p>
                <figure className="border-l border-orange-500 pl-6">
                  <blockquote className="font-serif text-lg italic leading-[1.5] text-gray-800">
                    {arc.exemplar}
                  </blockquote>
                </figure>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* WHAT COYL SEES AT 9:47 PM */}
      <section className="space-y-10 border-t border-gray-200 pt-16">
        <div className="flex items-center gap-3">
          <span className="h-px w-10 bg-orange-500" />
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            One minute, layered
          </span>
        </div>
        <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
          What COYL sees at <span className="italic text-orange-600">9:47 PM.</span>
        </h2>
        <p className="max-w-2xl text-base leading-[1.65] text-gray-700">
          A real timeline. Tuesday night, month 3 of using COYL. Tap to reveal each layer
          as it lands in the model. The order is the order events fire — not what you would
          report after the fact.
        </p>

        <div className="space-y-2 border-t border-gray-200 pt-8">
          {LAYERS_947.slice(0, layersRevealed).map((l, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 gap-2 border-b border-gray-100 py-3 md:grid-cols-12 md:gap-6"
            >
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-gray-500 md:col-span-3">
                {l.time}
              </p>
              <div className="md:col-span-9">
                <p
                  className={`font-mono text-[9px] font-medium uppercase tracking-[0.22em] ${
                    l.kind === 'passive'
                      ? 'text-orange-600'
                      : l.kind === 'active'
                        ? 'text-gray-900'
                        : 'text-gray-500'
                  }`}
                >
                  {l.kind}
                </p>
                <p className="mt-1 text-base leading-[1.5] text-gray-800">{l.signal}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {layersRevealed < LAYERS_947.length ? (
            <button
              type="button"
              onClick={() => setLayersRevealed((n) => Math.min(LAYERS_947.length, n + 1))}
              className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-white transition-colors hover:bg-orange-600"
            >
              Reveal next layer
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setLayersRevealed(1)}
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-5 py-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-gray-700 transition-colors hover:border-gray-400"
            >
              Replay from the top
            </button>
          )}
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-gray-500">
            {layersRevealed} of {LAYERS_947.length}
          </span>
        </div>
      </section>

      {/* THE MOAT */}
      <section className="space-y-8 border-t border-gray-200 pt-16">
        <div className="flex items-center gap-3">
          <span className="h-px w-10 bg-orange-500" />
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            The dependence is the moat
          </span>
        </div>
        <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
          The thing no LLM can synthesize.
        </h2>
        <div className="space-y-6 text-lg leading-[1.7] text-gray-700">
          <p>
            ChatGPT can describe what a 9PM Negotiator <em>might</em> do. Claude can predict
            the average human's evening drift. Neither knows what <em>you</em> did last
            Tuesday at 9:47 PM, what story you told yourself afterward, and whether the
            interrupt landed.
          </p>
          <p>
            That ground-truth, longitudinal, pre-conscious behavioral dataset is the thing.
            Synthesizing it requires watching one person across months — across slips,
            recoveries, excuses, and the moments when the interrupt fired and you tagged
            "caught me." No foundation model has that dataset. We do, on you, because you
            built it with us.
          </p>
          <p>
            Once it exists, it exports. A{' '}
            <Link href="/protocol" className="underline decoration-orange-500 underline-offset-4 hover:text-orange-600">
              Behavioral Context Object
            </Link>{' '}
            any LLM can consume. The platform play.
          </p>
        </div>
      </section>

      {/* RISKS */}
      <section className="space-y-8 border-t border-gray-200 pt-16">
        <div className="flex items-center gap-3">
          <span className="h-px w-10 bg-orange-500" />
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            Where it hurts
          </span>
        </div>
        <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
          Three risks. <span className="italic text-orange-600">All shipping fixes.</span>
        </h2>

        <div className="space-y-3">
          {RISKS.map((r, i) => {
            const open = openRisk === i
            return (
              <div
                key={r.title}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
              >
                <button
                  type="button"
                  onClick={() => setOpenRisk(open ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-gray-50"
                  aria-expanded={open}
                >
                  <div>
                    <p className="font-mono text-[9px] font-medium uppercase tracking-[0.22em] text-gray-400">
                      Risk {String(i + 1).padStart(2, '0')}
                    </p>
                    <p className="mt-1 font-serif text-xl font-normal leading-[1.2] text-gray-900">
                      {r.title}
                    </p>
                  </div>
                  <motion.span
                    animate={{ rotate: open ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                    aria-hidden
                    className="flex h-8 w-8 shrink-0 items-center justify-center text-gray-500"
                  >
                    <ChevronRight className="h-4 w-4" strokeWidth={2} />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {open ? (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-4 border-t border-gray-100 px-6 py-5">
                        <p className="text-base leading-[1.65] text-gray-700">{r.body}</p>
                        <div className="rounded-xl border border-orange-100 bg-orange-50/50 px-4 py-3">
                          <p className="font-mono text-[9px] font-medium uppercase tracking-[0.22em] text-orange-600">
                            Shipping fix
                          </p>
                          <p className="mt-1 text-sm leading-[1.55] text-gray-700">
                            {r.shippingFix}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </section>

      {/* RECURRING BRAND ANCHOR + CTA */}
      <section className="space-y-10 border-t border-gray-200 pt-16">
        <figure className="border-l border-orange-500 pl-8">
          <blockquote className="font-serif text-3xl font-normal italic leading-[1.2] tracking-[-0.01em] text-gray-900 md:text-5xl">
            AI for the moment before behavior happens.
          </blockquote>
          <figcaption className="mt-6 font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-gray-500">
            The recurring anchor
          </figcaption>
        </figure>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Link
            href="/audit"
            className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-gray-300"
          >
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              Start the cold start
            </p>
            <p className="mt-3 font-serif text-2xl font-normal leading-[1.15] text-gray-900">
              Take the 60-second audit.
            </p>
            <span className="mt-auto inline-flex items-center gap-1 pt-6 font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-gray-500 transition-colors group-hover:text-orange-600">
              /audit <ChevronRight className="h-3 w-3" strokeWidth={2} />
            </span>
          </Link>

          <Link
            href="/protocol"
            className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-gray-300"
          >
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              For developers
            </p>
            <p className="mt-3 font-serif text-2xl font-normal leading-[1.15] text-gray-900">
              The Behavioral Interrupt Protocol.
            </p>
            <span className="mt-auto inline-flex items-center gap-1 pt-6 font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-gray-500 transition-colors group-hover:text-orange-600">
              /protocol <ChevronRight className="h-3 w-3" strokeWidth={2} />
            </span>
          </Link>

          <Link
            href="/psyche"
            className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-gray-300"
          >
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              The category
            </p>
            <p className="mt-3 font-serif text-2xl font-normal leading-[1.15] text-gray-900">
              Psyche AI — read the full thinking.
            </p>
            <span className="mt-auto inline-flex items-center gap-1 pt-6 font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-gray-500 transition-colors group-hover:text-orange-600">
              /psyche <ChevronRight className="h-3 w-3" strokeWidth={2} />
            </span>
          </Link>
        </div>
      </section>
    </div>
  )
}
