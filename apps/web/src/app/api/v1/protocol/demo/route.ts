/**
 * POST /api/v1/protocol/demo — Live coordinator simulator.
 *
 * Public, unauthenticated endpoint that runs the SAME confidence-gate
 * + dedup-shape logic the production /api/pap/v1/proposal endpoint
 * uses, but in a write-free / user-free preview mode. Built to give
 * the /protocol page a "this is the protocol, running right now"
 * surface — not a mock and not a marketing diagram.
 *
 * What it does:
 *   1. Accepts a JSON body with `confidence`, `scopeRequested`,
 *      `action.mode`, and a hypothetical `scenario` flag (none /
 *      panic / quiet-hours / rate-limited / duplicate).
 *   2. Composes a synthetic ProposalInput and runs the production
 *      confidence-gate function from lib/coordinator/confidence-gate.
 *   3. Returns the same CoordinatorDecision shape the real endpoint
 *      returns — so the demo response is interchangeable with a real
 *      one for documentation purposes.
 *
 * What it does NOT do:
 *   - No DB writes.
 *   - No real userId lookup.
 *   - No bearer-token check.
 *   - No EAPAuditEntry row.
 *
 * The scenario flag lets the page demonstrate each denial reason
 * (panic_active, quiet_hours, rate_limited, deduplication_pending)
 * without actually putting a real user into that state. The pure
 * confidence-gate logic, however, IS the production function.
 *
 * To call the production endpoint instead:
 *   POST https://coyl.ai/api/pap/v1/proposal
 *   Authorization: Bearer coyl_pap_<id>_<secret>
 *   Body: { proposalKey, userId, scopeRequested, action, context }
 */

import { NextResponse } from 'next/server'
import {
  DEFAULT_CONFIDENCE_THRESHOLD,
  isAboveConfidenceThreshold,
} from '@/lib/coordinator/confidence-gate'
import type { CoordinatorDecision } from '@/lib/coordinator'

type DemoScenario = 'normal' | 'panic' | 'quiet_hours' | 'rate_limited' | 'duplicate'
const VALID_SCENARIOS = new Set<DemoScenario>([
  'normal',
  'panic',
  'quiet_hours',
  'rate_limited',
  'duplicate',
])

type DemoBody = {
  confidence?: number
  scopeRequested?: string[]
  action?: { mode?: string; headline?: string; subhead?: string }
  scenario?: string
}

const SUPPORTED_SCOPES = new Set([
  'proactive_food',
  'proactive_focus',
  'proactive_relational',
  'proactive_sleep',
  'proactive_purchase',
  'proactive_recovery',
  'proactive_substance',
  'proactive_mood',
  'read',
])

function clampConfidence(input: unknown): number {
  if (typeof input !== 'number' || Number.isNaN(input)) return 0.75
  return Math.max(0, Math.min(1, input))
}

export async function POST(req: Request) {
  let body: DemoBody = {}
  try {
    body = (await req.json()) as DemoBody
  } catch {
    // Empty body is fine — fall through to defaults.
  }

  const confidence = clampConfidence(body.confidence)
  const scopeRequested = (body.scopeRequested ?? ['proactive_food']).filter(
    (s) => typeof s === 'string' && SUPPORTED_SCOPES.has(s),
  )
  const action = {
    mode: body.action?.mode ?? 'callout',
    headline: body.action?.headline ?? '9:32. You said no food after 9. That is the story.',
    subhead: body.action?.subhead ?? 'Drink water. Brush teeth. Decide at 9:47.',
  }
  // Validate scenario explicitly — an unknown string used to silently
  // fall through to the confidence-gate branch, which made the simulator
  // appear to "allow" denial scenarios that were just spelled wrong
  // (e.g. `panic_active` instead of `panic`). Now it 400s with the
  // list of valid scenarios so the caller gets a clear correction.
  const rawScenario = body.scenario ?? 'normal'
  if (!VALID_SCENARIOS.has(rawScenario as DemoScenario)) {
    return NextResponse.json(
      {
        decision: 'denied',
        reason: 'invalid_input',
        detail: `unknown scenario "${rawScenario}" — valid: ${[...VALID_SCENARIOS].join(', ')}`,
      },
      { status: 400 },
    )
  }
  const scenario: DemoScenario = rawScenario as DemoScenario

  // Validate scope presence — same as the production endpoint would.
  if (scopeRequested.length === 0) {
    return NextResponse.json(
      {
        decision: 'denied',
        reason: 'invalid_input',
        detail: 'scopeRequested empty or unrecognized',
      },
      { status: 400 },
    )
  }

  // Scenario branch — simulate the world-state denials the production
  // endpoint would issue against a real user in that state. The
  // confidence path below is the only branch that runs production code.
  if (scenario === 'panic') {
    const decision: CoordinatorDecision = { decision: 'denied', reason: 'panic_active' }
    return NextResponse.json(annotate(decision, scenario))
  }
  if (scenario === 'quiet_hours') {
    const decision: CoordinatorDecision = {
      decision: 'denied',
      reason: 'quiet_hours',
    }
    return NextResponse.json(annotate(decision, scenario))
  }
  if (scenario === 'rate_limited') {
    const resetAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    const decision: CoordinatorDecision = {
      decision: 'denied',
      reason: 'rate_limited',
      detail: `band=partner_hourly resetAt=${resetAt}`,
    }
    return NextResponse.json(annotate(decision, scenario))
  }
  if (scenario === 'duplicate') {
    const decision: CoordinatorDecision = {
      decision: 'queued',
      reason: 'deduplication_pending',
      competingProposals: ['cmaaaaaaa0000aaaaaa', 'cmbbbbbbb0000bbbbbb'],
    }
    return NextResponse.json(annotate(decision, scenario))
  }

  // Production confidence-gate evaluation — this is real code.
  const passesConfidence = isAboveConfidenceThreshold(
    { context: { confidence } },
    DEFAULT_CONFIDENCE_THRESHOLD,
  )

  if (!passesConfidence) {
    const decision: CoordinatorDecision = {
      decision: 'denied',
      reason: 'confidence_too_low',
      detail: `score=${confidence} threshold=${DEFAULT_CONFIDENCE_THRESHOLD}`,
    }
    return NextResponse.json(annotate(decision, scenario))
  }

  const decision: CoordinatorDecision = { decision: 'allowed' }
  return NextResponse.json(annotate(decision, scenario))
}

function annotate(decision: CoordinatorDecision, scenario: DemoScenario) {
  return {
    ...decision,
    _demo: {
      mode: 'simulator',
      scenario,
      confidenceThreshold: DEFAULT_CONFIDENCE_THRESHOLD,
      note: 'This is the coordinator confidence gate from production. The world-state denials (panic, quiet hours, rate limit, dedup) are simulated by the scenario flag. The real endpoint at /api/pap/v1/proposal evaluates them against the actual user.',
    },
  }
}
