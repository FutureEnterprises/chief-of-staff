/**
 * Tests for `broadcastKillSwitch` — the UAP kill-switch realtime
 * broadcast helper.
 *
 * Two invariants are load-bearing for the protocol:
 *   1. When configured, it publishes exactly once to the expected
 *      Supabase Realtime channel with the expected payload.
 *   2. It NEVER throws — the kill-switch DB transaction has already
 *      committed by the time we're called, and broadcast failure must
 *      not bubble back to the caller.
 *
 * The publish path is HTTP (Supabase Realtime broadcast REST API).
 * We stub `globalThis.fetch` to keep the test hermetic — no live
 * Supabase contact.
 *
 * @see apps/web/src/lib/uap/realtime.ts
 * @see docs/protocol/UAP-0.1.md §3 (5-second propagation SLA)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Provide stable env so the module-level singleton resolves to a
// real transport (not the silent no-op no-config branch).
const ORIGINAL_ENV = { ...process.env }

beforeEach(() => {
  process.env.SUPABASE_URL = 'https://example.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key-for-tests'
  // Reset module state so the singleton picks up the env we just set.
  vi.resetModules()
})

afterEach(() => {
  vi.restoreAllMocks()
  process.env = { ...ORIGINAL_ENV }
})

describe('broadcastKillSwitch', () => {
  it('publishes exactly once to the user-scoped channel with the expected payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const { broadcastKillSwitch } = await import('../realtime')

    const userId = 'user_abc123'
    const payload = {
      killedAt: '2026-05-24T20:00:00.000Z',
      affectedGrantIds: ['grant_1', 'grant_2'],
      reason: 'user_initiated',
    }

    await broadcastKillSwitch(userId, payload)

    // Exactly one publish call.
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://example.supabase.co/realtime/v1/api/broadcast')
    expect(init?.method).toBe('POST')

    // Auth headers carry the service role key.
    const headers = init?.headers as Record<string, string>
    expect(headers['apikey']).toBe('service-role-key-for-tests')
    expect(headers['Authorization']).toBe('Bearer service-role-key-for-tests')
    expect(headers['Content-Type']).toBe('application/json')

    // Body shape: single broadcast message, topic = `uap:kill:<userId>`,
    // event = 'kill', payload echoed verbatim.
    const body = JSON.parse((init?.body as string) ?? '{}')
    expect(body).toEqual({
      messages: [
        {
          topic: `uap:kill:${userId}`,
          event: 'kill',
          payload,
          private: false,
        },
      ],
    })
  })

  it('returns void without throwing when the publish rejects (fire-and-forget)', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'))
    vi.stubGlobal('fetch', fetchMock)
    // Suppress the warn so test output stays clean.
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const { broadcastKillSwitch } = await import('../realtime')

    const result = await broadcastKillSwitch('user_xyz', {
      killedAt: '2026-05-24T20:00:00.000Z',
      affectedGrantIds: [],
      reason: 'safety_routing',
    })

    // Resolves to undefined, never throws.
    expect(result).toBeUndefined()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    // We logged the failure for ops visibility — kill is unaffected.
    expect(warnSpy).toHaveBeenCalled()
  })

  it('is a no-op when Supabase env vars are missing (kill still succeeds upstream)', async () => {
    // Clear config — exercises the silent no-op transport branch.
    delete process.env.SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    delete process.env.SUPABASE_SERVICE_KEY
    vi.resetModules()

    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const { broadcastKillSwitch } = await import('../realtime')

    const result = await broadcastKillSwitch('user_no_env', {
      killedAt: '2026-05-24T20:00:00.000Z',
      affectedGrantIds: ['g1'],
      reason: 'user_initiated',
    })

    expect(result).toBeUndefined()
    // No HTTP attempt when there's no transport.
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
