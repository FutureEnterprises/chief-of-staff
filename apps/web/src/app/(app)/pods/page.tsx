import Link from 'next/link'
import { requireDbUser } from '@/lib/auth'
import { getUserPods, getPodMetrics } from '@/lib/pods'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { Users, Plus, KeyRound, Flame, Activity } from 'lucide-react'

export const metadata = { title: 'Pods' }
export const dynamic = 'force-dynamic'

export default async function PodsPage() {
  const user = await requireDbUser()
  const pods = await getUserPods(user.id)
  const metrics = await Promise.all(pods.map((p) => getPodMetrics(p.id)))

  return (
    <div className="relative mx-auto max-w-3xl px-6 py-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-mesh opacity-40" />

      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="heading-1">Pods</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Accountability with the people who matter.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="glass" size="sm" asChild>
            <Link href="/pods/join">
              <KeyRound className="h-3.5 w-3.5" /> Join with code
            </Link>
          </Button>
          <Button variant="brand" size="sm" asChild>
            <Link href="/pods/create">
              <Plus className="h-3.5 w-3.5" /> Create pod
            </Link>
          </Button>
        </div>
      </div>

      {pods.length === 0 ? (
        <GlassCard className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-base font-semibold">No pods yet</h3>
          <p className="mx-auto mb-6 max-w-sm text-sm text-muted-foreground">
            Accountability with the people who matter. Share patterns, not screenshots.
          </p>
          <div className="flex justify-center gap-2">
            <Button variant="brand" size="sm" asChild>
              <Link href="/pods/create">Create a pod</Link>
            </Button>
            <Button variant="glass" size="sm" asChild>
              <Link href="/pods/join">Join with code</Link>
            </Button>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {pods.map((pod, i) => {
            const m = metrics[i]!
            return (
              <Link key={pod.id} href={`/pods/${pod.id}`}>
                <GlassCard hover className="cursor-pointer">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-base font-semibold">{pod.name}</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {m.memberCount} member{m.memberCount !== 1 ? 's' : ''} ·{' '}
                        {pod.maxMembers - m.memberCount} seat
                        {pod.maxMembers - m.memberCount !== 1 ? 's' : ''} open
                      </p>
                    </div>
                    <div className="flex -space-x-2">
                      {pod.members.slice(0, 4).map((member) => (
                        <Avatar key={member.id} user={member.user} />
                      ))}
                      {pod.members.length > 4 && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium">
                          +{pod.members.length - 4}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Flame className="h-3 w-3" />
                      Shared streak: <span className="font-semibold text-foreground">{m.sharedStreak}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      Archetypes:{' '}
                      <span className="font-semibold text-foreground">
                        {Object.keys(m.archetypeDistribution).filter((k) => k !== '__unknown').length || 0}
                      </span>
                    </span>
                  </div>
                </GlassCard>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Avatar({
  user,
}: {
  user: { name: string | null; avatarUrl: string | null }
}) {
  const initial = (user.name ?? '?').trim().charAt(0).toUpperCase() || '?'
  if (user.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatarUrl}
        alt={user.name ?? 'Pod member'}
        className="h-8 w-8 rounded-full border-2 border-background object-cover"
      />
    )
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-gradient-warm text-xs font-semibold text-white">
      {initial}
    </div>
  )
}
