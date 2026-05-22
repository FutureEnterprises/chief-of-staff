/**
 * Route-segment Suspense boundary for the authenticated app shell.
 *
 * Required by Next 16 Cache Components: every page that fetches
 * uncached data must sit inside a Suspense boundary. The loading.tsx
 * convention auto-wraps the page slot with <Suspense fallback={<this>} />,
 * so each (app)/* page can keep its top-level async fetches without
 * per-page refactoring.
 */
export default function Loading() {
  return (
    <div className="flex h-full items-center justify-center p-8 text-sm text-zinc-500">
      Loading…
    </div>
  )
}
