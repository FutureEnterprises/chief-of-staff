/**
 * Location-bridge wrapper.
 *
 * Geofence-only. We never expose raw GPS to JS or persist it
 * anywhere. The native side registers up to two CLCircularRegion
 * monitors (home + kitchen) and tells us, on demand, which kind
 * of region the user is currently inside — or "unknown" if none.
 *
 * The "work" branch in the LocationKind union is reserved for a
 * future build; the native side does not register it yet. Callers
 * should treat it as a forward-compatible value.
 */
import CoylHealthBridge, {
  type GeofenceCoord,
  type LocationKind,
} from '../modules/coyl-health-bridge'

export type { GeofenceCoord, LocationKind }

/**
 * Register up to two geofences. Passing `null`/`undefined` for a kind
 * removes any previously-registered region for that kind.
 *
 * Note: iOS enforces a 20-region cap *per app*. If you ever add a
 * third kind, audit the native side for stale region cleanup.
 */
export async function configureGeofences(opts: {
  homeCoord?: GeofenceCoord | null
  kitchenCoord?: GeofenceCoord | null
}): Promise<void> {
  return CoylHealthBridge.setupGeofences(
    opts.homeCoord ?? null,
    opts.kitchenCoord ?? null,
  )
}

/**
 * Resolves to the current location kind. Does NOT trigger a fresh
 * GPS read — returns the cached value from the geofence delegate.
 * "unknown" is the honest answer when the user is in neither of
 * the configured regions.
 */
export async function getCurrentLocationKind(): Promise<LocationKind> {
  return CoylHealthBridge.currentLocationKind()
}
