/**
 * /eap — Edge AI Protocol v0.1 marketing + developer landing.
 *
 * EAP is the bigger sibling of PAP. Where PAP makes LLMs proactive
 * about behavioral interventions, EAP makes LLMs proactive about
 * ACTION — across every device in a user's life. iPhone, Watch, Mac,
 * browser, home, car. Apache 2.0 open spec. Reference engine = COYL
 * Cloud + on-device bridges (proprietary).
 *
 * This page distills the 8K-word spec at docs/protocol/edge-ai-protocol.md
 * into a single-scroll editorial landing — voice matches /protocol,
 * /pap, /developers. Instrument Serif H1 with italic-orange accent,
 * mono kicker eyebrow, hairline rules, cream canvas. Code blocks sit
 * in a calm warm-dark surface so they read as a real spec excerpt.
 *
 * The category bet: the first horizontal cross-device LLM coordinator
 * to ship + get foundation-lab traction becomes the standard. Apple,
 * Google, Microsoft all build vertical. Foundation labs (Anthropic,
 * OpenAI) have no device fleet. EAP is the bridge.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { cacheLife, cacheTag } from 'next/cache'
import {
  CinematicScrim,
  CinematicEyebrow,
  CinematicDisplay,
  CinematicBody,
} from '@/components/cinematic'
import { BreadcrumbSchema } from '@/app/structured-data'


export const metadata: Metadata = {
  title: 'EAP — every device, every LLM, one protocol · COYL',
  description:
    'The Edge AI Protocol v0.1. Apache 2.0 open spec for cross-device LLM action — iPhone, Watch, Mac, browser, home, car — under a unified consent layer the user controls.',
  keywords: [
    'edge ai protocol',
    'eap',
    'cross-device llm action',
    'llm device protocol',
    'proactive ai protocol',
    'coyl eap',
    'apache 2.0 ai protocol',
  ],
  alternates: { canonical: '/eap' },
  openGraph: {
    title: 'EAP — every device, every LLM, one protocol',
    description:
      'The Edge AI Protocol v0.1. Apache 2.0 open spec for cross-device LLM action — iPhone, Watch, Mac, browser, home, car — under a unified consent layer the user controls.',
    url: 'https://coyl.ai/eap',
    images: [
      {
        url: '/api/og?title=Every+device.+Every+LLM.+One+protocol.&kicker=EAP+v0.1',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EAP — every device, every LLM, one protocol',
    description:
      'The Edge AI Protocol v0.1. Apache 2.0 open spec for cross-device LLM action — iPhone, Watch, Mac, browser, home, car — under a unified consent layer the user controls.',
    images: ['/api/og?title=Every+device.+Every+LLM.+One+protocol.&kicker=EAP+v0.1'],
  },
}

export default async function EapPage() {
  'use cache'
  cacheLife('days')
  cacheTag('marketing-eap')

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'COYL', url: 'https://coyl.ai' },
          { name: 'EAP', url: 'https://coyl.ai/eap' },
        ]}
      />

      <CinematicScrim bleedToCream className="-mx-6 -mt-24 px-6 pt-32 pb-20 md:-mx-12 md:px-12 md:pt-40 md:pb-28">
        <header className="mx-auto max-w-5xl space-y-10">
          <CinematicEyebrow label="EAP v0.1 · Apache 2.0" />
          <CinematicDisplay as="h1" variant="hero">
            Every device. Every LLM.{' '}
            <span className="italic text-orange-300">One protocol.</span>
          </CinematicDisplay>
          <CinematicBody>
            EAP is the universal coordinator for cross-device LLM
            action. iPhone, Watch, Mac, browser, home — any LLM can
            reach any device under a unified consent layer.
          </CinematicBody>
          <CinematicBody>
            <strong className="font-serif font-normal italic text-[#f8f1e4]">
              If MCP connects LLMs to software tools and{' '}
              <Link
                href="/pap"
                className="underline decoration-orange-300/60 underline-offset-4 hover:decoration-orange-300"
              >
                PAP
              </Link>{' '}
              connects them to behavioral state, EAP connects them to
              every actuator in the user&rsquo;s real life.
            </strong>{' '}
            Hardware, not just software. Action, not just answer.
          </CinematicBody>
        </header>
      </CinematicScrim>

      <article className="space-y-24 pb-12">

        {/* ─────────────────────────────────────────────────────────
            2. THE CATEGORY INSIGHT — vertical silos vs horizontal
            ───────────────────────────────────────────────────────── */}
        <section className="space-y-8 border-t border-gray-200 pt-12">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            01 · The insight
          </p>
          <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            Every device is already an edge.{' '}
            <span className="italic text-orange-600">None are addressable.</span>
          </h2>
          <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
            Your iPhone has HRV, motion, mic, camera, haptics, push,
            speaker, an app fleet. Your Watch has HRV, haptics,
            complications, Live Activities. Your MacBook has screen,
            Notifications Center, Shortcuts, AppleScript. Your browser
            has tabs, content, push, extensions. Your car has voice,
            screen, location. Your home has actuators — lights, thermostats,
            locks, speakers. Each platform has an SDK.
          </p>
          <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
            <strong className="font-serif font-normal italic">
              What does not exist:
            </strong>{' '}
            a single protocol where any LLM can subscribe to events
            from any device, propose actions on any device, and have
            those actions governed by a unified consent layer the user
            controls.
          </p>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white/50">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-white/80">
                <tr>
                  <th className="px-5 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-gray-600">
                    Today&rsquo;s vertical silos
                  </th>
                  <th className="px-5 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-gray-600">
                    Cross-vendor reach
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-5 py-3 text-gray-900">Apple Intelligence</td>
                  <td className="px-5 py-3 text-gray-600">None — Apple devices only</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 text-gray-900">Google Gemini in Android + Workspace</td>
                  <td className="px-5 py-3 text-gray-600">Limited — Google ecosystem</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 text-gray-900">Microsoft Copilot</td>
                  <td className="px-5 py-3 text-gray-600">Some — via Graph</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 text-gray-900">Samsung Bixby</td>
                  <td className="px-5 py-3 text-gray-600">None — Samsung only</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 text-gray-900">ChatGPT Operator / Claude Computer Use</td>
                  <td className="px-5 py-3 text-gray-600">None — pure browser compute</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
            Every vendor is building vertical. The user is stuck
            choosing one ecosystem and accepting that the other LLMs
            can&rsquo;t reach their devices. 62% of iPhone users also
            run Windows. 38% of Pixel users also run macOS. The
            horizontal protocol is the opening.
          </p>
        </section>

        {/* ─────────────────────────────────────────────────────────
            3. THE 10 PRIMITIVES
            ───────────────────────────────────────────────────────── */}
        <section className="space-y-12">
          <div className="space-y-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              02 · The ten primitives
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              Ten RPCs.{' '}
              <span className="italic text-orange-600">One consent layer.</span>
            </h2>
            <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
              EAP is HTTP JSON (upgradeable to WebSocket for streaming),
              OAuth 2.0 + short-lived JWTs. Ten primitives cover the
              full lifecycle: registration, discovery, action, sensors,
              outcome, consent, audit, panic.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {PRIMITIVES.map((p) => (
              <div
                key={p.n}
                className="space-y-3 border-t border-orange-500 pt-5"
              >
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                  {p.n} · {p.kicker}
                </p>
                <h3 className="font-serif text-xl font-normal leading-[1.2] tracking-[-0.01em] text-gray-900 md:text-2xl">
                  {p.title}
                </h3>
                <p className="text-sm leading-[1.65] text-gray-700">
                  {p.body}
                </p>
                {p.code && (
                  <pre className="overflow-x-auto rounded-lg border border-[#1b1f24] bg-[#0f1115] px-4 py-3 font-mono text-[11.5px] leading-[1.55] text-[#e6e2da]">
                    {p.code}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────
            4. PER-PLATFORM COORDINATOR COVERAGE
            ───────────────────────────────────────────────────────── */}
        <section className="space-y-8 border-t border-gray-200 pt-16">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            03 · Coordinator coverage
          </p>
          <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            How much of each platform we{' '}
            <span className="italic text-orange-600">can actually reach.</span>
          </h2>
          <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
            Each device runs a small EAP-compatible coordinator
            (~10K lines per platform). It evaluates requests locally,
            executes actuators, publishes sensor events, and respects
            the platform&rsquo;s native security model. Coverage varies.
          </p>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white/50">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-white/80">
                <tr>
                  <th className="px-5 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-gray-600">
                    Platform
                  </th>
                  <th className="px-5 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-gray-600">
                    Actuator coverage
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-5 py-3 text-gray-900">Linux</td>
                  <td className="px-5 py-3 text-gray-600">~95% (systemd + dbus — most permissive)</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 text-gray-900">Android / Windows / macOS</td>
                  <td className="px-5 py-3 text-gray-600">~85% (Tasker / PowerShell / AppleScript)</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 text-gray-900">Chrome / Edge / Firefox</td>
                  <td className="px-5 py-3 text-gray-600">~70% (WebExtensions)</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 text-gray-900">iOS</td>
                  <td className="px-5 py-3 text-gray-600">
                    ~60% (App Intents + Live Activities + Shortcuts)
                  </td>
                </tr>
                <tr>
                  <td className="px-5 py-3 text-gray-900">watchOS / Safari / Wear OS</td>
                  <td className="px-5 py-3 text-gray-600">~50% (platform-restricted)</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 text-gray-900">CarPlay / Android Auto</td>
                  <td className="px-5 py-3 text-gray-600">~30% (very restricted)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
            <strong className="font-serif font-normal italic">
              We&rsquo;re honest about the gaps.
            </strong>{' '}
            Apple locks down more than other platforms. Where we
            can&rsquo;t fire automatically, we surface to the user via
            Live Activities or Shortcuts — still faster than a chatbot
            back-and-forth.
          </p>
        </section>

        {/* ─────────────────────────────────────────────────────────
            5. ACTION REQUEST + ORCHESTRATION EXAMPLES
            ───────────────────────────────────────────────────────── */}
        <section className="space-y-12">
          <div className="space-y-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              04 · What the wire looks like
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              One device.{' '}
              <span className="italic text-orange-600">Or three at once.</span>
            </h2>
          </div>

          {/* Single-device action */}
          <div className="grid grid-cols-1 gap-10 border-t border-orange-500 pt-8 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-5">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                Single device · Action Request
              </p>
              <h3 className="mt-4 font-serif text-2xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900 md:text-3xl">
                Claude taps the Watch.
              </h3>
              <p className="mt-4 text-base leading-[1.7] text-gray-700">
                The LLM proposes a single haptic, the device-side
                coordinator evaluates against the user&rsquo;s scope
                grants and quiet hours, then either fires or denies with
                a reason the LLM can act on.
              </p>
            </div>
            <div className="md:col-span-7">
              <CodeBlock
                lang="POST /eap/v1/action/request"
                code={`{
  "actionId": "a_xyz",
  "llmId": "anthropic-claude-sonnet-3.7",
  "userId": "u_xyz",
  "deviceId": "watch-series-9-def",
  "actuator": "haptic",
  "params": {
    "pattern": "double-tap",
    "intensity": "medium"
  },
  "scopeRequested": "edge:watch:haptic",
  "reasoning": "HRV spiked 18% + entered kitchen geofence at 9:43 PM + active commitment 'no food after 9'",
  "confidence": 0.83,
  "ttlSeconds": 30
}

→ {
  "decision": "allowed",
  "executionToken": "et_xyz",
  "willExecuteAt": "2026-05-21T21:43:18Z"
}`}
              />
            </div>
          </div>

          {/* Multi-device orchestration */}
          <div className="grid grid-cols-1 gap-10 border-t border-gray-200 pt-8 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-5">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                Multi-device · Orchestration
              </p>
              <h3 className="mt-4 font-serif text-2xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900 md:text-3xl">
                Watch buzzes. Phone speaks. Mac dims.
              </h3>
              <p className="mt-4 text-base leading-[1.7] text-gray-700">
                A composite flow with atomicity guarantees. The
                coordinator evaluates each step independently AND the
                composite. <code className="font-mono text-[12px]">all_or_none</code>{' '}
                requires every step to be allowed or the whole
                orchestration is denied.
              </p>
            </div>
            <div className="md:col-span-7">
              <CodeBlock
                lang="POST /eap/v1/orchestration"
                code={`{
  "orchestrationId": "o_xyz",
  "llmId": "...",
  "userId": "...",
  "atomicity": "all_or_none",
  "steps": [
    {
      "deviceId": "watch-series-9-def",
      "actuator": "haptic",
      "params": { "pattern": "double-tap" },
      "atOffsetMs": 0
    },
    {
      "deviceId": "iphone-15-pro-abc",
      "actuator": "voice_tts",
      "params": { "text": "Stop. Hand on the counter. 4 breaths. Decide at 9:55." },
      "atOffsetMs": 200
    },
    {
      "deviceId": "macbook-pro-ghi",
      "actuator": "system_dim_screen",
      "params": { "brightnessPct": 30, "durationSec": 60 },
      "atOffsetMs": 200
    }
  ]
}`}
              />
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────
            6. SCOPE VOCABULARY
            ───────────────────────────────────────────────────────── */}
        <section className="space-y-8 border-t border-gray-200 pt-16">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            05 · The scope vocabulary
          </p>
          <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            Every actuator{' '}
            <span className="italic text-orange-600">is a scope.</span>
          </h2>
          <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
            Granular, revocable, logged in audit. Scopes ending in{' '}
            <code className="font-mono text-[12px]">:irreversible</code>{' '}
            are never auto-granted — they require per-action user
            confirmation, every time, no exceptions.
          </p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {SCOPE_GROUPS.map((g) => (
              <div key={g.title} className="space-y-3 border-t border-orange-500 pt-5">
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                  {g.title}
                </p>
                <ul className="space-y-1.5 font-mono text-[12.5px] leading-[1.55] text-gray-800">
                  {g.scopes.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="space-y-3 border-t border-red-500 pt-5 md:col-span-2">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-red-600">
                Irreversible · never auto-granted
              </p>
              <ul className="grid grid-cols-1 gap-1.5 font-mono text-[12.5px] leading-[1.55] text-gray-800 md:grid-cols-2">
                <li>edge:phone:send_message:irreversible</li>
                <li>edge:phone:initiate_call:irreversible</li>
                <li>edge:phone:purchase:irreversible</li>
                <li>edge:phone:money_transfer:irreversible</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────
            7. PRICING
            ───────────────────────────────────────────────────────── */}
        <section className="space-y-8 border-t border-gray-200 pt-16">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            06 · Pricing
          </p>
          <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            Free to start.{' '}
            <span className="italic text-orange-600">Usage from there.</span>
          </h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {PRICING.map((tier) => (
              <div
                key={tier.name}
                className="space-y-3 rounded-2xl border border-gray-200 bg-white/50 p-6"
              >
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                  {tier.name}
                </p>
                <p className="font-serif text-3xl font-normal leading-[1] tracking-[-0.02em] text-gray-900">
                  {tier.price}
                </p>
                <p className="text-sm leading-[1.65] text-gray-700">
                  {tier.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────
            8. EAP vs PAP vs MCP vs A2A
            ───────────────────────────────────────────────────────── */}
        <section className="space-y-8 border-t border-gray-200 pt-16">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            07 · How EAP relates to the rest
          </p>
          <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            EAP unifies what others{' '}
            <span className="italic text-orange-600">don&rsquo;t cover.</span>
          </h2>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white/50">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-white/80">
                <tr>
                  <th className="px-5 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-gray-600">
                    Protocol
                  </th>
                  <th className="px-5 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-gray-600">
                    Scope
                  </th>
                  <th className="px-5 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-gray-600">
                    Relationship to EAP
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-5 py-3 font-medium text-gray-900">MCP</td>
                  <td className="px-5 py-3 text-gray-600">LLM → software tools / data</td>
                  <td className="px-5 py-3 text-gray-600">
                    Complementary. MCP is for software, EAP is for hardware.
                  </td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-medium text-gray-900">PAP</td>
                  <td className="px-5 py-3 text-gray-600">LLM → behavioral interventions</td>
                  <td className="px-5 py-3 text-gray-600">
                    Subset. PAP focuses on behavioral state; EAP is broader.
                  </td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-medium text-gray-900">A2A</td>
                  <td className="px-5 py-3 text-gray-600">Agent-to-agent</td>
                  <td className="px-5 py-3 text-gray-600">
                    Orthogonal. A2A is agents talking; EAP is agents acting.
                  </td>
                </tr>
                <tr>
                  <td className="px-5 py-3 font-medium text-gray-900">App Intents / Shortcuts / HomeKit / Matter</td>
                  <td className="px-5 py-3 text-gray-600">Platform-native actuators</td>
                  <td className="px-5 py-3 text-gray-600">
                    Adopted as actuators. EAP invokes them on the device.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────
            9. GET STARTED
            ───────────────────────────────────────────────────────── */}
        <section className="space-y-8 border-t border-gray-200 pt-16">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            08 · Get started
          </p>
          <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            Two ways{' '}
            <span className="italic text-orange-600">to plug in.</span>
          </h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4 rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-white p-6">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                LLM partner
              </p>
              <h3 className="font-serif text-2xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900">
                Reach every device.
              </h3>
              <p className="text-sm leading-[1.65] text-gray-700">
                You have a model. You don&rsquo;t have an iPhone, a
                Watch, a Mac, a Chrome extension, a HomeKit bridge, or
                a CarPlay integration. EAP gives you all of them under
                one API key.
              </p>
              <a
                href="mailto:protocol@coyl.ai?subject=EAP%20LLM%20partner%20application"
                className="inline-block rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
              >
                Apply for API access →
              </a>
            </div>

            <div className="space-y-4 rounded-2xl border border-gray-200 bg-white/50 p-6">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
                Device manufacturer
              </p>
              <h3 className="font-serif text-2xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900">
                Become an EAP edge.
              </h3>
              <p className="text-sm leading-[1.65] text-gray-700">
                Your device has sensors and actuators. You want it
                addressable to every LLM, not just one. EAP is the
                horizontal protocol that makes your hardware reachable
                without picking a vendor.
              </p>
              <a
                href="mailto:protocol@coyl.ai?subject=EAP%20device%20manufacturer%20partnership"
                className="inline-block rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:border-orange-300"
              >
                Start an integration →
              </a>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────
            10. FAQ
            ───────────────────────────────────────────────────────── */}
        <section className="space-y-8 border-t border-gray-200 pt-16">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            09 · FAQ
          </p>
          <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            The questions{' '}
            <span className="italic text-orange-600">we get asked.</span>
          </h2>

          <div className="divide-y divide-gray-200 border-y border-gray-200">
            {FAQ.map((q) => (
              <details key={q.q} className="group py-5">
                <summary className="flex cursor-pointer items-start justify-between gap-4 font-serif text-xl font-normal leading-[1.25] tracking-[-0.01em] text-gray-900 marker:hidden md:text-2xl">
                  <span>{q.q}</span>
                  <span className="mt-1 select-none font-mono text-base text-orange-600 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-4 max-w-3xl text-base leading-[1.7] text-gray-700">
                  {q.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────
            11. CLOSING
            ───────────────────────────────────────────────────────── */}
        <section className="space-y-6 border-t border-orange-500 pt-12">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            10 · What ships next
          </p>
          <h2 className="font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
            EAP is the bigger sibling of{' '}
            <Link
              href="/pap"
              className="italic text-orange-600 underline decoration-orange-500/40 underline-offset-[6px] hover:decoration-orange-500"
            >
              PAP.
            </Link>
          </h2>
          <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
            PAP makes LLMs proactive about behavioral interventions.
            EAP makes them proactive about action across every device
            in your life. Together, with{' '}
            <Link
              href="/protocol"
              className="underline decoration-orange-500/40 underline-offset-4 hover:decoration-orange-500"
            >
              BIP
            </Link>{' '}
            as the behavioral context layer, they form the full
            proactive-AI infrastructure stack.
          </p>
          <blockquote className="max-w-3xl border-l-2 border-orange-500 pl-6 font-serif text-2xl font-normal italic leading-[1.35] text-gray-900 md:text-3xl">
            Catch yourself before you do it again.
          </blockquote>
          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href="https://github.com/FutureEnterprises/chief-of-staff/blob/main/docs/protocol/edge-ai-protocol.md"
              target="_blank"
              rel="noopener"
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
            >
              Read the EAP spec on GitHub →
            </a>
            <Link
              href="/pap"
              className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:border-orange-300"
            >
              The PAP companion →
            </Link>
            <Link
              href="/protocol"
              className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:border-orange-300"
            >
              The full protocol stack
            </Link>
          </div>
        </section>
      </article>
    </>
  )
}

/**
 * Calm dark code-block surface. Same treatment as /protocol so the
 * code snippets read as a continuous editorial voice across the
 * developer pages, not a per-page reinvention.
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

/* ────────────────────────────────────────────────────────────────
   DATA
   ──────────────────────────────────────────────────────────────── */

const PRIMITIVES: Array<{
  n: string
  kicker: string
  title: string
  body: string
  code?: string
}> = [
  {
    n: '01',
    kicker: 'POST /eap/v1/device/register',
    title: 'Device Registration',
    body: 'A device announces itself — its class, OS, sensors, actuators, user-granted scopes, and operational state.',
    code: `{
  "deviceId": "iphone-15-pro-abc",
  "deviceClass": "ios_phone",
  "manifest": {
    "sensors": ["hrv_proxy", "motion", "location_geofence"],
    "actuators": ["push_notification", "haptic", "voice_tts"],
    "userGrantedScopes": ["edge:phone:notification"]
  }
}`,
  },
  {
    n: '02',
    kicker: 'GET /eap/v1/devices/:userId',
    title: 'Capability Discovery',
    body: 'An LLM reads the user&rsquo;s full device fleet — what&rsquo;s online, what&rsquo;s addressable, and what scopes are already granted.',
    code: `→ {
  "fleet": [
    { "deviceId": "iphone-15-pro-abc", "online": true, ... },
    { "deviceId": "watch-series-9-def", "online": true, ... },
    { "deviceId": "macbook-pro-ghi", "online": false, ... }
  ],
  "aggregatePreferences": { "panicSwitch": false }
}`,
  },
  {
    n: '03',
    kicker: 'POST /eap/v1/action/request',
    title: 'Action Request',
    body: 'The LLM proposes a single action on a single device. The coordinator decides locally, returns allowed or denied with reasoning.',
    code: `{
  "deviceId": "watch-series-9-def",
  "actuator": "haptic",
  "params": { "pattern": "double-tap" },
  "scopeRequested": "edge:watch:haptic",
  "confidence": 0.83
}`,
  },
  {
    n: '04',
    kicker: 'POST /eap/v1/orchestration',
    title: 'Cross-Device Orchestration',
    body: 'A multi-device flow with atomicity guarantees. all_or_none or best_effort. Each step is evaluated independently and as a composite.',
    code: `{
  "atomicity": "all_or_none",
  "steps": [
    { "deviceId": "watch-...", "actuator": "haptic" },
    { "deviceId": "iphone-...", "actuator": "voice_tts" },
    { "deviceId": "macbook-...", "actuator": "dim_screen" }
  ]
}`,
  },
  {
    n: '05',
    kicker: 'POST /eap/v1/sensor/subscribe',
    title: 'Sensor Subscription',
    body: 'The LLM subscribes to a sensor stream with a filter. The device-side daemon fires the webhook when the filter matches.',
    code: `{
  "deviceId": "watch-series-9-def",
  "sensor": "hrv_proxy",
  "filter": { "deltaPctMin": 15, "directionDown": true },
  "webhookUrl": "...",
  "rateLimitPerHour": 6
}`,
  },
  {
    n: '06',
    kicker: 'GET /eap/v1/sensor/:deviceId/:sensor',
    title: 'Sensor Snapshot',
    body: 'Point-in-time read of a sensor value. The complement to subscriptions when the LLM needs a value right now.',
    code: `GET /eap/v1/sensor/watch-series-9-def/location_geofence

→ { "kind": "home", "subRegion": "kitchen", "asOf": "..." }`,
  },
  {
    n: '07',
    kicker: 'POST /eap/v1/action/outcome',
    title: 'Action Outcome',
    body: 'Fired by EAP, not the LLM. Reports execution status, user interaction, latency, and the user tag if the user responded.',
    code: `{
  "executionToken": "et_xyz",
  "outcome": "executed",
  "deviceState": { "userInteracted": true, "interactionLatencyMs": 1200 },
  "userTag": "caught_me"
}`,
  },
  {
    n: '08',
    kicker: 'POST /eap/v1/scope/grant',
    title: 'Authorization & Scope Grant',
    body: 'User-initiated. The user opens the EAP consent UI and explicitly grants a scope to an LLM. Time-bound, revocable, logged.',
    code: `{
  "llmId": "anthropic-claude-sonnet-3.7",
  "scope": "edge:watch:haptic",
  "expiresAt": null,
  "revocable": true
}`,
  },
  {
    n: '09',
    kicker: 'GET /eap/v1/audit',
    title: 'Audit Log',
    body: 'Every request, outcome, grant, and revoke is logged. User can review at any time, export as JSON, revoke retroactively.',
  },
  {
    n: '10',
    kicker: 'POST /eap/v1/panic',
    title: 'Panic Switch',
    body: 'One-tap, user-initiated. Immediately revokes every LLM scope across every device for 24 hours. The airplane-mode of proactive AI.',
    code: `POST /eap/v1/panic

→ {
  "panicSwitch": true,
  "expiresAt": "2026-05-22T21:43:18Z",
  "scopesRevoked": 47
}`,
  },
]

const SCOPE_GROUPS: Array<{ title: string; scopes: string[] }> = [
  {
    title: 'edge:phone — iOS / Android',
    scopes: [
      'edge:phone:notification',
      'edge:phone:haptic',
      'edge:phone:voice',
      'edge:phone:live_activity',
      'edge:phone:open_url',
      'edge:phone:open_app_intent',
      'edge:phone:read:location',
      'edge:phone:read:hrv',
      'edge:phone:read:screen_state',
    ],
  },
  {
    title: 'edge:watch — watchOS / Wear OS',
    scopes: [
      'edge:watch:haptic',
      'edge:watch:complication_update',
      'edge:watch:read:hrv',
    ],
  },
  {
    title: 'edge:laptop — macOS / Windows / Linux',
    scopes: [
      'edge:laptop:notification',
      'edge:laptop:dim_screen',
      'edge:laptop:do_not_disturb_toggle',
      'edge:laptop:open_app',
      'edge:laptop:run_shortcut',
    ],
  },
  {
    title: 'edge:browser — Chrome / Edge / Firefox / Safari',
    scopes: [
      'edge:browser:notification',
      'edge:browser:overlay',
      'edge:browser:tab_close',
      'edge:browser:read:active_url',
      'edge:browser:read:tab_count',
    ],
  },
  {
    title: 'edge:home — HomeKit / Matter',
    scopes: [
      'edge:home:lights_dim',
      'edge:home:do_not_disturb',
      'edge:home:lock_doors',
    ],
  },
  {
    title: 'edge:car — CarPlay / Android Auto',
    scopes: [
      'edge:car:voice_announce',
      'edge:car:radio_pause',
    ],
  },
]

const PRICING: Array<{ name: string; price: string; body: string }> = [
  {
    name: 'Free',
    price: '$0',
    body: '10K actions/month per LLM partner per user. Everything in the spec, no minimums, no card required.',
  },
  {
    name: 'Usage',
    price: '$0.0001 / action',
    body: 'Past the free tier. $0.001 per multi-device orchestration — higher unit price because composite flows carry more value.',
  },
  {
    name: 'Outcome-aligned',
    price: '$0.05 / positive-outcome action',
    body: 'Optional incentive-aligned pricing for select scope categories. You pay more, but only when the action produced the outcome the LLM proposed.',
  },
  {
    name: 'Enterprise / Strategic',
    price: 'Custom',
    body: 'Bulk discounts, SLA, per-region data residency, co-design on scope vocabulary and coordinator semantics. For foundation labs and device-platform partners.',
  },
]

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: 'How is this different from MCP and PAP?',
    a: 'MCP connects LLMs to software tools — databases, APIs, file systems. PAP connects them to behavioral state — danger windows, archetype, excuse pattern. EAP connects them to hardware — the physical actuators in the user’s real life. The three are complementary. PAP is a behavioral subset of EAP. MCP is orthogonal to both. Together they form the full proactive-AI stack.',
  },
  {
    q: 'What about Apple? They won’t adopt this.',
    a: 'Probably not soon. Apple optimizes for vertical integration and will keep building Apple Intelligence. But we ship iOS coverage at ~60% via App Intents, Live Activities, Shortcuts, and Push Notifications with actions — every channel Apple sanctions. The remaining 40% requires user manual taps. We document the gap honestly. The plays out like Bluetooth in the 2000s: Apple resisted, then eventually adopted because the alternative was being the device that didn’t work with the rest of the ecosystem.',
  },
  {
    q: 'What’s the latency for action firing?',
    a: 'Two-tier architecture. Fast path runs on-device with cached scope grants and a local classifier — sub-50ms for things like "fire haptic on stress spike." Slow path is full LLM reasoning and orchestration composition — typically 200–800ms round-trip. Users get both. The fast path matters most for real-time interventions; the slow path matters most for multi-device flows the LLM has time to compose.',
  },
  {
    q: 'How are irreversible actions like sending money handled?',
    a: 'Every scope ending in :irreversible — send_message, initiate_call, purchase, money_transfer — is never auto-granted. Per-action user confirmation, every single time, no exceptions, no "remember this choice." The EAP coordinator hard-fails closed: if the user doesn’t actively confirm within the action TTL, the action is denied. This is the boundary that lets us safely expand the rest of the scope vocabulary.',
  },
  {
    q: 'What’s the "panic switch"?',
    a: 'One tap. Immediately revokes every LLM scope across every device the user owns. Sets the user’s panicSwitch flag to true for 24 hours. During that window, no LLM can fire any action, regardless of prior grants. It’s the airplane-mode of proactive AI — non-negotiable, user-controlled, instantly recoverable when the user decides to unflip it. Critical for trust.',
  },
  {
    q: 'Can a user revoke a single device’s authority without revoking the whole LLM?',
    a: 'Yes. Scopes are granular per-device and per-actuator. A user can revoke edge:watch:haptic for Claude while keeping edge:phone:notification active. Every grant, revoke, action request, and outcome lands in the audit log. Users can review, filter, export as JSON, and revoke retroactively at any time. The vocabulary is designed for fine-grained control, not all-or-nothing OAuth.',
  },
]
