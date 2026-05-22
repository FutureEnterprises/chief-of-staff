import Link from 'next/link'
import { getCurrentProvider, getProviderPatients } from '@/lib/provider-rbac'
import { prisma } from '@repo/database'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Provider · Overview' }

/**
 * /provider — provider dashboard root.
 *
 * Top-of-funnel for the clinical channel surface. Three summary cards
 * (total patients, slips this week, avg self-trust) plus a link to
 * the full cohort table. Designed to load in <200ms with a 10-patient
 * cohort.
 *
 * Layout gating already happens in (provider)/layout.tsx — by the
 * time this component runs, getCurrentProvider() has succeeded.
 */
export default async function ProviderOverviewPage() {
  const provider = await getCurrentProvider()
  // layout.tsx has already gated; this is a defense-in-depth nil-check.
  if (!provider) return null

  const patients = await getProviderPatients(provider.id)

  let slipsThisWeek = 0
  if (patients.length > 0) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const slipRows = await prisma.slipRecord.findMany({
      where: {
        userId: { in: patients.map((p) => p.id) },
        createdAt: { gte: sevenDaysAgo },
      },
      select: { id: true },
    })
    slipsThisWeek = slipRows.length
  }

  const avgSelfTrust =
    patients.length > 0
      ? Math.round(
          patients.reduce((sum, p) => sum + (p.selfTrustScore ?? 0), 0) /
            patients.length,
        )
      : 0

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">
          Provider Dashboard
        </p>
        <h1 className="mt-2 font-serif text-3xl tracking-tight text-slate-900">
          Your cohort, at a glance.
        </h1>
        <p className="mt-2 max-w-prose text-sm text-slate-600">
          Aggregated behavior signal for the patients who have invited you to
          their COYL account. Raw biometric samples are not exposed.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard
          eyebrow="Total patients"
          value={patients.length.toString()}
          hint={patients.length === 0 ? 'No invites accepted yet' : undefined}
        />
        <SummaryCard
          eyebrow="Slips · last 7 days"
          value={slipsThisWeek.toString()}
          hint="Across cohort"
        />
        <SummaryCard
          eyebrow="Avg self-trust"
          value={`${avgSelfTrust}`}
          hint="0–100 scale"
        />
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-xl tracking-tight">Cohort detail</h2>
            <p className="mt-1 text-sm text-slate-600">
              Sortable patient list with per-patient drilldown.
            </p>
          </div>
          <Link
            href="/provider/cohort"
            className="rounded-sm border border-slate-300 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-slate-700 hover:border-slate-900 hover:text-slate-900"
          >
            Open cohort
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 pt-4 text-xs text-slate-500">
        v0.1 · HIPAA-light. Patient names are anonymized to first-name +
        last-initial unless a BAA is on file. Patient retains full export
        rights.
      </footer>
    </div>
  )
}

function SummaryCard({
  eyebrow,
  value,
  hint,
}: {
  eyebrow: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
        {eyebrow}
      </p>
      <p className="mt-3 font-serif text-3xl tracking-tight text-slate-900">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  )
}
