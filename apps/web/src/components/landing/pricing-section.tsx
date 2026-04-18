'use client'

import Link from 'next/link'
import { motion, useInView } from 'motion/react'
import { useRef, useState } from 'react'

type Interval = 'monthly' | 'annual'

const TIERS = [
  {
    slug: 'free',
    name: 'Free',
    tagline: 'Start noticing the script.',
    monthly: 0,
    annual: 0,
    features: [
      '25 active commitments',
      '20 Charges / month (AI)',
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
    featured: false,
  },
  {
    slug: 'core',
    name: 'Core',
    tagline: 'Interrupt the script, recover fast.',
    monthly: 19,
    annual: 179,
    features: [
      'Unlimited commitments',
      '500 Charges / month',
      'Full rescue flows + interruption',
      'Recovery engine (shame-free re-entry)',
      'Autopilot map + excuse detection',
      'AI assessments (Considerate + No-BS)',
      'Daily email briefings',
    ],
    cta: 'Start Core',
    featured: true,
  },
  {
    slug: 'plus',
    name: 'Plus',
    tagline: 'Accountability + precision interrupts.',
    monthly: 29,
    annual: 279,
    features: [
      'Everything in Core',
      '1,500 Charges / month',
      'Accountability partner',
      'Challenge pods (2–5 people)',
      'Precision interrupts (JITAI at learned danger windows)',
      'Advanced pattern reports',
      'Priority support',
    ],
    cta: 'Start Plus',
    featured: false,
  },
  {
    slug: 'premium',
    name: 'Premium',
    tagline: 'The full operator stack.',
    monthly: 49,
    annual: 469,
    features: [
      'Everything in Plus',
      'Unlimited Charges',
      'Scenario simulator',
      'Financial stakes (commit $ per rule)',
      'Health + calendar integrations',
      'Advanced identity + self-trust reports',
      'Specialty modules (destructive behaviors, cravings)',
    ],
    cta: 'Start Premium',
    featured: false,
  },
] as const

export function PricingSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  const [interval, setInterval] = useState<Interval>('annual')

  return (
    <section id="pricing" className="relative py-32" ref={ref}>
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="relative z-10 mb-12 text-center"
        >
          <h2 className="mb-6 text-4xl font-black tracking-tight text-white md:text-5xl">
            Pick your pressure level.
          </h2>
          <p className="mx-auto max-w-xl text-lg font-light text-gray-400">
            Every tier runs the same autopilot-interruption engine. Higher tiers add accountability, precision, and stakes.
          </p>

          {/* Interval toggle */}
          <div className="mt-8 inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/30 p-1">
            <button
              onClick={() => setInterval('monthly')}
              className={`rounded-full px-5 py-2 text-sm font-bold transition-all ${
                interval === 'monthly' ? 'bg-orange-500 text-white' : 'text-gray-400'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval('annual')}
              className={`rounded-full px-5 py-2 text-sm font-bold transition-all ${
                interval === 'annual' ? 'bg-orange-500 text-white' : 'text-gray-400'
              }`}
            >
              Annual <span className="ml-1 text-xs font-normal text-orange-200">save ~20%</span>
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((tier, i) => {
            const price = interval === 'annual' ? tier.annual : tier.monthly
            const isFree = tier.slug === 'free'
            const href = isFree ? '/sign-up' : `/sign-up?plan=${tier.slug}&interval=${interval}`

            return (
              <motion.div
                key={tier.slug}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.2 + i * 0.08, duration: 0.6 }}
                whileHover={{ y: -4 }}
                className={`relative z-10 flex flex-col overflow-hidden rounded-2xl p-6 ${
                  tier.featured
                    ? 'border-2 border-orange-500/60 shadow-[0_0_40px_-10px_rgba(255,102,0,0.4)]'
                    : 'border border-white/5'
                }`}
                style={{
                  background: tier.featured
                    ? 'linear-gradient(145deg, rgba(255,102,0,0.08), rgba(15,15,15,0.9))'
                    : 'linear-gradient(145deg, rgba(30,30,30,0.6), rgba(15,15,15,0.8))',
                  backdropFilter: 'blur(12px)',
                }}
              >
                {tier.featured && (
                  <div className="absolute right-4 top-4 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
                    Most Popular
                  </div>
                )}

                <h3 className="mb-1 text-xl font-bold text-white">{tier.name}</h3>
                <p className="mb-5 text-xs text-gray-400">{tier.tagline}</p>

                <div className="mb-6 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">${price}</span>
                  <span className="text-sm font-medium text-gray-500">
                    {isFree ? '/forever' : interval === 'annual' ? '/year' : '/mo'}
                  </span>
                </div>

                <ul className="mb-6 flex-1 space-y-2.5">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0 text-orange-500">
                        <path d="M13 4L6 12L3 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-xs text-gray-300">{f}</span>
                    </li>
                  ))}
                  {'excluded' in tier && tier.excluded?.map((f) => (
                    <li key={f} className="flex items-start gap-2 opacity-40">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0 text-gray-500">
                        <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                      <span className="text-xs text-gray-500 line-through">{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={href}
                  className={`block w-full rounded-xl py-3 text-center text-sm font-bold transition-all ${
                    tier.featured
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-[0_0_20px_rgba(255,102,0,0.3)] hover:shadow-[0_0_40px_rgba(255,102,0,0.5)]'
                      : 'border border-white/10 bg-white/5 text-gray-200 hover:bg-white/10'
                  }`}
                >
                  {tier.cta}
                </Link>
              </motion.div>
            )
          })}
        </div>

        <p className="mt-10 text-center text-xs text-gray-600">
          Cancel anytime. Annual plans come with a 7-day free trial. All tiers include the autopilot-interruption engine.
        </p>
      </div>
    </section>
  )
}
