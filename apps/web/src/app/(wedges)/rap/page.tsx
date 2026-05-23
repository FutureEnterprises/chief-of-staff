import type { Metadata } from 'next'
import Link from 'next/link'
import { cacheLife, cacheTag } from 'next/cache'
import { BreadcrumbSchema } from '@/app/structured-data'

export const metadata: Metadata = {
  title:
    'RAP — Risk Assessment Protocol · the safety routing layer · COYL',
  description:
    'When does an AI agent stop coaching and route the user to human support? RAP is the open spec for behavioral safety routing. The protocol every Trust & Safety team asks about first.',
  keywords: [
    'risk assessment protocol',
    'ai safety routing protocol',
    'behavioral ai escalation',
    'crisis routing protocol',
    'ai trust safety protocol',
    'coyl rap',
  ],
  alternates: { canonical: '/rap' },
  openGraph: {
    title: 'RAP — when AI stops coaching and routes to human support',
    description:
      'The safety routing protocol that sits orthogonal to BIP / PAP / EAP / UAP. Four risk classes. Three routing envelopes. Apache 2.0 draft.',
    url: 'https://coyl.ai/rap',
    images: [
      {
        url: '/api/og?title=When+the+AI+stops+coaching.&kicker=RAP+v0.1',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RAP — Risk Assessment Protocol',
    description:
      'The safety routing layer of the COYL protocol stack. Open draft.',
    images: ['/api/og?title=When+the+AI+stops+coaching.&kicker=RAP+v0.1'],
  },
}

const SPEC_URL =
  'https://github.com/FutureEnterprises/chief-of-staff/blob/main/docs/protocol/RAP-0.1.md'

export default async function RapPage() {
  'use cache'
  cacheLife('days')
  cacheTag('marketing-rap')

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'COYL', url: 'https://coyl.ai' },
          { name: 'Protocol', url: 'https://coyl.ai/protocol' },
          { name: 'RAP', url: 'https://coyl.ai/rap' },
        ]}
      />

      <article className="space-y-20 pb-12">
        <header className="space-y-8">
          <div className="flex items-center gap-3">
            <span className="h-px w-12 bg-orange-500" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              RAP v0.1 · draft · Apache 2.0
            </span>
          </div>

          <h1 className="font-serif text-5xl font-normal leading-[1.02] tracking-[-0.025em] text-gray-900 md:text-[5.5rem]">
            When the AI stops coaching{' '}
            <span className="italic text-orange-600">
              and routes to a human.
            </span>
          </h1>

          <p className="max-w-2xl text-lg leading-[1.65] text-gray-700">
            Every Trust &amp; Safety team that reviews a behavior-aware AI
            stack asks the same question first:{' '}
            <em>
              when does the model stop being part of the user&rsquo;s life
              and become a barrier between them and clinical care?
            </em>{' '}
            RAP is the protocol that answers it.
          </p>

          <p className="max-w-2xl text-base leading-[1.7] text-gray-600">
            RAP sits orthogonal to BIP / PAP / EAP / UAP. Four risk classes
            classify every behavioral moment. Three routing envelopes carry
            the AI&rsquo;s exit when classification crosses the floor. The
            classifier&rsquo;s rationale is hashed for audit replay so a
            reviewer six months later can confirm the same moment would
            classify the same way.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href={SPEC_URL}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
            >
              Read the RAP spec on GitHub →
            </a>
            <Link
              href="/protocol"
              className="inline-flex items-center rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:border-orange-300"
            >
              ← back to the protocol stack
            </Link>
          </div>
        </header>

        {/* THE FOUR RISK CLASSES */}
        <section className="space-y-10 border-t border-gray-200 pt-12">
          <div className="space-y-4">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              01 · The four risk classes
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              Every behavioral moment classifies into{' '}
              <span className="italic text-orange-600">exactly one.</span>
            </h2>
          </div>

          <div className="space-y-8">
            <RiskClassRow
              kicker="01.a · routine_friction"
              title="Coaching proceeds."
              body="The familiar loop. BIP context permits PAP proposals; PAP proposals fire through EAP under UAP-granted scope. The default class — most moments live here."
              example="Late-night scrolling. Mild procrastination. The 'one more snack' moment."
              routing="None required."
            />
            <RiskClassRow
              kicker="01.b · pattern_relapse"
              title="Heavier intervention. Optional accountability ping."
              body="The user has crossed back into a behavioral pattern they previously committed to leaving. Intensify EAP modality. Reduce PAP confidence threshold. No automatic clinical routing — but if the user granted UAP scope notify:relapse_signal, RAP emits an accountability-referral envelope to a user-pre-designated contact."
              example="Returning to nicotine after a 30-day quit. Resuming binge-purge cycle after a recovery week."
              routing="Accountability-referral envelope, if opted in."
            />
            <RiskClassRow
              kicker="01.c · crisis_indication"
              title="Coaching path closed. Active referral."
              body="The behavioral signal carries a credible indication of psychological crisis. AI must stop coaching IMMEDIATELY. RAP emits a crisis-referral envelope with jurisdictional crisis-line numbers, the user's pre-set emergency contact (if granted), and a self-care holding pattern. No further PAP proposals fire until a human-reviewed re-open is logged."
              example="Suicidal ideation phrases. Self-harm imagery. Acute substance crisis. Domestic-violence signals."
              routing="crisis_referral_envelope. 988 / Samaritans / jurisdictional line. AI must not re-enter the coaching path without human review."
            />
            <RiskClassRow
              kicker="01.d · legal_or_medical_emergency"
              title="Override every other protocol. Route to emergency services."
              body="Imminent danger to life or limb. RAP supersedes every other protocol — even active UAP grants and pending EAP IRREVERSIBLE actions. The AI must not attempt to coach, intervene, or delay routing."
              example="Acute overdose signals. Active bleeding. Stroke / cardiac signals. Active violence."
              routing="emergency_referral_envelope. 911 / jurisdictional emergency number. ai_must_refuse_coaching: true."
            />
          </div>
        </section>

        {/* THE CLASSIFIER */}
        <section className="space-y-8 border-t border-orange-500 pt-12">
          <div className="space-y-4">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              02 · The classifier
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              Hard rules where false negatives kill.{' '}
              <span className="italic text-orange-600">
                LLM evaluation where they don&rsquo;t.
              </span>
            </h2>
          </div>

          <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
            <code className="font-mono text-[13px] text-orange-600">
              crisis_indication
            </code>{' '}
            and{' '}
            <code className="font-mono text-[13px] text-orange-600">
              legal_or_medical_emergency
            </code>{' '}
            triggers are <strong>hard-rule</strong> — keyword + phrase pattern
            + structured-signal matchers that bypass the LLM entirely. False-
            positive rate accepted in exchange for zero false-negative tolerance.{' '}
            <code className="font-mono text-[13px] text-orange-600">
              routine_friction
            </code>{' '}
            vs.{' '}
            <code className="font-mono text-[13px] text-orange-600">
              pattern_relapse
            </code>{' '}
            is an LLM evaluation against the user&rsquo;s BIP pattern history.
          </p>

          <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
            Below confidence 0.7, the classifier escalates to the next-higher
            class. When in doubt, escalate, never de-escalate.
          </p>

          <p className="max-w-2xl text-sm leading-[1.6] text-gray-600">
            Every classification carries a{' '}
            <code className="font-mono text-[13px] text-orange-600">
              rationale_signature
            </code>{' '}
            — a deterministic hash of the signal chain that drove the decision.
            A Trust &amp; Safety reviewer can re-run RAP against the same
            signal chain six months later and confirm the classifier would
            have produced the same risk class.
          </p>
        </section>

        {/* OPEN QUESTIONS */}
        <section className="space-y-8 border-t border-gray-200 pt-12">
          <div className="space-y-4">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
              03 · What this draft does NOT yet answer
            </p>
            <h2 className="max-w-3xl font-serif text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-5xl">
              The four{' '}
              <span className="italic text-orange-600">
                community-input
              </span>{' '}
              questions.
            </h2>
          </div>

          <ul className="space-y-6 text-base leading-[1.7] text-gray-700">
            <li className="flex gap-3">
              <span className="font-mono text-xs text-orange-600 pt-1">·</span>
              <span>
                <strong className="font-serif font-normal italic">
                  False-positive cost of crisis triggers.
                </strong>{' '}
                Hard rules fire on phrase patterns. Quoting song lyrics, research
                context, dark humor — all produce false positives that close the
                coaching path for the session. What&rsquo;s the right re-open mechanism?
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-xs text-orange-600 pt-1">·</span>
              <span>
                <strong className="font-serif font-normal italic">
                  Per-jurisdiction routing tables.
                </strong>{' '}
                This spec defaults US-centric (988). The full international
                table needs community curation. PRs welcome.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-xs text-orange-600 pt-1">·</span>
              <span>
                <strong className="font-serif font-normal italic">
                  pattern_relapse under partial recovery.
                </strong>{' '}
                A user mid-rebuild with three slips in a month — routine
                friction (still trying) or pattern relapse (crossed back)?
                The reference engine treats this as user-configurable; the
                spec needs clearer guidance.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-xs text-orange-600 pt-1">·</span>
              <span>
                <strong className="font-serif font-normal italic">
                  EAP irreversibility-floor interaction.
                </strong>{' '}
                When an EAP IRREVERSIBLE action is mid-flight and RAP
                emits an emergency envelope — the exact handshake needs
                more thought.
              </span>
            </li>
          </ul>
        </section>

        {/* CLOSING ANCHOR */}
        <section className="space-y-10 border-t border-orange-500 pt-12">
          <blockquote className="max-w-4xl font-serif text-3xl font-normal italic leading-[1.15] tracking-[-0.02em] text-gray-900 md:text-6xl">
            The same architecture that lets an AI catch you before you fold{' '}
            <span className="not-italic text-orange-600">
              has to know when to step out of the way.
            </span>
          </blockquote>

          <p className="max-w-2xl text-base leading-[1.7] text-gray-700">
            RAP is the floor. The coordinator owns the implementation; the spec
            is open. Without this layer, behavior-aware AI is worse than
            chat-only AI. The category COYL is trying to define depends on
            having this answer.
          </p>

          <div className="flex flex-wrap gap-3">
            <a
              href={SPEC_URL}
              target="_blank"
              rel="noopener"
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
            >
              Read the full spec →
            </a>
            <Link
              href="/protocol"
              className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:border-orange-300"
            >
              The protocol stack
            </Link>
            <a
              href="mailto:protocol@coyl.ai?subject=RAP+spec+input"
              className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:border-orange-300"
            >
              Send spec input
            </a>
          </div>
        </section>
      </article>
    </>
  )
}

function RiskClassRow({
  kicker,
  title,
  body,
  example,
  routing,
}: {
  kicker: string
  title: string
  body: string
  example: string
  routing: string
}) {
  return (
    <div className="grid grid-cols-1 gap-6 border-t border-gray-200 pt-8 md:grid-cols-12 md:gap-10">
      <div className="md:col-span-5">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
          {kicker}
        </p>
        <h3 className="mt-3 font-serif text-2xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900 md:text-3xl">
          {title}
        </h3>
      </div>
      <div className="space-y-4 md:col-span-7">
        <p className="text-base leading-[1.65] text-gray-700">{body}</p>
        <p className="text-sm leading-[1.6] text-gray-600">
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.24em] text-gray-500">
            Example
          </span>{' '}
          · {example}
        </p>
        <p className="text-sm leading-[1.6] text-gray-600">
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.24em] text-orange-600">
            Routing
          </span>{' '}
          · {routing}
        </p>
      </div>
    </div>
  )
}
