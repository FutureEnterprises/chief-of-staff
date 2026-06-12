/**
 * COYL Edge Layer 3 — passive HealthKit sensing (iOS only).
 *
 * WHAT THIS DOES
 * ──────────────
 * Reads a small, NEDA-safe slice of Apple Health on the *device* — steps,
 * sleep, heart rate, resting heart rate, HRV — and POSTs aggregated signals
 * to the COYL web API (`/api/v1/mobile/health-sync`), which upserts them into
 * the `health_signals` table. From there the autopilot model uses them to
 * learn when a user's "danger windows" open (high stress → autopilot slip).
 *
 * NEDA HARD RULE (enforced here AND at the API boundary): NO body-measurement
 * data. No weight, no BMI, no body-fat percentage — not in the requested
 * permissions, not in the queries, not in the copy. Steps / sleep /
 * heart-rate class ONLY. If you are tempted to add `bodyMass`, don't.
 *
 * WHERE THINGS RUN
 * ────────────────
 * - Everything in this file runs ON-DEVICE. HealthKit never leaves the phone
 *   except as the aggregated `{ kind, value, unit, startedAt }` rows we POST.
 * - The native HealthKit bridge (`@kingstinct/react-native-healthkit`, v8.7.2,
 *   classic TurboModule — NOT the v11+ Nitro line, which needs RN 0.79+) is
 *   compiled into the binary by the EAS dev-client / production build. It is
 *   NOT present in Expo Go, so every export here no-ops gracefully when the
 *   module is missing (see `loadHK()` + `isHealthKitAvailable()`).
 *
 * WHAT CAN ONLY BE TESTED ON A PHYSICAL DEVICE
 * ────────────────────────────────────────────
 * - The HealthKit permission sheet (`requestHealthPermissions`).
 * - Real sample reads (`syncRecentSignals`) — the iOS Simulator has no Health
 *   database unless you hand-seed it; HRV/resting-HR are effectively
 *   device-only.
 * - Background delivery wake-ups (`enableBackgroundDelivery`) — iOS only wakes
 *   a real app on a real device; you cannot observe this in Expo Go or the
 *   Simulator.
 */

import { Platform, AppState, type AppStateStatus } from 'react-native'

// ── Self-contained authed fetch ──────────────────────────────────────────
// This module is deliberately SELF-CONTAINED: it does NOT import lib/api.ts.
// The caller hands us Clerk's `getToken` (from useAuth().getToken) and we
// attach a Bearer header ourselves.
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://www.coyl.ai'

type GetToken = () => Promise<string | null>

async function authedPost(path: string, body: unknown, getToken: GetToken): Promise<Response> {
  const token = await getToken()
  return fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
}

// ── The signal contract (must mirror the web Zod schema exactly) ─────────
// NEDA gate: this union is the ONLY set of kinds that may ever be produced.
export type HealthSignalKind =
  | 'steps'
  | 'sleep_minutes'
  | 'heart_rate'
  | 'resting_heart_rate'
  | 'hrv'

export type HealthSignal = {
  kind: HealthSignalKind
  value: number
  unit?: string
  startedAt: string // ISO
  endedAt?: string // ISO
}

// ── Lazy native-module guard ─────────────────────────────────────────────
// We require() the native module inside try/catch the first time it's needed.
// On Android, in Expo Go, or on any binary that didn't compile the module in,
// require throws / the module is undefined → we cache `null` and every export
// degrades to a no-op. We never import at module top-level so a missing
// binary can't crash the JS bundle on load.
//
// The shape below is a hand-written structural type for the v8.7.2 default
// export + named query helpers we use. We keep it loose (the real types are
// heavily generic over units) but accurate to the runtime signatures.

type HKModule = {
  isHealthDataAvailable: () => Promise<boolean>
  requestAuthorization: (read: readonly string[], write?: readonly string[]) => Promise<boolean>
  queryStatisticsForQuantity: (
    identifier: string,
    options: readonly string[],
    from: Date,
    to?: Date,
    unit?: string,
  ) => Promise<{
    sumQuantity?: { quantity: number } | undefined
    averageQuantity?: { quantity: number } | undefined
  }>
  queryCategorySamples: (
    identifier: string,
    options: { from?: Date; to?: Date; limit?: number; ascending?: boolean },
  ) => Promise<ReadonlyArray<{ value: number; startDate: Date; endDate: Date }>>
  queryQuantitySamples: (
    identifier: string,
    options: { from?: Date; to?: Date; limit?: number; ascending?: boolean; unit?: string },
  ) => Promise<ReadonlyArray<{ quantity: number; startDate: Date; endDate: Date; unit?: string }>>
  enableBackgroundDelivery: (identifier: string, updateFrequency: number) => Promise<boolean>
  subscribeToChanges?: (identifier: string, callback: () => void) => Promise<() => Promise<boolean>>
}

let _hk: HKModule | null | undefined // undefined = not yet probed, null = unavailable

function loadHK(): HKModule | null {
  if (_hk !== undefined) return _hk
  // Android has no HealthKit at all — short-circuit before touching require.
  if (Platform.OS !== 'ios') {
    _hk = null
    return null
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('@kingstinct/react-native-healthkit')
    const hk = (mod?.default ?? mod) as Partial<HKModule>
    // The named query helpers are exported alongside the default object; grab
    // whichever surface actually has the functions.
    const resolved: HKModule = {
      isHealthDataAvailable: hk.isHealthDataAvailable ?? mod.isHealthDataAvailable,
      requestAuthorization: hk.requestAuthorization ?? mod.requestAuthorization,
      queryStatisticsForQuantity: hk.queryStatisticsForQuantity ?? mod.queryStatisticsForQuantity,
      queryCategorySamples: hk.queryCategorySamples ?? mod.queryCategorySamples,
      queryQuantitySamples: hk.queryQuantitySamples ?? mod.queryQuantitySamples,
      enableBackgroundDelivery: hk.enableBackgroundDelivery ?? mod.enableBackgroundDelivery,
      subscribeToChanges: hk.subscribeToChanges ?? mod.subscribeToChanges,
    }
    // If the binary doesn't actually have the native bridge, the functions
    // may be present but the runtime will throw on first call. We still set
    // `_hk` here; individual reads are wrapped in try/catch so a throwing
    // bridge degrades to "no data" rather than a crash.
    if (typeof resolved.requestAuthorization !== 'function') {
      _hk = null
      return null
    }
    _hk = resolved
    return _hk
  } catch {
    // Module not compiled into this binary (e.g. Expo Go) → permanently off.
    _hk = null
    return null
  }
}

/**
 * True only when the native HealthKit bridge is present in this binary.
 * False on Android, in Expo Go, and on builds without the module. Cheap and
 * synchronous — safe to call in render to decide whether to show the
 * "Connect Apple Health" card.
 *
 * NOTE: this answers "is the bridge here", not "is the user's device capable"
 * (the Simulator returns true here but `isHealthDataAvailable()` may be false).
 */
export function isHealthKitAvailable(): boolean {
  return loadHK() !== null
}

// ── HealthKit identifier constants (string-literal, NEDA-safe set) ───────
// We hard-code the HK identifier strings rather than importing the library's
// enums, so this module's type-check doesn't depend on the native package's
// generated enums resolving. These five are the ONLY types we ever touch.
const HK = {
  stepCount: 'HKQuantityTypeIdentifierStepCount',
  sleepAnalysis: 'HKCategoryTypeIdentifierSleepAnalysis',
  heartRate: 'HKQuantityTypeIdentifierHeartRate',
  restingHeartRate: 'HKQuantityTypeIdentifierRestingHeartRate',
  hrvSDNN: 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
} as const

// HKStatisticsOptions string values (v8.7.2: string enum).
const STAT_SUM = 'cumulativeSum'

// HKUpdateFrequency.hourly === 2 (numeric enum in the native types).
const UPDATE_FREQUENCY_HOURLY = 2

// HKCategoryValueSleepAnalysis "asleep*" values — anything that counts as
// actual sleep (NOT inBed=0, NOT awake=2).
//   asleepUnspecified=1, asleepCore=3, asleepDeep=4, asleepREM=5
const ASLEEP_VALUES = new Set([1, 3, 4, 5])

/**
 * Request READ-ONLY authorization for the NEDA-safe set. NOTHING ELSE.
 * Returns false on unavailable platforms (no throw). Note iOS deliberately
 * does not tell apps whether *read* permission was granted (privacy) — a
 * `true` here means "the sheet was shown / dismissed", not "we have data".
 * The real test is whether `syncRecentSignals` returns rows.
 */
export async function requestHealthPermissions(): Promise<boolean> {
  const hk = loadHK()
  if (!hk) return false
  try {
    const available = await hk.isHealthDataAvailable().catch(() => false)
    if (!available) return false
    // READ array only; write array intentionally empty — COYL never writes.
    await hk.requestAuthorization([
      HK.stepCount,
      HK.sleepAnalysis,
      HK.heartRate,
      HK.restingHeartRate,
      HK.hrvSDNN,
    ])
    return true
  } catch {
    return false
  }
}

// ── Sync state (module memory) ───────────────────────────────────────────
let _lastSyncAt = 0 // epoch ms of last successful sync
const SYNC_COOLDOWN_MS = 6 * 60 * 60 * 1000 // skip if synced < 6h ago
const WINDOW_MS = 48 * 60 * 60 * 1000 // look back 48h
const BATCH_CAP = 200 // max signals per POST

/** Last successful sync time (ms epoch), or null if never. */
export function lastSyncAt(): number | null {
  return _lastSyncAt > 0 ? _lastSyncAt : null
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/**
 * Query the last 48h of the NEDA-safe set and POST batched signals.
 *
 * Produces:
 *  - `steps`              — daily totals via a cumulative-sum statistics query
 *                           (one row per day, startedAt = local midnight).
 *  - `sleep_minutes`      — one row per sleep *session* (asleep intervals,
 *                           contiguous samples merged), minutes asleep.
 *  - `resting_heart_rate` — latest resting-HR samples (one row each).
 *  - `hrv`                — HRV SDNN samples in ms (one row each).
 *  - `heart_rate`         — sampled HR points (capped) so the model sees spikes.
 *
 * Idempotent on the server via @@unique([userId, kind, startedAt]); devices
 * re-send overlapping samples and the API upserts.
 *
 * @param force skip the 6h cooldown (manual "Sync now").
 * @returns { synced, accepted } — accepted = rows the server upserted.
 */
export async function syncRecentSignals(
  getToken: GetToken,
  opts: { force?: boolean } = {},
): Promise<{ synced: boolean; accepted: number; reason?: string }> {
  const hk = loadHK()
  if (!hk) return { synced: false, accepted: 0, reason: 'unavailable' }

  if (!opts.force && _lastSyncAt > 0 && Date.now() - _lastSyncAt < SYNC_COOLDOWN_MS) {
    return { synced: false, accepted: 0, reason: 'cooldown' }
  }

  const now = new Date()
  const from = new Date(now.getTime() - WINDOW_MS)

  const signals: HealthSignal[] = []

  // ── Steps: daily cumulative-sum, one row per local day in the window. ──
  try {
    let dayStart = startOfLocalDay(from)
    while (dayStart.getTime() <= now.getTime()) {
      const dayEnd = new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate() + 1)
      const to = dayEnd.getTime() < now.getTime() ? dayEnd : now
      const stat = await hk
        .queryStatisticsForQuantity(HK.stepCount, [STAT_SUM], dayStart, to, 'count')
        .catch(() => null)
      const total = stat?.sumQuantity?.quantity
      if (total != null && total > 0) {
        signals.push({
          kind: 'steps',
          value: Math.round(total),
          unit: 'count',
          startedAt: dayStart.toISOString(),
          endedAt: to.toISOString(),
        })
      }
      dayStart = dayEnd
    }
  } catch {
    /* steps unreadable → skip silently */
  }

  // ── Sleep: asleep category samples → merge contiguous → minutes/session. ──
  try {
    const samples = await hk
      .queryCategorySamples(HK.sleepAnalysis, { from, to: now, ascending: true })
      .catch(() => [] as const)
    const asleep = (samples ?? [])
      .filter((s) => ASLEEP_VALUES.has(s.value))
      .map((s) => ({ start: new Date(s.startDate), end: new Date(s.endDate) }))
      .sort((a, b) => a.start.getTime() - b.start.getTime())

    // Merge intervals separated by < 30 min into one "session".
    const SESSION_GAP_MS = 30 * 60 * 1000
    const sessions: { start: Date; end: Date }[] = []
    for (const iv of asleep) {
      const last = sessions[sessions.length - 1]
      if (last && iv.start.getTime() - last.end.getTime() <= SESSION_GAP_MS) {
        if (iv.end > last.end) last.end = iv.end
      } else {
        sessions.push({ start: iv.start, end: iv.end })
      }
    }
    for (const s of sessions) {
      const minutes = Math.round((s.end.getTime() - s.start.getTime()) / 60000)
      if (minutes > 0) {
        signals.push({
          kind: 'sleep_minutes',
          value: minutes,
          unit: 'min',
          startedAt: s.start.toISOString(),
          endedAt: s.end.toISOString(),
        })
      }
    }
  } catch {
    /* sleep unreadable → skip */
  }

  // ── Resting HR: latest samples (bpm), one row each. ──
  try {
    const rhr = await hk
      .queryQuantitySamples(HK.restingHeartRate, { from, to: now, unit: 'count/min', ascending: true })
      .catch(() => [] as const)
    for (const s of rhr ?? []) {
      if (s.quantity > 0) {
        signals.push({
          kind: 'resting_heart_rate',
          value: Math.round(s.quantity),
          unit: 'bpm',
          startedAt: new Date(s.startDate).toISOString(),
          endedAt: new Date(s.endDate).toISOString(),
        })
      }
    }
  } catch {
    /* resting HR unreadable → skip */
  }

  // ── HRV (SDNN, ms): samples, one row each. ──
  try {
    const hrv = await hk
      .queryQuantitySamples(HK.hrvSDNN, { from, to: now, unit: 'ms', ascending: true })
      .catch(() => [] as const)
    for (const s of hrv ?? []) {
      if (s.quantity > 0) {
        signals.push({
          kind: 'hrv',
          value: Math.round(s.quantity * 10) / 10,
          unit: 'ms',
          startedAt: new Date(s.startDate).toISOString(),
          endedAt: new Date(s.endDate).toISOString(),
        })
      }
    }
  } catch {
    /* HRV unreadable → skip */
  }

  // ── Heart rate: sampled points (bpm). Cap to the most-recent 150 so a busy
  //    Apple Watch wearer doesn't blow the batch — the model wants spikes, not
  //    every beat. ──
  try {
    const hr = await hk
      .queryQuantitySamples(HK.heartRate, { from, to: now, unit: 'count/min', ascending: false, limit: 150 })
      .catch(() => [] as const)
    for (const s of hr ?? []) {
      if (s.quantity > 0) {
        signals.push({
          kind: 'heart_rate',
          value: Math.round(s.quantity),
          unit: 'bpm',
          startedAt: new Date(s.startDate).toISOString(),
          endedAt: new Date(s.endDate).toISOString(),
        })
      }
    }
  } catch {
    /* HR unreadable → skip */
  }

  if (signals.length === 0) {
    // Nothing to send, but if we got here without throwing the device is
    // reachable — record the attempt so we honor the cooldown.
    _lastSyncAt = Date.now()
    return { synced: true, accepted: 0, reason: 'no-data' }
  }

  // ── POST in batches of ≤ 200. ──
  let accepted = 0
  try {
    for (let i = 0; i < signals.length; i += BATCH_CAP) {
      const batch = signals.slice(i, i + BATCH_CAP)
      const res = await authedPost('/api/v1/mobile/health-sync', { signals: batch }, getToken)
      if (!res.ok) {
        return { synced: false, accepted, reason: `http_${res.status}` }
      }
      const json = (await res.json().catch(() => null)) as { accepted?: number } | null
      accepted += json?.accepted ?? batch.length
    }
  } catch (err) {
    return { synced: false, accepted, reason: (err as Error).message }
  }

  _lastSyncAt = Date.now()
  return { synced: true, accepted }
}

// ── Background / foreground-resume wiring ─────────────────────────────────
let _bgWired = false
let _appStateSub: { remove: () => void } | null = null
const _unsubscribers: Array<() => Promise<boolean>> = []

/**
 * Wire passive sensing so signals refresh without the user opening Settings.
 *
 * TRUE BACKGROUND DELIVERY: v8.7.2 exposes `enableBackgroundDelivery` +
 * `subscribeToChanges`, which map to HealthKit's
 * `enableBackgroundDelivery(for:frequency:)` / `HKObserverQuery`. With the
 * `com.apple.developer.healthkit.background-delivery` entitlement (added by
 * the config plugin) iOS will wake the app when new samples land, fire the
 * observer callback, and we sync. We register an observer per type AND call
 * enableBackgroundDelivery so wake-ups survive app termination.
 *
 * IMPORTANT HONESTY: even with this wired, the OS-level wake-up can ONLY be
 * verified on a physical device — Expo Go and the Simulator never deliver it.
 * As a guaranteed-everywhere fallback we ALSO sync on AppState 'active'
 * (foreground-resume), so the data refreshes whenever the user returns to the
 * app even if background delivery is throttled or unavailable.
 *
 * @param getToken Clerk token getter, captured for the lifetime of the wiring.
 */
export async function enableBackgroundDelivery(getToken: GetToken): Promise<void> {
  if (_bgWired) return
  const hk = loadHK()
  if (!hk) return
  _bgWired = true

  // Foreground-resume sync — works on every binary, including Simulator. The
  // 6h cooldown inside syncRecentSignals keeps this from hammering the API on
  // every tab switch.
  const onAppState = (state: AppStateStatus) => {
    if (state === 'active') {
      void syncRecentSignals(getToken).catch(() => {})
    }
  }
  _appStateSub = AppState.addEventListener('change', onAppState)

  // True background delivery — best-effort; physical-device only. Guard each
  // call so a throwing/absent native bridge can't break foreground-resume.
  const types = [HK.stepCount, HK.sleepAnalysis, HK.heartRate, HK.restingHeartRate, HK.hrvSDNN]
  for (const t of types) {
    try {
      await hk.enableBackgroundDelivery(t, UPDATE_FREQUENCY_HOURLY)
      if (hk.subscribeToChanges) {
        const unsub = await hk.subscribeToChanges(t, () => {
          // iOS woke us because new samples for `t` arrived → force a sync,
          // bypassing the cooldown so the fresh data lands promptly.
          void syncRecentSignals(getToken, { force: true }).catch(() => {})
        })
        if (typeof unsub === 'function') _unsubscribers.push(unsub)
      }
    } catch {
      /* this type's background delivery isn't available → foreground-resume
         still covers it. */
    }
  }
}

/** Tear down observers + the AppState listener (e.g. on sign-out). */
export async function disableBackgroundDelivery(): Promise<void> {
  _appStateSub?.remove()
  _appStateSub = null
  for (const unsub of _unsubscribers.splice(0)) {
    try {
      await unsub()
    } catch {
      /* ignore */
    }
  }
  _bgWired = false
}
