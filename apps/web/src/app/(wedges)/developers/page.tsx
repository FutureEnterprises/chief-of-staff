/**
 * /developers — getting-started surface for the Behavioral Interrupt
 * Protocol.
 *
 * /protocol is the spec announcement (WHAT). This page is the
 * developer onboarding (HOW). Same MCP-shaped strategy: open the spec
 * over there, win on developer experience over here. The first 60
 * seconds matter — show the smallest possible "your first BIP call"
 * snippet above the fold, then let the rest of the page do the
 * heavy onboarding lift.
 *
 * Editorial luxury treatment matches the rest of the wedge surfaces:
 * Instrument Serif H1 with italic-orange accent, mono kicker eyebrow,
 * hairline rules, cream canvas. Code blocks sit in a calm warm-dark
 * surface so they read as real engineering, not screenshots.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { BreadcrumbSchema } from '@/app/structured-data'

export const metadata: Metadata = {
  title: 'COYL Developers — build against the Behavioral Interrupt Protocol',
  description:
    'Get started with the Behavioral Interrupt Protocol in 5 minutes. SDK examples in TypeScript and Python, OAuth scopes, webhook patterns, and the BIP-Compatible badge program — everything you need to ship behaviorally-aware AI.',
  keywords: [
    'coyl developers',
    'bip sdk',
    'behavioral interrupt protocol sdk',
    'behavioral context api',
    'coyl protocol typescript',
    'coyl protocol python',
    'bip compatible',
  ],
  alternates: { canonical: '/developers' },
  openGraph: {
    title: 'COYL Developers — build against the Behavioral Interrupt Protocol',
    description:
      'SDKs, code examples, OAuth scopes, webhook patterns. Ship behaviorally-aware AI in 5 minutes.',
    url: 'https://coyl.ai/developers',
    images: [
      {
        url: '/api/og?title=Build+against+the+protocol.&kicker=Developers',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'COYL Developers',
    description:
      'Build behaviorally-aware AI on the Behavioral Interrupt Protocol. SDKs, scopes, webhooks.',
    images: ['/api/og?title=Build+against+the+protocol.&kicker=Developers'],
  },
}

export default function DevelopersPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'COYL', url: 'https://coyl.ai' },
          { name: 'Developers', url: 'https://coyl.ai/developers' },
        ]}
      />

      <article className="space-y-24 pb-12">
        <header className="space-y-8">
          <div className="flex items-center gap-3">
            <span className="h-px w-12 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              Developers · BIP v0.1
            </span>
          </div>

          <h1 className="font-serif text-6xl font-normal leading-[0.95] tracking-[-0.03em] text-gray-900 md:text-[6.5rem]">
            Build against the{' '}
            <span className="italic text-orange-600">protocol.</span>
          </h1>

          <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
            Your first BIP call in sixty seconds. Read a user&rsquo;s
            current behavioral context, push an interrupt trigger from a
            wearable, or subscribe to outcome webhooks — pick a surface,
            paste a snippet, ship a behaviorally-aware feature.
          </p>

          <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
            <strong className="font-serif font-normal italic">
              This page is the how. The{' '}
              <Link
                href="/protocol"
                className="underline decoration-orange-500/40 underline-offset-4 hover:decoration-orange-500"
              >
                v0.1 spec
              </Link>{' '}
              is the what.
            </strong>{' '}
            If you&rsquo;re evaluating BIP as a category, start at the
            spec. If you&rsquo;re ready to integrate, stay here.
          </p>
        </header>

        {/* SECTION 01 — 5-MINUTE INTEGRATION */}
        <section className="space-y-10">
          <div className="space-y-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              01 · 5-minute integration
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              Your first BIP call.{' '}
              <span className="italic text-orange-600">Read the context.</span>
            </h2>
            <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
              Install one of the official SDKs (forthcoming —{' '}
              <code className="rounded bg-orange-50 px-1.5 py-0.5 font-mono text-[12px] text-orange-700">
                @coyl/protocol
              </code>{' '}
              for TypeScript,{' '}
              <code className="rounded bg-orange-50 px-1.5 py-0.5 font-mono text-[12px] text-orange-700">
                coyl_protocol
              </code>{' '}
              for Python). Authenticate with an API key. Read the user&rsquo;s
              behavioral context. Branch on it. That&rsquo;s the integration.
            </p>
          </div>

          <CodeBlock
            lang="typescript"
            code={`// @coyl/protocol — Read a user's behavioral context (TypeScript)
import { CoylProtocol } from '@coyl/protocol'

const coyl = new CoylProtocol({ apiKey: process.env.COYL_API_KEY! })
const ctx = await coyl.context.get('u_2sj8xks0a')

if (ctx.danger_window_active && ctx.risk_level === 'HIGH') {
  // Your LLM now knows the user is in a high-risk behavioral state
  return llm.respond({
    ...userPrompt,
    systemContext: \`User is a \${ctx.archetype} in active danger window.\`,
  })
}`}
          />

          <CodeBlock
            lang="python"
            code={`# coyl_protocol — Trigger an interrupt from a wearable signal (Python)
from coyl_protocol import CoylProtocol

coyl = CoylProtocol(api_key=os.environ["COYL_API_KEY"])
result = coyl.interrupt.trigger(
    user_id="u_2sj8xks0a",
    trigger_source="apple_watch_hrv_spike",
    trigger_type="physiological",
    urgency="HIGH",
)
# result.decision: "FIRE" | "DEFER" | "IGNORE"`}
          />
        </section>

        {/* SECTION 02 — WHAT YOU CAN BUILD */}
        <section className="space-y-12 border-t border-gray-200 pt-16">
          <div className="space-y-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              02 · What you can build with BIP
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              Three integration shapes.{' '}
              <span className="italic text-orange-600">One protocol.</span>
            </h2>
          </div>

          {/* LLM platforms */}
          <div className="grid grid-cols-1 gap-10 border-t border-orange-500 pt-8 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-5">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                For LLM platforms
              </p>
              <h3 className="mt-4 font-serif text-2xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900 md:text-3xl">
                Make every model behaviorally aware.
              </h3>
              <p className="mt-4 text-base leading-[1.7] text-gray-700">
                Inject the Behavioral Context Object into the system
                prompt of any Claude / GPT / Gemini call. The model
                stops giving generic advice to a user in a danger window
                and starts giving the right answer for the moment.
              </p>
            </div>
            <div className="md:col-span-7">
              <CodeBlock
                lang="typescript"
                code={`// Wrap your LLM call with behavioral context
const ctx = await coyl.context.get(userId)

const completion = await anthropic.messages.create({
  model: 'claude-opus-4-7',
  system: \`The user is a \${ctx.archetype}.
    Danger window active: \${ctx.danger_window_active}.
    Current excuse pattern: \${ctx.current_excuse_category}.
    Respond accordingly.\`,
  messages: [{ role: 'user', content: prompt }],
})`}
              />
            </div>
          </div>

          {/* Wearables + health */}
          <div className="grid grid-cols-1 gap-10 border-t border-gray-200 pt-8 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-5">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                For wearables + health apps
              </p>
              <h3 className="mt-4 font-serif text-2xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900 md:text-3xl">
                Get the interrupt layer you didn&rsquo;t build.
              </h3>
              <p className="mt-4 text-base leading-[1.7] text-gray-700">
                Glucose monitors, sleep trackers, GLP-1 apps, ADHD tools —
                you collect signal. BIP decides when to fire. You push
                the trigger; BIP returns FIRE / DEFER / IGNORE and (if
                FIRE) emits the interrupt on your behalf.
              </p>
            </div>
            <div className="md:col-span-7">
              <CodeBlock
                lang="typescript"
                code={`// HRV spike from a Watch? Glucose dip from a CGM? Push the trigger.
const decision = await coyl.interrupt.trigger({
  userId: 'u_2sj8xks0a',
  triggerSource: 'cgm_glucose_dip',
  triggerType: 'physiological',
  urgency: 'MEDIUM',
})

if (decision.decision === 'FIRE') {
  // BIP fired the interrupt — your job is done.
  metrics.record('bip.fire', { source: 'cgm' })
}`}
              />
            </div>
          </div>

          {/* Enterprise productivity */}
          <div className="grid grid-cols-1 gap-10 border-t border-gray-200 pt-8 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-5">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                For enterprise productivity
              </p>
              <h3 className="mt-4 font-serif text-2xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900 md:text-3xl">
                Real-time follow-through across teams.
              </h3>
              <p className="mt-4 text-base leading-[1.7] text-gray-700">
                Subscribe to the outcome webhook. Every time an
                interrupt resolves — stopped, deferred, ignored — your
                productivity platform learns whether the team is
                following through on commitments. The data loop closes
                in real time.
              </p>
            </div>
            <div className="md:col-span-7">
              <CodeBlock
                lang="typescript"
                code={`// Receive outcome webhooks (TypeScript Express/Next.js handler)
app.post('/webhooks/coyl', verifySignature, (req, res) => {
  const event = req.body
  if (event.event === 'INTERRUPT_RESOLVED' && event.outcome === 'STOPPED') {
    // user pulled through — update your retention metrics
  }
  res.sendStatus(200)
})`}
              />
            </div>
          </div>
        </section>

        {/* SECTION 03 — AUTH + SCOPES */}
        <section className="space-y-10 border-t border-gray-200 pt-16">
          <div className="space-y-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              03 · Auth + scopes
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              OAuth 2.0, PKCE,{' '}
              <span className="italic text-orange-600">consent that&rsquo;s real.</span>
            </h2>
            <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
              Server-to-server traffic uses signed API keys. Third-party
              client integrations use OAuth 2.0 with PKCE. Subjects
              (users) can revoke consent at any time — revoked tokens
              return{' '}
              <code className="rounded bg-orange-50 px-1.5 py-0.5 font-mono text-[12px] text-orange-700">
                HTTP 410 Gone
              </code>
              , a signal to drop the integration immediately.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {SCOPES.map((s) => (
              <div key={s.scope} className="rounded-2xl border border-gray-200 bg-white p-5">
                <p className="font-mono text-[12px] font-semibold text-orange-600">
                  {s.scope}
                </p>
                <p className="mt-2 text-sm leading-[1.6] text-gray-700">{s.body}</p>
              </div>
            ))}
          </div>

          <CodeBlock
            lang="http"
            code={`GET https://api.coyl.ai/v1/oauth/authorize
  ?response_type=code
  &client_id=<your_client_id>
  &redirect_uri=<your_redirect_uri>
  &scope=context:read+interrupt:trigger+outcome:subscribe
  &code_challenge=<pkce_challenge>
  &code_challenge_method=S256
  &state=<csrf_token>

→ 302 → <your_redirect_uri>?code=<auth_code>&state=<csrf_token>`}
          />
        </section>

        {/* SECTION 04 — BADGE PROGRAM */}
        <section className="space-y-6 rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-white p-8 md:p-12">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            04 · Compatibility badge program
          </p>
          <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            BIP-Compatible.{' '}
            <span className="italic text-orange-600">Earn the badge.</span>
          </h2>
          <p className="max-w-2xl text-lg leading-[1.7] text-gray-700">
            Any engine that passes the public conformance suite can
            display the BIP-Compatible badge. Same play as
            OAuth-Compliant, MCP-Compatible, GraphQL-Spec-Compliant —
            an open verification ritual the ecosystem trusts. Suite
            ships open-source at{' '}
            <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[12px] text-orange-700">
              github.com/coyl/bip-conformance
            </code>{' '}
            (forthcoming).
          </p>
          <CodeBlock
            lang="bash"
            code={`# Run the conformance suite against your engine
npx @coyl/bip-conformance \\
  --engine https://your-engine.example.com \\
  --suite v0.1 \\
  --output ./conformance-report.json

# Pass → eligible for the BIP-Compatible badge`}
          />
        </section>

        {/* SECTION 05 — COMING SOON */}
        <section className="space-y-10 border-t border-gray-200 pt-16">
          <div className="space-y-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              05 · Coming soon
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              Public preview{' '}
              <span className="italic text-orange-600">Q3 2026.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {ROADMAP.map((r) => (
              <div key={r.title} className="border-t border-orange-500 pt-5">
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                  {r.eta}
                </p>
                <h3 className="mt-3 font-serif text-xl font-normal leading-[1.2] tracking-[-0.01em] text-gray-900 md:text-2xl">
                  {r.title}
                </h3>
                <p className="mt-3 text-sm leading-[1.65] text-gray-700">{r.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 06 — PAP INTEGRATION (LLM PARTNERS) */}
        <section className="space-y-10 border-t border-gray-200 pt-16">
          <div className="space-y-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              06 · PAP — LLM partners
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              Build proactive Claude / ChatGPT / Gemini{' '}
              <span className="italic text-orange-600">on COYL.</span>
            </h2>
            <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
              The Proactive AI Protocol is the trust layer foundation
              labs integrate against to ship proactive features
              without owning the rate-limit, dedup, consent, or audit
              infrastructure. Your LLM emits a Proposal; the PAP
              Coordinator decides whether to allow, queue, or deny
              against the user&rsquo;s current behavioral state and
              consent grants. If allowed, PAP fires through the
              user&rsquo;s preferred modality. Your LLM never touches
              a device API.
            </p>
          </div>

          <CodeBlock
            lang="typescript"
            code={`// @coyl/pap-sdk — Propose a proactive intervention (Node.js)
import { COYL } from '@coyl/pap-sdk'

const coyl = new COYL({
  apiKey: process.env.COYL_API_KEY!,
  llmId: 'anthropic-claude-sonnet-3.7',
})

const proposal = await coyl.proposal.create({
  userId: 'u_xyz',
  scopeRequested: ['proactive_food'],
  action: {
    kind: 'interrupt',
    mode: 'high_arousal',
    headline: 'Stop. Hand on the counter. 4 breaths.',
    subhead: '9:47 PM. You said no food after 9.',
  },
  context: {
    trigger: 'danger_window_active:late_night_kitchen',
    confidence: 0.84,
    reasoning: 'HRV dropped 22pts in 90min + sedentary 105min + geofence:kitchen + active commitment:no_food_after_9',
  },
})

if (proposal.decision === 'allowed') {
  // PAP coordinator will fire via the user's preferred modality.
  // Subscribe to the outcome webhook to learn whether the user
  // caught themselves, deferred, or ignored.
}`}
          />

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/pap"
              className="rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 hover:border-orange-300"
            >
              Read the full PAP v0.1 spec →
            </Link>
            <span className="text-xs uppercase tracking-widest text-gray-500">
              API key applications:{' '}
              <a
                href="mailto:partner@coyl.ai?subject=PAP%20partner%20access"
                className="underline decoration-orange-500/40 underline-offset-4 hover:decoration-orange-500"
              >
                partner@coyl.ai
              </a>
            </span>
          </div>
        </section>

        {/* SECTION 07 — EAP INTEGRATION (LLM PARTNERS) */}
        <section className="space-y-10 border-t border-gray-200 pt-16">
          <div className="space-y-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              07 · EAP — LLM partners
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              Address any device. Through{' '}
              <span className="italic text-orange-600">one protocol.</span>
            </h2>
            <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
              The Edge AI Protocol extends PAP from behavioral
              interventions to general cross-device action. Your LLM
              requests a haptic on the user&rsquo;s Watch, a voice
              prompt on their iPhone, a screen dim on their Mac &mdash;
              independently or as a multi-device orchestration. The
              user&rsquo;s device coordinator evaluates against
              cached scope grants, fires the actuator natively,
              returns the outcome.
            </p>
          </div>

          <CodeBlock
            lang="typescript"
            code={`// @coyl/eap-sdk — Request a single action on a specific device
import { COYL } from '@coyl/eap-sdk'

const coyl = new COYL({
  apiKey: process.env.COYL_API_KEY!,
  llmId: 'anthropic-claude-sonnet-3.7',
})

const action = await coyl.action.request({
  userId: 'u_xyz',
  deviceId: 'watch-series-9-def',
  actuator: 'haptic',
  params: { pattern: 'double-tap' },
  scopeRequested: 'edge:watch:haptic',
  reasoning: 'HRV spike + active danger window',
  confidence: 0.83,
})

if (action.decision === 'allowed') {
  // The user's Watch coordinator will fire the haptic.
  // Outcome arrives via your subscribed webhook.
}`}
          />

          <CodeBlock
            lang="typescript"
            code={`// Multi-device orchestration — one user-facing moment, three devices
const orchestration = await coyl.orchestration.create({
  userId: 'u_xyz',
  atomicity: 'all_or_none',
  steps: [
    {
      deviceId: 'watch-series-9-def',
      actuator: 'haptic',
      params: { pattern: 'double-tap' },
      atOffsetMs: 0,
    },
    {
      deviceId: 'iphone-15-pro-abc',
      actuator: 'voice_tts',
      params: { text: 'Stop. Hand on the counter. 4 breaths.' },
      atOffsetMs: 200,
    },
    {
      deviceId: 'macbook-pro-ghi',
      actuator: 'system_dim_screen',
      params: { brightnessPct: 30, durationSec: 60 },
      atOffsetMs: 200,
    },
  ],
})
// atomicity: 'all_or_none' — composite is denied if any step is denied.
// Use 'best_effort' for independent step evaluation.`}
          />

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/eap"
              className="rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 hover:border-orange-300"
            >
              Read the full EAP v0.1 spec →
            </Link>
            <span className="text-xs uppercase tracking-widest text-gray-500">
              Partner access:{' '}
              <a
                href="mailto:partner@coyl.ai?subject=EAP%20partner%20access"
                className="underline decoration-orange-500/40 underline-offset-4 hover:decoration-orange-500"
              >
                partner@coyl.ai
              </a>
            </span>
          </div>
        </section>

        {/* SECTION 08a — UAP (STANDING AUTHORITY FOR AGENTIC AI) */}
        <section className="space-y-10 border-t border-gray-200 pt-16">
          <div className="space-y-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              08 &middot; UAP &mdash; User-Authority Protocol
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              Standing authority for{' '}
              <span className="italic text-orange-600">agentic AI.</span>
            </h2>
            <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
              UAP defines the standing-authority layer. When a user
              grants their LLM bounded autonomous action, UAP is the
              trust contract &mdash; eight primitives, hard expiry,
              kill switch, signed audit trail.
            </p>
          </div>

          <CodeBlock
            lang="bash"
            code={`# Issue a standing grant under UAP v0.1
curl -X POST https://coyl.ai/api/uap/v1/grant \\
  -H "Authorization: Bearer coyl_uap_<partner_id>_<secret>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "user_id": "u_2sj8xks0a",
    "scopes": ["calendar.write", "messaging.routine"],
    "expires_at": "2026-05-29T17:00:00Z",
    "rules": [
      { "kind": "spending_cap", "max_per_action_usd": 50 },
      { "kind": "quiet_hours", "from": "00:00", "to": "07:00", "tz": "America/Los_Angeles" }
    ],
    "consent_artifact": {
      "version": "0.1",
      "shown_to_user_at": "2026-05-22T16:58:00Z",
      "user_response": "explicit_grant",
      "ui_surface": "settings.standing_authority"
    }
  }'`}
          />

          <p className="max-w-2xl text-sm leading-[1.7] text-gray-600">
            <strong className="font-semibold text-gray-800">Note:</strong>{' '}
            The{' '}
            <code className="rounded bg-orange-50 px-1.5 py-0.5 font-mono text-[12px] text-orange-700">
              /api/uap/v1/*
            </code>{' '}
            namespace is reserved and currently returns{' '}
            <code className="rounded bg-orange-50 px-1.5 py-0.5 font-mono text-[12px] text-orange-700">
              HTTP 501 Not Implemented
            </code>
            . The reference engine ships post-Series-A. Specification
            is final; implementations are encouraged.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://github.com/FutureEnterprises/chief-of-staff/blob/main/docs/protocol/UAP-0.1.md"
              target="_blank"
              rel="noopener"
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
            >
              Read the spec &rarr;
            </a>
            <Link
              href="/uap"
              className="rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 hover:border-orange-300"
            >
              /uap
            </Link>
            <span className="text-xs uppercase tracking-widest text-gray-500">
              Partner access:{' '}
              <a
                href="mailto:partner@coyl.ai?subject=UAP%20partner%20access"
                className="underline decoration-orange-500/40 underline-offset-4 hover:decoration-orange-500"
              >
                partner@coyl.ai
              </a>
            </span>
          </div>
        </section>

        {/* SECTION 09 — EAP COORDINATOR (DEVICE MANUFACTURERS) */}
        <section className="space-y-10 border-t border-gray-200 pt-16">
          <div className="space-y-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              09 · EAP — device manufacturers
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              Run a coordinator.{' '}
              <span className="italic text-orange-600">
                Become an EAP-compliant edge.
              </span>
            </h2>
            <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
              Each EAP-compatible device runs a small coordinator
              daemon (~10K lines per platform). The coordinator
              receives action requests from EAP cloud, checks the
              local cache of user scope grants, executes the
              actuator natively, and reports the outcome. Sensor
              streams flow in the other direction &mdash; the
              coordinator publishes events to EAP cloud, which fans
              out to subscribed LLMs.
            </p>
            <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
              We ship reference coordinators for every major
              platform. Device manufacturers can fork + extend for
              their own hardware.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {EAP_COORDINATORS.map((c) => (
              <div
                key={c.platform}
                className="rounded-xl border border-gray-200 bg-white p-4"
              >
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-600">
                  {c.platform}
                </p>
                <p className="mt-2 text-xs leading-[1.55] text-gray-700">
                  {c.body}
                </p>
              </div>
            ))}
          </div>

          <CodeBlock
            lang="bash"
            code={`# Reference coordinators — open-source, per-platform
git clone https://github.com/coyl/eap-coordinator-reference

# Each platform ships its own implementation:
#   ios/        — Native app extension + App Intents
#   macos/      — Menu bar app + AppleScript + Shortcuts
#   watchos/    — Watch app + WatchConnectivity
#   android/    — Tasker + custom Service
#   wearos/     — Watch app
#   chrome/     — WebExtension (also Edge, Firefox)
#   safari/     — Safari Extension

# Fork + extend for your hardware. Reach out and we'll
# RFC the manifest schema for your device class.`}
          />

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://github.com/coyl/eap-coordinator-reference"
              target="_blank"
              rel="noopener"
              className="rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 hover:border-orange-300"
            >
              github.com/coyl/eap-coordinator-reference →
            </a>
            <span className="text-xs uppercase tracking-widest text-gray-500">
              Device-manufacturer partnerships:{' '}
              <a
                href="mailto:devices@coyl.ai?subject=EAP%20coordinator%20integration"
                className="underline decoration-orange-500/40 underline-offset-4 hover:decoration-orange-500"
              >
                devices@coyl.ai
              </a>
            </span>
          </div>
        </section>

        {/* CTA */}
        <section className="space-y-6 border-t border-orange-500 pt-12">
          <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-4xl">
            Get into the alpha.
          </h2>
          <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
            We&rsquo;re onboarding integration partners through the
            private alpha now — wearables, LLM platforms, telehealth,
            enterprise productivity. Tell us what you&rsquo;re building
            and we&rsquo;ll get you sandbox keys.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="mailto:developers@coyl.ai?subject=Alpha%20access%20request"
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
            >
              Request alpha access
            </a>
            <Link
              href="/protocol"
              className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:border-orange-300"
            >
              Read the v0.1 spec
            </Link>
          </div>
        </section>
      </article>
    </>
  )
}

/**
 * Calm dark code-block surface — same shape as the one on /protocol so
 * the two pages read as one editorial system. Warm-dark background,
 * mono type, tight leading. Defined inline rather than extracted to a
 * shared util because the surface area is two pages; a util adds
 * indirection without gains.
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

const SCOPES: Array<{ scope: string; body: string }> = [
  {
    scope: 'context:read',
    body:
      'Read the current Behavioral Context Object for a consented subject. No PII — only behavioral abstractions.',
  },
  {
    scope: 'interrupt:trigger',
    body:
      'Push a behavioral signal. The engine decides FIRE / DEFER / IGNORE against the subject’s model.',
  },
  {
    scope: 'outcome:subscribe',
    body:
      'Receive outcome webhooks after every interrupt — STOPPED, DEFERRED, IGNORED — with pattern updates.',
  },
  {
    scope: 'pattern:update',
    body:
      'Contribute observed behavioral signal back to the subject’s pattern model with explicit consent.',
  },
]

const EAP_COORDINATORS: Array<{ platform: string; body: string }> = [
  {
    platform: 'iOS',
    body: 'Native app extension + App Intents. ~60% actuator coverage; Live Activities, haptics, push, voice TTS.',
  },
  {
    platform: 'macOS',
    body: 'Menu bar app + AppleScript + Shortcuts. ~80% actuator coverage; notifications, dim screen, app launch.',
  },
  {
    platform: 'watchOS',
    body: 'Watch app + WatchConnectivity. Haptic patterns, complication updates, HRV stream.',
  },
  {
    platform: 'Android',
    body: 'Tasker + custom Service. ~85% actuator coverage; least restrictive of the mobile platforms.',
  },
  {
    platform: 'Wear OS',
    body: 'Watch app. Haptic + tile updates + HRV stream via Health Services.',
  },
  {
    platform: 'Chrome',
    body: 'WebExtension. Tab control, full-screen overlay, web push, active-URL read.',
  },
  {
    platform: 'Edge',
    body: 'Shared WebExtension build with Chrome. Same actuator surface.',
  },
  {
    platform: 'Firefox',
    body: 'WebExtension. Tab control, push, overlay. Manifest v2 + v3 supported.',
  },
  {
    platform: 'Safari',
    body: 'Safari Extension. ~50% coverage; most restrictive of the browsers.',
  },
]

const ROADMAP: Array<{ eta: string; title: string; body: string }> = [
  {
    eta: 'Q3 2026',
    title: 'COYL Cloud reference engine — public preview',
    body: 'The hosted BIP-compatible engine. Production-grade rate limits, audit log, observability dashboards. Currently in private alpha.',
  },
  {
    eta: 'Q3 2026',
    title: 'Official SDKs — TypeScript, Python, Go',
    body: 'First-party SDKs with typed responses, retry semantics, signed-webhook helpers, and idempotency. Distributed via npm, PyPI, and pkg.go.dev.',
  },
  {
    eta: 'Q3 2026',
    title: 'Webhook test harness',
    body: 'Local CLI that mocks INTERRUPT_RESOLVED events with valid HMAC signatures so you can build webhook receivers without a live engine.',
  },
  {
    eta: 'Q3 2026',
    title: 'Sandbox API keys',
    body: 'Free, rate-limited sandbox keys for any developer with a verified email. Production keys gated on alpha onboarding.',
  },
]
