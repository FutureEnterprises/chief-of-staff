import { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import type { PurchasesOffering, PurchasesPackage } from 'react-native-purchases'
import {
  isConfigured,
  getOfferings,
  purchasePackage,
  restorePurchases,
  getActiveEntitlements,
} from '../../lib/purchases'
import { useMobileApi } from '../../lib/api'

/**
 * COYL in-app upgrade (paywall) — StoreKit / Play Billing via RevenueCat.
 *
 * Replaces the old "open web pricing in the browser" path on iOS, which
 * violated App Store Guideline 3.1.1. Here the purchase happens IN the app:
 * we read the published offering from RevenueCat, render each package with the
 * price the STORE returns (pkg.product.priceString — never hardcoded; App Store
 * Connect / Play Console is the price source of truth), and run the native
 * purchase sheet on tap.
 *
 * Apple-required elements present on this screen:
 *   • Real in-app purchase (no external checkout link).
 *   • A "Restore purchases" affordance.
 *   • Auto-renew disclosure + links to Terms and Privacy.
 *
 * On purchase success we optimistically confirm, then refetch
 * /api/v1/mobile/me — the web planType is the server source of truth and is set
 * by the RevenueCat webhook (apps/web/.../webhooks/revenuecat). There can be a
 * brief lag while the webhook lands; the confirmed state + a "Done" affordance
 * cover that window.
 *
 * NEDA-safe: behavioural / pattern framing only — never body / diet language.
 */

const COLORS = {
  bg: '#0e0c0a',
  orange: '#ff6600',
  orangeDim: 'rgba(255,102,0,0.14)',
  orangeBorder: 'rgba(255,102,0,0.35)',
  cream: '#f5efe6',
  muted: '#a59a87',
  hair: 'rgba(245,239,230,0.12)',
  card: '#17130f',
  cardBorder: 'rgba(245,239,230,0.08)',
}

const TERMS_URL = 'https://www.coyl.ai/terms'
const PRIVACY_URL = 'https://www.coyl.ai/privacy'

// What each package's entitlement unlocks, in plain behavioural copy. Keyed by
// the substring we expect in the RevenueCat package/product identifier; falls
// back to a generic line so an unrecognised package still renders safely.
function tierCopy(pkg: PurchasesPackage): { tier: string; blurb: string } {
  const id = `${pkg.identifier} ${pkg.product.identifier}`.toLowerCase()
  if (id.includes('rebound')) {
    return {
      tier: 'Rebound',
      blurb: 'Everything in Rewire, plus the GLP-1 companion and recovery protocol.',
    }
  }
  if (id.includes('rewire')) {
    return {
      tier: 'Rewire',
      blurb: 'Unlimited interrupts and your full pattern history.',
    }
  }
  return { tier: pkg.product.title, blurb: 'Unlock the full COYL experience.' }
}

type Status = 'loading' | 'unavailable' | 'ready' | 'purchasing' | 'confirmed'

export default function UpgradeScreen() {
  const router = useRouter()
  const api = useMobileApi()

  const [status, setStatus] = useState<Status>('loading')
  const [offering, setOffering] = useState<PurchasesOffering | null>(null)
  const [activePkgId, setActivePkgId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    // Defensive: this screen is only routed to when isConfigured() is true, but
    // guard anyway so a stale deep-link can't render a broken paywall.
    if (!isConfigured()) {
      setStatus('unavailable')
      return
    }
    const current = await getOfferings()
    if (!current || current.availablePackages.length === 0) {
      setStatus('unavailable')
      return
    }
    setOffering(current)
    setStatus('ready')
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const onPurchase = useCallback(
    async (pkg: PurchasesPackage) => {
      if (status === 'purchasing') return
      setError(null)
      setActivePkgId(pkg.identifier)
      setStatus('purchasing')
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})

      try {
        const info = await purchasePackage(pkg)
        if (!info) {
          // User cancelled — silently return to the ready state.
          setStatus('ready')
          setActivePkgId(null)
          return
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
        setStatus('confirmed')
        // Refetch server plan state — the webhook sets planType. Best-effort:
        // a momentary lag is expected, the confirmed screen owns that window.
        api.getMe().catch(() => {})
      } catch {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {})
        setError('That purchase didn’t go through. You weren’t charged. Please try again.')
        setStatus('ready')
        setActivePkgId(null)
      }
    },
    [api, status],
  )

  const onRestore = useCallback(async () => {
    setError(null)
    Haptics.selectionAsync().catch(() => {})
    const info = await restorePurchases()
    const active = await getActiveEntitlements()
    if (info && active.length > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
      setStatus('confirmed')
      api.getMe().catch(() => {})
    } else {
      setError('No previous purchases found for this Apple ID.')
    }
  }, [api])

  // ── Loading ──
  if (status === 'loading') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center' }}>
        <ActivityIndicator color={COLORS.orange} />
      </SafeAreaView>
    )
  }

  // ── Unavailable (no offering / not configured) ──
  if (status === 'unavailable') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 28 }}>
          <Text style={{ color: COLORS.cream, fontSize: 22, fontWeight: '700', marginBottom: 10 }}>
            Upgrades aren’t available right now
          </Text>
          <Text style={{ color: COLORS.muted, fontSize: 15, lineHeight: 22 }}>
            Please try again in a little while. Your current plan keeps working as normal.
          </Text>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            style={{ marginTop: 28, paddingVertical: 14 }}
          >
            <Text style={{ color: COLORS.orange, fontSize: 15, fontWeight: '600' }}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  // ── Confirmed ──
  if (status === 'confirmed') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 28 }}>
          <View
            style={{
              alignSelf: 'flex-start',
              borderRadius: 999,
              backgroundColor: COLORS.orangeDim,
              borderWidth: 1,
              borderColor: COLORS.orangeBorder,
              paddingHorizontal: 14,
              paddingVertical: 6,
              marginBottom: 20,
            }}
          >
            <Text style={{ color: COLORS.orange, fontSize: 12, fontWeight: '700', letterSpacing: 1 }}>
              YOU’RE IN
            </Text>
          </View>
          <Text style={{ color: COLORS.cream, fontSize: 28, fontWeight: '700', letterSpacing: -0.5 }}>
            You’re upgraded.
          </Text>
          <Text style={{ color: COLORS.muted, fontSize: 15, lineHeight: 22, marginTop: 12 }}>
            Your new plan is unlocking now. If a feature still looks locked, give it a moment to sync.
          </Text>
          <Pressable
            onPress={() => router.replace('/(app)/today')}
            accessibilityRole="button"
            style={({ pressed }) => ({
              marginTop: 32,
              backgroundColor: COLORS.orange,
              borderRadius: 16,
              paddingVertical: 18,
              alignItems: 'center',
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <Text style={{ color: '#0e0c0a', fontSize: 16, fontWeight: '700' }}>Done</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  // ── Ready / purchasing — the paywall ──
  const packages = offering?.availablePackages ?? []

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
          <View style={{ width: 22, height: 1.5, backgroundColor: COLORS.orange, marginRight: 10 }} />
          <Text
            style={{
              color: COLORS.orange,
              fontSize: 12,
              letterSpacing: 3,
              textTransform: 'uppercase',
              fontWeight: '700',
            }}
          >
            Upgrade
          </Text>
        </View>
        <Text
          style={{
            color: COLORS.cream,
            fontSize: 34,
            lineHeight: 38,
            fontWeight: '700',
            letterSpacing: -1,
            marginBottom: 12,
          }}
        >
          Catch every window.
        </Text>
        <Text style={{ color: COLORS.muted, fontSize: 16, lineHeight: 24, marginBottom: 24 }}>
          Unlimited interrupts, your full pattern history, and the tools that catch you before the fold.
        </Text>

        {/* Packages — price comes from the store, never hardcoded. */}
        {packages.map((pkg) => {
          const { tier, blurb } = tierCopy(pkg)
          const isBusy = status === 'purchasing' && activePkgId === pkg.identifier
          const disabled = status === 'purchasing'
          // Friendly cadence label from the package type (monthly/annual/...).
          const cadence =
            pkg.packageType === 'ANNUAL'
              ? '/ year'
              : pkg.packageType === 'MONTHLY'
                ? '/ month'
                : ''
          return (
            <View
              key={pkg.identifier}
              style={{
                backgroundColor: COLORS.card,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: COLORS.cardBorder,
                padding: 18,
                marginBottom: 14,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Text style={{ color: COLORS.cream, fontSize: 19, fontWeight: '700', letterSpacing: -0.3 }}>
                  {tier}
                </Text>
                <Text style={{ color: COLORS.cream, fontSize: 18, fontWeight: '700' }}>
                  {pkg.product.priceString}
                  <Text style={{ color: COLORS.muted, fontSize: 13, fontWeight: '500' }}> {cadence}</Text>
                </Text>
              </View>
              <Text style={{ color: COLORS.muted, fontSize: 14, lineHeight: 20, marginTop: 8 }}>
                {blurb}
              </Text>
              <Pressable
                onPress={() => onPurchase(pkg)}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel={`Subscribe to ${tier} for ${pkg.product.priceString}`}
                style={({ pressed }) => ({
                  marginTop: 16,
                  backgroundColor: COLORS.orange,
                  borderRadius: 14,
                  paddingVertical: 15,
                  alignItems: 'center',
                  opacity: disabled ? 0.6 : pressed ? 0.9 : 1,
                })}
              >
                {isBusy ? (
                  <ActivityIndicator color="#0e0c0a" />
                ) : (
                  <Text style={{ color: '#0e0c0a', fontSize: 15.5, fontWeight: '700' }}>
                    Continue
                  </Text>
                )}
              </Pressable>
            </View>
          )
        })}

        {error ? (
          <Text style={{ color: '#ff8a65', fontSize: 13, lineHeight: 19, marginTop: 4, marginBottom: 8 }}>
            {error}
          </Text>
        ) : null}

        {/* Restore — REQUIRED by Apple. */}
        <Pressable
          onPress={onRestore}
          disabled={status === 'purchasing'}
          accessibilityRole="button"
          accessibilityLabel="Restore purchases"
          style={{ paddingVertical: 14, alignItems: 'center', marginTop: 4 }}
        >
          <Text style={{ color: COLORS.cream, fontSize: 14, fontWeight: '600' }}>Restore purchases</Text>
        </Pressable>

        {/* Auto-renew disclosure + legal links — required for App Review. */}
        <Text style={{ color: COLORS.muted, fontSize: 11.5, lineHeight: 18, marginTop: 16, textAlign: 'center' }}>
          {Platform.OS === 'ios'
            ? 'Payment is charged to your Apple ID. Subscriptions renew automatically unless cancelled at least 24 hours before the end of the current period. Manage or cancel anytime in your Apple ID settings.'
            : 'Payment is charged to your Google Play account. Subscriptions renew automatically unless cancelled before the end of the current period. Manage or cancel anytime in Google Play.'}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 18, marginTop: 12 }}>
          <Pressable onPress={() => Linking.openURL(TERMS_URL).catch(() => {})} accessibilityRole="link">
            <Text style={{ color: COLORS.muted, fontSize: 12, textDecorationLine: 'underline' }}>Terms</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL(PRIVACY_URL).catch(() => {})} accessibilityRole="link">
            <Text style={{ color: COLORS.muted, fontSize: 12, textDecorationLine: 'underline' }}>Privacy</Text>
          </Pressable>
        </View>

        {/* Quiet dismiss */}
        <Pressable onPress={() => router.back()} accessibilityRole="button" style={{ paddingVertical: 16, alignItems: 'center', marginTop: 6 }}>
          <Text style={{ color: 'rgba(165,154,135,0.7)', fontSize: 13, fontWeight: '500' }}>Maybe later</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}
