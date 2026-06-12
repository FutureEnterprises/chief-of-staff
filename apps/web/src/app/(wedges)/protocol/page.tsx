/**
 * /protocol — unified developer entry point for the COYL protocol stack.
 *
 * Today this page is the front door for foundation labs (Anthropic,
 * OpenAI, Google), wearable platforms, and consumer-app developers
 * evaluating the COYL stack. It showcases all four open specs as one
 * coherent layered protocol:
 *
 *   - BIP — behavioral context primitives (consumer-app substrate)
 *   - PAP — proactive-action protocol (LLM behavioral interventions)
 *   - EAP — execution-action protocol (LLM action across device fleets)
 *   - UAP — user-authority protocol (standing-authority layer)
 *
 * COYL Cloud is the proprietary reference engine. The specs are open
 * (Apache 2.0). The play mirrors MCP / OAuth / Stripe — own the
 * protocol category, win on data + integration depth, not on lock-in.
 *
 * Editorial design matches the rest of the luxury overhaul — serif H1,
 * mono eyebrow, italic accent, hairline-rule sections, cream background.
 * Code excerpts sit in calm dark surfaces for readability.
 *
 * Sibling dedicated pages (built in parallel session): /pap, /eap, /uap.
 * Developer console + SDK examples live at /developers.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { cacheLife, cacheTag } from 'next/cache'
import { BreadcrumbSchema } from '@/app/structured-data'
import { TryItLive } from './try-it-live'
import {
  CinematicScrim,
  CinematicEyebrow,
  CinematicDisplay,
  CinematicBody,
} from '@/components/cinematic'

// Cache Components migration: replaces `export const revalidate = 86400`
// with surgical, tag-based invalidation. Admin marketing edits call
// revalidateTag('marketing-protocol') to invalidate this one page
// without waiting on the daily revalidate window.

export const metadata: Metadata = {
  title:
    'COYL Protocol — the authority layer for LLMs acting in the world',
  description:
    'Permission, audit, control, and provenance for agents acting on a person’s behalf — scoped, revocable, rate-limited, auditable, provenance-signed, kill-switchable, portable across models and devices. Five orthogonal open specs (Apache 2.0); reference engine + @coyl/protocol SDK in alpha; design partners invited.',
  keywords: [
    'authority layer for ai agents',
    'agentic ai consent',
    'ai agent kill switch',
    'provenance for ai actions',
    'agent permission and audit',
    'standing authority for ai',
    'coyl protocol stack',
    'open protocol for ai agents',
    'cross-device llm action',
    'behavioral interrupt protocol',
  ],
  alternates: { canonical: '/protocol' },
  openGraph: {
    title:
      'COYL Protocol — the authority layer for LLMs acting in the world',
    description:
      'Permission, audit, control, and provenance for agents acting on a person’s behalf. Apache 2.0 specs; alpha reference engine + SDK; design partners invited.',
    url: 'https://coyl.ai/protocol',
    images: [
      {
        url: '/api/og?title=The+authority+layer+for+LLMs+acting+in+the+world&kicker=The+Protocols',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'COYL Protocol — the authority layer for LLMs acting',
    description:
      'Permission, audit, control, and provenance for agents acting on a person’s behalf. Apache 2.0 specs; alpha engine + SDK; design partners invited.',
    images: [
      '/api/og?title=The+authority+layer+for+LLMs+acting+in+the+world&kicker=The+Protocols',
    ],
  },
}

export default async function ProtocolPage() {
  'use cache'
  cacheLife('days')
  cacheTag('marketing-protocol')

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'COYL', url: 'https://coyl.ai' },
          { name: 'Protocol', url: 'https://coyl.ai/protocol' },
        ]}
      />

      {/* HEADER — cinematic dark scrim. The behavior-blindness opener
          sits in the cinematic surface so the page reads as one
          coherent chapter shift before dropping into the cream
          editorial body below. */}
      <CinematicScrim bleedToCream className="-mx-6 -mt-24 px-6 pt-32 pb-20 md:-mx-12 md:px-12 md:pt-40 md:pb-28">
        <header className="mx-auto max-w-5xl space-y-10">
          <CinematicEyebrow label="The protocol stack" />

          <CinematicDisplay as="h1" variant="hero">
            COYL is the authority layer for{' '}
            <span className="italic text-orange-300">
              LLMs acting in the world.
            </span>
          </CinematicDisplay>

          <CinematicBody tone="muted">
            MCP connects agents to tools. A2A lets agents talk to
            agents. COYL is the layer underneath both:{' '}
            <strong className="font-serif font-normal italic text-[#f8f1e4]">
              permission, audit, control, and provenance
            </strong>{' '}
            for an agent acting on a person&rsquo;s behalf. Scoped,
            revocable, rate-limited, auditable, provenance-signed,
            kill-switchable — and portable across every model and
            device.
          </CinematicBody>

          <CinematicBody tone="muted">
            The moment an LLM stops answering and starts acting for
            someone, it needs a contract for what it&rsquo;s allowed to
            do, who it answers to, and how the person takes control
            back. That contract is five orthogonal layers — read,
            propose, act, hold standing authority, and stop — each
            implementable on its own, each implemented in this
            repository today.
          </CinematicBody>

          <CinematicBody tone="dim" className="text-base md:text-base">
            The specs are open (Apache&nbsp;2.0). The reference engine
            and the typed{' '}
            <code className="text-orange-300">@coyl/protocol</code> SDK
            are in alpha. Below: the stack, a coordinator you can hit
            right now, and the safety floor a Trust &amp; Safety
            reviewer asks about first.{' '}
            <Link href="/uap" className="text-orange-300 underline-offset-4 hover:underline">
              UAP
            </Link>{' '}
            ·{' '}
            <Link href="/rap" className="text-orange-300 underline-offset-4 hover:underline">
              RAP
            </Link>
          </CinematicBody>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href="mailto:protocol@coyl.ai?subject=Design%20partner%20interest"
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
            >
              Become a design partner &rarr;
            </a>
            <Link
              href="/developers"
              className="rounded-full border border-white/15 bg-white/[0.04] px-6 py-3 text-sm font-medium text-[#e7dccb] hover:border-orange-300 hover:text-orange-300"
            >
              Developer console
            </Link>
          </div>
        </header>
      </CinematicScrim>

      <article className="space-y-24 pb-12">
        {/* CONSENT FOUNDATION — per the user's protocol audit ("UAP
            is actually the foundation. Without it, BIP/PAP/EAP can
            become manipulative or creepy. The AI must first know:
            what did the user authorize me to help with, and how far
            can I go?"). Sits ABOVE the stack diagram as the framing
            line for the whole architecture. */}
        <section className="space-y-8 pt-4">
          <CinematicEyebrow label="00 · The foundation" tone="muted" />
          <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            <span className="italic text-orange-600">Permission</span> is the
            only thing that lets an agent act safely on your behalf.
          </h2>
          <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
            Standing authority — the User-Authority Protocol — sits at
            the foundation of the stack. It answers the question every
            other layer depends on:{' '}
            <em>
              what did the person authorize this agent to do, and how
              far can it go?
            </em>{' '}
            Every other layer reads that answer before it fires. Every
            grant is bounded, revocable, kill-switch-first, and
            auditable.
          </p>
          <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
            <strong className="font-serif font-normal italic">
              MCP connects agents to tools. A2A lets agents talk to
              agents. COYL is the permission, audit, and control layer
              underneath
            </strong>{' '}
            — the part that says what an agent may do on a real
            person&rsquo;s behalf, records what it did, and lets that
            person take it all back in one move.
          </p>
        </section>

        {/* THE STACK DIAGRAM */}
        <section className="space-y-10 border-t border-gray-200 pt-12">
          <div className="space-y-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              01 · The stack
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              UAP at the foundation.{' '}
              <span className="italic text-orange-600">
                RAP as the override.
              </span>{' '}
              Five orthogonal layers, each implementable independently.
            </h2>
            <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
              UAP holds the user&rsquo;s standing authority — what the
              model is permitted to do. BIP is the substrate that says
              what loop the user is in. PAP narrows action to
              behavioral interventions with safety guardrails. EAP
              carries action across devices, one action at a time.
              RAP sits at the override layer: when risk crosses the
              floor, it stops every other protocol and routes to a
              human. Each layer can be implemented independently.
            </p>
          </div>

          <StackDiagram />
        </section>

        {/* WHAT'S ACTUALLY SHIPPED — the credibility proof. SDK + demo +
            live safety floor, in plain English, before the per-protocol
            code cards. These assets exist in this repo today. */}
        <section className="space-y-10 border-t border-gray-200 pt-16">
          <div className="space-y-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              01b · What&rsquo;s actually shipped
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              A typed SDK, a runnable demo, and a live safety floor.{' '}
              <span className="italic text-orange-600">
                Not a slide deck.
              </span>
            </h2>
            <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
              The five-layer stack is implemented in this repository —
              read, propose, act, standing-authority, safety-floor. The
              specs are Apache&nbsp;2.0; the reference engine and the SDK
              are alpha. Three proofs make that concrete.
            </p>
          </div>

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
                A typed, zero-dependency TypeScript client. <code className="font-mono text-[13px] text-orange-600">UAPClient</code>{' '}
                does grant / precheck / execute / revoke / audit /
                kill-switch / verify-provenance.{' '}
                <code className="font-mono text-[13px] text-orange-600">EAPDeviceClient</code>{' '}
                registers a device, polls for approved actions, reports
                outcomes, and publishes sensor snapshots. Typed against
                the live route handlers — wire shapes can change before
                1.0.
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
                One script walks the whole trust contract: grant →
                reversible action allowed and audited → irreversible
                send <strong className="font-serif font-normal italic">denied</strong>{' '}
                (it fails closed) → provenance verified on an allowed
                representation action → kill switch → the next action is
                dead. The fail-closed denial is the point.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                The safety floor · live
              </p>
              <h3 className="mt-3 font-serif text-xl font-normal leading-[1.2] tracking-[-0.01em] text-gray-900 md:text-2xl">
                Gates both paths. First.
              </h3>
              <p className="mt-3 text-sm leading-[1.65] text-gray-700">
                The closed-coaching-path check runs ahead of every other
                gate on the agent path — a crisis-class assessment denies
                a proposal or a standing-authority execution before scope
                or rate limits are even read. The same check runs before
                any consumer interrupt: a person in a closed path is never
                nudged. Classifier, routing envelopes, and store are
                implemented today.
              </p>
            </div>
          </div>
        </section>

        {/* THE FOUR PROTOCOL CARDS */}
        <section className="space-y-16">
          <div className="space-y-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              02 · The specs
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              Read the substrate. Propose the moment. Act across the fleet.{' '}
              <span className="italic text-orange-600">
                Hold standing authority.
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

          {/* UAP */}
          <ProtocolCard
            eyebrow="UAP v0.1 · Apache 2.0"
            title="User-Authority Protocol"
            subtitle="The standing-authority layer."
            href="https://github.com/FutureEnterprises/chief-of-staff/blob/main/docs/protocol/UAP-0.1.md"
            ctaLabel="Read the spec on GitHub →"
            paragraphs={[
              'UAP is the fourth layer of the COYL stack — the trust contract a user issues to an LLM when they want autonomous action without per-action consent. BIP, PAP, and EAP all assume the user is present: the model proposes, the user confirms, the action fires. UAP is for the moments the user is absent. Daily routines. Tomorrow&rsquo;s calendar. Recurring purchases. Scheduled deliveries. The category every foundation lab is shipping in 2026, with no defensible consent model under it.',
              'UAP defines exactly eight primitives — GRANT, REVOKE, KILL_SWITCH, PRECHECK, EXECUTE, EXPIRE, RULE_DECLARE, AUDIT_QUERY — and a small set of hard invariants. Every grant has a bounded expiry (90 days max, 7 days default). Irreversibles always re-confirm, even under standing grant. The kill switch supersedes every grant, every rule, every in-flight action, and propagates across all surfaces in five seconds. The audit log is append-only, cryptographically signed, and owned by the user — not the LLM, not COYL.',
              'The strategic read is this: the capability for agentic AI exists today. The trust infrastructure does not. UAP is the layer that lets foundation labs ship agentic AI safely without each inventing a brittle ad-hoc consent model — and the layer that, by virtue of being open-spec, audit-defaulted, kill-switch-first, and cross-LLM portable, cannot be reasonably forked by any single lab without losing the portability that gives it value. The protocol is the trust contract. The trust contract is the moat.',
            ]}
            snippets={[
              {
                title: 'GRANT request',
                lang: 'http',
                code: `POST /api/uap/v1/grant
Authorization: Bearer coyl_uap_<partner_id>_<secret>

{
  "user_id": "u_2sj8xks0a",
  "scopes": [
    "calendar.write",
    "messaging.routine",
    "purchase.recurring"
  ],
  "expires_at": "2026-05-29T17:00:00Z",
  "rules": [
    { "kind": "spending_cap", "max_per_action_usd": 50 },
    { "kind": "quiet_hours", "from": "00:00", "to": "07:00",
      "tz": "America/Los_Angeles" },
    { "kind": "irreversible_floor",
      "always_confirm": ["money_transfer", "share_pii"] }
  ],
  "consent_artifact": {
    "version": "0.1",
    "shown_to_user_at": "2026-05-22T16:58:00Z",
    "user_response": "explicit_grant",
    "ui_surface": "settings.standing_authority"
  }
}`,
              },
              {
                title: 'KILL_SWITCH request',
                lang: 'http',
                code: `POST /api/uap/v1/kill-switch
Authorization: <user session, not partner token>

{
  "user_id": "u_2sj8xks0a",
  "reason": "user_initiated"
}

→ 200 OK
{
  "killed": true,
  "affected_grant_count": 7,
  "propagation_deadline": "2026-05-22T17:02:19Z",
  "audit_url": "https://coyl.ai/audit/uap/kill_aD9k2x"
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
              function the proposal endpoint at{' '}
              <code className="font-mono text-[13px] text-orange-600">
                /api/pap/v1/proposal
              </code>{' '}
              uses. The decision you see is what the reference coordinator
              returns — no auth, no database writes.
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
              02c · The first integration is COYL itself
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              We run our own coordinator before we ask{' '}
              <span className="italic text-orange-600">anyone else to.</span>
            </h2>
            <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
              COYL&rsquo;s own consumer app is the first partner to the
              proposal coordinator. It emits proposals through an internal
              partner — partner id{' '}
              <code className="font-mono text-[13px] text-orange-600">
                coyl_internal
              </code>
              {' '}— and the coordinator evaluates each one against real
              user state: panic, quiet hours, rate limit, dedup,
              confidence, and the RAP safety floor first. Every decision is
              audited.
            </p>
            <p className="max-w-2xl text-sm leading-[1.6] text-gray-600">
              A reviewer querying the audit table sees the coordinator
              making real decisions against real state — not a mock. The
              stack isn&rsquo;t aspirational; it&rsquo;s the same path
              COYL&rsquo;s own interrupts already run through. The engine
              is alpha and design-partner-invited, not a public hosted
              production service.
            </p>
          </div>
        </section>

        {/* WHY SEPARATE LAYERS, NOT ONE */}
        <section className="space-y-10 border-t border-gray-200 pt-16">
          <div className="space-y-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              03 · Why separate layers, not one
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              Separate concerns.{' '}
              <span className="italic text-orange-600">
                Separate layers.
              </span>{' '}
              One coordinator, one safety floor.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
            <LayerCard
              kicker="BIP — the substrate"
              title="Consumer-side. Read &amp; emit."
              body="BIP is what consumer apps and wearables implement. It carries behavioral signal in and behavioral state out. It is a substrate, not an action layer. Everything above it consumes it."
            />
            <LayerCard
              kicker="PAP — the behavior layer"
              title="LLM proposes. Coordinator arbitrates."
              body="PAP is narrowed to behavioral interventions. The envelope demands rationale + reversibility + scope. The Coordinator enforces rate limits across competing LLMs. The user is not bombarded by every model at the same moment."
            />
            <LayerCard
              kicker="EAP — the action layer"
              title="Cross-device action with consent envelopes."
              body="EAP carries one action at a time across watch, phone, browser, lock screen, and ambient surfaces. Per-action confirmation for irreversibles. Same audit. Same revocation. Same consent surface — while the user is present."
            />
            <LayerCard
              kicker="UAP — the standing-authority layer"
              title="User-level. Grant &amp; revoke."
              body="UAP is for the moments the user is absent. The user issues a bounded grant — scope-limited, time-limited, rule-governed. The model acts under it. Every execute is audit-signed. Expiry is hard. The kill switch revokes everything fast. It&rsquo;s the layer that lets a team ship agents that act on a person&rsquo;s behalf without inventing a brittle consent model per product."
            />
          </div>

          <div className="rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-white p-8 md:p-12">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              The layering
            </p>
            <p className="mt-4 max-w-3xl font-serif text-2xl font-normal leading-[1.3] text-gray-900 md:text-3xl">
              UAP holds standing authority.{' '}
              <span className="italic text-orange-600">
                EAP carries one action.
              </span>{' '}
              PAP narrows to behavior. BIP is the substrate all three
              consume. RAP is the safety floor that overrides them all.
            </p>
            <p className="mt-6 max-w-2xl text-base leading-[1.7] text-gray-700">
              The separation is what lets a wearable implement only BIP
              without taking on action responsibility. It is what lets a
              foundation lab implement PAP for behavioral assistants
              without committing to the full EAP surface. It is what
              lets a labs partner build agentic-AI features on UAP
              without re-inventing the consent UI, the audit log, or the
              kill-switch propagation guarantee. The user&rsquo;s consent
              surface stays coherent across every model competing for
              the same moment and across every grant standing in the
              background.
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
                The reference engine is ours.
              </span>
            </h2>
            <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
              Anyone can implement the specs. COYL maintains the reference
              engine — the coordinator, the audit log, the device bridges,
              and the consent surface — the same way an open standard is
              anchored by a canonical implementation. The category exists
              because the contract is open; the company exists because the
              engine and the integration depth are ours. The engine is in
              alpha today.
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
              Where this stands
            </p>
            <h3 className="mt-4 font-serif text-2xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900 md:text-3xl">
              Specs published. Engine and SDK in alpha.{' '}
              <span className="italic text-orange-600">
                Design partners invited.
              </span>
            </h3>
            <ul className="mt-6 space-y-3 text-base leading-[1.65] text-gray-700">
              <li className="flex gap-3">
                <span className="font-mono text-xs text-orange-600">·</span>
                <span>
                  <strong className="font-serif font-normal italic">
                    The specs.
                  </strong>{' '}
                  Apache&nbsp;2.0, published, free to implement. The open
                  contract is what makes the category real.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-xs text-orange-600">·</span>
                <span>
                  <strong className="font-serif font-normal italic">
                    The engine + SDK.
                  </strong>{' '}
                  The reference coordinators, the safety floor, the typed{' '}
                  <code className="font-mono text-[13px] text-orange-600">
                    @coyl/protocol
                  </code>{' '}
                  client, and the runnable demo are in this repo, in alpha.
                  Wire shapes may still change before 1.0.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-xs text-orange-600">·</span>
                <span>
                  <strong className="font-serif font-normal italic">
                    Commercial terms.
                  </strong>{' '}
                  A design-partner conversation, not a public price list.
                  We&rsquo;d rather shape the integration with you than
                  hand you a finished black box.
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
                You want your model authorized to act on a person&rsquo;s
                behalf — with permission, audit, control, and provenance
                you don&rsquo;t have to reinvent. Implement the propose +
                act layers and route through the reference coordinator.
              </p>
              <p className="mt-6 font-mono text-xs uppercase tracking-[0.28em] text-orange-600 group-hover:text-orange-700">
                Become a design partner →
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
              What an AI platform team{' '}
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
          <blockquote className="max-w-4xl font-serif text-3xl font-normal italic leading-[1.15] tracking-[-0.02em] text-gray-900 md:text-6xl">
            The authority layer for{' '}
            <span className="not-italic text-orange-600">
              LLMs acting in the world.
            </span>
          </blockquote>

          <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
            Permission, audit, control, and provenance for an agent
            acting on a person&rsquo;s behalf — read the context, propose
            the moment, act across the fleet, hold bounded standing
            authority, and stop at the safety floor. Five open specs; an
            alpha reference engine and SDK; design partners invited.
          </p>

          <div className="flex flex-wrap gap-3">
            <a
              href="mailto:protocol@coyl.ai?subject=Design%20partner%20interest"
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
            >
              Become a design partner →
            </a>
            <Link
              href="/developers"
              className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:border-orange-300"
            >
              Developer console
            </Link>
            <Link
              href="/uap"
              className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:border-orange-300"
            >
              Read UAP
            </Link>
            <Link
              href="/rap"
              className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:border-orange-300"
            >
              Read RAP
            </Link>
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
  // Reordered May 2026 per the user's protocol audit: consent-first
  // means UAP belongs at the foundation, not in the middle. RAP sits
  // at the override-top because when it fires it stops every other
  // protocol. Visual reads bottom-up — foundation first, override
  // last — which matches "what loads the system" rather than "where
  // the request enters."
  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <StackBox
        kicker="Override layer · fires when risk crosses the floor"
        title="RAP v0.1 · draft"
        subtitle="When the AI stops coaching and routes to a human. Overrides every other layer."
        tone="accent"
      />
      <StackConnector />
      <StackBox
        kicker="Action layer"
        title="EAP v0.1 · cross-device action"
        subtitle="Per-action execution across the device fleet, with consent + reversibility envelopes."
        tone="accent"
      />
      <StackConnector />
      <StackBox
        kicker="Proposal layer"
        title="PAP v0.1 · proactive intervention"
        subtitle="LLMs propose, coordinator arbitrates. Multi-vendor Switzerland for behavioral interrupts."
        tone="accent"
      />
      <StackConnector />
      <StackBox
        kicker="Substrate layer"
        title="BIP v0.1 · behavioral context"
        subtitle="What loop is the user in right now. The primitive other layers read."
        tone="accent"
      />
      <StackConnector />
      <StackBox
        kicker="Foundation · what the user permits"
        title="UAP v0.1 · standing authority"
        subtitle="The consent surface every other layer reads before firing. Bounded grants. Kill-switch first."
        tone="accent"
      />
      <StackConnector />
      <StackBox
        kicker="Bottom of stack"
        title="The user"
        subtitle="Who issues UAP grants. Who any of this exists to serve."
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
 * stack of code excerpts (one per key primitive). Used four times:
 * BIP, PAP, EAP, UAP.
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
    q: 'When does the AI stop coaching and route to a human?',
    a: 'That&rsquo;s the safety floor — the Risk Assessment Protocol — and it&rsquo;s implemented, not promised. A per-moment classifier assigns a risk class; a crisis or emergency class closes the coaching path and emits a jurisdiction-aware routing envelope. The closed-path check runs as the first gate on both the agent path (the proposal coordinator and standing-authority execution both deny ahead of scope and rate limits) and the consumer interrupt path (a person in a closed path is never nudged). Nothing reopens the path until a human-reviewed reopen is logged. This is the question a Trust &amp; Safety reviewer asks first; we answer it in code.',
  },
  {
    q: 'How does an action carry proof of who acted, and under whose authority?',
    a: 'Every allowed representation action is provenance-signed. The signed envelope names the acting agent and the subject, and is verifiable through a public, unauthenticated endpoint — so a recipient can confirm an action was taken by a specific agent under a specific standing grant. Irreversible representation actions hit the irreversibility floor first and are denied for per-action confirmation, so they are never signed-and-sent silently. The runnable demo verifies a real signature end to end.',
  },
  {
    q: 'What about Apple? They won&rsquo;t adopt this.',
    a: 'Apple doesn&rsquo;t need to adopt the spec for the spec to work — the device bridges run inside our reference engine. We use the surfaces Apple already exposes (push, App Intents, Watch complications, Live Activities, Lock-Screen widgets). If Apple ever builds a first-party version, the spec is what their developers cite to argue for parity. The protocol is the policy lever.',
  },
  {
    q: 'What&rsquo;s the status — can we use this in production today?',
    a: 'Honest answer: the five specs are published under Apache 2.0; the reference engine and the @coyl/protocol SDK are in alpha, in this repository, with the safety floor, the coordinators, and a runnable authority demo all implemented. There is no public hosted production API with an uptime promise — and we&rsquo;re not going to claim one. We&rsquo;re inviting design partners precisely so the engine hardens against real integrations before 1.0. Commercial terms are part of that conversation, not a published price list.',
  },
]
