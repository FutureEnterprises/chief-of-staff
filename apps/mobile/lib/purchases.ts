import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesOfferings,
  type PurchasesPackage,
} from 'react-native-purchases'
import { Platform } from 'react-native'

/**
 * RevenueCat (StoreKit / Play Billing) wiring for COYL.
 *
 * WHY THIS EXISTS
 * ---------------
 * App Store Review Guideline 3.1.1 forbids linking out to a web checkout for
 * digital goods. The old plan-banner opened https://www.coyl.ai/pricing in the
 * system browser — fine for TestFlight, a rejection risk for public release.
 * This module replaces that iOS path with real in-app purchases brokered by
 * RevenueCat, which abstracts StoreKit (iOS) and Play Billing (Android) and
 * relays the entitlement state to our web webhook.
 *
 * THE JOIN KEY (the contract that makes the webhook work)
 * -------------------------------------------------------
 * After Clerk sign-in we call `Purchases.logIn(clerkUserId)`, so RevenueCat's
 * `app_user_id` IS the Clerk user id. The web webhook
 * (apps/web/src/app/api/webhooks/revenuecat/route.ts) reads `app_user_id`
 * straight off the event and looks the User up by `clerkId`. No extra mapping
 * table, no Prisma migration.
 *
 * ENTITLEMENT IDENTIFIERS (must match RevenueCat dashboard + the webhook)
 * ----------------------------------------------------------------------
 *   rewire  → CORE  ("Rewire", $12/mo · $99/yr web parity)
 *   rebound → PLUS  ("Rebound", $29/mo · $199/yr web parity)
 *
 * GRACEFUL NO-OP
 * --------------
 * Everything here no-ops when the platform API key env is absent. The app must
 * run fine with RevenueCat unconfigured (Expo Go, a dev build before the key is
 * set, Android before its key exists). `isConfigured()` is the single source of
 * truth other surfaces (plan-banner, /upgrade) gate on.
 *
 * PRICES ARE NEVER HARDCODED. The App Store / Play Store is the price source of
 * truth — UI reads pkg.product.priceString. We only declare entitlement ids.
 */

export const ENTITLEMENTS = {
  /** RevenueCat entitlement id that grants PlanType CORE. */
  rewire: 'rewire',
  /** RevenueCat entitlement id that grants PlanType PLUS. */
  rebound: 'rebound',
} as const

export type CoylEntitlement = (typeof ENTITLEMENTS)[keyof typeof ENTITLEMENTS]

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY

/** The platform-appropriate RevenueCat public SDK key, or undefined. */
function apiKey(): string | undefined {
  return Platform.OS === 'ios' ? IOS_KEY : Platform.OS === 'android' ? ANDROID_KEY : undefined
}

/**
 * True only when a RevenueCat key exists for the current platform AND
 * configure() has run. Surfaces gate purchase affordances on this — when it's
 * false they must show NO purchase UI (safest App Review posture).
 */
export function isConfigured(): boolean {
  return _configured && apiKey() != null
}

let _configured = false
let _configuring: Promise<void> | null = null

/**
 * Idempotently configure the RevenueCat SDK. Safe to call repeatedly; the
 * underlying configure runs at most once. No-ops (and leaves isConfigured()
 * false) when the platform key is absent.
 */
export async function configurePurchases(): Promise<void> {
  if (_configured) return
  if (_configuring) return _configuring

  const key = apiKey()
  if (!key) {
    // No key for this platform — leave unconfigured. Callers treat this as
    // "purchases unavailable" and hide all purchase UI.
    return
  }

  _configuring = (async () => {
    try {
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.WARN)
      }
      Purchases.configure({ apiKey: key })
      _configured = true
    } catch (err) {
      // Configuration failure must never crash the app — purchases simply
      // stay unavailable.
      console.warn('[COYL] RevenueCat configure failed:', err)
    } finally {
      _configuring = null
    }
  })()

  return _configuring
}

/**
 * Identify the RevenueCat customer as the Clerk user. Call AFTER Clerk sign-in.
 * This makes RevenueCat's app_user_id === clerkUserId, which is the exact join
 * key the web webhook uses (User.clerkId). Configures first if needed.
 * No-op when unconfigured.
 */
export async function identify(clerkUserId: string): Promise<void> {
  if (!clerkUserId) return
  await configurePurchases()
  if (!isConfigured()) return
  try {
    await Purchases.logIn(clerkUserId)
  } catch (err) {
    console.warn('[COYL] RevenueCat logIn failed:', err)
  }
}

/**
 * Reset RevenueCat to an anonymous id. Call on Clerk sign-out so a shared
 * device doesn't leak one user's entitlements to the next. No-op when
 * unconfigured.
 */
export async function signOut(): Promise<void> {
  if (!isConfigured()) return
  try {
    await Purchases.logOut()
  } catch (err) {
    // logOut throws if already anonymous — benign.
    console.warn('[COYL] RevenueCat logOut failed:', err)
  }
}

/**
 * Fetch the current (default) offering's packages from the store. Returns null
 * when unconfigured or when no offering is published. Prices inside each
 * package come straight from App Store Connect / Play Console.
 */
export async function getOfferings(): Promise<PurchasesOffering | null> {
  if (!isConfigured()) return null
  try {
    const offerings: PurchasesOfferings = await Purchases.getOfferings()
    return offerings.current ?? null
  } catch (err) {
    console.warn('[COYL] RevenueCat getOfferings failed:', err)
    return null
  }
}

/**
 * Purchase a single package. Resolves to the updated CustomerInfo on success,
 * or null if the user cancelled (cancellation is a normal, non-error outcome).
 * Throws only on genuine, surfaced purchase failures so the caller can show an
 * error state.
 */
export async function purchasePackage(
  pkg: PurchasesPackage,
): Promise<CustomerInfo | null> {
  if (!isConfigured()) return null
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg)
    return customerInfo
  } catch (e) {
    const err = e as { userCancelled?: boolean }
    if (err?.userCancelled) return null
    throw e
  }
}

/**
 * Restore prior purchases — REQUIRED by Apple. Returns the restored
 * CustomerInfo, or null when unconfigured / on failure.
 */
export async function restorePurchases(): Promise<CustomerInfo | null> {
  if (!isConfigured()) return null
  try {
    return await Purchases.restorePurchases()
  } catch (err) {
    console.warn('[COYL] RevenueCat restorePurchases failed:', err)
    return null
  }
}

/**
 * The set of active COYL entitlement ids the current customer holds
 * (subset of {'rewire','rebound'}). Empty when unconfigured or when the
 * customer has none. Useful for an instant client-side check after purchase;
 * the web planType remains the server source of truth (set by the webhook).
 */
export async function getActiveEntitlements(): Promise<CoylEntitlement[]> {
  if (!isConfigured()) return []
  try {
    const info = await Purchases.getCustomerInfo()
    const active = Object.keys(info.entitlements.active)
    return active.filter(
      (id): id is CoylEntitlement =>
        id === ENTITLEMENTS.rewire || id === ENTITLEMENTS.rebound,
    )
  } catch (err) {
    console.warn('[COYL] RevenueCat getCustomerInfo failed:', err)
    return []
  }
}
