import { Metadata } from 'next'
import { prisma } from '@repo/database'

export const metadata: Metadata = {
  title: 'Leaderboard — top self-trust scores',
  description: 'COYL users ranked by execution score and streak. Public profiles only.',
}

export const revalidate = 300 // 5 minutes

export default async function LeaderboardPage() {
  const top = await prisma.user.findMany({
    where: { profilePublic: true },
    select: {
      name: true,
      profileSlug: true,
      executionScore: true,
      selfTrustScore: true,
      currentStreak: true,
      longestStreak: true,
    },
    orderBy: [
      { executionScore: 'desc' },
      { currentStreak: 'desc' },
    ],
    take: 50,
  })

  return (
    <article className="prose prose-invert prose-gray max-w-none prose-headings:text-white">
      <div className="mb-4 flex items-center gap-3 not-prose">
        <span className="h-px w-8 bg-orange-500" />
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500">Leaderboard</span>
      </div>
      <h1 className="mb-2 text-4xl font-black text-white">Top self-trust scores.</h1>
      <p className="text-sm text-gray-400">Public profiles only. Updated every 5 minutes.</p>

      {top.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-sm text-gray-400 not-prose">
          No public profiles yet. Be the first — enable your public profile in Settings.
        </div>
      ) : (
        <div className="mt-8 space-y-2 not-prose">
          {top.map((u, i) => (
            <a
              key={u.profileSlug}
              href={`/profile/${u.profileSlug}`}
              className="flex items-center gap-4 rounded-2xl border border-white/5 bg-gradient-to-r from-white/5 to-transparent p-4 transition-colors hover:border-orange-500/30 hover:bg-orange-500/5"
            >
              <span className={`w-8 text-center text-lg font-black ${i < 3 ? 'text-orange-400' : 'text-gray-500'}`}>
                {i + 1}
              </span>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">{u.name.split(' ')[0]}</p>
                <p className="text-xs text-gray-500">
                  🔥 {u.currentStreak}d streak &middot; Longest: {u.longestStreak}d
                </p>
              </div>
              <span className="text-2xl font-black tabular-nums text-orange-400">
                {u.executionScore}
              </span>
            </a>
          ))}
        </div>
      )}

      <p className="mt-8 text-xs text-gray-500">
        Want to appear here? Turn on public profile in <a href="/settings" className="text-orange-400">Settings</a> and build your streak.
      </p>
    </article>
  )
}
