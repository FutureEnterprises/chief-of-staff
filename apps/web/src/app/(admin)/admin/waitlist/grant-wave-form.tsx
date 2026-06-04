'use client'

import { useState, useTransition } from 'react'
import { grantWave, type GrantWaveResult } from './actions'

/**
 * "Open a wave" control. Enter N → grants the next N people by effective
 * position and emails each their claim link. Confirms before firing
 * (it sends real email) and shows the result.
 */
export function GrantWaveForm({ waiting }: { waiting: number }) {
  const [count, setCount] = useState(25)
  const [result, setResult] = useState<GrantWaveResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onGrant() {
    setError(null)
    setResult(null)
    const n = Math.max(1, Math.min(waiting, Math.floor(count) || 0))
    if (n <= 0) {
      setError('No one is waiting.')
      return
    }
    if (!window.confirm(`Grant access to the next ${n} ${n === 1 ? 'person' : 'people'} and email each their invite? This sends real email.`)) {
      return
    }
    startTransition(async () => {
      try {
        const res = await grantWave(n)
        setResult(res)
      } catch {
        setError('Grant failed. Check you are signed in as admin.')
      }
    })
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <p className="text-sm font-semibold text-gray-900">Open a wave</p>
      <p className="mt-1 text-xs text-gray-500">
        Grants the next N people by effective position (line-jumpers first)
        and emails each a claim link.
      </p>
      <div className="mt-4 flex items-center gap-2">
        <input
          type="number"
          min={1}
          max={Math.max(1, waiting)}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          disabled={pending || waiting === 0}
          className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={onGrant}
          disabled={pending || waiting === 0}
          className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-5 py-2 text-sm font-bold text-white shadow-[0_8px_28px_-8px_rgba(255,102,0,0.55)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? 'Granting…' : `Grant next ${Math.max(1, Math.min(waiting, Math.floor(count) || 0))}`}
        </button>
      </div>

      {waiting === 0 && (
        <p className="mt-3 text-xs text-gray-500">No one is waiting to be granted.</p>
      )}
      {error && <p className="mt-3 text-xs font-semibold text-red-600">{error}</p>}
      {result && (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          Granted <strong>{result.granted}</strong> · emailed <strong>{result.emailed}</strong>
          {result.errors > 0 && <> · <span className="text-red-600">{result.errors} email error(s)</span></>}
          {!result.emailConfigured && (
            <> · <span className="text-amber-700">RESEND not configured — granted but no email sent</span></>
          )}
        </div>
      )}
    </div>
  )
}
