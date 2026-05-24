import type { Metadata } from 'next'
import Link from 'next/link'
import { cacheLife, cacheTag } from 'next/cache'
import { BreadcrumbSchema } from '@/app/structured-data'

/**
 * /trust — public Trust Center landing for COYL.
 *
 * Shipped per the AppSource submission package
 * (docs/integrations/teams-appsource-submission.md, step 9) and the
 * round-3 compliance posture work (docs/regulatory/compliance-posture-
 * may-2026.md). Microsoft 365 Certification and AppSource Publisher
 * Attestation both treat a Trust Center URL as a soft requirement —
 * IT buyers expect to find one. Most enterprise procurement flows
 * include a "Trust Center URL" field on the vendor onboarding form.
 *
 * Honest framing: COYL is a pre-revenue, founder-led startup. We do
 * NOT pretend to be SOC 2-certified or HIPAA-compliant when we aren't.
 * The page maps directly to what's in place vs in progress, with
 * specific status indicators per program. This is the buyer-facing
 * version of docs/regulatory/compliance-posture-may-2026.md.
 *
 * Visual: same cinematic editorial template as /safety + /privacy.
 * Cream canvas, Instrument Serif H1, single orange accent.
 */

export const metadata: Metadata = {
  title: 'Trust Center — security, privacy, and compliance · COYL',
  description:
    'Honest, current status of COYL\'s security, privacy, and compliance program. What\'s in place, what\'s in progress, and how to reach our security team.',
  keywords: [
    'coyl trust center',
    'coyl security',
    'coyl privacy',
    'coyl hipaa',
    'coyl soc2',
    'coyl compliance',
  ],
  alternates: { canonical: '/trust' },
  openGraph: {
    title: 'COYL Trust Center',
    description:
      'Honest, current status of our security, privacy, and compliance program.',
    url: 'https://coyl.ai/trust',
    images: [
      {
        url: '/api/og?title=Trust+Center&kicker=Security+%C2%B7+Privacy+%C2%B7+Compliance',
        width: 1200,
        height: 630,
      },
    ],
  },
}

type ProgramStatus = 'in_place' | 'in_progress' | 'planned'

const STATUS_LABEL: Record<ProgramStatus, string> = {
  in_place: 'In place',
  in_progress: 'In progress',
  planned: 'Planned',
}

const STATUS_DOT: Record<ProgramStatus, string> = {
  in_place: 'bg-emerald-500',
  in_progress: 'bg-amber-500',
  planned: 'bg-gray-400',
}

type Program = {
  name: string
  status: ProgramStatus
  detail: string
}

// One row per discrete program. The honest cell is the `status` field
// — if a program is "in_place", an acquirer's diligence team should
// expect to receive evidence on request. If "in_progress", we have
// the scaffold + named owner but no auditor sign-off. If "planned",
// we're committing to a date but the work hasn't begun.
const PROGRAMS: Program[] = [
  {
    name: 'Encryption at rest',
    status: 'in_place',
    detail: 'AES-256 across Supabase (Postgres + storage). Vercel encrypted environment variables. Apple/Google encryption for push notification payloads.',
  },
  {
    name: 'Encryption in transit',
    status: 'in_place',
    detail: 'TLS 1.3 for all client-server and server-server traffic. HSTS enforced via Vercel headers.',
  },
  {
    name: 'Row-level security (RLS) on all database tables',
    status: 'in_place',
    detail: 'Every public-schema table in the COYL database has RLS enabled with no public policies. Service-role bypass is the only access path; anon-key REST exposure cannot read rows.',
  },
  {
    name: 'Authentication (SSO + MFA)',
    status: 'in_place',
    detail: 'Clerk-managed identity. SSO via Azure AD / Google Workspace / Okta available on Workspace tier. MFA enforced on admin accounts.',
  },
  {
    name: 'Secrets management',
    status: 'in_progress',
    detail: 'Production secrets in Vercel encrypted env vars. Quarterly rotation cadence being formalized; secret-scanning CI being added.',
  },
  {
    name: 'Vulnerability scanning',
    status: 'in_progress',
    detail: 'Static analysis via Semgrep at edit time. Dependency scanning via GitHub Dependabot. Third-party penetration test scheduled Q3 2026.',
  },
  {
    name: 'Business Associate Agreement (HIPAA)',
    status: 'in_progress',
    detail: 'BAA template drafted (docs/regulatory/baa-template.md). Outside counsel review + upstream BAA execution with Anthropic, Supabase, Vercel, Resend, Twilio, Clerk in progress. Available on request once counsel-reviewed.',
  },
  {
    name: 'Breach notification policy',
    status: 'in_progress',
    detail: 'Draft policy in place (docs/regulatory/breach-notification-policy.md) with state-law overlay matrix. Outside counsel review + Security Officer designation pending.',
  },
  {
    name: 'Security risk analysis',
    status: 'in_progress',
    detail: 'NIST 800-30 informal risk analysis published internally (docs/regulatory/security-risk-analysis.md). Top-10 gap remediation plan active.',
  },
  {
    name: 'SOC 2 Type II',
    status: 'planned',
    detail: 'Planned audit window: Q2 2027 (12-month observation period begins Q2 2026). Vanta or Drata as the compliance automation partner — selection pending.',
  },
  {
    name: 'HIPAA-eligible architecture',
    status: 'in_progress',
    detail: 'Data layer architected to HIPAA-aligned controls (encryption, access logging, audit trail). Full HIPAA Business Associate status pending the upstream BAA chain + Security Officer designation.',
  },
  {
    name: 'GDPR + CCPA + state privacy laws',
    status: 'in_place',
    detail: 'Data deletion path live at /api/v1/user (DELETE). Privacy policy at /privacy describes data classes, retention windows, and third-party processors.',
  },
  {
    name: 'Subprocessor list',
    status: 'in_place',
    detail: 'Public list maintained at /privacy. Current subprocessors: Vercel (hosting), Supabase (database), Clerk (auth), Anthropic (model inference), Resend (email), Twilio (SMS), Apple/Google (push).',
  },
  {
    name: 'Microsoft 365 Certification',
    status: 'planned',
    detail: 'Target submission Q3 2026 alongside the Microsoft Teams AppSource listing. Will publish certification badge when granted.',
  },
]

// Security-contact info is what a Trust Center is for — give buyers
// a single channel to reach the right person about an issue.
const SECURITY_CONTACTS = [
  {
    label: 'Report a vulnerability',
    detail: 'Email security@coyl.ai. We acknowledge within 1 business day and aim to resolve critical findings within 14 days.',
  },
  {
    label: 'Request a SOC 2 / HIPAA / BAA package',
    detail: 'Email security@coyl.ai with your company + use case. Available packages: current security posture summary, draft BAA, breach notification policy, security risk analysis summary.',
  },
  {
    label: 'Privacy questions or data deletion requests',
    detail: 'Email privacy@coyl.ai OR delete your account in-app at /settings (data is purged within 30 days per our retention policy).',
  },
]

export default async function TrustPage() {
  'use cache'
  cacheLife('hours')
  cacheTag('marketing-trust')

  const inPlaceCount = PROGRAMS.filter((p) => p.status === 'in_place').length
  const inProgressCount = PROGRAMS.filter((p) => p.status === 'in_progress').length
  const plannedCount = PROGRAMS.filter((p) => p.status === 'planned').length

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'COYL', url: 'https://coyl.ai' },
          { name: 'Trust Center', url: 'https://coyl.ai/trust' },
        ]}
      />

      {/* EYEBROW + H1 + subhead — same atom as /safety + /privacy.
          The honest framing is the hero: "we tell you exactly what's
          in place and what isn't." */}
      <div className="mb-4 flex items-center gap-3">
        <span className="h-px w-8 bg-orange-500" />
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
          Trust Center
        </span>
      </div>

      <h1 className="mb-6 max-w-3xl font-serif text-4xl font-normal leading-[1.05] tracking-[-0.02em] text-gray-900 md:text-6xl">
        Security, privacy, and compliance &mdash;{' '}
        <span className="italic text-orange-600">honest, current.</span>
      </h1>

      <p className="mb-6 max-w-2xl text-lg leading-[1.65] text-gray-700">
        Every line below has a status: <strong>in place</strong>,{' '}
        <strong>in progress</strong>, or <strong>planned with a date</strong>.
        If you&rsquo;re evaluating COYL for an enterprise rollout, a
        clinical pilot, or an acquisition diligence, you should know
        exactly where the program stands. We won&rsquo;t claim what we
        haven&rsquo;t built.
      </p>

      <p className="mb-12 max-w-2xl text-base leading-[1.7] text-gray-600">
        Updated May 24, 2026. Last reviewed: same.
      </p>

      {/* STATUS SUMMARY — top-of-fold counts so a buyer can see the
          shape of the program in 3 seconds. */}
      <section className="mb-16 grid grid-cols-3 gap-4">
        <StatusSummaryCard label="In place" count={inPlaceCount} dot={STATUS_DOT.in_place} />
        <StatusSummaryCard label="In progress" count={inProgressCount} dot={STATUS_DOT.in_progress} />
        <StatusSummaryCard label="Planned" count={plannedCount} dot={STATUS_DOT.planned} />
      </section>

      {/* PROGRAM TABLE — one row per discrete control or certification.
          Editorial table style; status dot first, label, then the
          honest detail. */}
      <section className="mb-16">
        <div className="mb-4 flex items-center gap-3">
          <span className="h-px w-8 bg-orange-500" />
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            The program
          </span>
        </div>
        <h2 className="mb-8 max-w-3xl font-serif text-3xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900 md:text-4xl">
          14 lines, one status each.
        </h2>

        <ul className="space-y-3">
          {PROGRAMS.map((p) => (
            <li
              key={p.name}
              className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-5 md:grid-cols-[auto_1fr] md:gap-6"
            >
              <div className="flex items-center gap-2 md:flex-col md:items-start md:gap-1">
                <span className={`block h-2.5 w-2.5 rounded-full ${STATUS_DOT[p.status]}`} aria-hidden />
                <span className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-gray-600">
                  {STATUS_LABEL[p.status]}
                </span>
              </div>
              <div>
                <p className="font-serif text-lg font-normal text-gray-900">{p.name}</p>
                <p className="mt-1 text-sm leading-[1.65] text-gray-700">{p.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* CONTACTS — Trust Center 101: give buyers a way to reach us. */}
      <section className="mb-16 border-t border-gray-200 pt-12">
        <div className="mb-4 flex items-center gap-3">
          <span className="h-px w-8 bg-orange-500" />
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.32em] text-orange-600">
            Reach the security team
          </span>
        </div>
        <h2 className="mb-8 max-w-3xl font-serif text-3xl font-normal leading-[1.15] tracking-[-0.01em] text-gray-900 md:text-4xl">
          One channel, three asks.
        </h2>
        <ul className="space-y-4">
          {SECURITY_CONTACTS.map((c) => (
            <li key={c.label} className="border-l-[3px] border-orange-500/60 bg-orange-500/5 px-5 py-4">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-orange-700">
                {c.label}
              </p>
              <p className="mt-2 text-sm leading-[1.65] text-gray-800">{c.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* SUBPROCESSORS + INCIDENT HISTORY — the two things every IT
          buyer asks for. Both link out so the page stays focused. */}
      <section className="mb-16 border-t border-gray-200 pt-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-orange-600">
              Subprocessors
            </p>
            <p className="mt-2 text-sm leading-[1.65] text-gray-700">
              Full list maintained at <Link href="/privacy" className="text-orange-700 underline-offset-4 hover:underline">/privacy</Link>.
              We notify enterprise customers via email when the
              subprocessor list materially changes.
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-orange-600">
              Incident history
            </p>
            <p className="mt-2 text-sm leading-[1.65] text-gray-700">
              Zero security incidents through May 2026. Status page
              with uptime + any incidents lives at{' '}
              <Link href="/changelog" className="text-orange-700 underline-offset-4 hover:underline">/changelog</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* RECURRING ANCHOR — the brand mantra closer every wedge has. */}
      <section className="border-t border-gray-200 pt-12 text-center">
        <p className="font-serif text-2xl font-normal italic leading-[1.3] text-gray-700 md:text-3xl">
          AI for the moment before behavior happens.
        </p>
      </section>
    </>
  )
}

function StatusSummaryCard({
  label,
  count,
  dot,
}: {
  label: string
  count: number
  dot: string
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-2 flex items-center gap-2">
        <span className={`block h-2.5 w-2.5 rounded-full ${dot}`} aria-hidden />
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-gray-600">
          {label}
        </p>
      </div>
      <p className="font-serif text-4xl font-normal tracking-tight text-gray-900">{count}</p>
    </div>
  )
}
