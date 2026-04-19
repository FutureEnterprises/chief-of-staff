import { Platform } from 'react-native'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://www.coyl.ai'

type DayMetrics = {
  steps?: number
  weightKg?: number
  sleepHours?: number
  heartRateAvg?: number
  restingHeartRate?: number
  workoutMinutes?: number
}

export type HealthProvider = 'apple_health' | 'google_fit'

/**
 * Request permissions + read yesterday's health metrics from the native store
 * (HealthKit on iOS, Health Connect on Android) and POST to COYL.
 *
 * Only aggregated day-level metrics leave the device — no raw samples.
 */
export async function syncYesterdayHealth(
  getToken: () => Promise<string | null>
): Promise<{ synced: boolean; provider: HealthProvider | null; metrics?: DayMetrics }> {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  try {
    let provider: HealthProvider
    let metrics: DayMetrics = {}

    if (Platform.OS === 'ios') {
      provider = 'apple_health'
      metrics = await readHealthKit(start, end)
    } else if (Platform.OS === 'android') {
      provider = 'google_fit'
      metrics = await readHealthConnect(start, end)
    } else {
      return { synced: false, provider: null }
    }

    // Don't POST if we got nothing
    const hasAny = Object.values(metrics).some((v) => v !== undefined && v !== null)
    if (!hasAny) return { synced: false, provider, metrics }

    const token = await getToken()
    const res = await fetch(`${API_URL}/api/v1/integrations/health`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        provider,
        date: start.toISOString(),
        metrics,
      }),
    })

    return { synced: res.ok, provider, metrics }
  } catch (err) {
    console.warn('[health] sync failed:', (err as Error).message)
    return { synced: false, provider: null }
  }
}

/* --- iOS: HealthKit --- */

async function readHealthKit(start: Date, end: Date): Promise<DayMetrics> {
  // Dynamic import so Android bundle doesn't choke
  type HealthKitModule = {
    requestAuthorization: (read: string[], write?: string[]) => Promise<boolean>
    queryStatisticsForQuantity?: (id: string, opts: { from: Date; to: Date; unit?: string }) => Promise<{ sumQuantity?: { quantity: number }; averageQuantity?: { quantity: number } } | null>
    queryCategorySamplesForType?: (id: string, opts: { from: Date; to: Date }) => Promise<Array<{ startDate: Date; endDate: Date }>>
  }
  const HealthKit = (await import('@kingstinct/react-native-healthkit')).default as unknown as HealthKitModule

  const granted = await HealthKit.requestAuthorization([
    'HKQuantityTypeIdentifierStepCount',
    'HKQuantityTypeIdentifierBodyMass',
    'HKQuantityTypeIdentifierHeartRate',
    'HKQuantityTypeIdentifierRestingHeartRate',
    'HKQuantityTypeIdentifierAppleExerciseTime',
    'HKCategoryTypeIdentifierSleepAnalysis',
  ])
  if (!granted) return {}

  const metrics: DayMetrics = {}

  const steps = await HealthKit.queryStatisticsForQuantity?.('HKQuantityTypeIdentifierStepCount', {
    from: start, to: end, unit: 'count',
  }).catch(() => null)
  if (steps?.sumQuantity?.quantity != null) metrics.steps = Math.round(steps.sumQuantity.quantity)

  const weight = await HealthKit.queryStatisticsForQuantity?.('HKQuantityTypeIdentifierBodyMass', {
    from: start, to: end, unit: 'kg',
  }).catch(() => null)
  if (weight?.averageQuantity?.quantity != null) metrics.weightKg = Math.round(weight.averageQuantity.quantity * 10) / 10

  const hr = await HealthKit.queryStatisticsForQuantity?.('HKQuantityTypeIdentifierHeartRate', {
    from: start, to: end, unit: 'count/min',
  }).catch(() => null)
  if (hr?.averageQuantity?.quantity != null) metrics.heartRateAvg = Math.round(hr.averageQuantity.quantity)

  const rhr = await HealthKit.queryStatisticsForQuantity?.('HKQuantityTypeIdentifierRestingHeartRate', {
    from: start, to: end, unit: 'count/min',
  }).catch(() => null)
  if (rhr?.averageQuantity?.quantity != null) metrics.restingHeartRate = Math.round(rhr.averageQuantity.quantity)

  const exercise = await HealthKit.queryStatisticsForQuantity?.('HKQuantityTypeIdentifierAppleExerciseTime', {
    from: start, to: end, unit: 'min',
  }).catch(() => null)
  if (exercise?.sumQuantity?.quantity != null) metrics.workoutMinutes = Math.round(exercise.sumQuantity.quantity)

  const sleep = await HealthKit.queryCategorySamplesForType?.('HKCategoryTypeIdentifierSleepAnalysis', {
    from: start, to: end,
  }).catch(() => null)
  if (sleep && Array.isArray(sleep)) {
    const totalMs = sleep.reduce((s, sample) => s + (new Date(sample.endDate).getTime() - new Date(sample.startDate).getTime()), 0)
    metrics.sleepHours = Math.round((totalMs / 3_600_000) * 10) / 10
  }

  return metrics
}

/* --- Android: Health Connect --- */

async function readHealthConnect(start: Date, end: Date): Promise<DayMetrics> {
  type HealthConnectModule = {
    initialize: () => Promise<boolean>
    requestPermission: (perms: Array<{ accessType: 'read'; recordType: string }>) => Promise<Array<{ accessType: 'read'; recordType: string }>>
    readRecords: <T = unknown>(type: string, opts: { timeRangeFilter: { operator: 'between'; startTime: string; endTime: string } }) => Promise<{ records: T[] }>
  }
  const mod = (await import('react-native-health-connect')) as unknown as HealthConnectModule

  const ok = await mod.initialize()
  if (!ok) return {}

  const perms = await mod.requestPermission([
    { accessType: 'read', recordType: 'Steps' },
    { accessType: 'read', recordType: 'Weight' },
    { accessType: 'read', recordType: 'SleepSession' },
    { accessType: 'read', recordType: 'HeartRate' },
    { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
  ])
  if (!perms.length) return {}

  const range = {
    timeRangeFilter: {
      operator: 'between' as const,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    },
  }
  const metrics: DayMetrics = {}

  try {
    const steps = await mod.readRecords<{ count: number }>('Steps', range)
    metrics.steps = steps.records.reduce((s, r) => s + (r.count ?? 0), 0)
  } catch { /* ignore */ }

  try {
    const weight = await mod.readRecords<{ weight: { inKilograms: number } }>('Weight', range)
    if (weight.records.length > 0) {
      const avg = weight.records.reduce((s, r) => s + (r.weight?.inKilograms ?? 0), 0) / weight.records.length
      metrics.weightKg = Math.round(avg * 10) / 10
    }
  } catch { /* ignore */ }

  try {
    const sleep = await mod.readRecords<{ startTime: string; endTime: string }>('SleepSession', range)
    const totalMs = sleep.records.reduce((s, r) => s + (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()), 0)
    metrics.sleepHours = Math.round((totalMs / 3_600_000) * 10) / 10
  } catch { /* ignore */ }

  try {
    const hr = await mod.readRecords<{ samples: Array<{ beatsPerMinute: number }> }>('HeartRate', range)
    const allSamples = hr.records.flatMap((r) => r.samples ?? [])
    if (allSamples.length > 0) {
      metrics.heartRateAvg = Math.round(allSamples.reduce((s, x) => s + x.beatsPerMinute, 0) / allSamples.length)
    }
  } catch { /* ignore */ }

  try {
    const cals = await mod.readRecords<{ energy: { inKilocalories: number } }>('ActiveCaloriesBurned', range)
    const totalCal = cals.records.reduce((s, r) => s + (r.energy?.inKilocalories ?? 0), 0)
    // Rough: ~6 kcal/min moderate exercise
    if (totalCal > 0) metrics.workoutMinutes = Math.round(totalCal / 6)
  } catch { /* ignore */ }

  return metrics
}
