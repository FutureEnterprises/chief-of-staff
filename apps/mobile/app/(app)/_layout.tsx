import { useAuth } from '@clerk/clerk-expo'
import { Redirect, Tabs, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { BRAND } from '@repo/shared'
import { useEffect, useRef } from 'react'
import * as Notifications from 'expo-notifications'
import {
  registerForPushNotifications,
  registerInterruptCategory,
  addNotificationResponseListener,
  handleInterruptNotificationResponse,
} from '../../lib/notifications'
import {
  startInterruptActivity,
  endInterruptActivity,
  setLiveActivityAuthToken,
} from '../../lib/live-activity'

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
  // Mirror getToken into a ref so the notification response listener
  // (which can fire while React is unmounted or the app is in the
  // background) reaches a fresh callback every time without re-registering.
  const getTokenRef = useRef(getToken)
  useEffect(() => {
    getTokenRef.current = getToken
  }, [getToken])

  // Push-notification registration + tap handling. Runs once per signed-in
  // session. Fires only on physical devices (lib guards with Device.isDevice).
  useEffect(() => {
    if (!isSignedIn || registrationAttempted.current) return
    registrationAttempted.current = true

    // Push the Clerk auth token into the shared App Group so the widget
    // extension's App Intents (Caught me / I slipped / Not now buttons on
    // the lock-screen Live Activity) can authenticate against the COYL
    // API directly. The token lives in UserDefaults under suite
    // "group.com.coyl.shared", key "coyl.authToken". Best-effort —
    // if the app group isn't provisioned yet (pre-prebuild) we just
    // warn and continue.
    getToken()
      .then((tok) => setLiveActivityAuthToken(tok))
      .catch((err) => console.warn('[COYL] live-activity token push failed:', err))

    // Register the COYL_INTERRUPT iOS notification category so danger-window
    // pushes show "Caught me / I slipped / Not now" action buttons directly
    // on the lock screen. This is the one-tap mechanic — the backend tags
    // every interrupt push with categoryId: 'COYL_INTERRUPT' so iOS knows
    // to render these actions.
    registerInterruptCategory().catch((err) => {
      console.warn('[COYL] category registration failed:', err)
    })

    registerForPushNotifications(getToken, API_URL).catch((err) => {
      // Silent — permission denial is expected and fine, notifications are
      // an enhancement not a requirement for the app to function.
      console.warn('[COYL] push registration failed:', err)
    })

    // Track in-flight Live Activity ids by interruptId so a follow-up
    // push for the same interrupt (countdown tick, dismissal) can find
    // and update / end the right activity without round-tripping the
    // OS-assigned id through the server.
    const liveActivityByInterruptId = new Map<string, string>()

    // Foreground/background notification *receive* listener. Fires when
    // a push arrives at the device — *before* the user taps anything.
    // For interrupt-tier pushes (data.type === 'interrupt') we
    // materialize the lock-screen Live Activity here so the rich
    // countdown UI is up and running by the time the user looks at
    // the phone, even if they never engage with the banner notification.
    const receivedSub = Notifications.addNotificationReceivedListener((notif) => {
      const data = (notif.request.content.data ?? {}) as Record<string, unknown>
      if (data.type !== 'interrupt') return
      const interruptId = typeof data.interruptId === 'string' ? data.interruptId : null
      if (!interruptId) return

      // If the push signals end-of-window we tear down any existing
      // activity for this interrupt instead of starting a new one.
      if (data.action === 'end') {
        const existing = liveActivityByInterruptId.get(interruptId)
        if (existing) {
          endInterruptActivity(existing, 'immediate').catch(() => null)
          liveActivityByInterruptId.delete(interruptId)
        }
        return
      }

      const payload = {
        interruptId,
        archetype: typeof data.archetype === 'string' ? data.archetype : '',
        headline:
          typeof data.headline === 'string'
            ? data.headline
            : notif.request.content.title ?? '',
        subhead:
          typeof data.subhead === 'string'
            ? data.subhead
            : notif.request.content.body ?? '',
        timeRemainingSec:
          typeof data.timeRemainingSec === 'number' ? data.timeRemainingSec : 0,
      }

      startInterruptActivity(payload)
        .then((id) => {
          if (id) liveActivityByInterruptId.set(interruptId, id)
        })
        .catch((err) => {
          console.warn('[COYL] startInterruptActivity error:', err)
        })
    })

    const sub = addNotificationResponseListener((response) => {
      const actionId = response.actionIdentifier

      // When the user taps Caught me / I slipped / Not now we also tear
      // down the Live Activity for the matching interrupt — the danger
      // window has effectively ended from the user's POV.
      const responseData = (response.notification.request.content.data ?? {}) as Record<
        string,
        unknown
      >
      const respInterruptId =
        typeof responseData.interruptId === 'string' ? responseData.interruptId : null
      if (respInterruptId && actionId !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
        const liveId = liveActivityByInterruptId.get(respInterruptId)
        if (liveId) {
          endInterruptActivity(liveId, 'immediate').catch(() => null)
          liveActivityByInterruptId.delete(respInterruptId)
        }
      }

      // Action-button taps (Caught me / I slipped / Not now) execute the
      // tag silently without opening the app — opensAppToForeground:false
      // is set on each category action. Route them through the dedicated
      // handler, then bail BEFORE the deep-link push below so the app
      // stays in the background as the user expected.
      if (actionId === 'CAUGHT_ME' || actionId === 'SLIPPED' || actionId === 'SNOOZE') {
        handleInterruptNotificationResponse(
          response,
          () => getTokenRef.current(),
          API_URL,
        ).catch((err) => {
          console.warn('[COYL] interrupt action handling failed:', err)
        })
        return
      }

      // Default tap (notification body, not an action button) → open the
      // app and deep-link into the right screen.
      const screen = response.notification.request.content.data?.screen as
        | string
        | undefined
      const target = (screen && PUSH_ROUTES[screen]) ?? '/today'
      router.push(target as never)
    })

    return () => {
      sub.remove()
      receivedSub.remove()
    }
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
