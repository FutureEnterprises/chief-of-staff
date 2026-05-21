'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { Check, X, ArrowRight } from 'lucide-react'

type Interval = 'monthly' | 'annual'

type Tier = {
  slug: 'free' | 'core' | 'plus' | 'premium'
  name: string
  tagline: string
  monthly: number
  annual: number
  features: string[]
  excluded?: string[]
  cta: string
  ctaHref: string
  featured: boolean
}

/**
 * Tier definitions — mirror apps/web/src/lib/services/entitlement.service.ts.
 * The server is the source of truth for what a user can DO; this page is
 * the source of truth for what a user is TOLD they can do. They must agree.
 *
 * Annual prices are 12-month commits at ~22% discount. Don't quote a "save
 * 22%" badge; it's already cooked in. Users discount-fatigue when you
 * highlight a number they didn't ask about.
 */
const TIERS: Tier[] = [
  {
    slug: 'free',
    name: 'Free',
    tagline: 'Start noticing the script.',
    monthly: 0,
    annual: 0,
    features: [
      '25 active commitments',
      '20 AI charges / month',
      'Morning + night check-ins',
      'Self-trust score',
      'Basic autopilot map',
    ],
    excluded: [
      'Rescue flows',
      'Recovery engine',
      'Pattern detection',
      'Precision interrupts',
    ],
    cta: 'Start free',
    ctaHref: '/sign-up?ref=pricing-free',
    featured: false,
  },
  {
    slug: 'core',
    name: 'Core',
    tagline: 'Interrupt the script. Recover fast.',
    monthly: 19,
    annual: 179,
    features: [
      'Unlimited commitments',
      '500 AI charges / month',
      'Full rescue flows',
      'Recovery engine (no Monday reset)',
      'Autopilot map + excuse detection',
      'AI assessments (Considerate + No-BS)',
      'Daily email briefings',
    ],
    cta: 'Start Core',
    ctaHref: '/sign-up?ref=pricing-core',
    featured: true,
  },
  {
    slug: 'plus',
    name: 'Plus',
    tagline: 'Push interrupts at your danger windows.',
    monthly: 29,
    annual: 279,
    features: [
      'Precision interrupts (push fires at your learned danger windows)',
      'Accountability partner loop',
      'Challenge pods (small groups)',
      '1,500 AI charges / month',
      'Priority response time',
      'Everything in Core',
    ],
    cta: 'Start Plus',
    ctaHref: '/sign-up?ref=pricing-plus',
    featured: false,
  },
  {
    slug: 'premium',
    name: 'Premium',
    tagline: 'Stakes. Simulation. Health data.',
    monthly: 49,
    annual: 469,
    features: [
      'Everything in Plus',
      'Unlimited AI',
      'Scenario simulator',
      'Financial stakes (charity-backed commitments)',
      'Apple Health + Google Fit + Calendar',
      'Priority support',
    ],
    cta: 'Start Premium',
    ctaHref: '/sign-up?ref=pricing-premium',
    featured: false,
  },
]

const FAQ = [
  {
    q: 'Why pay anything? Doesn’t willpower work?',
    a: 'For some people on some weeks. The reason you keep losing in the same exact moments is that the script is faster than your willpower. COYL fires before the script. That’s what you’re paying for.',
  },
  {
    q: 'I’m on Ozempic / Wegovy / Mounjaro. Do I still need this?',
    a: 'Especially. The drug suppresses appetite. It does not touch the 9pm kitchen habit, the stress-eat reflex, or the “I deserve this” script. When the prescription ends, the autopilot is still there. COYL trains the interrupt while you’re on the drug so it’s muscle memory when you’re off.',
  },
  {
    q: 'How is this different from Noom?',
    a: 'Noom is daily-log coaching. COYL is moment-of-decision interruption. Noom asks you to journal what you ate. COYL fires at the exact second you’re standing in front of the fridge. Different products, different surfaces.',
  },
  {
    q: 'Can I cancel?',
    a: 'Anytime, no questions, prorated. We don’t guilt-trip cancellations. The whole product is built on the premise that punishment doesn’t change behavior.',
  },
  {
    q: 'Is this medical or treatment?',
    a: 'No. COYL is behavioral support, not medical treatment or diagnosis. Always work with your doctor for any clinical concerns.',
  },
  {
    q: 'What happens to my data if I cancel?',
    a: 'Your account stays in Free tier. Your slips, commitments, and pattern data stay yours — you can export or delete at any time from /settings.',
  },
]

export function PricingView() {
  const [interval, setInterval] = useState<Interval>('monthly')

  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <span className="h-px w-8 bg-orange-500" />
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500">
          Pricing
        </span>
      </div>

      <h1 className="mb-6 text-4xl font-black leading-[1.05] text-gray-900 md:text-6xl">
        Pay for the interrupt,<br />
        <span className="text-orange-600">not for the guilt.</span>
      </h1>

      <p className="mb-10 max-w-2xl text-lg text-gray-600">
        Free forever to start. Upgrade when the autopilot is costing you more than $19/month.
        No 7-day trial gimmicks, no annual lock-in tricks, cancel anytime.
      </p>

      {/* Monthly / Annual toggle */}
      <div className="mb-12 inline-flex rounded-full border border-gray-200 bg-white p-1">
        <button
          type="button"
          onClick={() => setInterval('monthly')}
          aria-pressed={interval === 'monthly'}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors duration-200 ${
            interval === 'monthly'
              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-[0_0_12px_rgba(255,102,0,0.3)]'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => setInterval('annual')}
          aria-pressed={interval === 'annual'}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors duration-200 ${
            interval === 'annual'
              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-[0_0_12px_rgba(255,102,0,0.3)]'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Annual
          <span className="ml-1.5 rounded-full bg-orange-500/20 px-1.5 py-0.5 text-[10px] font-bold text-orange-700">
            − 22%
          </span>
        </button>
      </div>

      {/* Tier grid */}
      <section className="mb-20 grid grid-cols-1 gap-4 lg:grid-cols-4">
        {TIERS.map((t, i) => {
          const price = interval === 'monthly' ? t.monthly : Math.round(t.annual / 12)
          const billed = interval === 'annual' && t.annual > 0
          return (
            <motion.div
              key={t.slug}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
              className={`relative flex flex-col rounded-3xl border p-6 ${
                t.featured
                  ? 'border-orange-500/40 bg-gradient-to-br from-orange-500/[0.06] to-transparent'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {t.featured && (
                <span className="absolute -top-3 left-6 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-[0_0_16px_rgba(255,102,0,0.4)]">
                  Most picked
                </span>
              )}

              <p className="text-xs font-mono uppercase tracking-widest text-gray-500">
                {t.name}
              </p>
              <p className="mt-1 mb-5 text-base font-semibold text-gray-900">
                {t.tagline}
              </p>

              <div className="mb-2 flex items-baseline gap-1">
                <span className="text-5xl font-black text-gray-900">${price}</span>
                <span className="text-sm text-gray-500">/mo</span>
              </div>
              <p className="mb-6 text-xs text-gray-600">
                {t.monthly === 0
                  ? 'Forever. No card needed.'
                  : billed
                    ? `Billed $${t.annual}/year`
                    : 'Billed monthly'}
              </p>

              <Link
                href={t.ctaHref}
                className={`mb-6 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition-all duration-200 ${
                  t.featured
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-[0_0_20px_rgba(255,102,0,0.35)] hover:shadow-[0_0_28px_rgba(255,102,0,0.5)]'
                    : 'border border-gray-200 bg-white text-gray-100 hover:border-orange-300 hover:text-gray-900'
                }`}
              >
                {t.cta}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>

              <ul className="space-y-2">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
                    <span>{f}</span>
                  </li>
                ))}
                {t.excluded?.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm text-gray-600 line-through"
                  >
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-gray-700" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )
        })}
      </section>

      {/* Compare-the-loops belt. Per design-system-v2 §"Migration",
          inner marketing blocks use rounded-2xl; only the tier cards
          + final CTA stay at 3xl as the page anchors. */}
      <section className="mb-20 rounded-2xl border border-gray-200 bg-white p-8">
        <h2 className="mb-2 text-2xl font-bold text-gray-900">
          What you get on every tier.
        </h2>
        <p className="mb-6 text-sm text-gray-600">
          Free is real software, not a 7-day demo. The paid tiers add depth, not gates around the basics.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            {
              n: '01',
              h: 'No data hostage.',
              b: 'Cancel and you keep your slips, commitments, and pattern data. Export anytime.',
            },
            {
              n: '02',
              h: 'No shame UX.',
              b: 'Streaks are un-breakable. Patterns defeated > consecutive days.',
            },
            {
              n: '03',
              h: 'Not medical treatment.',
              b: 'Behavioral support only. Always work with your doctor for clinical concerns.',
            },
          ].map((b) => (
            <div
              key={b.n}
              className="rounded-2xl border border-gray-200 bg-gray-50 p-5"
            >
              <p className="text-xs font-mono text-orange-500">{b.n}</p>
              <h3 className="mt-2 text-base font-bold text-gray-900">{b.h}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{b.b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-20">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-orange-500">
          <span className="h-2 w-2 rounded-sm bg-orange-500" />
          FAQ
        </h2>
        <h3 className="mb-8 text-2xl font-bold text-gray-900 md:text-3xl">
          Honest answers, before you sign up.
        </h3>
        <div className="space-y-3">
          {FAQ.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-gray-200 bg-white p-5 open:border-orange-500/20 open:bg-orange-500/[0.03]"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-3 text-base font-semibold text-gray-900 marker:hidden [&::-webkit-details-marker]:hidden">
                <span>{f.q}</span>
                <span
                  aria-hidden
                  className="text-orange-600 transition-transform duration-200 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/sign-up?ref=pricing-bottom"
          className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
        >
          Start free
        </Link>
        <Link
          href="/how-it-works"
          className="rounded-full border border-gray-200 px-6 py-3 text-sm text-gray-800 hover:border-orange-500/40 hover:text-orange-700"
        >
          How it works
        </Link>
      </div>
    </>
  )
}
