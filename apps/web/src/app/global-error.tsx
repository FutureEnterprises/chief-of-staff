'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body className="flex min-h-screen items-center justify-center bg-[#faf8f5]">
        <div className="text-center space-y-4 p-8">
          <h2 className="text-2xl font-bold text-gray-900">Something went wrong</h2>
          <p className="text-gray-600 max-w-md">
            An unexpected error occurred. Please try again or contact support if the problem persists.
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
      </body>
    </html>
  )
}
