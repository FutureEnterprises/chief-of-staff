import Link from 'next/link'
import { notFound } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@repo/database'
import { revalidatePath } from 'next/cache'
import { isAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'LLM partner — COYL Admin', robots: { index: false } }

/**
 * LLM-partner detail view.
 *
 * Surfaces (in order, top → bottom):
 *   • Identity card (slug, name, publisher, last4, tier, rate limit,
 *     bundled scopes, createdAt)
 *   • 30-day usage snapshot (PAP proposals, ActionRequests, scope
 *     grants total)
 *   • Active scope grants (most recent 100, with user id + scope +
 *     granted-at)
 *   • Last 50 EAPAuditEntry rows scoped to this partner
 *   • Actions: rotate key, deactivate (soft-delete)
 *
 * The (admin)/layout email gate + the second-line ADMIN_USER_IDS
 * check both have to pass before any DB read happens.
 */
export default async function LLMPartnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId || !isAdmin(userId)) notFound()

  const partner = await prisma.lLMPartner.findUnique({ where: { id } })
  if (!partner) notFound()

  // Server-action: flip active=false (soft-delete). Re-validates the
  // detail page so the page reloads with the updated status.
  async function toggleActive(formData: FormData) {
    'use server'
    const partnerId = String(formData.get('partnerId') ?? '')
    const desired = String(formData.get('desired') ?? 'inactive') === 'active'
    const { userId: actorId } = await auth()
    if (!actorId || !isAdmin(actorId)) return
    await prisma.lLMPartner.update({
      where: { id: partnerId },
      data: { active: desired },
    })
    revalidatePath(`/admin/llm-partners/${partnerId}`)
    revalidatePath('/admin/llm-partners')
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [proposals30d, actions30d, scopeGrantCount, activeGrants, recentAudit] =
    await Promise.all([
      prisma.pAPProposal.count({
        where: { llmPartnerId: id, createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.actionRequest.count({
        where: { llmPartnerId: id, createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.scopeGrant.count({ where: { llmPartnerId: id, active: true } }),
      prisma.scopeGrant.findMany({
        where: { llmPartnerId: id, active: true },
        orderBy: { grantedAt: 'desc' },
        take: 100,
        select: {
          id: true,
          userId: true,
          scope: true,
          bundleKey: true,
          grantedAt: true,
          expiresAt: true,
          consentScreenVersion: true,
        },
      }),
      prisma.eAPAuditEntry.findMany({
        where: { llmPartnerId: id },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          eventKind: true,
          referenceId: true,
          userId: true,
          ipAddress: true,
          createdAt: true,
        },
      }),
    ])

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between border-b border-white/[0.08] pb-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange-500">
            LLM partner
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {partner.name}
          </h1>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.08em] text-gray-500">
            {partner.slug} ·{' '}
            <span className={partner.active ? 'text-emerald-400' : 'text-gray-500'}>
              {partner.active ? 'active' : 'inactive'}
            </span>{' '}
            · key …{partner.apiKeyLastFour}
          </p>
        </div>
        <Link
          href="/admin/llm-partners"
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500 hover:text-gray-200"
        >
          ← all partners
        </Link>
      </div>

      {/* Identity card */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KV label="Publisher" value={partner.publisher} />
        <KV label="Pricing tier" value={partner.pricingTier} mono />
        <KV
          label="Rate limit"
          value={`${partner.rateLimitPerHour.toLocaleString()} / hour`}
          mono
        />
        <KV
          label="Created"
          value={partner.createdAt.toISOString().slice(0, 19).replace('T', ' ')}
          mono
        />
        <KV
          label="Updated"
          value={partner.updatedAt.toISOString().slice(0, 19).replace('T', ' ')}
          mono
        />
        <KV label="Partner id" value={partner.id} mono />
        <div className="sm:col-span-2 lg:col-span-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-500">
            Bundled scopes
          </p>
          {partner.bundledScopes.length === 0 ? (
            <p className="mt-1 font-mono text-[11px] text-gray-600">
              (none)
            </p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              {partner.bundledScopes.map((s) => (
                <span
                  key={s}
                  className="border border-white/[0.08] bg-white/[0.02] px-2 py-1 font-mono text-[10px] tracking-[0.04em] text-gray-300"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Usage snapshot */}
      <section className="border border-white/[0.06]">
        <div className="border-b border-white/[0.06] bg-[#111] px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-400">
            Usage · last 30 days
          </p>
        </div>
        <div className="grid grid-cols-1 divide-y divide-white/[0.06] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <Metric label="PAP proposals" value={proposals30d} />
          <Metric label="Action requests" value={actions30d} />
          <Metric label="Active scope grants" value={scopeGrantCount} />
        </div>
      </section>

      {/* Active scope grants */}
      <section className="border border-white/[0.06]">
        <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#111] px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-400">
            Active scope grants · {activeGrants.length} shown
          </p>
          {activeGrants.length === 100 && (
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500">
              capped at 100
            </p>
          )}
        </div>
        {activeGrants.length === 0 ? (
          <p className="px-4 py-6 font-mono text-[11px] text-gray-500">
            No active scope grants for this partner yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/[0.06] text-sm">
              <thead>
                <tr className="text-left font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Scope</th>
                  <th className="px-4 py-3">Bundle</th>
                  <th className="px-4 py-3">Granted</th>
                  <th className="px-4 py-3">Expires</th>
                  <th className="px-4 py-3">Consent v.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {activeGrants.map((g) => (
                  <tr key={g.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-2 font-mono text-[11px] text-gray-300">
                      {g.userId}
                    </td>
                    <td className="px-4 py-2 font-mono text-[11px] text-gray-300">
                      {g.scope}
                    </td>
                    <td className="px-4 py-2 font-mono text-[11px] text-gray-500">
                      {g.bundleKey ?? '—'}
                    </td>
                    <td className="px-4 py-2 font-mono text-[11px] text-gray-500">
                      {g.grantedAt.toISOString().slice(0, 19).replace('T', ' ')}
                    </td>
                    <td className="px-4 py-2 font-mono text-[11px] text-gray-500">
                      {g.expiresAt
                        ? g.expiresAt.toISOString().slice(0, 10)
                        : '—'}
                    </td>
                    <td className="px-4 py-2 font-mono text-[11px] text-gray-500">
                      {g.consentScreenVersion}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Audit log */}
      <section className="border border-white/[0.06]">
        <div className="border-b border-white/[0.06] bg-[#111] px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-400">
            Last 50 audit entries
          </p>
        </div>
        {recentAudit.length === 0 ? (
          <p className="px-4 py-6 font-mono text-[11px] text-gray-500">
            No audit entries for this partner yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/[0.06] text-sm">
              <thead>
                <tr className="text-left font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500">
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {recentAudit.map((a) => (
                  <tr key={a.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-2 font-mono text-[11px] text-gray-500">
                      {a.createdAt.toISOString().slice(0, 19).replace('T', ' ')}
                    </td>
                    <td className="px-4 py-2 font-mono text-[11px] text-orange-400">
                      {a.eventKind}
                    </td>
                    <td className="px-4 py-2 font-mono text-[11px] text-gray-400">
                      {a.userId}
                    </td>
                    <td className="px-4 py-2 font-mono text-[11px] text-gray-500">
                      {a.referenceId ?? '—'}
                    </td>
                    <td className="px-4 py-2 font-mono text-[11px] text-gray-500">
                      {a.ipAddress ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Actions */}
      <section className="flex flex-wrap items-center gap-3 border-t border-white/[0.06] pt-6">
        <Link
          href={`/admin/llm-partners/${partner.id}/rotate-key`}
          className="border border-orange-500 bg-orange-500 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-black hover:bg-orange-400"
        >
          Rotate API key
        </Link>
        <form action={toggleActive}>
          <input type="hidden" name="partnerId" value={partner.id} />
          <input
            type="hidden"
            name="desired"
            value={partner.active ? 'inactive' : 'active'}
          />
          <button
            type="submit"
            className={`border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] ${
              partner.active
                ? 'border-red-500/60 bg-red-500/[0.08] text-red-300 hover:border-red-500 hover:bg-red-500/[0.15]'
                : 'border-emerald-500/60 bg-emerald-500/[0.08] text-emerald-300 hover:border-emerald-500 hover:bg-emerald-500/[0.15]'
            }`}
          >
            {partner.active ? 'Deactivate' : 'Reactivate'}
          </button>
        </form>
      </section>
    </div>
  )
}

function KV({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-500">
        {label}
      </p>
      <p
        className={`mt-1 ${
          mono ? 'font-mono text-[11px]' : 'text-sm'
        } text-gray-200`}
      >
        {value}
      </p>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-4 py-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-gray-100">
        {value.toLocaleString()}
      </p>
    </div>
  )
}
