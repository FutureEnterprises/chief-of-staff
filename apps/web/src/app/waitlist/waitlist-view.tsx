'use client'

import { useEffect, useState } from 'react'
import { getFamily, parseFamilySlug } from '@/lib/audit-archetype'

type JoinResult = {
  position: number
  total: number
  inviteCode: string
  referralCount: number
  spotsPerReferral: number
  archetypeSlug?: string | null
  alreadyOnList?: boolean
}

function getArchetypeName(slug: string | null | undefined) {
  const family = slug ? parseFamilySlug(slug) : null
  return family ? getFamily(family).name : null
}

function fireOwnedShareEvent(args: {
  inviteCode: string
  archetypeSlug: string | null
}) {
  if (typeof window === 'undefined') return
  const body = JSON.stringify({
    sessionId: `waitlist:${args.inviteCode}`.slice(0, 64),
    kind: 'shared',
    archetypeFamily: args.archetypeSlug ?? undefined,
    archetypeSlug: args.archetypeSlug ?? undefined,
    source: 'waitlist_invite',
  })

  try {
    if ('sendBeacon' in navigator) {
      const blob = new Blob([body], { type: 'application/json' })
      navigator.sendBeacon('/api/v1/audit/event', blob)
    } else {
      void fetch('/api/v1/audit/event', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {})
    }
  } catch {
    /* swallow */
  }
}

/**
 * Client island for /waitlist — the invite-only FOMO engine.
 *
 * Flow: email → POST /api/v1/waitlist → show position + invite link +
 * "+5 spots per friend". Reads ?ref= (referral attribution) and
 * ?archetype= (warmer confirmation) from the URL. Polls GET to surface
 * line-jumps as friends join.
 */
export function WaitlistView() {
  const [email, setEmail] = useState('')
  const [ref, setRef] = useState<string | null>(null)
  const [archetype, setArchetype] = useState<string | null>(null)
  const [source, setSource] = useState<string | null>(null)
  const [result, setResult] = useState<JoinResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search)
    setRef(sp.get('ref'))
    setArchetype(sp.get('archetype'))
    setSource(sp.get('source')?.slice(0, 64) ?? null)
  }, [])

  // Poll for live position updates once joined (friends joining bump us up).
  useEffect(() => {
    if (!result) return
    const id = setInterval(async () => {
      try {
        const r = await fetch(`/api/v1/waitlist?code=${result.inviteCode}`)
        if (r.ok) {
          const d = (await r.json()) as JoinResult
          setResult((prev) => (prev ? { ...prev, position: d.position, referralCount: d.referralCount, total: d.total } : prev))
        }
      } catch {
        /* swallow */
      }
    }, 15000)
    return () => clearInterval(id)
  }, [result])

  async function onJoin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const r = await fetch('/api/v1/waitlist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email,
          ref: ref ?? undefined,
          archetypeSlug: archetype ?? undefined,
          source: ref ? 'referral' : source ?? (archetype ? 'card' : 'direct'),
        }),
      })
      const d = await r.json()
      if (!r.ok) {
        setError(d?.error === 'rate_limited' ? 'Too many tries — give it a minute.' : 'Something went wrong. Try again.')
        return
      }
      setResult(d as JoinResult)
      try {
        void import('@/lib/telemetry/posthog-client').then(({ captureMarketingEvent }) =>
          captureMarketingEvent('free_tier.signup', { source: 'waitlist', archetype: archetype ?? undefined }),
        )
      } catch {
        /* swallow */
      }
    } catch {
      setError('Network error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  // Canonical host first so invite links don't fragment across
  // apex/preview/localhost origins (splits OG cache + referral analytics).
  const shareOrigin =
    process.env.NEXT_PUBLIC_APP_URL ??
    (typeof window !== 'undefined' ? window.location.origin : 'https://www.coyl.ai')
  const inviteUrl = result ? `${shareOrigin}/waitlist?ref=${result.inviteCode}` : ''
  const activeArchetypeSlug = result?.archetypeSlug ?? archetype
  const activeArchetypeName = getArchetypeName(activeArchetypeSlug)
  const shareText = activeArchetypeName
    ? `I got ${activeArchetypeName} on COYL and I'm #${result?.position} for the app. Use my invite to skip ahead → ${inviteUrl}`
    : `I'm #${result?.position} in line for COYL. Skip ahead with my code → ${inviteUrl}`

  async function onShare() {
    if (result) {
      fireOwnedShareEvent({
        inviteCode: result.inviteCode,
        archetypeSlug: activeArchetypeSlug ?? null,
      })
    }
    try {
      void import('@/lib/telemetry/posthog-client').then(({ captureMarketingEvent }) =>
        captureMarketingEvent('audit.shared', { channel: 'waitlist_invite' }),
      )
    } catch {
      /* swallow */
    }
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title: 'Skip the COYL line', text: shareText, url: inviteUrl })
        return
      } catch {
        /* fall through to copy */
      }
    }
    await navigator.clipboard.writeText(shareText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Joined state ──────────────────────────────────────────────
  if (result) {
    return (
      <div className="flex flex-col gap-8">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-orange-500">
            {result.alreadyOnList ? "You're already in" : "You're in"}
          </p>
          <div className="mt-4 flex items-baseline gap-4">
            <span className="font-serif text-7xl font-normal tracking-[-0.03em] text-[#f5efe6] md:text-8xl">
              #{result.position.toLocaleString()}
            </span>
            <span className="text-base text-[#8a7f6d]">of {result.total.toLocaleString()}</span>
          </div>
          {activeArchetypeName && (
            <p className="mt-3 text-sm text-[#a59a87]">
              Saved {activeArchetypeName}. We&rsquo;ll open your archetype first.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-orange-400/25 bg-orange-500/[0.08] p-6">
          <p className="font-serif text-xl text-[#f5efe6]">
            Jump <span className="text-orange-400">{result.spotsPerReferral} spots</span> for every
            friend who joins.
          </p>
          <p className="mt-1 text-sm text-[#a59a87]">
            {result.referralCount > 0
              ? `${result.referralCount} friend${result.referralCount === 1 ? '' : 's'} joined — you've jumped ${result.referralCount * result.spotsPerReferral}.`
              : 'No referrals yet. Send your code.'}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={onShare}
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-[0_0_24px_rgba(255,102,0,0.35)]"
            >
              Share your invite →
            </button>
            <button
              onClick={onShare}
              className="rounded-full border border-white/15 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-[#cdc2ad]"
            >
              {copied ? 'Copied ✓' : 'Copy link'}
            </button>
          </div>
          <p className="mt-4 break-all font-mono text-[11px] text-[#7a7264]">{inviteUrl}</p>
        </div>
      </div>
    )
  }

  // ── Join form ─────────────────────────────────────────────────
  return (
    <form onSubmit={onJoin} className="flex flex-col gap-4">
      {ref && (
        <p className="text-sm text-orange-300">A friend sent you — you&rsquo;ll skip ahead.</p>
      )}
      {!ref && activeArchetypeName && (
        <p className="text-sm text-orange-300">
          You came in through {activeArchetypeName} — we&rsquo;ll save it with your spot.
        </p>
      )}
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        className="w-full rounded-full border border-white/15 bg-white/[0.04] px-6 py-4 text-base text-[#f5efe6] placeholder:text-[#7a7264] focus:border-orange-400/50 focus:outline-none"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4 text-base font-bold text-white shadow-[0_0_24px_rgba(255,102,0,0.35)] disabled:opacity-60"
      >
        {loading ? 'Joining…' : 'Request access →'}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <p className="text-xs text-[#7a7264]">
        No spam. One email when your spot opens. The 60-second audit is free now — this is for the app.
      </p>
    </form>
  )
}
