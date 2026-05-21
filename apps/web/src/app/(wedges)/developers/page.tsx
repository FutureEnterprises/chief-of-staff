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
