import { useAuth } from '@clerk/clerk-expo'
import { Redirect, Tabs, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { BRAND } from '@repo/shared'
import { useEffect, useRef } from 'react'
import {
  registerForPushNotifications,
  addNotificationResponseListener,
} from '../../lib/notifications'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://www.coyl.ai'

/**
 * Screens we route into when a push notification is tapped. The server-side
 * crons (danger-window-interrupt, post-slip-interrupt, churn) set
 * `data.screen` on the push payload; matching values route there, anything
 * else falls through to /today.
 */
const PUSH_ROUTES: Record<string, string> = {
  today: '/today',
  rescue: '/rescue',
  decide: '/decide',
  patterns: '/patterns',
  commitments: '/commitments',
  slip: '/today',
}

export default function AppTabLayout() {
  const { isSignedIn, getToken } = useAuth()
  const router = useRouter()
  const registrationAttempted = useRef(false)

  // Push-notification registration + tap handling. Runs once per signed-in
  // session. Fires only on physical devices (lib guards with Device.isDevice).
  useEffect(() => {
    if (!isSignedIn || registrationAttempted.current) return
    registrationAttempted.current = true

    registerForPushNotifications(getToken, API_URL).catch((err) => {
      // Silent — permission denial is expected and fine, notifications are
      // an enhancement not a requirement for the app to function.
      console.warn('[COYL] push registration failed:', err)
    })

    const sub = addNotificationResponseListener((response) => {
      const screen = response.notification.request.content.data?.screen as
        | string
        | undefined
      const target = (screen && PUSH_ROUTES[screen]) ?? '/today'
      router.push(target as never)
    })

    return () => sub.remove()
  }, [isSignedIn, getToken, router])

  if (!isSignedIn) return <Redirect href="/(auth)/sign-in" />

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: BRAND.orange,
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: BRAND.cream,
          borderTopColor: '#e5e0d8',
          paddingBottom: 4,
          height: 84,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size }) => <Ionicons name="today-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="decide"
        options={{
          title: 'Decide',
          tabBarIcon: ({ color, size }) => <Ionicons name="bulb-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="rescue"
        options={{
          title: 'Rescue',
          tabBarIcon: ({ color, size }) => <Ionicons name="flame-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="commitments"
        options={{
          title: 'Rules',
          tabBarIcon: ({ color, size }) => <Ionicons name="shield-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="patterns"
        options={{
          title: 'Patterns',
          tabBarIcon: ({ color, size }) => <Ionicons name="eye-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          tabBarIcon: ({ color, size }) => <Ionicons name="mail-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, size }) => <Ionicons name="checkbox-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="follow-ups"
        options={{
          title: 'Follow-ups',
          tabBarIcon: ({ color, size }) => <Ionicons name="refresh-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Projects',
          tabBarIcon: ({ color, size }) => <Ionicons name="folder-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="assessment"
        options={{
          title: 'Assessment',
          tabBarIcon: ({ color, size }) => <Ionicons name="analytics-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  )
}
