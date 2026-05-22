/**
 * Screen-Time API wrapper.
 *
 * iOS 17.0+ is the first version where DeviceActivity exposes
 * anonymized category-level usage counts to third-party apps. The
 * native bridge gracefully returns an empty dictionary on older
 * iOS — but we expose `isScreenTimeAvailable()` so the UI can hide
 * the relevant prompt entirely on iOS 16.
 *
 * The data shape returned by `readCategoryUsage` is an open-ended
 * `Record<string, number>` rather than a hardcoded
 * `{ social, productivity, ... }` because Apple's category list
 * evolves between iOS versions and we'd rather ship without
 * needing a new build every time they add a category.
 */
import { Platform } from 'react-native'
import CoylHealthBridge from '../modules/coyl-health-bridge'

/** Maps the canonical category buckets we care about — but other
 *  keys may also appear in the result; callers should treat the
 *  return value as a generic record. */
export type CategoryUsage = Record<string, number> & {
  social?: number
  productivity?: number
  entertainment?: number
  games?: number
  utilities?: number
}

/**
 * True iff:
 *   - Platform is iOS
 *   - iOS version is 17.0 or later
 *
 * We can't ask the native side synchronously, so we check the OS
 * version locally. React Native's Platform.Version on iOS is a
 * string like "17.0" or "16.4".
 */
export function isScreenTimeAvailable(): boolean {
  if (Platform.OS !== 'ios') return false
  const v = String(Platform.Version)
  const major = Number(v.split('.')[0])
  return Number.isFinite(major) && major >= 17
}

/**
 * Read aggregated category usage since `startMs`. Returns an empty
 * object on:
 *   - non-iOS platforms
 *   - iOS < 17
 *   - iOS 17+ where the user hasn't authorized FamilyControls
 *   - iOS 17+ where the DeviceActivityReport extension hasn't
 *     emitted data yet
 *
 * The empty-result behavior is deliberate — the predictive model
 * already handles a missing screen-time signal, and we don't want
 * one denied permission to wedge a whole batch.
 */
export async function readCategoryUsage(
  startMs: number,
): Promise<CategoryUsage> {
  if (!isScreenTimeAvailable()) return {}
  const startIso = new Date(startMs).toISOString()
  return CoylHealthBridge.readScreenTimeCategoryUsage(startIso) as Promise<CategoryUsage>
}
