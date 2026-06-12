import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { Platform } from 'react-native'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

/**
 * iOS notification category identifier our backend sends in the push
 * payload as `categoryId`. When iOS sees this it renders the three
 * action buttons defined in registerInterruptCategory() ON the
 * lock-screen notification itself — one-tap tagging without unlocking.
 *
 * Backend (apps/web cron/danger-window-interrupt, post-slip-interrupt,
 * churn) sets this same string on every interrupt-tier Expo push.
 */
export const COYL_INTERRUPT_CATEGORY = 'COYL_INTERRUPT'

export type InterruptActionIdentifier = 'CAUGHT_ME' | 'SLIPPED' | 'SNOOZE'

/**
 * Registers the lock-screen action buttons for COYL interrupt pushes.
 *
 * `opensAppToForeground: false` is the one-tap mechanic — iOS executes
 * the action and dispatches our response listener WITHOUT unlocking
 * the device or opening the app. The listener still runs because
 * `addNotificationResponseReceivedListener` is registered against the
 * native notification center, not against React render.
 *
 * `isAuthenticationRequired: false` matches: we trust the user behind
 * the device biometric/passcode that's already keeping the lock screen
 * locked; requiring re-auth here would defeat the "one tap" promise.
 *
 * Idempotent — Expo's setNotificationCategoryAsync replaces an
 * existing category with the same id.
 */
export async function registerInterruptCategory(): Promise<void> {
  if (Platform.OS === 'web') return
  try {
    await Notifications.setNotificationCategoryAsync(COYL_INTERRUPT_CATEGORY, [
      {
        identifier: 'CAUGHT_ME',
        buttonTitle: 'Caught me',
        options: {
          isDestructive: false,
          isAuthenticationRequired: false,
          opensAppToForeground: false,
        },
      },
      {
        identifier: 'SLIPPED',
        buttonTitle: 'I slipped',
        options: {
          isDestructive: true,
          isAuthenticationRequired: false,
          opensAppToForeground: false,
        },
      },
      {
        identifier: 'SNOOZE',
        buttonTitle: 'Not now',
        options: {
          isDestructive: false,
          isAuthenticationRequired: false,
          opensAppToForeground: false,
        },
      },
    ])
  } catch (err) {
    // Registering categories is best-effort — if it fails the user just
    // sees the notification without action buttons (still tappable to
    // open the app), which is the pre-existing behavior.
    console.warn('[COYL] failed to register interrupt category:', err)
  }
}

export async function registerForPushNotifications(
  getToken: () => Promise<string | null>,
  apiUrl: string,
): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push notifications only work on physical devices')
    return null
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted')
    return null
  }

  if (Platform.OS === 'android') {
    await ensureAndroidChannels()
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId
  const pushToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data

  // Register with backend. POSTs to the mobile-owned route
  // (/api/v1/mobile/push-token) which writes User.expoPushToken — the field the
  // web crons read to fan out Expo push.
  try {
    const authToken = await getToken()
    await fetch(`${apiUrl}/api/v1/mobile/push-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({ expoPushToken: pushToken }),
    })
  } catch (err) {
    console.error('Failed to register push token:', err)
  }

  return pushToken
}

/**
 * Creates the Android notification channels at startup.
 *
 * Android requires a channel for a notification to surface, and the channel's
 * importance — not the per-notification priority — governs heads-up / sound /
 * lock-screen behaviour. Interrupt-tier pushes (danger-window, post-slip) target
 * the dedicated 'interrupts' channel at MAX importance so they break through;
 * the web cron sets `channelId: 'interrupts'` on those payloads. A 'default'
 * channel is kept for everything else.
 *
 * Idempotent — setNotificationChannelAsync replaces a same-id channel — so it's
 * safe to call on every cold start. No-op on iOS / web.
 */
export async function ensureAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android') return
  try {
    await Notifications.setNotificationChannelAsync('interrupts', {
      name: 'Interrupts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#ff6600',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: false,
    })
    await Notifications.setNotificationChannelAsync('default', {
      name: 'COYL',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#ff6600',
    })
  } catch (err) {
    // Channel setup is best-effort — failure just means notifications fall back
    // to the system default channel, still tappable.
    console.warn('[COYL] failed to set Android notification channels:', err)
  }
}

export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void,
) {
  return Notifications.addNotificationResponseReceivedListener(handler)
}

/**
 * Routes a lock-screen action tap to the correct backend endpoint.
 *
 * Called from the global notification response listener in
 * apps/mobile/app/(app)/_layout.tsx. The listener fires on the JS
 * runtime that lives behind the lock screen — there is no React tree
 * to read context from, so we accept getToken as a parameter (captured
 * from useAuth() at listener registration time).
 *
 * Action semantics (matches buttons registered in
 * registerInterruptCategory()):
 *   SLIPPED   → POST /api/v1/slip/quick    (logs a SlipRecord, no body needed)
 *   CAUGHT_ME → POST /api/v1/interrupts/[id]/feedback { feedback: 'caught_me' }
 *   SNOOZE    → POST /api/v1/interrupts/[id]/feedback { feedback: 'snoozed' }
 *
 * Returns true if a network call was attempted, false otherwise
 * (e.g. unknown action identifier or unauthenticated). Fails silent on
 * network errors — the notification action has already been performed
 * from the user's perspective, and the in-app open will reconcile.
 */
export async function handleInterruptNotificationResponse(
  response: Notifications.NotificationResponse,
  getToken: () => Promise<string | null>,
  apiUrl: string,
): Promise<boolean> {
  const actionId = response.actionIdentifier as InterruptActionIdentifier | string
  const data = response.notification.request.content.data ?? {}
  const interruptId = typeof data.interruptId === 'string' ? data.interruptId : null

  // The system "default" action identifier is what fires when the user
  // taps the notification body itself (not an action button). That path
  // is already handled upstream — open the app and route to a screen.
  // We only care about action-button taps here.
  if (
    actionId !== 'CAUGHT_ME' &&
    actionId !== 'SLIPPED' &&
    actionId !== 'SNOOZE'
  ) {
    return false
  }

  let authToken: string | null = null
  try {
    authToken = await getToken()
  } catch {
    authToken = null
  }
  if (!authToken) {
    // User isn't signed in or token fetch failed. Fail silent — the next
    // app open will re-prompt for sign-in and the user can retry there.
    return false
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${authToken}`,
  }

  try {
    if (actionId === 'SLIPPED') {
      await fetch(`${apiUrl}/api/v1/slip/quick`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ context: 'other' }),
      })
      return true
    }
    if (!interruptId) {
      // CAUGHT_ME / SNOOZE require the interruptId to tag the right
      // ProductivityEvent. If the backend didn't include it (older push
      // payload), fall back to a generic event log so we still capture
      // the feedback rather than dropping it.
      await fetch(`${apiUrl}/api/v1/events`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          eventType: 'INTERRUPT_FEEDBACK',
          metadata: {
            source: 'lock_screen',
            feedback: actionId === 'CAUGHT_ME' ? 'caught_me' : 'snoozed',
          },
        }),
      }).catch(() => null)
      return true
    }
    await fetch(`${apiUrl}/api/v1/interrupts/${interruptId}/feedback`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        feedback: actionId === 'CAUGHT_ME' ? 'caught_me' : 'snoozed',
        source: 'lock_screen',
      }),
    })
    return true
  } catch {
    // Network failure on the lock screen is invisible to the user
    // anyway; the action button already vanished from the notification.
    // Swallow the error rather than throwing into the response listener.
    return false
  }
}
