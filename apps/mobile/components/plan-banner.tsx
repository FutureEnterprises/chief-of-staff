import { useEffect, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { BRAND } from '@repo/shared'
import { useMobileApi, type MobileMe } from '../lib/api'
import { isConfigured as purchasesConfigured } from '../lib/purchases'

/**
 * PlanBanner — shows the signed-in user's plan state on app surfaces.
 *
 * FREE users see a compact "Free plan — 3 interrupts/week" notice; paid users
 * (CORE / PLUS / PREMIUM / legacy PRO / TEAM) see nothing — the banner
 * self-hides so it never nags people who already pay.
 *
 * APPLE IAP POLICY (current — Apple-compliant):
 *   The upgrade affordance is platform-specific, per App Store Review
 *   Guideline 3.1.1 (no linking out to an external purchase flow for digital
 *   goods):
 *     • iOS + RevenueCat configured  → routes to the in-app /upgrade paywall
 *       (real StoreKit IAP). No web link.
 *     • iOS + RevenueCat NOT configured → renders the plan notice with NO
 *       upgrade affordance at all (no button, no purchase mention, no external
 *       link). Safest App Review posture: a reviewer on a build without the
 *       RevenueCat key sees zero purchase surface to object to.
 *     • Android → keeps the existing web-pricing link (Play policy permits it,
 *       and Android isn't gated on the iOS guideline).
 *
 * NEDA-safe: copy is behavioural ("interrupts"), never body / diet framing.
 */

const PRICING_URL = 'https://www.coyl.ai/pricing'

const PAID_PLANS = new Set(['CORE', 'PLUS', 'PREMIUM', 'PRO', 'TEAM'])

export function PlanBanner() {
  const api = useMobileApi()
  const router = useRouter()
  const [me, setMe] = useState<MobileMe | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    api
      .getMe()
      .then((data) => {
        if (!cancelled) setMe(data)
      })
      .catch(() => {
        // Plan state is non-blocking — if the fetch fails we simply render
        // nothing rather than guess at the user's entitlement.
        if (!cancelled) setMe(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [api])

  if (loading) {
    return (
      <View style={{ paddingVertical: 8, alignItems: 'center' }}>
        <ActivityIndicator color={BRAND.orange} />
      </View>
    )
  }

  // Hide for paid plans (or when we couldn't determine the plan).
  if (!me || PAID_PLANS.has(me.planType)) return null

  // Decide the upgrade affordance for this platform (see header policy):
  //   iOS + RevenueCat configured → in-app paywall
  //   iOS + RevenueCat unconfigured → NO affordance (no button at all)
  //   Android → web pricing link
  const iosIapReady = Platform.OS === 'ios' && purchasesConfigured()
  const showUpgradeButton = iosIapReady || Platform.OS !== 'ios'
  const onUpgrade = () => {
    if (iosIapReady) {
      router.push('/(app)/upgrade')
    } else if (Platform.OS !== 'ios') {
      // Android (and any non-iOS) — keep the existing web-pricing flow.
      Linking.openURL(PRICING_URL).catch(() => {})
    }
  }

  return (
    <View
      style={{
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          backgroundColor: `${BRAND.orange}15`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="flash-outline" size={18} color={BRAND.orange} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: BRAND.charcoal }}>
          Free plan — 3 interrupts/week
        </Text>
        <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
          {showUpgradeButton
            ? 'Upgrade for unlimited interrupts.'
            : // iOS without RevenueCat configured: no purchase mention at all.
              'You get 3 interrupts each week.'}
        </Text>
      </View>
      {showUpgradeButton ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Upgrade your plan"
          onPress={onUpgrade}
          style={{
            backgroundColor: BRAND.orange,
            borderRadius: 12,
            paddingVertical: 10,
            paddingHorizontal: 16,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Upgrade</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}
