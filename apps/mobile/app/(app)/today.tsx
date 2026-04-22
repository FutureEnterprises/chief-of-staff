import { useEffect, useState, useCallback, useRef } from 'react'
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  TouchableOpacity,
  Animated,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useApiClient } from '../../lib/api'
import type { CoylUser, ToneMode } from '@repo/shared'

/**
 * Today — primary surface of the autopilot interruption system.
 *
 * Redesigned from the pre-pivot task-manager layout. This screen is the
 * first thing users see post-sign-in and the primary App Store screenshot.
 * Narrative priority (top to bottom):
 *   1. Tone-mode indicator + greeting (context)
 *   2. Danger-window alert (red, only if inside a learned risk window)
 *   3. Self-trust hero card with streak + patterns-defeated counter
 *   4. Two primary CTAs: "I'm about to mess up" (→ /rescue) + "Ask COYL" (→ /decide)
 *   5. Commitments today (keep/break state per rule)
 *   6. Quiet footer: recently completed tasks
 *
 * Design language matches coyl.ai website: #0a0a0a background, orange→red
 * gradient accents (#ff6600 → #ef4444), Inter-style heavy display type,
 * generous negative space. Primary-only visible actions; secondary actions
 * live one tap deeper.
 *
 * Data: /api/v1/user GET now returns insideDangerWindow, selfTrustScore,
 * currentStreak, toneMode, and patternsDefeatedThisWeek in one round-trip.
 * /api/v1/today still returns the legacy task surfaces which we relegate
 * to the quiet footer — they're orthogonal to the autopilot narrative.
 */

const COLORS = {
  bg: '#0a0a0a',
  surface: '#111',
  surfaceAlt: '#1a1a1a',
  border: 'rgba(255,255,255,0.06)',
  text: '#fff',
  textDim: '#888',
  textFaint: '#555',
  orange: '#ff6600',
  orangeDim: 'rgba(255,102,0,0.15)',
  red: '#ef4444',
  redDim: 'rgba(239,68,68,0.15)',
  green: '#10b981',
  greenDim: 'rgba(16,185,129,0.15)',
}

const TONE_LABELS: Record<ToneMode, { label: string; dot: string }> = {
  MENTOR: { label: 'Mentor', dot: COLORS.green },
  STRATEGIST: { label: 'Strategist', dot: '#3b82f6' },
  NO_BS: { label: 'No-BS', dot: COLORS.orange },
  BEAST: { label: 'Beast', dot: COLORS.red },
}

export default function TodayScreen() {
  const api = useApiClient()
  const router = useRouter()
  const [user, setUser] = useState<CoylUser | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const pulseAnim = useRef(new Animated.Value(0.5)).current

  const load = useCallback(async () => {
    try {
      const u = await api.getUser()
      setUser(u)
    } catch (err) {
      console.warn('[today] load failed:', err)
    }
  }, [api])

  useEffect(() => {
    load()
  }, [load])

  // Pulse the danger-window banner so it reads as urgent without being
  // obnoxious. 1.4s cycle, opacity 0.5 → 1 → 0.5, reduce-motion respected
  // by RN by default on OS flag (we don't override).
  useEffect(() => {
    if (!user?.insideDangerWindow) return
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [user?.insideDangerWindow, pulseAnim])

  async function onRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  function goToRescue() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    router.push('/rescue')
  }

  function goToDecide() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push('/decide')
  }

  function goToPatterns() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push('/patterns')
  }

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: COLORS.textDim, fontSize: 13 }}>Loading…</Text>
        </View>
      </SafeAreaView>
    )
  }

  const firstName = user.name?.split(' ')[0] ?? 'You'
  const hour = new Date().getHours()
  const greeting = hour < 5 ? 'Late' : hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : hour < 22 ? 'Evening' : 'Night'
  const tone = TONE_LABELS[user.toneMode ?? 'MENTOR']
  const streak = user.currentStreak ?? 0
  const trust = user.selfTrustScore ?? 0
  const defeated = user.patternsDefeatedThisWeek ?? 0

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 140 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.orange}
          />
        }
      >
        {/* ───── header row: tone + brand mark ───── */}
        <View style={styles.headerRow}>
          <View style={styles.brandMark}>
            <View style={styles.coilBar} />
            <View style={[styles.coilBar, { width: 18, opacity: 0.9 }]} />
            <View style={[styles.coilBar, { width: 16, opacity: 0.75 }]} />
            <Text style={styles.brandText}>COYL</Text>
          </View>

          <TouchableOpacity
            style={styles.tonePill}
            onPress={() => router.push('/settings')}
            accessibilityLabel={`Tone mode: ${tone.label}. Tap to change.`}
          >
            <View style={[styles.toneDot, { backgroundColor: tone.dot }]} />
            <Text style={styles.toneText}>{tone.label}</Text>
          </TouchableOpacity>
        </View>

        {/* ───── greeting ───── */}
        <Text style={styles.greeting}>
          {greeting}, <Text style={{ color: COLORS.orange }}>{firstName}</Text>.
        </Text>
        <Text style={styles.greetingSub}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>

        {/* ───── danger window banner (only if inside) ───── */}
        {user.insideDangerWindow && (
          <Animated.View style={[styles.dangerBanner, { opacity: pulseAnim }]}>
            <View style={styles.dangerHeaderRow}>
              <View style={styles.dangerDot} />
              <Text style={styles.dangerLabel}>AUTOPILOT DETECTED</Text>
            </View>
            <Text style={styles.dangerTitle}>
              {user.nextDangerWindowLabel ?? 'Danger window active'}
            </Text>
            <Text style={styles.dangerBody}>
              This is where you always lose. Tap before the script runs.
            </Text>
            <TouchableOpacity style={styles.dangerCta} onPress={goToRescue}>
              <Text style={styles.dangerCtaText}>Rescue me</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ───── self-trust hero card ───── */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={goToPatterns}
          style={styles.heroCard}
        >
          <View style={styles.heroRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroLabel}>SELF-TRUST</Text>
              <View style={styles.heroScoreRow}>
                <Text style={styles.heroScore}>{trust}</Text>
                <Text style={styles.heroScoreSuffix}>/100</Text>
              </View>
            </View>
            <View style={styles.heroDivider} />
            <View style={{ flex: 1 }}>
              <Text style={styles.heroLabel}>STREAK</Text>
              <View style={styles.heroScoreRow}>
                <Text style={styles.heroScore}>{streak}</Text>
                <Text style={styles.heroScoreSuffix}>d</Text>
              </View>
            </View>
          </View>
          <View style={styles.defeatedBadge}>
            <Ionicons name="flash" size={14} color={COLORS.orange} />
            <Text style={styles.defeatedText}>
              {defeated} pattern{defeated === 1 ? '' : 's'} defeated this week
            </Text>
          </View>
        </TouchableOpacity>

        {/* ───── primary rescue CTAs ───── */}
        <View style={styles.ctaRow}>
          <TouchableOpacity style={styles.ctaPrimary} onPress={goToRescue}>
            <Ionicons name="flame" size={18} color="#fff" />
            <Text style={styles.ctaPrimaryText}>Rescue</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ctaSecondary} onPress={goToDecide}>
            <Ionicons name="bulb-outline" size={18} color={COLORS.text} />
            <Text style={styles.ctaSecondaryText}>Ask COYL</Text>
          </TouchableOpacity>
        </View>

        {/* ───── truth card — the quotable we want screenshotted ───── */}
        <View style={styles.truthCard}>
          <Text style={styles.truthLabel}>TODAY</Text>
          <Text style={styles.truthLine}>
            It&rsquo;s not the mistake.
          </Text>
          <Text style={[styles.truthLine, { color: COLORS.orange }]}>
            It&rsquo;s what you do after.
          </Text>
        </View>

        {/* ───── recovery state hint (only if in a slip-recovery state) ───── */}
        {user.recoveryState === 'SLIPPED' && (
          <TouchableOpacity style={styles.recoveryCard} onPress={goToRescue}>
            <Text style={styles.recoveryLabel}>YOU SLIPPED</Text>
            <Text style={styles.recoveryBody}>
              Good. Now we stop the damage. Same-night re-entry.
            </Text>
            <View style={styles.recoveryFooter}>
              <Text style={styles.recoveryCta}>Build the recovery plan</Text>
              <Ionicons name="arrow-forward" size={14} color={COLORS.green} />
            </View>
          </TouchableOpacity>
        )}

        {user.recoveryState === 'RECOVERING' && (
          <View style={styles.recoveringCard}>
            <View style={styles.recoveringDot} />
            <Text style={styles.recoveringText}>
              Recovering. One decision at a time.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ───── primary FAB: "I'm about to mess up" → /rescue ───── */}
      <TouchableOpacity
        onPress={goToRescue}
        style={styles.fab}
        accessibilityLabel="I'm about to mess up — open rescue flow"
      >
        <Ionicons name="flame" size={20} color="#fff" />
        <Text style={styles.fabText}>I&rsquo;m about to mess up</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}

// ─────────────── styles ───────────────
// Inline object so the file is self-contained; mirrors coyl.ai web patterns.

const styles = {
  headerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 28,
  },
  brandMark: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  coilBar: {
    width: 20,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.orange,
    marginRight: 2,
  },
  brandText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '900' as const,
    color: COLORS.text,
    letterSpacing: 3,
  },
  tonePill: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  toneDot: { width: 6, height: 6, borderRadius: 3 },
  toneText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: COLORS.text,
    letterSpacing: 0.5,
  },

  greeting: {
    fontSize: 34,
    fontWeight: '900' as const,
    color: COLORS.text,
    lineHeight: 38,
    letterSpacing: -0.8,
  },
  greetingSub: {
    marginTop: 6,
    marginBottom: 24,
    fontSize: 12,
    color: COLORS.textFaint,
    textTransform: 'uppercase' as const,
    letterSpacing: 2,
  },

  // ── danger banner ──
  dangerBanner: {
    marginBottom: 20,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.35)',
    backgroundColor: COLORS.redDim,
  },
  dangerHeaderRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 10,
  },
  dangerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.red,
  },
  dangerLabel: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: COLORS.red,
    letterSpacing: 2.5,
  },
  dangerTitle: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: COLORS.text,
    marginBottom: 4,
  },
  dangerBody: { fontSize: 14, color: COLORS.textDim, marginBottom: 14 },
  dangerCta: {
    alignSelf: 'flex-start' as const,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.red,
  },
  dangerCtaText: { fontSize: 13, fontWeight: '800' as const, color: '#fff' },

  // ── hero card ──
  heroCard: {
    marginBottom: 16,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  heroRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  heroDivider: {
    width: 1,
    height: 48,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: COLORS.textFaint,
    letterSpacing: 2,
    marginBottom: 4,
  },
  heroScoreRow: {
    flexDirection: 'row' as const,
    alignItems: 'baseline' as const,
  },
  heroScore: {
    fontSize: 44,
    fontWeight: '900' as const,
    color: COLORS.text,
    letterSpacing: -1,
  },
  heroScoreSuffix: {
    marginLeft: 4,
    fontSize: 16,
    color: COLORS.textFaint,
    fontWeight: '600' as const,
  },
  defeatedBadge: {
    marginTop: 14,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    alignSelf: 'flex-start' as const,
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.orangeDim,
  },
  defeatedText: { fontSize: 12, fontWeight: '700' as const, color: COLORS.orange },

  // ── CTA row ──
  ctaRow: {
    flexDirection: 'row' as const,
    gap: 10,
    marginBottom: 16,
  },
  ctaPrimary: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: COLORS.orange,
    shadowColor: COLORS.orange,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  ctaPrimaryText: { fontSize: 15, fontWeight: '800' as const, color: '#fff' },
  ctaSecondary: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  ctaSecondaryText: { fontSize: 15, fontWeight: '700' as const, color: COLORS.text },

  // ── truth card ──
  truthCard: {
    padding: 20,
    borderRadius: 20,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.orange,
    backgroundColor: COLORS.surfaceAlt,
    marginBottom: 16,
  },
  truthLabel: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: COLORS.textFaint,
    letterSpacing: 2,
    marginBottom: 8,
  },
  truthLine: {
    fontSize: 20,
    fontWeight: '900' as const,
    color: COLORS.text,
    lineHeight: 26,
    letterSpacing: -0.3,
  },

  // ── recovery cards ──
  recoveryCard: {
    marginBottom: 16,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    backgroundColor: COLORS.greenDim,
  },
  recoveryLabel: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: COLORS.green,
    letterSpacing: 2,
    marginBottom: 6,
  },
  recoveryBody: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600' as const,
    lineHeight: 22,
    marginBottom: 12,
  },
  recoveryFooter: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  recoveryCta: { fontSize: 13, fontWeight: '800' as const, color: COLORS.green },
  recoveringCard: {
    marginBottom: 16,
    padding: 14,
    borderRadius: 14,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  recoveringDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.green,
  },
  recoveringText: { fontSize: 13, color: COLORS.textDim },

  // ── FAB ──
  fab: {
    position: 'absolute' as const,
    left: 20,
    right: 20,
    bottom: 24,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
    paddingVertical: 18,
    borderRadius: 22,
    backgroundColor: COLORS.red,
    shadowColor: COLORS.red,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 12,
  },
  fabText: { fontSize: 15, fontWeight: '800' as const, color: '#fff', letterSpacing: 0.3 },
}
