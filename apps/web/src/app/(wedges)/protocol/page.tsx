/**
 * /protocol — unified developer entry point for the COYL protocol stack.
 *
 * Today this page is the front door for foundation labs (Anthropic,
 * OpenAI, Google), wearable platforms, and consumer-app developers
 * evaluating the COYL stack. It showcases all three open specs as one
 * coherent layered protocol:
 *
 *   - BIP — behavioral context primitives (consumer-app substrate)
 *   - PAP — proactive-action protocol (LLM behavioral interventions)
 *   - EAP — execution-action protocol (LLM action across device fleets)
 *
 * COYL Cloud is the proprietary reference engine. The specs are open
 * (Apache 2.0). The play mirrors MCP / OAuth / Stripe — own the
 * protocol category, win on data + integration depth, not on lock-in.
 *
 * Editorial design matches the rest of the luxury overhaul — serif H1,
 * mono eyebrow, italic accent, hairline-rule sections, cream background.
 * Code excerpts sit in calm dark surfaces for readability.
 *
 * Sibling dedicated pages (built in parallel session): /pap, /eap.
 * Developer console + SDK examples live at /developers.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { BreadcrumbSchema } from '@/app/structured-data'
import { TryItLive } from './try-it-live'

// ISR — static editorial content; 1-day revalidate window. Full cacheComponents migration with cacheTag-based surgical invalidation tracked as a follow-up.
export const revalidate = 86400

export const metadata: Metadata = {
  title:
    'COYL Protocol — three open specs, one reference engine for proactive AI',
  description:
    'BIP for behavioral context. PAP for LLM proactive interventions. EAP for cross-device LLM action. Three layered open specs (Apache 2.0) and one proprietary reference engine — COYL Cloud — for any foundation lab, wearable, or consumer app that needs to act at the moment before behavior happens.',
  keywords: [
    'behavioral interrupt protocol',
    'proactive ai protocol',
    'cross-device llm action',
    'coyl protocol stack',
    'bip pap eap',
    'open protocol for proactive ai',
    'llm intervention protocol',
    'coyl cloud reference engine',
  ],
  alternates: { canonical: '/protocol' },
  openGraph: {
    title:
      'COYL Protocol — three open specs. One reference engine.',
    description:
      'BIP, PAP, EAP — the trust infrastructure for proactive AI. Apache 2.0 open standards with a hosted reference engine.',
    url: 'https://coyl.ai/protocol',
    images: [
      {
        url: '/api/og?title=Three+open+specs.+One+reference+engine.&kicker=The+Protocols',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'COYL Protocol — BIP + PAP + EAP',
    description:
      'Three open specs. One reference engine. The trust infrastructure for proactive AI.',
    images: [
      '/api/og?title=Three+open+specs.+One+reference+engine.&kicker=The+Protocols',
    ],
  },
}

export default function ProtocolPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'COYL', url: 'https://coyl.ai' },
          { name: 'Protocol', url: 'https://coyl.ai/protocol' },
        ]}
      />

      <article className="space-y-24 pb-12">
        {/* HEADER */}
        <header className="space-y-8">
          <div className="flex items-center gap-3">
            <span className="h-px w-12 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              The protocols
            </span>
          </div>

          <h1 className="font-serif text-6xl font-normal leading-[0.95] tracking-[-0.03em] text-gray-900 md:text-[6.5rem]">
            Three open specs.{' '}
            <span className="italic text-orange-600">
              One reference engine.
            </span>
          </h1>

          <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
            BIP for consumer apps. PAP for LLM behavioral interventions.
            EAP for cross-device LLM action. Together: the trust
            infrastructure for proactive AI.
          </p>

          <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
            <strong className="font-serif font-normal italic">
              MCP connected LLMs to software systems. The COYL stack
              connects LLMs to the human behavioral system — read,
              propose, act, with consent.
            </strong>{' '}
            The specs are open. The reference engine is ours.
          </p>
        </header>

        {/* THE STACK DIAGRAM */}
        <section className="space-y-10 border-t border-gray-200 pt-12">
          <div className="space-y-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              01 · The stack
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              Foundation labs at the top.{' '}
              <span className="italic text-orange-600">
                The user at the bottom.
              </span>{' '}
              Three protocols in between.
            </h2>
            <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
              Each layer has a single concern. EAP carries action across
              devices. PAP narrows action to behavioral interventions
              with safety guardrails. BIP is the substrate both
              consume — the behavioral state of the user at this moment.
            </p>
          </div>

          <StackDiagram />
        </section>

        {/* THE THREE PROTOCOL CARDS */}
        <section className="space-y-16">
          <div className="space-y-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              02 · The specs
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              Read the substrate. Propose the moment.{' '}
              <span className="italic text-orange-600">
                Act across the fleet.
              </span>
            </h2>
          </div>

          {/* BIP */}
          <ProtocolCard
            eyebrow="BIP v0.1 · Apache 2.0"
            title="Behavioral Interrupt Protocol"
            subtitle="The substrate."
            href="https://github.com/FutureEnterprises/chief-of-staff/blob/main/docs/protocol/BIP-0.1.md"
            ctaLabel="Read the spec on GitHub →"
            paragraphs={[
              'BIP is the consumer-side primitive. Apps emit behavioral signals (a tab-switch, an HRV spike, an open-fridge event). Apps consume a single read API that returns the user&rsquo;s current behavioral state — archetype, danger-window status, excuse pattern, risk level. No PII. Only behavioral abstractions.',
              'Wearables don&rsquo;t need to understand psychology. Calendar apps don&rsquo;t need to model attention. Each emits the signal it already collects; BIP coordinates the meaning. That coordination layer is what every LLM and every device today is missing.',
              'BIP is the substrate both PAP and EAP consume. If you only ship a consumer app, you implement BIP. If you ship an LLM or a device fleet, you read BIP and emit through PAP or EAP.',
            ]}
            snippets={[
              {
                title: 'Behavioral context (read)',
                lang: 'http',
                code: `GET /v1/context/{user_id}
Authorization: Bearer <token>

{
  "spec_version": "0.1",
  "archetype": "9PM_NEGOTIATOR",
  "archetype_confidence": 0.83,
  "danger_window_active": true,
  "current_excuse_category": "DESERVER",
  "self_trust_score": 74,
  "risk_level": "HIGH",
  "freshness": { "ttl_seconds": 60 }
}`,
              },
              {
                title: 'Signal emit (push)',
                lang: 'http',
                code: `POST /v1/signal
Authorization: Bearer <token>

{
  "user_id": "u_2sj8xks0a",
  "source": "apple_watch",
  "type": "hrv_spike",
  "magnitude": 0.71,
  "captured_at": "2026-05-21T21:47:03Z"
}`,
              },
              {
                title: 'Outcome webhook',
                lang: 'http',
                code: `POST <your_webhook_url>
X-BIP-Signature: sha256=<hmac>
X-BIP-Event: INTERRUPT_RESOLVED

{
  "event": "INTERRUPT_RESOLVED",
  "user_id": "u_2sj8xks0a",
  "outcome": "STOPPED",
  "elapsed_seconds": 47,
  "pattern_update": { "self_trust_score": 1 }
}`,
              },
            ]}
          />

          {/* PAP */}
          <ProtocolCard
            eyebrow="PAP v0.1 · Apache 2.0"
            title="Proactive-Action Protocol"
            subtitle="The behavioral intervention layer."
            href="/pap"
            ctaLabel="Read the PAP spec →"
            paragraphs={[
              'PAP is how LLMs propose behavioral interventions. A model reads BIP context, decides the moment is right, and submits a Proposal envelope to the COYL Coordinator. The envelope declares the proposed intervention, the rationale, the scope, the channel, and a reversibility class. The Coordinator decides whether to FIRE, DEFER, or REJECT.',
              'PAP exists because behavioral interventions are not free actions. They cost the user&rsquo;s attention. They can be wrong. They can be overcorrected. The Coordinator enforces rate limits across competing LLMs, dedups proposals targeting the same behavioral moment, checks user scope grants, and respects quiet hours. The user is never spammed by every model on the market firing at the same moment.',
              'PAP is the protocol foundation labs implement to make their assistants behaviorally aware without re-implementing the safety layer. Claude, GPT, and Gemini each emit Proposals. COYL Cloud arbitrates which one — if any — fires.',
            ]}
            snippets={[
              {
                title: 'Proposal envelope',
                lang: 'http',
                code: `POST /v1/pap/proposal
Authorization: Bearer <llm_partner_key>

{
  "spec_version": "0.1",
  "user_id": "u_2sj8xks0a",
  "proposing_llm": "claude-opus-4",
  "intent": "INTERRUPT_LATE_NIGHT_EATING",
  "rationale_summary": "9pm_negotiator pattern, danger window active",
  "reversibility": "REVERSIBLE",
  "channel_preference": ["push", "watch_haptic"],
  "expires_at": "2026-05-21T21:50:00Z"
}`,
              },
              {
                title: 'Coordinator decision',
                lang: 'http',
                code: `→ 200 OK
{
  "decision": "FIRE",
  "proposal_id": "prop_7xj2k9q",
  "dispatched_channels": ["push"],
  "rate_limit_remaining": 8,
  "competing_proposals_deduped": 2,
  "audit_log_id": "log_aQ91xx"
}`,
              },
              {
                title: 'Scope grants (consent)',
                lang: 'http',
                code: `GET /v1/pap/scope/{user_id}

{
  "grants": [
    {
      "llm_id": "claude-opus-4",
      "scopes": ["read:context", "propose:intervention"],
      "quiet_hours": ["22:30-07:00"],
      "monthly_intervention_cap": 1000,
      "revoked_at": null
    }
  ]
}`,
              },
            ]}
          />

          {/* EAP */}
          <ProtocolCard
            eyebrow="EAP v0.1 · Apache 2.0"
            title="Execution-Action Protocol"
            subtitle="The cross-device action layer."
            href="/eap"
            ctaLabel="Read the EAP spec →"
            paragraphs={[
              'EAP is the superset. An LLM authors an Action Request — vibrate this Watch, surface this Lock-Screen card, dim this room&rsquo;s lights, draft this message in the user&rsquo;s reply queue — and the Coordinator routes it to the right device bridge with the right consent, the right scope, and the right reversibility envelope.',
              'PAP is a subset of EAP focused on behavioral interventions. EAP covers everything else: ambient nudges, calendar actions, browser-context cards, watch glances, surfacing-on-Lock-Screen. The same Coordinator engine governs both. Same audit log. Same revocation surface.',
              'EAP is what makes &ldquo;your AI&rdquo; portable across devices without each device fleet needing a direct LLM integration. The LLM speaks EAP. The bridge translates. The user has one consent surface across every model, every device.',
            ]}
            snippets={[
              {
                title: 'Action request',
                lang: 'http',
                code: `POST /v1/eap/action
Authorization: Bearer <llm_partner_key>

{
  "spec_version": "0.1",
  "user_id": "u_2sj8xks0a",
  "action_type": "WATCH_HAPTIC_CARD",
  "payload": {
    "title": "Pause.",
    "body": "9:47pm. You&rsquo;re a deserver tonight.",
    "primary_action": "ACKNOWLEDGE",
    "secondary_action": "OVERRIDE"
  },
  "reversibility": "REVERSIBLE",
  "scope": "behavioral_intervention",
  "ttl_seconds": 180
}`,
              },
              {
                title: 'Device bridge dispatch',
                lang: 'http',
                code: `→ 200 OK
{
  "action_id": "act_9k2x7p",
  "bridge": "apple_watch_v1",
  "dispatched_at": "2026-05-21T21:47:08Z",
  "delivery_state": "DELIVERED",
  "user_response_expected_until": "2026-05-21T21:50:08Z"
}`,
              },
              {
                title: 'Irreversible-action gate',
                lang: 'http',
                code: `POST /v1/eap/action
{
  "action_type": "SEND_MESSAGE",
  "reversibility": "IRREVERSIBLE",
  ...
}

→ 202 Accepted
{
  "decision": "AWAITING_USER_CONFIRMATION",
  "confirmation_surface": "lock_screen_card",
  "confirmation_expires_at": "2026-05-21T21:48:00Z"
}`,
              },
            ]}
          />
        </section>

        {/* LIVE PROTOCOL SIMULATOR — per v2 strategy brief, the highest-leverage
            move on this page is converting the spec from "open doc" to "running
            integration you can hit right now." TryItLive POSTs to
            /api/v1/protocol/demo, which executes the production confidence-gate
            function in-process. Real coordinator decision, no auth, no DB writes. */}
        <section className="space-y-10 border-t border-orange-500 pt-16">
          <div className="space-y-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              02b · Live
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              The coordinator. <span className="italic text-orange-600">Not a diagram.</span>
            </h2>
            <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
              Pick a scenario. Slide a confidence. POST hits{' '}
              <code className="font-mono text-[13px] text-orange-600">
                /api/v1/protocol/demo
              </code>{' '}
              — which runs the same{' '}
              <code className="font-mono text-[13px] text-orange-600">
                isAboveConfidenceThreshold
              </code>{' '}
              function the production endpoint at{' '}
              <code className="font-mono text-[13px] text-orange-600">
                /api/pap/v1/proposal
              </code>{' '}
              uses. The decision you see is what the real coordinator returns.
            </p>
          </div>
          <TryItLive />
        </section>

        {/* FIRST PRODUCTION INTEGRATION — COYL Internal partner. Converts
            "open spec" to "Anthropic has already integrated us — why
            rebuild?" The /today server render emits a real PAPProposal
            row through this partner on every visit. Reviewers querying
            the audit table see real coordinator traffic from day one. */}
        <section className="space-y-10 border-t border-orange-500 pt-16">
          <div className="space-y-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              02c · First production integration
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              COYL is the first PAP partner.{' '}
              <span className="italic text-orange-600">Itself.</span>
            </h2>
            <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
              Every server-side render of{' '}
              <code className="font-mono text-[13px] text-orange-600">/today</code>{' '}
              emits a real PAPProposal row through the COYL Internal
              partner — partner id{' '}
              <code className="font-mono text-[13px] text-orange-600">
                coyl_internal
              </code>
              . The coordinator evaluates against the user&rsquo;s real state
              (panic, quiet hours, rate limit, dedup, confidence). The row
              persists. The proof is the row count.
            </p>
            <p className="max-w-2xl text-sm leading-[1.6] text-gray-600">
              Foundation-lab Trust &amp; Safety reviewers querying the audit
              table see real coordinator traffic from day one. The protocol
              is not aspirational. It is the production interrupt pipeline.
            </p>
          </div>
        </section>

        {/* WHY THREE PROTOCOLS, NOT ONE */}
        <section className="space-y-10 border-t border-gray-200 pt-16">
          <div className="space-y-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              03 · Why three, not one
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              Three concerns.{' '}
              <span className="italic text-orange-600">
                Three layers.
              </span>{' '}
              One coordinator.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            <LayerCard
              kicker="BIP — the substrate"
              title="Consumer-side. Read &amp; emit."
              body="BIP is what consumer apps and wearables implement. It carries behavioral signal in and behavioral state out. It is a substrate, not an action layer. Anything above it consumes it."
            />
            <LayerCard
              kicker="PAP — the behavior layer"
              title="LLM proposes. Coordinator arbitrates."
              body="PAP is narrowed to behavioral interventions. The envelope demands rationale + reversibility + scope. The Coordinator enforces rate limits across competing LLMs. The user is not bombarded by every model at the same moment."
            />
            <LayerCard
              kicker="EAP — the action layer"
              title="Cross-device action with consent envelopes."
              body="EAP is the superset. Any LLM action across any device — watch, phone, browser, lock screen, ambient — flows through EAP. PAP is a subset focused on behavioral interventions. Same audit. Same revocation. Same consent surface."
            />
          </div>

          <div className="rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-white p-8 md:p-12">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              The layering
            </p>
            <p className="mt-4 max-w-3xl font-serif text-2xl font-normal leading-[1.3] text-gray-900 md:text-3xl">
              EAP is the superset.{' '}
              <span className="italic text-orange-600">
                PAP is a subset focused on behavior.
              </span>{' '}
              BIP is the substrate both consume.
            </p>
            <p className="mt-6 max-w-2xl text-base leading-[1.7] text-gray-700">
              The separation is what lets a wearable implement only BIP
              without taking on action responsibility. It is what lets a
              foundation lab implement PAP for behavioral assistants
              without committing to the full EAP surface. It is what
              keeps the user&rsquo;s consent surface coherent across
              every model competing for the same moment.
            </p>
          </div>
        </section>

        {/* THE REFERENCE ENGINE — COYL CLOUD */}
        <section className="space-y-10 border-t border-gray-200 pt-16">
          <div className="space-y-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              04 · The reference engine
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              The specs are open.{' '}
              <span className="italic text-orange-600">
                COYL Cloud is ours.
              </span>
            </h2>
            <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
              Anyone can implement BIP, PAP, or EAP. COYL Cloud is the
              proprietary reference engine — the same play Anthropic ran
              with MCP, OAuth ran with authorization, Stripe ran with
              checkout. Win on data quality and integration depth, not
              on closed specs.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <EngineCapability
              kicker="The Coordinator engine"
              title="Rate limits. Dedup. Scope. Quiet hours."
              body="Across every LLM proposing through PAP. Across every action firing through EAP. One arbitration loop. One audit log. One revocation surface. Foundation labs do not need to build this. They route through it."
            />
            <EngineCapability
              kicker="Audit logs"
              title="Every proposal. Every decision. Every outcome."
              body="Append-only. User-visible. Exportable. Required for the kind of consumer trust that lets people grant proactive authority to an LLM in the first place. Required for the compliance surface enterprises actually buy."
            />
            <EngineCapability
              kicker="Device bridges"
              title="iOS. macOS. Watch. Browser."
              body="A library of first-party bridges that translate EAP Action Requests into platform-native primitives. LLMs author EAP. The bridges deliver. New devices ship; the bridges expand; the LLMs don&rsquo;t need to recompile."
            />
            <EngineCapability
              kicker="Consent UI"
              title="One surface across every model."
              body="The user sees every LLM that has authority, every scope granted, every quiet hour, every revocation. One mental model across Claude, GPT, Gemini, and whatever ships next. The thing every individual LLM&rsquo;s app can&rsquo;t build alone."
            />
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-8 md:p-12">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              Pricing
            </p>
            <h3 className="mt-4 font-serif text-2xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900 md:text-3xl">
              Free up to 1K interventions / user / LLM / month.
            </h3>
            <ul className="mt-6 space-y-3 text-base leading-[1.65] text-gray-700">
              <li className="flex gap-3">
                <span className="font-mono text-xs text-orange-600">·</span>
                <span>
                  <strong className="font-serif font-normal italic">
                    Free tier.
                  </strong>{' '}
                  1,000 interventions per user, per LLM partner, per
                  month. Zero cost.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-xs text-orange-600">·</span>
                <span>
                  <strong className="font-serif font-normal italic">
                    Usage.
                  </strong>{' '}
                  $0.001 per intervention above the free tier.
                  Coordinator decisions, audit logs, and bridge dispatch
                  included.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-xs text-orange-600">·</span>
                <span>
                  <strong className="font-serif font-normal italic">
                    Strategic seats.
                  </strong>{' '}
                  Foundation labs, large platforms, and category-defining
                  device fleets — reach out. We size the contract to the
                  integration depth.
                </span>
              </li>
            </ul>
          </div>
        </section>

        {/* GET STARTED — TWO PATHS */}
        <section className="space-y-10 border-t border-gray-200 pt-16">
          <div className="space-y-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              05 · Get started
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              Two paths in.{' '}
              <span className="italic text-orange-600">
                One stack underneath.
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <Link
              href="/developers"
              className="group block rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-white p-8 transition hover:border-orange-400 md:p-12"
            >
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                Path 01
              </p>
              <h3 className="mt-4 font-serif text-2xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900 md:text-3xl">
                I&rsquo;m an{' '}
                <span className="italic text-orange-600">LLM partner.</span>
              </h3>
              <p className="mt-4 text-base leading-[1.65] text-gray-700">
                Foundation lab, model provider, or assistant platform.
                You want to make your model behaviorally aware and
                authorized to act with consent. Implement PAP + EAP,
                route through COYL Cloud, ship in weeks not quarters.
              </p>
              <p className="mt-6 font-mono text-xs uppercase tracking-[0.28em] text-orange-600 group-hover:text-orange-700">
                Get an API key →
              </p>
            </Link>

            <Link
              href="/developers"
              className="group block rounded-3xl border border-gray-200 bg-white p-8 transition hover:border-orange-400 md:p-12"
            >
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                Path 02
              </p>
              <h3 className="mt-4 font-serif text-2xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900 md:text-3xl">
                I&rsquo;m an{' '}
                <span className="italic text-orange-600">app developer.</span>
              </h3>
              <p className="mt-4 text-base leading-[1.65] text-gray-700">
                Consumer app, wearable, telehealth, productivity, ADHD
                or GLP-1 tool. You want behavioral context without
                building the model layer yourself. Implement BIP, emit
                signals, consume context, ship the smarter product.
              </p>
              <p className="mt-6 font-mono text-xs uppercase tracking-[0.28em] text-orange-600 group-hover:text-orange-700">
                BIP SDK examples →
              </p>
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="space-y-10 border-t border-gray-200 pt-16">
          <div className="space-y-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              06 · The honest questions
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              What a corp-dev team{' '}
              <span className="italic text-orange-600">
                actually asks.
              </span>
            </h2>
          </div>

          <div className="space-y-10">
            {FAQ.map((item) => (
              <div
                key={item.q}
                className="grid grid-cols-1 gap-6 border-t border-gray-200 pt-8 md:grid-cols-12 md:gap-10"
              >
                <h3 className="font-serif text-xl font-normal leading-[1.25] tracking-[-0.01em] text-gray-900 md:col-span-5 md:text-2xl">
                  {item.q}
                </h3>
                <p className="text-base leading-[1.7] text-gray-700 md:col-span-7">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CLOSING BRAND ANCHOR */}
        <section className="space-y-12 border-t border-orange-500 pt-16">
          <blockquote className="max-w-4xl font-serif text-3xl font-normal italic leading-[1.25] text-gray-900 md:text-6xl">
            AI for the moment{' '}
            <span className="not-italic text-orange-600">
              before behavior happens.
            </span>
          </blockquote>

          <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
            Three open specs. One reference engine. The trust
            infrastructure for proactive AI — read the substrate,
            propose the intervention, act across the fleet, with
            consent.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/pap"
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
            >
              Read PAP →
            </Link>
            <Link
              href="/eap"
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
            >
              Read EAP →
            </Link>
            <Link
              href="/developers"
              className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:border-orange-300"
            >
              Developer console
            </Link>
            <a
              href="mailto:protocol@coyl.ai?subject=Partner%20interest"
              className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:border-orange-300"
            >
              Strategic partnership
            </a>
          </div>
        </section>
      </article>
    </>
  )
}

/**
 * The stack diagram — text-rendered as styled boxes + connectors so it
 * reads as editorial composition rather than a flat ASCII screenshot.
 * Mobile collapses connector spacing; desktop gets generous breathing
 * room. The orange accent rails reinforce the layering.
 */
function StackDiagram() {
  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <StackBox
        kicker="Top of stack"
        title="Foundation labs"
        subtitle="Anthropic · OpenAI · Google · …"
        tone="muted"
      />
      <StackConnector />
      <StackBox
        kicker="EAP v0.1"
        title="Cross-device action"
        subtitle="The superset. Any LLM action, any device, with consent."
        tone="accent"
      />
      <StackConnector />
      <StackBox
        kicker="PAP v0.1"
        title="LLM proactive intervention"
        subtitle="A subset of EAP. Behavioral interventions, arbitrated."
        tone="accent"
      />
      <StackConnector />
      <StackBox
        kicker="BIP v0.1"
        title="Behavioral context primitives"
        subtitle="The substrate. Read, emit, consume."
        tone="accent"
      />
      <StackConnector />
      <StackBox
        kicker="Bottom of stack"
        title="Consumer apps + users"
        subtitle="coyl.ai consumer · partner apps · wearables"
        tone="muted"
      />
    </div>
  )
}

function StackBox({
  kicker,
  title,
  subtitle,
  tone,
}: {
  kicker: string
  title: string
  subtitle: string
  tone: 'accent' | 'muted'
}) {
  const isAccent = tone === 'accent'
  return (
    <div
      className={[
        'rounded-2xl border px-6 py-5 text-center',
        isAccent
          ? 'border-orange-200 bg-gradient-to-br from-orange-50 via-white to-white shadow-[0_8px_24px_-12px_rgba(255,102,0,0.18)]'
          : 'border-gray-200 bg-white',
      ].join(' ')}
    >
      <p
        className={[
          'font-mono text-[10px] font-medium uppercase tracking-[0.32em]',
          isAccent ? 'text-orange-600' : 'text-gray-500',
        ].join(' ')}
      >
        {kicker}
      </p>
      <p className="mt-2 font-serif text-xl font-normal leading-[1.2] tracking-[-0.01em] text-gray-900">
        {title}
      </p>
      <p className="mt-2 text-sm leading-[1.55] text-gray-600">{subtitle}</p>
    </div>
  )
}

function StackConnector() {
  return (
    <div className="flex justify-center">
      <span className="h-6 w-px bg-orange-300" aria-hidden="true" />
    </div>
  )
}

/**
 * A protocol card — eyebrow, title, 2-3 paragraphs, primary CTA, and a
 * stack of three code excerpts (one per key primitive). Used three
 * times: BIP, PAP, EAP.
 */
function ProtocolCard({
  eyebrow,
  title,
  subtitle,
  href,
  ctaLabel,
  paragraphs,
  snippets,
}: {
  eyebrow: string
  title: string
  subtitle: string
  href: string
  ctaLabel: string
  paragraphs: string[]
  snippets: Array<{ title: string; lang: string; code: string }>
}) {
  const isExternal = href.startsWith('http')
  return (
    <div className="grid grid-cols-1 gap-10 border-t border-orange-500 pt-10 md:grid-cols-12 md:gap-12">
      <div className="md:col-span-5">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
          {eyebrow}
        </p>
        <h3 className="mt-4 font-serif text-3xl font-normal leading-[1.1] tracking-[-0.01em] text-gray-900 md:text-4xl">
          {title}{' '}
          <span className="italic text-orange-600">{subtitle}</span>
        </h3>
        <div className="mt-6 space-y-4">
          {paragraphs.map((p, i) => (
            <p
              key={i}
              className="text-base leading-[1.7] text-gray-700"
              dangerouslySetInnerHTML={{ __html: p }}
            />
          ))}
        </div>
        <div className="mt-8">
          {isExternal ? (
            <a
              href={href}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
            >
              {ctaLabel}
            </a>
          ) : (
            <Link
              href={href}
              className="inline-flex items-center rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
            >
              {ctaLabel}
            </Link>
          )}
        </div>
      </div>
      <div className="space-y-6 md:col-span-7">
        {snippets.map((s) => (
          <div key={s.title} className="space-y-2">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-gray-500">
              {s.title}
            </p>
            <CodeBlock lang={s.lang} code={s.code} />
          </div>
        ))}
      </div>
    </div>
  )
}

function LayerCard({
  kicker,
  title,
  body,
}: {
  kicker: string
  title: string
  body: string
}) {
  return (
    <div className="border-t border-orange-500 pt-6">
      <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
        {kicker}
      </p>
      <h3
        className="mt-4 font-serif text-2xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900"
        dangerouslySetInnerHTML={{ __html: title }}
      />
      <p className="mt-4 text-base leading-[1.65] text-gray-700">{body}</p>
    </div>
  )
}

function EngineCapability({
  kicker,
  title,
  body,
}: {
  kicker: string
  title: string
  body: string
}) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 md:p-8">
      <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
        {kicker}
      </p>
      <h3 className="mt-4 font-serif text-xl font-normal leading-[1.2] tracking-[-0.01em] text-gray-900 md:text-2xl">
        {title}
      </h3>
      <p className="mt-4 text-base leading-[1.65] text-gray-700">{body}</p>
    </div>
  )
}

/**
 * Calm dark code-block surface that survives on the cream marketing
 * canvas without breaking the editorial palette. Mono + tight leading
 * + warm dark bg so it reads as a real spec excerpt, not a screenshot.
 */
function CodeBlock({ code, lang }: { code: string; lang: string }) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-[#1b1f24] bg-[#0f1115] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.18)]">
      <figcaption className="border-b border-white/[0.04] bg-white/[0.02] px-5 py-2 font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a847a]">
        {lang}
      </figcaption>
      <pre className="overflow-x-auto px-5 py-5 font-mono text-[12.5px] leading-[1.55] text-[#e6e2da]">
        {code}
      </pre>
    </figure>
  )
}

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: 'Why publish the spec open-source if it&rsquo;s your moat?',
    a: 'Because the moat is not the spec. The moat is the reference engine + the data quality + the integration library + the consent surface the user actually trusts. Anthropic open-sourced MCP. OAuth was open. Stripe Checkout integrations were open. The spec being open is what makes the category exist. The engine being ours is what makes the company exist.',
  },
  {
    q: 'What stops Anthropic from building this themselves?',
    a: 'Nothing stops them from implementing the spec — that&rsquo;s the point. What stops them from owning the category is the cross-LLM coordination problem. The user&rsquo;s consent surface has to span every model. The audit log has to be neutral. A single foundation lab cannot credibly arbitrate proposals from its competitors. The Coordinator has to be Switzerland. That&rsquo;s the structural reason this layer is not first-party LLM work.',
  },
  {
    q: 'How do you handle rate limits across competing LLMs?',
    a: 'The Coordinator runs per-user, per-LLM, and per-moment rate limits. Per-user caps the total interventions the user receives in any window. Per-LLM enforces the partner&rsquo;s grant. Per-moment dedups overlapping proposals targeting the same behavioral window — if Claude and GPT both detect the 9pm pattern, only one fires, chosen by user-set preference rules. The user can&rsquo;t be spammed by every model on the market firing at once.',
  },
  {
    q: 'Can users revoke any LLM&rsquo;s authority?',
    a: 'Yes — that&rsquo;s the consent surface. The user sees every LLM that holds any scope, every grant, every quiet hour. Revocation is one tap, takes effect on the next proposal, and is persisted in the audit log. Without this surface, no user grants proactive authority. With it, they do.',
  },
  {
    q: 'How do you handle irreversible actions like &ldquo;send a message&rdquo; or &ldquo;make a purchase&rdquo;?',
    a: 'EAP requires every Action Request to declare a reversibility class — REVERSIBLE, REVERSIBLE_WITHIN_WINDOW, or IRREVERSIBLE. Irreversible actions never auto-fire. The Coordinator returns AWAITING_USER_CONFIRMATION and pushes a confirmation surface (lock-screen card, watch glance, app intent) with a short TTL. The LLM never directly executes irreversible action; the user does. Same envelope, hard guarantee.',
  },
  {
    q: 'What&rsquo;s the latency for action firing?',
    a: 'Signal-to-decision is sub-200ms on the Coordinator. Decision-to-bridge-delivery depends on the device — watch haptic is sub-second, push is one to three seconds, lock-screen card is bound by the device&rsquo;s next-render frame. We expose end-to-end latency in the audit log so partners can measure their own moments without instrumentation.',
  },
  {
    q: 'What about Apple? They won&rsquo;t adopt this.',
    a: 'Apple doesn&rsquo;t need to adopt the spec for the spec to work — the device bridges run inside our reference engine. We use the surfaces Apple already exposes (push, App Intents, Watch complications, Live Activities, Lock-Screen widgets). If Apple ever builds a first-party version, the spec is what their developers cite to argue for parity. The protocol is the policy lever.',
  },
  {
    q: 'What&rsquo;s COYL Cloud&rsquo;s pricing?',
    a: 'Free up to 1,000 interventions per user, per LLM partner, per month. $0.001 per intervention above that, with Coordinator, audit log, and bridge dispatch all included. Strategic seats for foundation labs and category-defining device fleets are sized to integration depth — reach out and we&rsquo;ll size the contract together.',
  },
]
