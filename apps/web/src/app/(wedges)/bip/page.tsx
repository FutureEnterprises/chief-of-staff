import type { Metadata } from 'next'
import Link from 'next/link'
import { cacheLife, cacheTag } from 'next/cache'
import { BreadcrumbSchema } from '@/app/structured-data'

/**
 * /bip — public dedicated landing for the Behavioral Interrupt
 * Protocol (BIP) open spec.
 *
 * Built per the May 2026 audit finding: BIP was the only one of the
 * five open specs without its own wedge page. The nav pointed to
 * /protocol#bip (an anchor on the multi-spec hub) and any visitor who
 * guessed the sibling URL /bip got the Clerk sign-in wall (the
 * isPublicRoute matcher in proxy.ts didn't include /bip).
 *
 * Fix: mirror the lightweight /rap structure — single editorial page
 * with the GitHub spec link as the primary CTA, cross-links to the
 * sibling specs (PAP / EAP / UAP / RAP), and a return path to
 * /protocol for the visitor who wants the full stack overview.
 *
 * Intentionally compact relative to /pap and /eap. BIP is the
 * substrate spec — "what loop is the user in right now" — and the
 * audience for this page is a developer/partner who just needs to
 * find the spec doc, not be sold on the protocol family.
 */

const SPEC_GITHUB_URL =
  'https://github.com/FutureEnterprises/chief-of-staff/blob/main/docs/protocol/BIP-0.1.md'

export const metadata: Metadata = {
  title:
    'BIP — Behavioral Interrupt Protocol · the substrate spec for behavioral context',
  description:
    'The open spec for behavioral context. What loop the user is in right now, in a shape any LLM, wearable, or coordinator can read. Apache 2.0. Reference-implemented by COYL Cloud.',
  keywords: [
    'behavioral interrupt protocol',
    'BIP spec',
    'behavioral context protocol',
    'open protocol behavioral ai',
    'coyl protocol',
    'apache 2.0 behavioral spec',
  ],
  alternates: { canonical: '/bip' },
  openGraph: {
    title: 'BIP — Behavioral Interrupt Protocol',
    description:
      'The open spec for behavioral context. Apache 2.0. The substrate underneath PAP, EAP, UAP, RAP.',
    url: 'https://coyl.ai/bip',
    images: [
      {
        url: '/api/og?title=BIP+%E2%80%94+Behavioral+Interrupt+Protocol&kicker=Open+spec',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BIP — Behavioral Interrupt Protocol',
    description:
      'The open spec for behavioral context. Apache 2.0.',
    images: [
      '/api/og?title=BIP+%E2%80%94+Behavioral+Interrupt+Protocol&kicker=Open+spec',
    ],
  },
}

export default async function BipPage() {
  'use cache'
  cacheLife('days')
  cacheTag('marketing-bip')

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'COYL', url: 'https://coyl.ai' },
          { name: 'Protocol', url: 'https://coyl.ai/protocol' },
          { name: 'BIP', url: 'https://coyl.ai/bip' },
        ]}
      />

      {/* EYEBROW + H1 — same atom as /pap, /eap, /uap, /rap. Hairline
          rule, mono micro-label, Instrument Serif H1 with italic
          accent on the claim line. */}
      <div className="mb-4 flex items-center gap-3">
        <span className="h-px w-8 bg-orange-500" />
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
          BIP · the substrate spec
        </span>
      </div>

      <h1 className="mb-6 max-w-3xl font-serif text-4xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-6xl">
        Behavioral Interrupt Protocol &mdash;{' '}
        <span className="italic text-orange-600">
          the open spec for behavioral context.
        </span>
      </h1>

      <p className="mb-6 max-w-2xl text-lg leading-[1.65] text-gray-700">
        What loop is the user in right now? BIP is the spec that answers
        that question in a shape any LLM, wearable, coordinator, or
        downstream protocol (PAP, EAP, UAP, RAP) can read.
      </p>

      <p className="mb-6 max-w-2xl text-base leading-[1.7] text-gray-600">
        Apache 2.0. Reference-implemented by COYL Cloud. The substrate
        underneath the four sibling specs &mdash; behavior context flows
        into PAP&apos;s proactive interrupt, EAP&apos;s cross-device
        action, UAP&apos;s standing-authority gate, and RAP&apos;s
        irreversibility scoring.
      </p>

      {/* ALPHA-STATUS LINE — same honest framing /protocol leads with.
          BIP is the read substrate, so the status note points at the
          live stack it feeds. */}
      <p className="mb-10 max-w-2xl text-base leading-[1.7] text-gray-600">
        Status, honestly: the spec is published under Apache&nbsp;2.0; the
        reference engine and the typed{' '}
        <code className="font-mono text-[13px] text-orange-700">
          @coyl/protocol
        </code>{' '}
        SDK are in alpha. BIP context feeds the live stack &mdash; PAP
        proposes, EAP acts, UAP authorizes, and the RAP safety floor gates
        every one of them. Built for foundation labs; design partners
        invited.
      </p>

      <div className="mb-20 flex flex-wrap gap-3">
        <a
          href={SPEC_GITHUB_URL}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
        >
          Read the BIP spec on GitHub &rarr;
        </a>
        <Link
          href="/protocol"
          className="rounded-full border border-gray-200 px-6 py-3 text-sm text-gray-800 hover:border-orange-500/40 hover:text-orange-700"
        >
          See the full protocol stack
        </Link>
      </div>

      {/* WHAT BIP DEFINES — three bullets, editorial list. Same rhythm
          as /pap and /eap's "what the spec covers" section. */}
      <section className="mb-20 border-t border-gray-200 pt-12">
        <p className="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
          What the spec defines
        </p>
        <h2 className="mb-8 max-w-3xl font-serif text-3xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900 md:text-4xl">
          The shape behavioral context{' '}
          <span className="italic text-orange-600">travels in.</span>
        </h2>
        <ul className="space-y-4 text-base leading-[1.7] text-gray-800">
          <li className="flex items-start gap-3 border-b border-gray-100 pb-4">
            <span
              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500"
              aria-hidden
            />
            <span>
              <strong className="font-semibold text-gray-900">
                The BehavioralContext envelope.
              </strong>{' '}
              A signed JSON document carrying loop identity (what
              recurring behavior), phase (entry / window / exit),
              confidence, danger-window proximity, and the
              consent-scope under which it was authored.
            </span>
          </li>
          <li className="flex items-start gap-3 border-b border-gray-100 pb-4">
            <span
              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500"
              aria-hidden
            />
            <span>
              <strong className="font-semibold text-gray-900">
                Loop taxonomy + ontology.
              </strong>{' '}
              The canonical vocabulary for recurring behavior &mdash;
              dose-trough rebound, weekend-collapse, post-deadline
              reward, stress-event window &mdash; that consumers and
              producers of BIP agree to use.
            </span>
          </li>
          <li className="flex items-start gap-3 pb-4">
            <span
              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500"
              aria-hidden
            />
            <span>
              <strong className="font-semibold text-gray-900">
                Conformance + transport.
              </strong>{' '}
              How a context-emitter (wearable, journaling app,
              prescription bridge) signs and transmits a context, and
              how a context-consumer (LLM coordinator, interrupt
              service) validates the signature, the scope, and the
              freshness window.
            </span>
          </li>
        </ul>
      </section>

      {/* WHAT'S ACTUALLY SHIPPED — parity proof block mirroring
          /protocol's "The SDK · alpha / The demo · runnable / The safety
          floor · live" trio, framed in BIP's read-substrate terms. The
          assets referenced (@coyl/protocol, examples/authority-demo.ts,
          lib/rap/*) exist in this repo today. */}
      <section className="mb-20 border-t border-gray-200 pt-12">
        <p className="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
          What&rsquo;s actually shipped
        </p>
        <h2 className="mb-4 max-w-3xl font-serif text-3xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900 md:text-4xl">
          A typed SDK, a runnable demo, and a live safety floor.{' '}
          <span className="italic text-orange-600">Not a slide deck.</span>
        </h2>
        <p className="mb-8 max-w-2xl text-base leading-[1.7] text-gray-700">
          BIP is the read substrate. The context it carries feeds a stack
          that is implemented in this repository, in alpha &mdash; PAP
          proposes, EAP acts, UAP authorizes, RAP gates. Three proofs make
          that concrete.
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              The SDK · alpha
            </p>
            <h3 className="mt-3 font-serif text-xl font-normal leading-[1.2] tracking-[-0.01em] text-gray-900 md:text-2xl">
              <code className="font-mono text-base text-orange-600">
                @coyl/protocol
              </code>
            </h3>
            <p className="mt-3 text-sm leading-[1.65] text-gray-700">
              A typed, zero-dependency TypeScript client.{' '}
              <code className="font-mono text-[13px] text-orange-600">
                UAPClient
              </code>{' '}
              does grant / precheck / execute / revoke / audit /
              kill-switch / verify-provenance;{' '}
              <code className="font-mono text-[13px] text-orange-600">
                EAPDeviceClient
              </code>{' '}
              registers a device, polls approved actions, and publishes
              sensor snapshots &mdash; the same snapshots that become BIP
              context. Typed against the live route handlers; wire shapes
              can change before 1.0.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              The demo · runnable
            </p>
            <h3 className="mt-3 font-serif text-xl font-normal leading-[1.2] tracking-[-0.01em] text-gray-900 md:text-2xl">
              Grant it, then try to break it.
            </h3>
            <p className="mt-3 text-sm leading-[1.65] text-gray-700">
              One script walks the whole trust contract: grant &rarr;
              reversible action allowed and audited &rarr; irreversible
              send{' '}
              <strong className="font-serif font-normal italic">
                denied
              </strong>{' '}
              (it fails closed) &rarr; provenance verified on an allowed
              representation action &rarr; kill switch &rarr; the next
              action is dead. The fail-closed denial is the point.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              The safety floor · live
            </p>
            <h3 className="mt-3 font-serif text-xl font-normal leading-[1.2] tracking-[-0.01em] text-gray-900 md:text-2xl">
              Gates everything BIP feeds.
            </h3>
            <p className="mt-3 text-sm leading-[1.65] text-gray-700">
              RAP&apos;s classifier, routing envelopes, and store are
              implemented and gating live in the app &mdash; the
              closed-coaching-path check runs ahead of every other gate on
              the agent path and before any consumer interrupt. A person in
              a closed path is never nudged, no matter what BIP context
              says.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="mailto:protocol@coyl.ai?subject=Design%20partner%20interest"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
          >
            Become a design partner &rarr;
          </a>
          <Link
            href="/protocol"
            className="rounded-full border border-gray-200 px-6 py-3 text-sm text-gray-800 hover:border-orange-500/40 hover:text-orange-700"
          >
            See the full protocol stack
          </Link>
        </div>
      </section>

      {/* SIBLING SPECS — closing chain, same pattern /pap and /eap use
          at the bottom. Makes the family obvious. */}
      <section className="mb-20 border-t border-orange-500 pt-12">
        <p className="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
          The protocol family
        </p>
        <h2 className="mb-8 max-w-3xl font-serif text-3xl font-normal italic leading-[1.15] tracking-[-0.01em] text-gray-900 md:text-4xl">
          BIP is the substrate. Four siblings build on it.
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            href="/pap"
            className="rounded-2xl border border-gray-200 bg-white p-5 hover:border-orange-300"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-orange-600">
              PAP
            </p>
            <p className="mt-2 text-sm font-semibold text-gray-900">
              Proactive AI Protocol &mdash; LLM-authored interrupts.
            </p>
          </Link>
          <Link
            href="/eap"
            className="rounded-2xl border border-gray-200 bg-white p-5 hover:border-orange-300"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-orange-600">
              EAP
            </p>
            <p className="mt-2 text-sm font-semibold text-gray-900">
              Edge AI Protocol &mdash; cross-device action routing.
            </p>
          </Link>
          <Link
            href="/uap"
            className="rounded-2xl border border-gray-200 bg-white p-5 hover:border-orange-300"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-orange-600">
              UAP
            </p>
            <p className="mt-2 text-sm font-semibold text-gray-900">
              User Authority Protocol &mdash; standing-authority layer.
            </p>
          </Link>
          <Link
            href="/rap"
            className="rounded-2xl border border-gray-200 bg-white p-5 hover:border-orange-300"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-orange-600">
              RAP
            </p>
            <p className="mt-2 text-sm font-semibold text-gray-900">
              Risk Assessment Protocol &mdash; irreversibility scoring.
            </p>
          </Link>
        </div>
      </section>

      {/* RECURRING ANCHOR — same brand mantra every protocol page closes
          on. Keeps the developer leaving with one phrase. */}
      <section className="border-t border-gray-200 pt-12 text-center">
        <p className="font-serif text-2xl font-normal italic leading-[1.3] text-gray-700 md:text-3xl">
          AI for the moment before behavior happens.
        </p>
      </section>
    </>
  )
}
