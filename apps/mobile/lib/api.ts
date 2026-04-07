import { CoylApiClient } from '@repo/shared'
import { useAuth } from '@clerk/clerk-expo'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://www.coyl.ai'

let _client: CoylApiClient | null = null

export function useApiClient() {
  const { getToken } = useAuth()

  if (!_client) {
    _client = new CoylApiClient(API_URL, getToken)
  }

  return _client
}
