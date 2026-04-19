import { useState } from 'react'
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native'
import { useAuth, useUser } from '@clerk/clerk-expo'
import { Ionicons } from '@expo/vector-icons'
import { BRAND } from '@repo/shared'
import { syncYesterdayHealth } from '../../lib/health'

export default function SettingsScreen() {
  const { signOut, getToken } = useAuth()
  const { user } = useUser()
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ])
  }

  async function handleHealthSync() {
    setSyncing(true)
    try {
      const result = await syncYesterdayHealth(getToken)
      if (result.synced) {
        setLastSync(new Date().toLocaleString())
        Alert.alert('Synced', `Yesterday's health data sent to COYL.${result.metrics?.steps != null ? ` Steps: ${result.metrics.steps.toLocaleString()}` : ''}`)
      } else {
        Alert.alert('No data', "Couldn't read health metrics. Make sure permissions are granted and you have data from yesterday.")
      }
    } catch (err) {
      Alert.alert('Error', (err as Error).message)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND.cream }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: BRAND.charcoal, marginBottom: 20 }}>Settings</Text>

        {/* Account */}
        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: `${BRAND.orange}15`, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="person" size={18} color={BRAND.orange} />
            </View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: BRAND.charcoal }}>Account</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: BRAND.charcoal }}>
                {user?.firstName?.charAt(0) ?? user?.emailAddresses?.[0]?.emailAddress?.charAt(0)?.toUpperCase() ?? '?'}
              </Text>
            </View>
            <View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: BRAND.charcoal }}>
                {user?.fullName ?? 'User'}
              </Text>
              <Text style={{ fontSize: 12, color: '#94a3b8' }}>
                {user?.emailAddresses?.[0]?.emailAddress ?? ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Health integrations */}
        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: `${BRAND.orange}15`, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="fitness" size={18} color={BRAND.orange} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: BRAND.charcoal }}>
                {Platform.OS === 'ios' ? 'Apple Health' : 'Health Connect'}
              </Text>
              <Text style={{ fontSize: 11, color: '#94a3b8' }}>
                Send yesterday's steps, weight, sleep, HR
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={handleHealthSync}
            disabled={syncing}
            style={{ backgroundColor: BRAND.orange, borderRadius: 12, padding: 12, alignItems: 'center', opacity: syncing ? 0.6 : 1 }}
          >
            {syncing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Sync yesterday</Text>
            )}
          </TouchableOpacity>
          {lastSync && (
            <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 8, textAlign: 'center' }}>
              Last sync: {lastSync}
            </Text>
          )}
          <Text style={{ fontSize: 10, color: '#94a3b8', marginTop: 8 }}>
            Only aggregated daily metrics leave your device. Never raw samples.
          </Text>
        </View>

        {/* App info */}
        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: `${BRAND.orange}15`, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="information-circle" size={18} color={BRAND.orange} />
            </View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: BRAND.charcoal }}>About</Text>
          </View>
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, color: '#94a3b8' }}>Version</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: BRAND.charcoal }}>1.0.0</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, color: '#94a3b8' }}>Website</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: BRAND.orange }}>coyl.ai</Text>
            </View>
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity
          onPress={handleSignOut}
          style={{
            backgroundColor: '#fff', borderRadius: 16, padding: 16,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8,
          }}
        >
          <Ionicons name="log-out-outline" size={18} color="#ef4444" />
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#ef4444' }}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}
