/**
 * Route-segment Suspense boundary for legal + leaderboard pages. See
 * (app)/loading.tsx for the Next 16 Cache Components rationale.
 */
export default function Loading() {
  return (
    <div className="flex h-full items-center justify-center p-8 text-sm text-zinc-500">
      Loading…
    </div>
  )
}
