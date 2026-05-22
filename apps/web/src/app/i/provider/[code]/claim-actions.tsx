'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useUser } from '@clerk/nextjs'

/**
 * ClaimActions — the two-button accept/decline island for the patient-
 * facing /i/provider/[code] page.
 *
 * Lives as its own client component so the parent (the page itself)
 * can stay a server component — the consent copy is mostly read-only
 * and benefits from server rendering for SEO + initial load. Only the
 * action handlers need to run on the client.
 *
 * Auth: clicking Accept requires the visitor to be signed in. If they
 * aren't, we route them to /sign-up with redirect_url back to this
 * page so they land here again after auth and can complete the claim.
 */
export function ClaimActions({ code }: { code: string }) {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useUser()
  const [submitting, setSubmitting] = useState<'accept' | 'decline' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function accept() {
    if (isLoaded && !isSignedIn) {
      router.push(
        `/sign-up?ref=provider-invite&redirect_url=/i/provider/${encodeURIComponent(
          code,
        )}`,
      )
      return
    }
    setSubmitting('accept')
    setError(null)
    try {
      const res = await fetch(`/api/v1/provider/claim/${code}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ decision: 'accept' }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      router.push('/today?ref=provider-claim')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to accept invite')
      setSubmitting(null)
    }
  }

  async function decline() {
    setSubmitting('decline')
    setError(null)
    try {
      // Decline does NOT require auth — we revoke the invite regardless
      // of who clicks. The route accepts an unauthenticated decline so
      // a patient who decides "no" doesn't have to make an account just
      // to say so. (The route still validates that the code exists.)
      const res = await fetch(`/api/v1/provider/claim/${code}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ decision: 'decline' }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      router.push('/')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to decline invite')
      setSubmitting(null)
    }
  }

  return (
    <section className="mt-10 space-y-3">
      <div className="flex flex-col gap-3 md:flex-row">
        <button
          type="button"
          onClick={accept}
          disabled={submitting !== null}
          className="flex-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4 text-base font-bold text-white shadow-[0_0_20px_rgba(255,102,0,0.3)] disabled:opacity-50"
        >
          {submitting === 'accept' ? 'Accepting…' : 'Accept'}
        </button>
        <button
          type="button"
          onClick={decline}
          disabled={submitting !== null}
          className="flex-1 rounded-full border border-gray-300 bg-white px-6 py-4 text-base font-semibold text-gray-800 hover:border-gray-500 disabled:opacity-50"
        >
          {submitting === 'decline' ? 'Declining…' : 'Decline'}
        </button>
      </div>

      {isLoaded && !isSignedIn ? (
        <p className="text-xs text-gray-500">
          You’ll be asked to{' '}
          <Link
            href={`/sign-in?redirect_url=/i/provider/${encodeURIComponent(code)}`}
            className="underline"
          >
            sign in
          </Link>{' '}
          before the connection is confirmed.
        </p>
      ) : null}

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}
    </section>
  )
}
