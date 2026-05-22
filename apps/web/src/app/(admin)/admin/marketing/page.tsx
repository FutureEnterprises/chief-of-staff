import Link from 'next/link'
import { MarketingPlatform, MarketingPostStatus } from '@repo/database'
import { listDrafts } from './actions'
import { DraftRowActions } from './draft-row-actions'


/**
 * Marketing approval queue — list view.
 *
 * Filters via query string (?status=DRAFT&platform=REDDIT) so links can
 * be shared / bookmarked. Listing is server-rendered for max immediacy;
 * the row actions are a client island.
 */
export default async function MarketingQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; platform?: string }>
}) {
  const sp = await searchParams
  const statusFilter = isMarketingStatus(sp.status) ? sp.status : undefined
  const platformFilter = isMarketingPlatform(sp.platform) ? sp.platform : undefined

  const drafts = await listDrafts({ status: statusFilter, platform: platformFilter })

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between border-b border-white/[0.08] pb-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange-500">
            Marketing queue
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Drafts</h1>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.1em] text-gray-500">
            {drafts.length} record{drafts.length === 1 ? '' : 's'}
          </p>
        </div>
        <Link
          href="/admin/marketing/new"
          className="border border-orange-500 bg-orange-500 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-black hover:bg-orange-400"
        >
          + New draft
        </Link>
      </div>

      <FilterBar status={statusFilter} platform={platformFilter} />

      {drafts.length === 0 ? (
        <div className="border border-dashed border-white/[0.08] p-12 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-gray-500">
            No drafts match
          </p>
          <p className="mt-2 text-sm text-gray-400">
            Use{' '}
            <Link href="/admin/marketing/new" className="text-orange-500 hover:underline">
              New draft
            </Link>{' '}
            to generate the first one.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {drafts.map((d) => (
            <li
              key={d.id}
              className="border border-white/[0.08] bg-[#101010] p-4 hover:border-white/20"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill status={d.status} />
                    <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-gray-400">
                      {d.platform.toLowerCase().replaceAll('_', '-')}
                    </span>
                    {d.archetype && (
                      <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-gray-500">
                        · {d.archetype}
                      </span>
                    )}
                    <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-gray-600">
                      · {d.model}
                    </span>
                  </div>
                  <Link
                    href={`/admin/marketing/${d.id}`}
                    className="mt-2 block truncate text-sm text-gray-100 hover:text-orange-500"
                  >
                    {d.topic}
                  </Link>
                  <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                    {(d.finalBody ?? d.draftBody).slice(0, 200)}
                  </p>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.08em] text-gray-600">
                    {d.generatedAt.toISOString().slice(0, 19).replace('T', ' ')} UTC
                    {d.postedUrl && (
                      <>
                        {' · '}
                        <a
                          href={d.postedUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-orange-500 hover:underline"
                        >
                          posted ↗
                        </a>
                      </>
                    )}
                  </p>
                </div>
                <DraftRowActions id={d.id} status={d.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function StatusPill({ status }: { status: MarketingPostStatus }) {
  const map: Record<MarketingPostStatus, string> = {
    DRAFT: 'border-gray-600 text-gray-300',
    APPROVED: 'border-orange-500 text-orange-500',
    POSTED: 'border-emerald-500 text-emerald-400',
    REJECTED: 'border-red-500/60 text-red-400',
    ERRORED: 'border-yellow-500 text-yellow-400',
  }
  return (
    <span
      className={`inline-flex items-center border px-2 py-[2px] font-mono text-[9px] uppercase tracking-[0.12em] ${map[status]}`}
    >
      {status}
    </span>
  )
}

function FilterBar({
  status,
  platform,
}: {
  status?: MarketingPostStatus
  platform?: MarketingPlatform
}) {
  const statuses: (MarketingPostStatus | undefined)[] = [
    undefined,
    'DRAFT',
    'APPROVED',
    'POSTED',
    'REJECTED',
    'ERRORED',
  ]
  const platforms: (MarketingPlatform | undefined)[] = [
    undefined,
    'REDDIT',
    'TWITTER_THREAD',
    'TWITTER_SINGLE',
    'THREADS',
    'LINKEDIN',
    'INDIEHACKERS',
    'PRODUCTHUNT',
    'HACKERNEWS',
    'NEWSLETTER',
  ]

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500">Status</span>
        {statuses.map((s) => {
          const params = new URLSearchParams()
          if (s) params.set('status', s)
          if (platform) params.set('platform', platform)
          const href = `/admin/marketing${params.toString() ? `?${params.toString()}` : ''}`
          const active = s === status
          return (
            <Link
              key={s ?? 'all-status'}
              href={href}
              className={`border px-2 py-[3px] font-mono text-[10px] uppercase tracking-[0.1em] ${
                active
                  ? 'border-orange-500 text-orange-500'
                  : 'border-white/10 text-gray-400 hover:border-white/30 hover:text-gray-200'
              }`}
            >
              {s ?? 'all'}
            </Link>
          )
        })}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500">Platform</span>
        {platforms.map((p) => {
          const params = new URLSearchParams()
          if (status) params.set('status', status)
          if (p) params.set('platform', p)
          const href = `/admin/marketing${params.toString() ? `?${params.toString()}` : ''}`
          const active = p === platform
          return (
            <Link
              key={p ?? 'all-platform'}
              href={href}
              className={`border px-2 py-[3px] font-mono text-[10px] uppercase tracking-[0.1em] ${
                active
                  ? 'border-orange-500 text-orange-500'
                  : 'border-white/10 text-gray-400 hover:border-white/30 hover:text-gray-200'
              }`}
            >
              {p ? p.toLowerCase().replaceAll('_', '-') : 'all'}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

const STATUSES = new Set<MarketingPostStatus>([
  'DRAFT',
  'APPROVED',
  'POSTED',
  'REJECTED',
  'ERRORED',
])
const PLATFORMS = new Set<MarketingPlatform>([
  'REDDIT',
  'TWITTER_THREAD',
  'TWITTER_SINGLE',
  'THREADS',
  'LINKEDIN',
  'INDIEHACKERS',
  'PRODUCTHUNT',
  'HACKERNEWS',
  'NEWSLETTER',
])

function isMarketingStatus(value: string | undefined): value is MarketingPostStatus {
  return !!value && STATUSES.has(value as MarketingPostStatus)
}

function isMarketingPlatform(value: string | undefined): value is MarketingPlatform {
  return !!value && PLATFORMS.has(value as MarketingPlatform)
}
