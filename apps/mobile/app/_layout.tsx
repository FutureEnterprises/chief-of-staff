import { useEffect } from 'react'
import { Stack, useRouter } from 'expo-router'
import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/clerk-expo'
import { tokenCache } from '../lib/token-cache'
import { registerForPushNotifications, addNotificationResponseListener } from '../lib/notifications'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'

SplashScreen.preventAutoHideAsync()

const CLERK_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://www.coyl.ai'

function PushNotificationSetup() {
  const { getToken, isSignedIn } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isSignedIn) return
    registerForPushNotifications(getToken, API_URL)
  }, [isSignedIn, getToken])

  useEffect(() => {
    const sub = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data
      if (data?.screen === 'today') router.push('/(app)/today')
      else if (data?.screen === 'inbox') router.push('/(app)/inbox')
      else if (data?.screen === 'chat') router.push('/(app)/chat')
      else if (data?.taskId) router.push(`/(app)/tasks`)
    })
    return () => sub.remove()
  }, [router])

  return null
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync()
  }, [])

  return (
    <ClerkProvider publishableKey={CLERK_KEY} tokenCache={tokenCache}>
      <ClerkLoaded>
        <StatusBar style="auto" />
        <PushNotificationSetup />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
      </ClerkLoaded>
    </ClerkProvider>
  )
}
