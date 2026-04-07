'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center space-y-4 p-8">
        <h2 className="text-xl font-bold text-gray-900">Something went wrong</h2>
        <p className="text-gray-600 max-w-md">
          An error occurred while loading this page.
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400 font-mono">Error ID: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="px-6 py-2 bg-[#ff6600] text-white font-semibold rounded-lg hover:bg-[#e55c00] transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
