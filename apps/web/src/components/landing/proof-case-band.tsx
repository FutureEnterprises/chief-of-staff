'use client'

/**
 * <ProofCaseBand /> — homepage band that sits below RescueDemo (May 2026
 * platform-tier repositioning).
 *
 * The Stripe-style "look at our merchants" surface. Stripe's protocol
 * was payments-as-API; the merchants were the proof the protocol ships.
 * COYL's protocols are BIP / PAP / EAP; coyl.ai — the consumer product
 * — is the proof case. This band names that publicly so visitors,
 * partners, and acquirers read the consumer app as evidence, not as
 * the whole company.
 *
 * Voice + layout match the rest of the cream-editorial system:
 *   - eyebrow (mono, orange, hairline rule)
 *   - serif H3 with italic orange accent on the proof line
 *   - 2-col body: narrative left, editorial stats block right
 *   - mono labels + serif numerals in the stats block
 *   - CTA row pointing to /audit + /protocol
 *
 * Stats are placeholders the founder fills in. The keys are
 * intentional: USERS, ARCHETYPES MAPPED, INTERRUPT HOLD RATE,
 * DAILY-NUMBER SHARE RATE, CLINICAL RCT — the five numbers that
 * matter when the acquirer pool reads this band cold.
 */

import Link from 'next/link'
import { useRef } from 'react'
import { motion, useInView } from 'motion/react'

type Stat = {
  label: string
  value: string
  note?: string
}

const STATS: Stat[] = [
  { label: 'Users', value: '[N]' },
  { label: 'Archetypes mapped', value: '6' },
  { label: 'Interrupt hold rate', value: '[N%]' },
  { label: 'Daily-number share rate', value: '[N%]' },
  { label: 'Clinical RCT', value: 'in flight', note: 'Found Health partnership' },
]

export function ProofCaseBand() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="relative mx-auto max-w-6xl px-6 py-40 md:px-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
        className="mb-16"
      >
        <div className="mb-8 flex items-center gap-3">
          <span className="h-px w-10 bg-orange-500" />
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            The proof case
          </span>
        </div>

        <h3 className="font-serif text-5xl font-normal leading-[1.02] tracking-[-0.02em] text-gray-900 md:text-7xl">
          coyl.ai — the consumer product.<br />
          <span className="italic text-orange-600">Proves the protocol works in real life.</span>
        </h3>
      </motion.div>

      <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="md:col-span-7"
        >
          <p className="font-serif text-2xl font-normal italic leading-[1.4] text-gray-900 md:text-3xl">
            If you used COYL today, here&rsquo;s what you&rsquo;d see.
          </p>
          <p className="mt-8 text-lg leading-[1.7] text-gray-600">
            Sixty-second audit, then your archetype. First interrupt
            inside an hour — the cue your autopilot uses, named in your
            own language, caught in the three-second window before the
            pattern runs. At 8 PM the daily-number ritual: one number,
            one screenshot, one share. By day thirty, a model of your
            year mapped against the six archetypes — the same engine
            that ran your interrupts, now reflecting them back.
          </p>
          <p className="mt-6 text-lg leading-[1.7] text-gray-600">
            The consumer app is one reference implementation of the
            stack. The protocols beneath it are the product.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="md:col-span-5"
        >
          <dl className="border-l border-gray-200 pl-6">
            {STATS.map((s, i) => (
              <div
                key={s.label}
                className={
                  i === 0
                    ? 'flex items-baseline justify-between gap-6 pb-5'
                    : 'flex items-baseline justify-between gap-6 border-t border-gray-200 py-5 last:pb-0'
                }
              >
                <dt className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-gray-500">
                  {s.label}
                </dt>
                <dd className="text-right">
                  <span className="font-serif text-3xl font-normal leading-none tracking-[-0.015em] text-gray-900 md:text-4xl">
                    {s.value}
                  </span>
                  {s.note ? (
                    <span className="mt-1 block font-mono text-[10px] font-medium uppercase tracking-[0.24em] text-gray-500">
                      {s.note}
                    </span>
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="mt-16 flex flex-wrap gap-3"
      >
        <Link
          href="/audit"
          className="rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_6px_18px_-8px_rgba(255,102,0,0.4)] transition-all hover:bg-orange-600"
        >
          Take the audit
        </Link>
        <Link
          href="/protocol"
          className="rounded-full border border-gray-200 px-6 py-3 text-sm font-medium text-gray-900 transition-all hover:border-gray-900"
        >
          Read the protocol
        </Link>
      </motion.div>
    </section>
  )
}
