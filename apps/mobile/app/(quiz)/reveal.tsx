import { useCallback, useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  SafeAreaView,
  Animated,
  Easing,
  Share,
  Platform,
  useWindowDimensions,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useAuth } from '@clerk/clerk-expo'
import * as Haptics from 'expo-haptics'
import * as Notifications from 'expo-notifications'
import {
  buildArchetype,
  buildShareSlug,
  buildShareUrl,
  parseShareSlug,
  windowLabel,
} from '../../lib/archetypes'
import { markQuizSeen } from '../../lib/activation'

/**
 * COYL archetype reveal — the screenshot-worthy moment.
 *
 * A full-screen, 9:16-friendly dark card with an amber accent. This is the
 * viral asset: the user is meant to screenshot it and send it to "the friend
 * who's your opposite type." Everything above the buttons is composed to read
 * as a single shareable image — eyebrow, large serif-ish name, essence,
 * signature quote, danger window, and the prevalence stat.
 *
 * Actions, NO paywall:
 *   • Start catching yours — the activation CTA: routes to /(auth)/sign-up
 *     (or /(app)/today when already signed in on a retake). The result slug is
 *     stashed in AsyncStorage (lib/activation) so the post-signup step can
 *     replay it into the account via /api/v1/audit/finalize.
 *   • Share — co-primary. Native Share.share() with pre-filled text +
 *     the canonical coyl.ai permalink.
 *   • Daily pattern check — requests notification permission and schedules a
 *     daily LOCAL notification at 9:30 PM ("Your {name} window is opening.").
 *
 * Rendering the reveal also sets the coyl.quizSeen device flag, so cold-start
 * routing (app/index) never loops this user back into the quiz.
 *
 * NEDA-safe: behavioural / pattern framing only, no body / diet language.
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

const DAILY_HOUR = 21 // 9:30 PM local
const DAILY_MINUTE = 30

export default function RevealScreen() {
  const router = useRouter()
  const { isSignedIn } = useAuth()
  const { height } = useWindowDimensions()
  const params = useLocalSearchParams<{ slug?: string }>()

  // Resolve + validate the share slug (wedge-window-script). A bad/missing slug
  // falls back to a coherent default so the card always renders. The parsed
  // triple drives the SAME wedge×window×script model the web audit uses, so the
  // family, specific, and share link all match coyl.ai exactly.
  const parsed =
    parseShareSlug(params.slug ?? '') ?? { wedge: 'weight' as const, window: 'latenight' as const, script: 'minimize' as const }
  const archetype = buildArchetype(parsed.wedge, parsed.window, parsed.script)
  const family = archetype.family
  const specific = archetype.specific
  const dangerWindow = windowLabel(parsed.window)
  const shareSlug = buildShareSlug(parsed)
  const shareUrl = buildShareUrl(parsed)

  // The reveal has rendered → this device has "seen" the quiz (cold-start
  // routing goes to sign-in from now on) and this slug is the pending result
  // the post-signup finalize step replays into the account. Best-effort.
  useEffect(() => {
    markQuizSeen(shareSlug).catch(() => {})
  }, [shareSlug])

  const [reminderState, setReminderState] = useState<'idle' | 'scheduling' | 'set' | 'denied'>(
    'idle',
  )

  // Entrance: the card rises and fades in once, marked by a soft success haptic
  // so the reveal lands as an event, not a screen transition.
  const enter = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
    Animated.timing(enter, {
      toValue: 1,
      duration: 620,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [enter])

  const translateY = enter.interpolate({ inputRange: [0, 1], outputRange: [18, 0] })

  const handleStart = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
    // New users start the account; a signed-in retake goes straight home. The
    // archetype itself travels via AsyncStorage (markQuizSeen above), so
    // sign-up needs no route params.
    router.push(isSignedIn ? '/(app)/today' : '/(auth)/sign-up')
  }, [isSignedIn, router])

  const handleShare = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
    // Point at the canonical specific permalink (/a/{wedge}-{window}-{script}) so
    // the recipient lands on the exact same result the web app renders.
    const message = `I'm ${family.name} on COYL. What's your pattern? ${shareUrl}`
    try {
      await Share.share(
        Platform.OS === 'ios' ? { message, url: shareUrl } : { message },
        { subject: "What's your pattern?" },
      )
    } catch {
      // User dismissed the sheet or share failed — nothing to recover, the
      // card is still on screen for them to screenshot manually.
    }
  }, [family.name, shareUrl])

  const handleDailyCheck = useCallback(async () => {
    if (reminderState === 'scheduling' || reminderState === 'set') return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    setReminderState('scheduling')

    try {
      const existing = await Notifications.getPermissionsAsync()
      let granted = existing.granted
      if (!granted && existing.canAskAgain) {
        const req = await Notifications.requestPermissionsAsync()
        granted = req.granted
      }
      if (!granted) {
        setReminderState('denied')
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {})
        return
      }

      // Android needs a channel for the notification to surface; harmless on iOS.
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('pattern-check', {
          name: 'Daily pattern check',
          importance: Notifications.AndroidImportance.DEFAULT,
          lightColor: COLORS.orange,
        })
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'COYL',
          body: `Your ${family.name} window is opening. Notice once.`,
          ...(Platform.OS === 'android' ? { channelId: 'pattern-check' } : {}),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: DAILY_HOUR,
          minute: DAILY_MINUTE,
        },
      })

      setReminderState('set')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
    } catch {
      // Best-effort — scheduling failures (e.g. simulator quirks) shouldn't
      // break the reveal. Reset so the user can retry.
      setReminderState('idle')
    }
  }, [family.name, reminderState])

  const dailyLabel =
    reminderState === 'set'
      ? 'Daily check is on · 9:30 PM'
      : reminderState === 'scheduling'
        ? 'Setting your reminder…'
        : reminderState === 'denied'
          ? 'Enable notifications in Settings'
          : 'Get your daily pattern check'

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <Animated.View
        style={{
          flex: 1,
          opacity: enter,
          transform: [{ translateY }],
          paddingHorizontal: 28,
          justifyContent: 'space-between',
          paddingTop: height * 0.04,
          paddingBottom: 14,
        }}
      >
        {/* ── Shareable card region (everything above the actions) ── */}
        <View style={{ flex: 1, justifyContent: 'center' }}>
          {/* Eyebrow */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 22 }}>
            <View
              style={{ width: 22, height: 1.5, backgroundColor: COLORS.orange, marginRight: 10 }}
            />
            <Text
              style={{
                color: COLORS.orange,
                fontSize: 12,
                letterSpacing: 3,
                textTransform: 'uppercase',
                fontWeight: '700',
              }}
            >
              Your Pattern
            </Text>
          </View>

          {/* Name — the headline of the screenshot. */}
          <Text
            style={{
              color: COLORS.cream,
              fontSize: 46,
              lineHeight: 50,
              fontWeight: '700',
              letterSpacing: -1.4,
              // iOS ships a true serif; Android falls back to its serif family.
              fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
              marginBottom: 18,
            }}
          >
            {family.name}
          </Text>

          {/* Essence */}
          <Text
            style={{
              color: COLORS.cream,
              fontSize: 19,
              lineHeight: 28,
              fontWeight: '500',
              letterSpacing: -0.2,
              marginBottom: 26,
            }}
          >
            {family.essence}
          </Text>

          {/* Signature quote — set off with a hairline rule. */}
          <View
            style={{
              borderLeftWidth: 2,
              borderLeftColor: COLORS.orange,
              paddingLeft: 16,
              marginBottom: 30,
            }}
          >
            <Text
              style={{
                color: COLORS.cream,
                fontSize: 23,
                lineHeight: 30,
                fontWeight: '600',
                letterSpacing: -0.3,
                fontFamily: Platform.select({
                  ios: 'Georgia',
                  android: 'serif',
                  default: 'serif',
                }),
                fontStyle: 'italic',
              }}
            >
              {family.signature}
            </Text>
          </View>

          {/* Specific texture — "specifically, Night Fridge Saboteur." This is
              the wedge×window detail that proves the family fits this exact
              user; mirrors the web /a/[slug] family + specific composition. */}
          <View style={{ marginBottom: 18 }}>
            <Text
              style={{
                color: COLORS.muted,
                fontSize: 11,
                letterSpacing: 2.5,
                textTransform: 'uppercase',
                fontWeight: '700',
                marginBottom: 6,
              }}
            >
              Specifically
            </Text>
            <Text
              style={{
                color: COLORS.orange,
                fontSize: 17,
                lineHeight: 24,
                fontWeight: '600',
                letterSpacing: -0.1,
              }}
            >
              {specific.name}
            </Text>
            <Text
              style={{
                color: COLORS.muted,
                fontSize: 13,
                lineHeight: 19,
                fontWeight: '500',
                marginTop: 4,
              }}
            >
              {dangerWindow}
            </Text>
          </View>

          <View style={{ height: 1, backgroundColor: COLORS.hair, marginBottom: 18 }} />

          {/* Family description — the longer-form essence the web family page
              shows beneath the headline. */}
          <Text
            style={{
              color: COLORS.muted,
              fontSize: 15,
              lineHeight: 23,
              fontWeight: '500',
            }}
          >
            {family.description}
          </Text>
        </View>

        {/* ── Actions (excluded from the "screenshot" mental frame) ── */}
        <View style={{ marginTop: 24 }}>
          {/* Primary: the activation CTA — the wow moment must not dead-end. */}
          <Pressable
            onPress={handleStart}
            accessibilityRole="button"
            accessibilityLabel="Start catching yours"
            style={({ pressed }) => ({
              backgroundColor: COLORS.orange,
              borderRadius: 16,
              paddingVertical: 18,
              paddingHorizontal: 20,
              alignItems: 'center',
              opacity: pressed ? 0.88 : 1,
              transform: [{ scale: pressed ? 0.99 : 1 }],
            })}
          >
            <Text
              style={{
                color: '#0e0c0a',
                fontSize: 16.5,
                fontWeight: '700',
                letterSpacing: -0.2,
                textAlign: 'center',
              }}
            >
              Start catching yours →
            </Text>
          </Pressable>

          {/* Co-primary: the viral share — same weight class, orange-on-dim. */}
          <Pressable
            onPress={handleShare}
            accessibilityRole="button"
            accessibilityLabel="Send this to the friend who's your opposite type"
            style={({ pressed }) => ({
              marginTop: 12,
              backgroundColor: COLORS.orangeDim,
              borderWidth: 1,
              borderColor: COLORS.orangeBorder,
              borderRadius: 16,
              paddingVertical: 18,
              paddingHorizontal: 20,
              alignItems: 'center',
              opacity: pressed ? 0.88 : 1,
              transform: [{ scale: pressed ? 0.99 : 1 }],
            })}
          >
            <Text
              style={{
                color: COLORS.orange,
                fontSize: 16.5,
                fontWeight: '700',
                letterSpacing: -0.2,
                textAlign: 'center',
              }}
            >
              Send this to the friend who's your opposite type
            </Text>
          </Pressable>

          <Pressable
            onPress={handleDailyCheck}
            disabled={reminderState === 'scheduling' || reminderState === 'set'}
            accessibilityRole="button"
            accessibilityLabel={dailyLabel}
            style={({ pressed }) => ({
              marginTop: 12,
              backgroundColor: reminderState === 'set' ? COLORS.orangeDim : 'transparent',
              borderWidth: 1,
              borderColor: reminderState === 'set' ? COLORS.orangeBorder : COLORS.hair,
              borderRadius: 16,
              paddingVertical: 16,
              paddingHorizontal: 20,
              alignItems: 'center',
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text
              style={{
                color: reminderState === 'set' ? COLORS.orange : COLORS.cream,
                fontSize: 15,
                fontWeight: '600',
                letterSpacing: -0.1,
              }}
            >
              {dailyLabel}
            </Text>
          </Pressable>

          {/* Quiet retake affordance — low-emphasis, never competes with share. */}
          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {})
              router.replace('/(quiz)')
            }}
            accessibilityRole="button"
            accessibilityLabel="Retake the audit"
            style={{ paddingVertical: 14, alignItems: 'center' }}
          >
            <Text style={{ color: 'rgba(165,154,135,0.7)', fontSize: 13, fontWeight: '500' }}>
              Retake the audit
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </SafeAreaView>
  )
}
