import '../global.css' // NativeWind — must be imported once at the app root.
import { useEffect } from 'react'
import { View, Text } from 'react-native'
import { Stack } from 'expo-router'
import { ClerkProvider } from '@clerk/clerk-expo'
import { tokenCache } from '../lib/token-cache'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { ensureAndroidChannels } from '../lib/notifications'

SplashScreen.preventAutoHideAsync()

const CLERK_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync()
    // Create the Android notification channels at cold start so an interrupt
    // push can surface at MAX importance even before the first sign-in. The
    // iOS foreground handler is installed at module load in lib/notifications.
    // No-op on iOS / web. Importing notifications here also ensures
    // setNotificationHandler runs early.
    ensureAndroidChannels().catch(() => {})
  }, [])

  if (!CLERK_KEY) {
    // className here also serves as the NativeWind smoke test — if the
    // babel/metro pipeline weren't wired, this screen would render
    // unstyled. Tailwind tokens map to the COYL palette (tailwind.config.js).
    return (
      <View className="flex-1 items-center justify-center bg-coyl-ink">
        <Text className="p-5 text-center text-sm text-red-400">
          Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
        </Text>
      </View>
    )
  }

  return (
    <ClerkProvider publishableKey={CLERK_KEY} tokenCache={tokenCache}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="(quiz)" />
      </Stack>
    </ClerkProvider>
  )
}
