import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  SafeAreaView, RefreshControl, ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND } from '@repo/shared'
import { useAuth } from '@clerk/clerk-expo'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://www.coyl.ai'

type Commitment = {
  id: string
  rule: string
  domain: string
  frequency: string
  active: boolean
  keepCount: number
  breakCount: number
}

export default function CommitmentsScreen() {
  const { getToken } = useAuth()
  const [items, setItems] = useState<Commitment[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [rule, setRule] = useState('')

  const load = useCallback(async () => {
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/v1/commitments`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      setItems(data.commitments ?? [])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [getToken])

  useEffect(() => { load() }, [load])

  async function create() {
    if (!rule.trim()) return
    const token = await getToken()
    await fetch(`${API_URL}/api/v1/commitments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ rule: rule.trim() }),
    })
    setRule('')
    setShowForm(false)
    load()
  }

  async function check(id: string, kept: boolean) {
    const token = await getToken()
    await fetch(`${API_URL}/api/v1/commitments`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ commitmentId: id, kept }),
    })
    load()
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND.cream }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} tintColor={BRAND.orange} />}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <View>
            <Text style={{ fontSize: 28, fontWeight: '800', color: BRAND.charcoal }}>Rules</Text>
            <Text style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>Keep them. Track them.</Text>
          </View>
          <TouchableOpacity onPress={() => setShowForm(!showForm)} style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: BRAND.orange, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {showForm && (
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12 }}>
            <TextInput
              autoFocus
              value={rule}
              onChangeText={setRule}
              placeholder="e.g. No food after 9 PM"
              placeholderTextColor="#94a3b8"
              style={{ fontSize: 15, color: BRAND.charcoal, minHeight: 44 }}
            />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <TouchableOpacity onPress={() => setShowForm(false)} style={{ flex: 1, padding: 12, alignItems: 'center' }}>
                <Text style={{ color: '#94a3b8', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={create} style={{ flex: 1, padding: 12, backgroundColor: BRAND.orange, borderRadius: 12, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Add rule</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {loading ? (
          <ActivityIndicator color={BRAND.orange} />
        ) : items.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Ionicons name="shield-outline" size={48} color="#94a3b8" />
            <Text style={{ fontSize: 16, fontWeight: '700', color: BRAND.charcoal, marginTop: 12 }}>No rules yet</Text>
          </View>
        ) : (
          items.map((c) => (
            <View key={c.id} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: BRAND.charcoal, marginBottom: 6 }}>{c.rule}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 11, color: '#94a3b8' }}>
                  {c.domain.toLowerCase()} · kept {c.keepCount} · broken {c.breakCount}
                </Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity onPress={() => check(c.id, true)} style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="checkmark" size={18} color="#16a34a" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => check(c.id, false)} style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="close" size={18} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
