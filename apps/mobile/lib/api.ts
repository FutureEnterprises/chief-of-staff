import { CoylApiClient, type PlanType } from '@repo/shared'
import { useAuth } from '@clerk/clerk-expo'
import { useCallback, useMemo } from 'react'

/**
 * Mobile → web API access.
 *
 * Two layers live here:
 *   1. `useApiClient()` — the existing thin wrapper around the shared
 *      CoylApiClient (today/tasks/user). Unchanged.
 *   2. `useMobileApi()` — a small client for the /api/v1/mobile/* surface that
 *      this app owns end-to-end (plan state, push-token registration). It grabs
 *      the Clerk session token via useAuth().getToken() and sends it as an
 *      `Authorization: Bearer <token>` header — the exact auth contract the web
 *      routes expect (they read it through Clerk's auth() → clerkId).
 *
 * Base URL: EXPO_PUBLIC_API_URL when set (dev / preview), else the canonical
 * production host. Inlined at build by Expo's env handling.
 */

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://www.coyl.ai'

let _client: CoylApiClient | null = null

export function useApiClient() {
  const { getToken } = useAuth()

  if (!_client) {
    _client = new CoylApiClient(API_URL, getToken)
  }

  return _client
}

/**
 * Shape returned by GET /api/v1/mobile/me. Kept inline (not in @repo/shared)
 * because this endpoint is mobile-owned and the payload is intentionally
 * minimal — plan/identity only.
 */
export type MobileMe = {
  planType: PlanType
  email: string
  firstName: string | null
  onboardingCompleted: boolean
}

/**
 * One active danger window in the device-schedulable shape returned by
 * GET /api/v1/mobile/danger-windows. `daysOfWeek` are ints 0 (Sun)..6 (Sat);
 * an "all days" window arrives pre-expanded to [0..6]. `startMinute` is always
 * 0 today (the model is whole-hour). `timezone` is the IANA zone the wall-clock
 * hour is stored in (the user's timezone).
 */
export type MobileDangerWindow = {
  id: string
  label?: string | null
  daysOfWeek: number[]
  startHour: number
  startMinute: number
  timezone: string
}

/** Response kind for a local check-in, mirrored from the notification action. */
export type CheckinResponseKind = 'caught_me' | 'im_good' | 'opened'

/**
 * Hook returning a small typed client for the mobile-owned API surface.
 * Memoised against getToken so callers can put it in effect deps safely.
 */
export function useMobileApi() {
  const { getToken } = useAuth()

  const request = useCallback(
    async <T>(path: string, options?: RequestInit): Promise<T> => {
      const token = await getToken()
      const res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          // Bearer is how every /api/v1/* route authenticates mobile calls:
          // Clerk's auth() reads the session from this header server-side.
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options?.headers,
        },
      })
      if (!res.ok) {
        throw new Error(`API ${res.status} ${res.statusText} on ${path}`)
      }
      return res.json() as Promise<T>
    },
    [getToken],
  )

  return useMemo(
    () => ({
      /** Plan + identity slice used to gate signed-in surfaces. */
      getMe: () => request<MobileMe>('/api/v1/mobile/me'),

      /** Persist the device's Expo push token to User.expoPushToken. */
      registerPushToken: (expoPushToken: string) =>
        request<{ ok: boolean; expoPushToken: string | null }>(
          '/api/v1/mobile/push-token',
          { method: 'POST', body: JSON.stringify({ expoPushToken }) },
        ),

      /**
       * Active danger windows in device-schedulable shape. The mobile
       * check-in scheduler (lib/checkin-scheduler.ts) calls this once per cold
       * start to (re)build the on-device weekly local notifications.
       */
      getDangerWindows: () =>
        request<{ windows: MobileDangerWindow[] }>('/api/v1/mobile/danger-windows'),

      /**
       * Record a local check-in response so the learning loop sees it.
       * `kind` mirrors the tapped notification action ('caught_me' | 'im_good')
       * or 'opened' when the user taps the notification body. `windowId` is the
       * DangerWindow this check-in was scheduled from.
       */
      postCheckinResponse: (input: {
        kind: CheckinResponseKind
        windowId?: string
        firedAt?: string
      }) =>
        request<{ ok: boolean; kind: CheckinResponseKind; eventType: string }>(
          '/api/v1/mobile/checkin-response',
          { method: 'POST', body: JSON.stringify(input) },
        ),
    }),
    [request],
  )
}
