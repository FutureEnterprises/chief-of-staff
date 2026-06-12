import { useCallback, useRef, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  SafeAreaView,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import {
  QUESTIONS,
  resolveAnswers,
  buildShareSlug,
  type QuizAnswers,
  type QuizQuestion,
} from '../../lib/archetypes'

/**
 * One tap option across any of the three questions. Each question's options
 * carry a different model-id value type (wedge/window/script), so we narrow per
 * question when handling the tap; this loose shape just lets the renderer treat
 * every option uniformly.
 */
type AnyOption = { id: string; label: string; value: string }

/**
 * COYL archetype quiz — hook + 3-question, tap-only flow. No typing, no signup.
 *
 * Beat structure:
 *   1. Hook line (no logo, no "welcome") — the promise that earns the next tap.
 *   2. One question on screen at a time. Every option is a tap target; a light
 *      haptic fires on each tap and the progress bar advances 1/3 → 3/3.
 *   3. On the final tap we resolve the archetype deterministically (see
 *      lib/archetypes.resolveAnswers — same wedge×window×script model the web
 *      audit uses) and push to /(quiz)/reveal with the share slug, so the reveal
 *      and any share link round-trip to the canonical /a/{wedge}-{window}-{script}.
 *
 * Editorial dark palette, generous spacing, hairline rules — premium, not
 * healthtech. NEDA-safe: behavioural framing only, no body/diet language.
 */

const COLORS = {
  bg: '#0e0c0a',
  card: '#17130f',
  cardPressed: '#221b14',
  border: 'rgba(245,239,230,0.10)',
  borderPressed: 'rgba(255,102,0,0.55)',
  orange: '#ff6600',
  cream: '#f5efe6',
  muted: '#a59a87',
  track: 'rgba(245,239,230,0.08)',
}

const HOOK = "There's a pattern running your choices. We'll name it in 90 seconds."

export default function QuizScreen() {
  const router = useRouter()
  const { height } = useWindowDimensions()
  const [step, setStep] = useState(0)
  const answers = useRef<QuizAnswers>({})

  // Progress fill (0 → 1) and a soft cross-fade between questions.
  const progress = useRef(new Animated.Value(0)).current
  const questionFade = useRef(new Animated.Value(1)).current

  const total = QUESTIONS.length
  // step is always in-range (advanced one tap at a time, reveal handoff fires
  // before it can exceed total), but fall back to the first question to satisfy
  // noUncheckedIndexedAccess and keep the screen renderable in any race.
  const question: QuizQuestion = QUESTIONS[step] ?? QUESTIONS[0]!
  // The three questions carry different option value-types (wedge/window/script);
  // for rendering we treat them uniformly via the loose AnyOption shape.
  const options = question.options as AnyOption[]

  const animateProgress = useCallback(
    (toStep: number) => {
      Animated.timing(progress, {
        toValue: toStep / total,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false, // animating width %
      }).start()
    },
    [progress, total],
  )

  const handleSelect = useCallback(
    (option: AnyOption) => {
      // Light impact on every tap — the core tactile beat of the quiz.
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})

      // question.id is 'wedge' | 'window' | 'script'; option.value is the
      // matching model id. The QUESTIONS array keeps them aligned, so storing
      // by question.id yields a well-formed QuizAnswers.
      answers.current = {
        ...answers.current,
        [question.id]: option.value,
      } as QuizAnswers
      const nextStep = step + 1
      animateProgress(nextStep)

      if (nextStep >= total) {
        // Final answer — a slightly firmer haptic to mark the reveal handoff.
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
        const archetype = resolveAnswers(answers.current)
        const slug = buildShareSlug(archetype)
        router.replace({
          pathname: '/(quiz)/reveal',
          // `slug` (wedge-window-script) fully encodes the result, so the
          // reveal screen + share link both round-trip to /a/{slug}.
          params: { slug },
        })
        return
      }

      // Cross-fade out, swap the question, fade back in.
      Animated.timing(questionFade, {
        toValue: 0,
        duration: 160,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        setStep(nextStep)
        Animated.timing(questionFade, {
          toValue: 1,
          duration: 240,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }).start()
      })
    },
    [animateProgress, question.id, questionFade, router, step, total],
  )

  const fillWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  })

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={{ flex: 1, paddingHorizontal: 26, paddingTop: height * 0.06 }}>
        {/* Hook line — sits above everything, the reason to start tapping. */}
        <Text
          style={{
            color: COLORS.cream,
            fontSize: 27,
            lineHeight: 35,
            fontWeight: '600',
            letterSpacing: -0.4,
            marginBottom: 8,
          }}
        >
          {HOOK}
        </Text>

        {/* Progress: count + hairline track. */}
        <View style={{ marginTop: 28, marginBottom: 4 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: 10,
            }}
          >
            <Text
              style={{
                color: COLORS.muted,
                fontSize: 12,
                letterSpacing: 2,
                textTransform: 'uppercase',
                fontWeight: '600',
              }}
            >
              The Audit
            </Text>
            <Text style={{ color: COLORS.muted, fontSize: 13, fontWeight: '600' }}>
              {Math.min(step + 1, total)}
              <Text style={{ color: 'rgba(165,154,135,0.5)' }}> / {total}</Text>
            </Text>
          </View>
          <View
            style={{
              height: 3,
              borderRadius: 2,
              backgroundColor: COLORS.track,
              overflow: 'hidden',
            }}
          >
            <Animated.View
              style={{
                height: '100%',
                width: fillWidth,
                backgroundColor: COLORS.orange,
                borderRadius: 2,
              }}
            />
          </View>
        </View>

        {/* Question + options. */}
        <Animated.View style={{ flex: 1, opacity: questionFade, marginTop: 30 }}>
          <Text
            style={{
              color: COLORS.cream,
              fontSize: 21,
              lineHeight: 29,
              fontWeight: '600',
              letterSpacing: -0.2,
              marginBottom: 22,
            }}
          >
            {question.prompt}
          </Text>

          <View style={{ gap: 12 }}>
            {options.map((option) => (
              <Pressable
                key={option.id}
                onPress={() => handleSelect(option)}
                accessibilityRole="button"
                accessibilityLabel={option.label}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? COLORS.cardPressed : COLORS.card,
                  borderWidth: 1,
                  borderColor: pressed ? COLORS.borderPressed : COLORS.border,
                  borderRadius: 16,
                  paddingVertical: 18,
                  paddingHorizontal: 20,
                  transform: [{ scale: pressed ? 0.985 : 1 }],
                })}
              >
                <Text
                  style={{
                    color: COLORS.cream,
                    fontSize: 17,
                    lineHeight: 23,
                    fontWeight: '500',
                    letterSpacing: -0.1,
                  }}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        <Text
          style={{
            color: 'rgba(165,154,135,0.55)',
            fontSize: 12,
            textAlign: 'center',
            paddingVertical: 16,
          }}
        >
          No account. No typing. Just notice.
        </Text>
      </View>
    </SafeAreaView>
  )
}
