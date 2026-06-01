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
import * as Haptics from 'expo-haptics'
import * as Notifications from 'expo-notifications'
import {
  FAMILIES,
  isFamilySlug,
  windowFromQ2,
  type FamilySlug,
  type QuizAnswers,
} from '../../lib/archetypes'

/**
 * COYL archetype reveal — the screenshot-worthy moment.
 *
 * A full-screen, 9:16-friendly dark card with an amber accent. This is the
 * viral asset: the user is meant to screenshot it and send it to "the friend
 * who's your opposite type." Everything above the buttons is composed to read
 * as a single shareable image — eyebrow, large serif-ish name, essence,
 * signature quote, danger window, and the prevalence stat.
 *
 * Two actions, NO paywall:
 *   • Share — native Share.share() with pre-filled text + coyl.ai/audit.
 *   • Daily pattern check — requests notification permission and schedules a
 *     daily LOCAL notification at 9:30 PM ("Your {name} window is opening.").
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
  const { height } = useWindowDimensions()
  const params = useLocalSearchParams<{ family?: string; q2?: string }>()

  // Resolve + validate the slug param; fall back to the negotiator if a bad
  // value is deep-linked so the card always renders something coherent.
  const slug: FamilySlug = isFamilySlug(params.family)
    ? params.family
    : 'the-9pm-negotiator'
  const family = FAMILIES[slug]

  const answers: QuizAnswers = { q2: typeof params.q2 === 'string' ? params.q2 : undefined }
  const dangerWindow = windowFromQ2(answers, slug)

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

  const handleShare = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
    const message = `I'm ${family.name} on COYL. What's your pattern? coyl.ai/audit`
    try {
      await Share.share(
        Platform.OS === 'ios' ? { message, url: 'https://coyl.ai/audit' } : { message },
        { subject: "What's your pattern?" },
      )
    } catch {
      // User dismissed the sheet or share failed — nothing to recover, the
      // card is still on screen for them to screenshot manually.
    }
  }, [family.name])

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

          {/* Danger window */}
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
              Your danger window
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
              {dangerWindow}
            </Text>
          </View>

          <View style={{ height: 1, backgroundColor: COLORS.hair, marginBottom: 18 }} />

          {/* Prevalence stat */}
          <Text
            style={{
              color: COLORS.muted,
              fontSize: 15,
              lineHeight: 23,
              fontWeight: '500',
            }}
          >
            {family.prevalence}
          </Text>
        </View>

        {/* ── Actions (excluded from the "screenshot" mental frame) ── */}
        <View style={{ marginTop: 24 }}>
          <Pressable
            onPress={handleShare}
            accessibilityRole="button"
            accessibilityLabel="Send this to the friend who's your opposite type"
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
