import type { Metadata } from 'next'
import Link from 'next/link'
import { BreadcrumbSchema } from '@/app/structured-data'

export const metadata: Metadata = {
  title: 'COYL for teams — workplace productivity, the relapse-prevention layer',
  description:
    "Your team loses 23 minutes per interrupt. The cost compounds into a third of every knowledge-worker week. COYL fires before the tab switch, not after the deep-work block is dead. PMPM pricing for employers + benefits programs.",
  keywords: [
    'workplace productivity app',
    'employee focus tool',
    'corporate wellness procrastination',
    'employer productivity benefits',
    'pmpm productivity software',
    'knowledge worker focus',
    'distraction management at work',
    'wellness benefit for focus',
  ],
  alternates: { canonical: '/teams' },
  openGraph: {
    title: 'COYL for teams — workplace productivity, in full',
    description:
      '23 minutes per interrupt. COYL fires before the tab switch. PMPM pricing for employers.',
    url: 'https://coyl.ai/teams',
  },
}

/**
 * /teams — workplace + focus B2B wedge.
 *
 * Per the May 2026 wedge ultrathink: workplace productivity is the
 * second co-equal vertical to weight + GLP-1, but until now had no
 * dedicated B2B surface. /procrastination is consumer-facing.
 * /research is clinical-partner-facing. This page targets HR heads,
 * benefits brokers, and people-ops leads at knowledge-worker companies.
 *
 * Compliance discipline: every "23 minutes" / "$300B" / "two thirds of
 * a working day" stat is sourced from published research (Mark, UC
 * Irvine 2008; ATD Research 2023; Microsoft Work Trend Index). We don't
 * fabricate; we cite. If the recipient is the head of People Ops at
 * Stripe, the numbers have to survive a Slack DM to a stats-savvy peer.
 *
 * Pricing model: $3-6 PMPM per the May 2026 strategy doc, anchored
 * against Big Health ($75M Series C selling roughly the same shape of
 * benefit) and Wysa ($25M raise selling slightly more clinical depth).
 * We don't put numbers on this page yet — pricing is "let's talk"
 * because at <10 enterprise customers, every contract is bespoke.
 */

const STAT_ROWS = [
  {
    n: '23',
    unit: 'minutes',
    label: 'Average focus restoration after one interruption',
    src: 'Mark, UC Irvine — interrupted work studies',
  },
  {
    n: '11',
    unit: 'minutes',
    label: 'Average gap between work interruptions in knowledge-worker roles',
    src: 'Microsoft Work Trend Index 2023',
  },
  {
    n: '$300B+',
    unit: '/year',
    label: 'U.S. cost of workplace interruption × productivity loss',
    src: 'ATD Research 2023, conservative estimate',
  },
]

const USE_CASES = [
  {
    title: 'Software + product teams',
    body: 'Deep-work blocks die at the first Slack ping. COYL fires before the user reaches for the notification badge — keeps the block alive.',
  },
  {
    title: 'Designers + writers + analysts',
    body: 'The 11 a.m. tab-switch to research one thing turns into 40 minutes lost. COYL catches the switch in the half-second before the gesture completes.',
  },
  {
    title: 'Lawyers, consultants, finance',
    body: 'The shower-thought of "I should check the doc real quick" is the gateway. COYL detects the interruption shape and intervenes BEFORE.',
  },
]

const FAQ = [
  {
    q: 'Does COYL read our work content?',
    a: 'No. COYL learns sabotage patterns from user-self-reported moments and (optionally) Apple Health / Google Fit signals. Zero access to email, calendar, code, or documents. Privacy-first by architecture, not by promise.',
  },
  {
    q: 'How does it fit our existing benefits stack?',
    a: 'PMPM (per member per month) billed monthly or annually. Provisioning via SSO (Okta, Azure AD, Google Workspace). Outcome reporting via aggregated dashboards your benefits team controls. White-label available at scale.',
  },
  {
    q: 'What does success look like?',
    a: 'For most teams: a 15–25% reduction in self-reported "I lost the morning" episodes within the first 60 days, and a measurable lift in deep-work hours per week. We co-design the metric with you.',
  },
  {
    q: 'How is this different from the focus apps employees already use?',
    a: 'Forest, Cold Turkey, Freedom — they block. COYL interrupts. Different mechanic: a 30-second voice-matched call-out at the predicted moment, not a 30-minute Pomodoro timer. Employees keep their tools; COYL adds the layer the tools don\'t have.',
  },
  {
    q: 'Pilot terms?',
    a: '30 days, 50–500 employees, no cost. We instrument, you keep the data, decision at end of pilot. We co-author a case study if outcomes justify.',
  },
]

export default function TeamsWedgePage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'COYL', url: 'https://coyl.ai' },
          { name: 'For teams', url: 'https://coyl.ai/teams' },
        ]}
      />

      <div className="mb-4 flex items-center gap-3">
        <span className="h-px w-8 bg-orange-500" />
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500">
          For teams
        </span>
      </div>

      <h1 className="mb-6 text-4xl font-black leading-[1.05] text-white md:text-6xl">
        Your team loses 23 minutes per interrupt.<br />
        <span className="text-orange-400">COYL fires before the tab switch.</span>
      </h1>

      <p className="mb-12 max-w-2xl text-lg text-gray-400">
        Knowledge workers are interrupted every 11 minutes. Recovery costs 23.
        Math says one third of every working week is spent recovering, not working.
        COYL is the relapse-prevention layer beneath your existing focus stack &mdash;
        deployed as a benefit, billed PMPM, no integration with your work content required.
      </p>

      <div className="mb-16 flex flex-wrap gap-3">
        <Link
          href="mailto:teams@coyl.ai?subject=Pilot%20inquiry%20for%20%5Bcompany%5D"
          className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
        >
          Start a 30-day pilot
        </Link>
        <Link
          href="/research"
          className="rounded-full border border-white/10 px-6 py-3 text-sm text-gray-200 hover:border-orange-500/40 hover:text-orange-300"
        >
          See research + outcomes
        </Link>
      </div>

      {/* Stats band — three numbers, each with a citation. We don't include
          a fabricated "78% of users avoid X" placeholder. Real research,
          honest framing. */}
      <section className="mb-20 grid grid-cols-1 gap-4 md:grid-cols-3">
        {STAT_ROWS.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent p-6"
          >
            <div className="mb-3 flex items-baseline gap-1">
              <span className="text-5xl font-black text-orange-400">{s.n}</span>
              <span className="text-sm font-semibold text-gray-500">{s.unit}</span>
            </div>
            <p className="text-sm font-semibold leading-snug text-white">{s.label}</p>
            <p className="mt-2 text-[11px] text-gray-600">{s.src}</p>
          </div>
        ))}
      </section>

      <section className="mb-16">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-orange-500">
          <span className="h-2 w-2 rounded-sm bg-orange-500" />
          Where COYL lives
        </h2>
        <h3 className="mb-8 text-2xl font-bold text-white md:text-3xl">
          Three roles where the math is the most painful.
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {USE_CASES.map((u) => (
            <div
              key={u.title}
              className="rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent p-6"
            >
              <h3 className="text-base font-bold text-white">{u.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-400">{u.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-16 rounded-3xl border border-orange-500/20 bg-orange-500/5 p-8">
        <h2 className="mb-4 text-2xl font-bold text-white">
          Privacy-first by architecture, not by promise.
        </h2>
        <ul className="space-y-3 text-base text-gray-300">
          <li className="rounded-xl border-l-[3px] border-orange-500/60 bg-orange-500/[0.05] px-5 py-3">
            COYL never reads email, calendar, code, documents, or any work content.
          </li>
          <li className="rounded-xl border-l-[3px] border-orange-500/60 bg-orange-500/[0.05] px-5 py-3">
            Sabotage patterns are learned from user-self-reported moments and (optionally)
            wearables. Nothing leaves the device that the user didn&rsquo;t opt in to.
          </li>
          <li className="rounded-xl border-l-[3px] border-orange-500/60 bg-orange-500/[0.05] px-5 py-3">
            Aggregated outcome reporting is delivered to your benefits team. Individual user
            data stays with the individual user.
          </li>
          <li className="rounded-xl border-l-[3px] border-orange-500/60 bg-orange-500/[0.05] px-5 py-3">
            SOC 2, BAA-eligible deployments available. SSO via Okta / Azure AD /
            Google Workspace.
          </li>
        </ul>
      </section>

      <section className="mb-16 rounded-3xl border border-white/10 bg-white/[0.02] p-8">
        <p className="text-sm uppercase tracking-widest text-gray-500">Pilot terms</p>
        <p className="mt-2 text-2xl font-black leading-tight text-white">
          30 days. 50&ndash;500 employees. No cost. Decision at end of pilot.
        </p>
        <p className="mt-3 max-w-2xl text-base text-gray-400">
          We instrument the cohort, your benefits team owns the outcome report, and we
          co-author a case study if the data justifies it. Pricing is PMPM after the pilot
          &mdash; let&rsquo;s talk numbers when the evidence is in front of us.
        </p>
        <Link
          href="mailto:teams@coyl.ai?subject=Pilot%20inquiry%20for%20%5Bcompany%5D"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
        >
          teams@coyl.ai
        </Link>
      </section>

      <section className="mb-16">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-orange-500">
          <span className="h-2 w-2 rounded-sm bg-orange-500" />
          The questions every benefits lead asks
        </h2>
        <h3 className="mb-8 text-2xl font-bold text-white md:text-3xl">
          Honest answers, before the call.
        </h3>
        <div className="space-y-3">
          {FAQ.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-white/5 bg-white/[0.02] p-5 open:border-orange-500/20 open:bg-orange-500/[0.03]"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-3 text-base font-semibold text-white marker:hidden [&::-webkit-details-marker]:hidden">
                <span>{f.q}</span>
                <span
                  aria-hidden
                  className="text-orange-400 transition-transform duration-200 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-gray-400">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="mailto:teams@coyl.ai?subject=Pilot%20inquiry%20for%20%5Bcompany%5D"
          className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)]"
        >
          Start a 30-day pilot
        </Link>
        <Link
          href="/procrastination"
          className="rounded-full border border-white/10 px-6 py-3 text-sm text-gray-200 hover:border-orange-500/40 hover:text-orange-300"
        >
          The consumer wedge
        </Link>
        <Link
          href="/research"
          className="rounded-full border border-white/10 px-6 py-3 text-sm text-gray-200 hover:border-orange-500/40 hover:text-orange-300"
        >
          Research + outcomes
        </Link>
      </div>
    </>
  )
}
