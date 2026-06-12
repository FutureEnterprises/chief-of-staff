import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, Linking, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND } from '@repo/shared'
import { useMobileApi, type MobileMe } from '../lib/api'

/**
 * PlanBanner — shows the signed-in user's plan state on app surfaces.
 *
 * FREE users see a compact "Free plan — 3 interrupts/week" notice with an
 * Upgrade button. Paid users (CORE / PLUS / PREMIUM / legacy PRO / TEAM) see
 * nothing — the banner self-hides so it never nags people who already pay.
 *
 * APPLE IAP POLICY (v1 tradeoff — revisit before App Store submission):
 *   Upgrade opens https://www.coyl.ai/pricing in the system browser rather than
 *   presenting an in-app purchase. App Store Review Guideline 3.1.1 restricts
 *   linking out to external purchase flows for digital goods; this external-link
 *   approach is acceptable for TestFlight / internal builds but MUST be revisited
 *   (StoreKit IAP, or an approved External Purchase Link entitlement) before a
 *   public App Store submission. No in-app purchase is built here by design.
 *
 * NEDA-safe: copy is behavioural ("interrupts"), never body / diet framing.
 */

const PRICING_URL = 'https://www.coyl.ai/pricing'

const PAID_PLANS = new Set(['CORE', 'PLUS', 'PREMIUM', 'PRO', 'TEAM'])

export function PlanBanner() {
  const api = useMobileApi()
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
          Upgrade for unlimited interrupts.
        </Text>
      </View>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Upgrade your plan"
        onPress={() => {
          // RN built-in Linking — no new native module. Opens the web pricing
          // page in the system browser (see Apple IAP note above).
          Linking.openURL(PRICING_URL).catch(() => {})
        }}
        style={{
          backgroundColor: BRAND.orange,
          borderRadius: 12,
          paddingVertical: 10,
          paddingHorizontal: 16,
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Upgrade</Text>
      </TouchableOpacity>
    </View>
  )
}
