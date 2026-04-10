import { prisma } from '@repo/database'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

interface ProfilePageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { slug } = await params
  const user = await prisma.user.findUnique({
    where: { profileSlug: slug },
    select: { name: true, executionScore: true },
  })
  if (!user) return { title: 'Profile Not Found' }
  return {
    title: `${user.name} — Execution Score ${user.executionScore}`,
    description: `${user.name}'s COYL execution profile. Score: ${user.executionScore}/100.`,
  }
}

export default async function PublicProfilePage({ params }: ProfilePageProps) {
  const { slug } = await params

  const user = await prisma.user.findUnique({
    where: { profileSlug: slug },
    select: {
      name: true,
      executionScore: true,
      currentStreak: true,
      longestStreak: true,
      level: true,
      xp: true,
      profilePublic: true,
      createdAt: true,
      badges: {
        include: { badge: true },
        orderBy: { earnedAt: 'desc' },
      },
    },
  })

  if (!user || !user.profilePublic) return notFound()

  const firstName = user.name.split(' ')[0]
  const scoreColor = user.executionScore >= 80 ? 'text-green-400' : user.executionScore >= 60 ? 'text-orange-400' : user.executionScore >= 40 ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className="flex flex-col items-center py-12">
      {/* Score hero */}
      <div className="mb-2 flex items-center gap-3">
        <div className="h-px w-8 bg-orange-500" />
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500">
          Execution Profile
        </span>
        <div className="h-px w-8 bg-orange-500" />
      </div>

      <h1 className="mb-8 text-3xl font-black text-white">{firstName}</h1>

      <div className="mb-2 flex items-baseline gap-3">
        <span className={`text-8xl font-black tabular-nums ${scoreColor}`}>
          {user.executionScore}
        </span>
        <span className="text-2xl text-gray-500">/100</span>
      </div>
      <p className="mb-8 text-sm text-gray-500">Execution Score</p>

      {/* Stats row */}
      <div className="mb-12 flex gap-8">
        <div className="text-center">
          <p className="text-2xl font-bold text-white">🔥 {user.currentStreak}</p>
          <p className="text-xs text-gray-500">Current Streak</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-white">{user.longestStreak}</p>
          <p className="text-xs text-gray-500">Longest Streak</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-white">Lv.{user.level}</p>
          <p className="text-xs text-gray-500">Level</p>
        </div>
      </div>

      {/* Badges */}
      {user.badges.length > 0 && (
        <div className="w-full max-w-md">
          <h2 className="mb-4 text-center text-sm font-bold uppercase tracking-widest text-gray-500">Badges</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {user.badges.map((ub) => (
              <div
                key={ub.badge.slug}
                className="flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                title={ub.badge.description}
              >
                <span className="text-2xl">{ub.badge.emoji}</span>
                <span className="text-[10px] font-semibold text-gray-400">{ub.badge.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="mt-12 text-center">
        <p className="mb-4 text-sm text-gray-500">Build your own execution profile</p>
        <a
          href="/sign-up"
          className="inline-block rounded-full bg-gradient-to-r from-orange-600 to-red-600 px-8 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)] transition-all hover:shadow-[0_0_40px_rgba(255,102,0,0.5)]"
        >
          Start Enforcing
        </a>
      </div>
    </div>
  )
}
