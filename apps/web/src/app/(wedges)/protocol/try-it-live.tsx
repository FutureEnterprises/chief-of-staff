'use client'

/**
 * "Try the protocol" client island for /protocol.
 *
 * Posts to /api/v1/protocol/demo with the visitor-chosen scenario,
 * scope, and confidence — and renders the actual CoordinatorDecision
 * the production confidence-gate function returns. Not a mock.
 *
 * The /api/v1/protocol/demo endpoint runs lib/coordinator's
 * isAboveConfidenceThreshold in-process with DEFAULT_CONFIDENCE_THRESHOLD
 * (0.7). World-state denials (panic, quiet hours, rate limit, dedup)
 * are simulated by the scenario flag — see the route's annotate() block.
 *
 * Purpose: convert /protocol from "open spec doc" to "live integration
 * you can hit right now" — per the v2 strategy brief, this is the
 * highest-leverage M&A asset the page can carry.
 */

import { useState } from 'react'

type DemoResponse = {
  decision: 'allowed' | 'denied' | 'queued'
  reason?: string
  detail?: string
  competingProposals?: string[]
  _demo?: {
    mode: string
    scenario: string
    confidenceThreshold: number
    note: string
  }
}

type Scenario = 'normal' | 'panic' | 'quiet_hours' | 'rate_limited' | 'duplicate'

const SCENARIOS: { value: Scenario; label: string; desc: string }[] = [
  {
    value: 'normal',
    label: 'Normal — confidence gate only',
    desc: 'No panic. Daytime. No rate limit. Decision turns on confidence.',
  },
  {
    value: 'panic',
    label: 'User hit the panic button',
    desc: 'Absolute deny. Supersedes every other check.',
  },
  {
    value: 'quiet_hours',
    label: 'In user quiet hours',
    desc: 'Denied — the user has scoped silence on this surface right now.',
  },
  {
    value: 'rate_limited',
    label: 'Partner over hourly cap',
    desc: 'Denied — your LLM has fired too often on this user this hour.',
  },
  {
    value: 'duplicate',
    label: 'Another LLM proposed first',
    desc: 'Queued — coordinator will pick a winner across competing proposals.',
  },
]

const SCOPES = [
  'proactive_food',
  'proactive_focus',
  'proactive_relational',
  'proactive_sleep',
  'proactive_purchase',
  'proactive_recovery',
  'proactive_substance',
  'proactive_mood',
]

export function TryItLive() {
  const [scenario, setScenario] = useState<Scenario>('normal')
  const [scope, setScope] = useState('proactive_food')
  const [confidence, setConfidence] = useState(0.78)
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<DemoResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleRun() {
    setLoading(true)
    setError(null)
    setResponse(null)
    try {
      const res = await fetch('/api/v1/protocol/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          scopeRequested: [scope],
          confidence,
          action: {
            mode: 'callout',
            headline: '9:32. You said no food after 9. That is the story.',
            subhead: 'Drink water. Brush teeth. Decide at 9:47.',
          },
        }),
      })
      const json = (await res.json()) as DemoResponse
      setResponse(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  const decisionColor =
    response?.decision === 'allowed'
      ? 'text-emerald-600'
      : response?.decision === 'denied'
        ? 'text-red-600'
        : response?.decision === 'queued'
          ? 'text-amber-600'
          : 'text-gray-600'

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="block font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-gray-500">
            Scenario
          </label>
          <select
            className="mt-2 w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:outline-none"
            value={scenario}
            onChange={(e) => setScenario(e.target.value as Scenario)}
          >
            {SCENARIOS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs leading-[1.5] text-gray-600">
            {SCENARIOS.find((s) => s.value === scenario)?.desc}
          </p>
        </div>

        <div>
          <label className="block font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-gray-500">
            Scope requested
          </label>
          <select
            className="mt-2 w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:outline-none"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
          >
            {SCOPES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs leading-[1.5] text-gray-600">
            One of the nine PAP scopes the user can grant per LLM partner.
          </p>
        </div>
      </div>

      <div>
        <label className="flex items-baseline justify-between font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-gray-500">
          <span>Confidence</span>
          <span className="font-mono text-sm tabular-nums text-gray-900">
            {confidence.toFixed(2)}
          </span>
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={confidence}
          onChange={(e) => setConfidence(parseFloat(e.target.value))}
          className="mt-2 w-full accent-orange-500"
        />
        <p className="mt-2 text-xs leading-[1.5] text-gray-600">
          DEFAULT_CONFIDENCE_THRESHOLD = 0.70 in production. Anything below denies with{' '}
          <code className="font-mono text-[11px] text-orange-600">confidence_too_low</code>.
        </p>
      </div>

      <button
        onClick={handleRun}
        disabled={loading}
        className="border border-orange-500 bg-orange-500 px-6 py-3 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Evaluating…' : 'Run coordinator → POST /api/v1/protocol/demo'}
      </button>

      {error && (
        <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {response && (
        <div className="border-t border-gray-200 pt-6">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-gray-500">
            Coordinator decision
          </p>
          <p className={`mt-3 font-serif text-3xl font-normal italic ${decisionColor}`}>
            {response.decision}
            {response.reason && (
              <span className="ml-3 font-mono text-base not-italic text-gray-700">
                · {response.reason}
              </span>
            )}
          </p>
          {response.detail && (
            <p className="mt-2 font-mono text-xs text-gray-600">{response.detail}</p>
          )}
          {response.competingProposals && (
            <p className="mt-2 font-mono text-xs text-gray-600">
              competingProposals: {response.competingProposals.join(', ')}
            </p>
          )}

          <pre className="mt-6 overflow-x-auto rounded-md border border-gray-200 bg-gray-50 p-4 font-mono text-[12px] leading-relaxed text-gray-800">
            {JSON.stringify(response, null, 2)}
          </pre>

          <p className="mt-4 text-xs leading-[1.6] text-gray-600">
            This is the production{' '}
            <code className="font-mono text-[11px] text-orange-600">
              isAboveConfidenceThreshold
            </code>{' '}
            function from{' '}
            <code className="font-mono text-[11px] text-orange-600">
              lib/coordinator/confidence-gate.ts
            </code>{' '}
            executing in real time. The world-state checks (panic, quiet hours, rate
            limit, dedup) are simulated by the scenario flag — they require a real
            user record, which the production endpoint at{' '}
            <code className="font-mono text-[11px] text-orange-600">
              POST /api/pap/v1/proposal
            </code>{' '}
            evaluates against the authenticated user.
          </p>
        </div>
      )}
    </div>
  )
}
