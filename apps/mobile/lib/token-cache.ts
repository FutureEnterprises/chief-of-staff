import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Use AsyncStorage for Expo Go compatibility
// expo-secure-store requires native crypto modules not in all Expo Go builds
// For production, switch to expo-secure-store after running `npx expo prebuild`
export const tokenCache = {
  async getToken(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key)
    } catch {
      return null
    }
  },
  async saveToken(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value)
    } catch {}
  },
}
