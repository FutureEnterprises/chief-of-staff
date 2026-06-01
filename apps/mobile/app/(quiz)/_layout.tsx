import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

/**
 * Public, no-auth route group for the consumer archetype quiz.
 *
 * Lives outside `(app)` and `(auth)` so it can be linked / deep-linked without
 * a signed-in session — this is the top-of-funnel viral surface (coyl.ai/audit).
 * Dark editorial canvas (#0e0c0a) carried across both screens; headers hidden so
 * the hook line and reveal card own the full screen on iOS and Android alike.
 */
export default function QuizLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0e0c0a' },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="reveal" />
      </Stack>
    </>
  )
}
