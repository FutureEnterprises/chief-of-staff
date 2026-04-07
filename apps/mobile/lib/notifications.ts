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
    await Notifications.setNotificationChannelAsync('default', {
      name: 'COYL',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#ff6600',
    })
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId
  const pushToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data

  // Register with backend
  try {
    const authToken = await getToken()
    await fetch(`${apiUrl}/api/v1/user/push-token`, {
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

export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void,
) {
  return Notifications.addNotificationResponseReceivedListener(handler)
}
