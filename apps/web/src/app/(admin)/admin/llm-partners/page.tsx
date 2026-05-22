import Link from 'next/link'
import { prisma } from '@repo/database'
import { auth } from '@clerk/nextjs/server'
import { notFound } from 'next/navigation'
import { isAdmin } from '@/lib/admin-auth'

export const metadata = { title: 'LLM partners — COYL Admin', robots: { index: false } }

/**
 * LLM-partner list view.
 *
 * Lists every registered foundation-lab partner (Anthropic, OpenAI,
 * Google, etc.) with the columns a founder / partner-success team
 * needs at-a-glance:
 *   slug · name · publisher · active · pricingTier · rateLimitPerHour
 *   · lastFour · createdAt
 *
 * Gated by the (admin)/layout email check AND a second-line
 * ADMIN_USER_IDS check (so a future second admin without LLM-partner
 * privs is still blocked).
 */
export default async function LLMPartnersPage() {
  const { userId } = await auth()
  if (!userId || !isAdmin(userId)) notFound()

  const partners = await prisma.lLMPartner.findMany({
    orderBy: [{ active: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      slug: true,
      name: true,
      publisher: true,
      active: true,
      pricingTier: true,
      rateLimitPerHour: true,
      apiKeyLastFour: true,
      createdAt: true,
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between border-b border-white/[0.08] pb-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange-500">
            LLM partners
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Foundation labs
          </h1>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.1em] text-gray-500">
            {partners.length} partner{partners.length === 1 ? '' : 's'} ·{' '}
            {partners.filter((p) => p.active).length} active
          </p>
        </div>
        <Link
          href="/admin/llm-partners/new"
          className="border border-orange-500 bg-orange-500 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-black hover:bg-orange-400"
        >
          + New partner
        </Link>
      </div>

      <nav className="flex items-center gap-4 border-b border-white/[0.04] pb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-gray-500">
        <Link href="/admin/llm-partners" className="text-orange-500">
          LLM partners
        </Link>
        <Link href="/admin/marketing" className="hover:text-gray-200">
          Marketing
        </Link>
        <Link href="/admin" className="hover:text-gray-200">
          Metrics
        </Link>
      </nav>

      {partners.length === 0 ? (
        <div className="border border-dashed border-white/[0.08] p-12 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-gray-500">
            No partners registered yet
          </p>
          <p className="mt-2 text-sm text-gray-400">
            Use{' '}
            <Link
              href="/admin/llm-partners/new"
              className="text-orange-500 hover:underline"
            >
              + New partner
            </Link>{' '}
            to register the first foundation lab.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-white/[0.06]">
          <table className="min-w-full divide-y divide-white/[0.06] text-sm">
            <thead className="bg-[#111]">
              <tr className="text-left font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500">
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Publisher</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3">Rate/h</th>
                <th className="px-4 py-3">Last4</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {partners.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-3 font-mono text-[12px] text-gray-200">
                    <Link
                      href={`/admin/llm-partners/${p.id}`}
                      className="hover:text-orange-500"
                    >
                      {p.slug}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{p.name}</td>
                  <td className="px-4 py-3 text-gray-400">{p.publisher}</td>
                  <td className="px-4 py-3">
                    {p.active ? (
                      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-emerald-400">
                        active
                      </span>
                    ) : (
                      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500">
                        inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] uppercase tracking-[0.08em] text-gray-400">
                    {p.pricingTier}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-gray-400">
                    {p.rateLimitPerHour.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-gray-500">
                    …{p.apiKeyLastFour}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-gray-500">
                    {p.createdAt.toISOString().slice(0, 10)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/llm-partners/${p.id}`}
                      className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500 hover:text-orange-500"
                    >
                      view →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
