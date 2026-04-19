'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { PageTransition, StaggerList, StaggerItem } from '@/components/motion/animations'
import { GlassCard } from '@/components/ui/glass-card'
import { Copy, Check, Share2, DollarSign, Users, TrendingUp, Sparkles } from 'lucide-react'

type ReferralData = {
  code: string
  shareUrl: string
  stats: { sent: number; converted: number; creditsEarnedCents: number }
}

export function CreatorView() {
  const [data, setData] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<'code' | 'url' | null>(null)

  useEffect(() => {
    fetch('/api/v1/referrals')
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false))
  }, [])

  function copy(value: string, type: 'code' | 'url') {
    navigator.clipboard.writeText(value)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  function share() {
    if (!data) return
    const text = `I'm using COYL — an AI that interrupts my autopilot before I sabotage myself. Use my link for $10 off: ${data.shareUrl}`
    if (navigator.share) {
      navigator.share({ title: 'COYL', text, url: data.shareUrl }).catch(() => {})
    } else {
      copy(text, 'url')
    }
  }

  return (
    <PageTransition className="relative mx-auto max-w-3xl p-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-mesh opacity-40" />

      <div className="mb-8">
        <h1 className="heading-1 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-orange-500" />
          Creator program
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Share COYL. Get $10 credit for every paid conversion. They get $10 off too.
        </p>
      </div>

      {loading ? (
        <div className="text-center text-sm text-muted-foreground">Loading…</div>
      ) : !data ? (
        <div className="glass rounded-2xl p-8 text-center">
          <p className="text-sm text-muted-foreground">Couldn&apos;t load referral data.</p>
        </div>
      ) : (
        <>
          {/* Hero code card */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard variant="orange-glow" className="p-8">
              <p className="label-xs mb-3 text-orange-500">Your referral code</p>
              <div className="mb-6 flex items-center justify-between gap-3">
                <code className="font-mono text-4xl font-black tabular-nums text-foreground">
                  {data.code}
                </code>
                <button
                  onClick={() => copy(data.code, 'code')}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted"
                >
                  {copied === 'code' ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied === 'code' ? 'Copied' : 'Copy'}
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-border bg-background/50 p-3">
                  <code className="truncate text-xs text-muted-foreground">{data.shareUrl}</code>
                  <button
                    onClick={() => copy(data.shareUrl, 'url')}
                    className="ml-3 shrink-0 text-xs font-medium text-orange-500 hover:underline"
                  >
                    {copied === 'url' ? 'Copied' : 'Copy'}
                  </button>
                </div>

                <button
                  onClick={share}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-warm px-4 py-3 text-sm font-bold text-white shadow-glow-orange"
                >
                  <Share2 className="h-4 w-4" />
                  Share your link
                </button>
              </div>
            </GlassCard>
          </motion.div>

          {/* Stats */}
          <StaggerList className="mt-6 grid grid-cols-3 gap-4">
            <StaggerItem>
              <GlassCard hover>
                <Users className="mb-2 h-4 w-4 text-orange-500" />
                <p className="text-2xl font-bold tabular-nums">{data.stats.sent}</p>
                <p className="label-xs text-muted-foreground">Invited</p>
              </GlassCard>
            </StaggerItem>
            <StaggerItem>
              <GlassCard hover>
                <TrendingUp className="mb-2 h-4 w-4 text-orange-500" />
                <p className="text-2xl font-bold tabular-nums">{data.stats.converted}</p>
                <p className="label-xs text-muted-foreground">Converted</p>
              </GlassCard>
            </StaggerItem>
            <StaggerItem>
              <GlassCard hover>
                <DollarSign className="mb-2 h-4 w-4 text-orange-500" />
                <p className="text-2xl font-bold tabular-nums">
                  ${(data.stats.creditsEarnedCents / 100).toFixed(0)}
                </p>
                <p className="label-xs text-muted-foreground">Earned</p>
              </GlassCard>
            </StaggerItem>
          </StaggerList>

          {/* How it works */}
          <GlassCard className="mt-6 p-6">
            <h3 className="heading-4 mb-3">How it works</h3>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li><strong className="text-foreground">1.</strong> Share your link anywhere — social, DMs, email.</li>
              <li><strong className="text-foreground">2.</strong> They sign up → start on Free.</li>
              <li><strong className="text-foreground">3.</strong> When they upgrade to a paid tier (not just trial), you both get <strong className="text-orange-500">$10 credit</strong>.</li>
              <li><strong className="text-foreground">4.</strong> No cap. The more you refer, the more you earn.</li>
            </ol>
          </GlassCard>

          {/* Swipe copy */}
          <GlassCard className="mt-6 p-6">
            <h3 className="heading-4 mb-3">Swipe copy</h3>
            <p className="text-xs text-muted-foreground mb-3">Tap to copy, then paste wherever.</p>
            <div className="space-y-2">
              {[
                `I stopped trying to motivate myself. I'm using @coylai — an AI that catches me on autopilot and interrupts the script. $10 off with my link: ${data.shareUrl}`,
                `COYL caught me in the exact moment I was about to blow the day. Weirdly effective. Try it: ${data.shareUrl}`,
                `The only productivity thing that worked for me was an AI that calls out my excuses in real time. It's called COYL. $10 off: ${data.shareUrl}`,
              ].map((line) => (
                <button
                  key={line}
                  onClick={() => copy(line, 'url')}
                  className="w-full rounded-xl border border-border bg-background/50 p-3 text-left text-xs text-muted-foreground hover:bg-muted"
                >
                  {line}
                </button>
              ))}
            </div>
          </GlassCard>
        </>
      )}
    </PageTransition>
  )
}
