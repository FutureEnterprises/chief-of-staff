'use client'

/**
 * <PlatformBand /> — homepage section 2 (May 2026 platform-tier repositioning).
 *
 * The Stripe-model band. Stripe's homepage led with "payments API"; the
 * merchants were proof. COYL leads with the protocol stack — BIP, PAP,
 * EAP — and the consumer app at coyl.ai is the proof case.
 *
 * Visually: cream surface, hairline orange top border on each card,
 * three columns at md+, single column on mobile. Eyebrow + serif H2
 * with italic orange accent, then the protocol grid, then a closing
 * "every LLM, every device" frame and a CTA row pointing to /protocol
 * (canonical BIP route), /pap, /eap.
 *
 * Voice is editorial-quiet — no shouting, no badges, no emojis. The
 * protocol names sit in serif at the top of each card; the Apache 2.0
 * + canonical-route attribution sits in mono at the bottom, so the eye
 * reads: name → claim → license. That's the same order an investor
 * scans a protocol page.
 */

import Link from 'next/link'
import { useRef } from 'react'
import { motion, useInView } from 'motion/react'

type Protocol = {
  abbr: string
  name: string
  body: string
  license: string
  href: string
  hrefLabel: string
}

const PROTOCOLS: Protocol[] = [
  {
    abbr: 'BIP',
    name: 'Behavioral Interrupt Protocol',
    body:
      'The consumer-side protocol. Apps observe user behavior and emit structured BIP context — the cue, the danger window, the user model — so any intervention engine can act on it.',
    license: 'Apache 2.0',
    href: '/protocol',
    hrefLabel: '/protocol',
  },
  {
    abbr: 'PAP',
    name: 'Proactive AI Protocol',
    body:
      'LLMs propose behavioral interventions through a single trust infrastructure — consent, scope, throttling, and audit baked into the spec, not bolted on per integration.',
    license: 'Apache 2.0',
    href: '/pap',
    hrefLabel: '/pap',
  },
  {
    abbr: 'EAP',
    name: 'Edge AI Protocol',
    body:
      "LLMs act across the user's full device fleet — iPhone, Watch, Mac, browser, home, car — under one consent layer, with one model of where the user is and what the moment can carry.",
    license: 'Apache 2.0',
    href: '/eap',
    hrefLabel: '/eap',
  },
]

export function PlatformBand() {
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
            The protocols
          </span>
        </div>

        <h3 className="font-serif text-5xl font-normal leading-[1.02] tracking-[-0.02em] text-gray-900 md:text-7xl">
          Three open specs. One reference engine.<br />
          <span className="italic text-orange-600">Built so any LLM works in real life.</span>
        </h3>

        <p className="mt-8 max-w-2xl text-lg leading-[1.7] text-gray-600">
          The behavioral OS for the LLM era is three protocols, published
          openly, and one reference implementation that proves they ship.
          Read the spec, vendor the engine, or both.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
        {PROTOCOLS.map((p, i) => (
          <motion.article
            key={p.abbr}
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.12 * i, duration: 0.55 }}
            className="relative flex h-full flex-col border-t-[1.5px] border-orange-500 bg-white/60 p-7 shadow-[0_1px_0_rgba(20,20,20,0.04)] backdrop-blur-[1px]"
          >
            <header>
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                {p.abbr}
              </p>
              <h4 className="mt-3 font-serif text-2xl font-normal leading-[1.15] tracking-[-0.015em] text-gray-900 md:text-[1.625rem]">
                {p.name}
              </h4>
            </header>

            <p className="mt-5 flex-1 text-base leading-[1.7] text-gray-600">
              {p.body}
            </p>

            <footer className="mt-7 flex items-center justify-between border-t border-gray-200 pt-4">
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.28em] text-gray-500">
                {p.license}
              </span>
              <Link
                href={p.href}
                className="font-mono text-[10px] font-medium uppercase tracking-[0.28em] text-orange-600 underline-offset-4 hover:underline"
              >
                {p.hrefLabel}
              </Link>
            </footer>
          </motion.article>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="mt-20 border-t border-gray-200 pt-12"
      >
        <p className="mx-auto max-w-3xl text-center font-serif text-2xl font-normal italic leading-[1.4] text-gray-900 md:text-3xl">
          Together: every LLM can reach every device in your life
          <span className="text-orange-600"> — with your consent, on your terms.</span>
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/protocol"
            className="rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_6px_18px_-8px_rgba(255,102,0,0.4)] transition-all hover:bg-orange-600"
          >
            Read the spec · BIP
          </Link>
          <Link
            href="/pap"
            className="rounded-full border border-gray-200 px-6 py-3 text-sm font-medium text-gray-900 transition-all hover:border-gray-900"
          >
            PAP
          </Link>
          <Link
            href="/eap"
            className="rounded-full border border-gray-200 px-6 py-3 text-sm font-medium text-gray-900 transition-all hover:border-gray-900"
          >
            EAP
          </Link>
        </div>
      </motion.div>
    </section>
  )
}
