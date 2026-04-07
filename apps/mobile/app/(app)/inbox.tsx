import { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, RefreshControl, SafeAreaView, TouchableOpacity } from 'react-native'
import { useApiClient } from '../../lib/api'
import { BRAND } from '@repo/shared'
import type { CoylTask } from '@repo/shared'
import { TaskCardMobile } from '../../components/task-card'
import { Ionicons } from '@expo/vector-icons'

export default function InboxScreen() {
  const api = useApiClient()
  const [tasks, setTasks] = useState<CoylTask[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await api.getTasks()
      setTasks(res.tasks.filter((t) => t.status === 'INBOX'))
    } catch (err) {
      console.error('Failed to load inbox:', err)
    }
  }, [api])

  useEffect(() => { load() }, [load])

  async function onRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND.cream }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.orange} />}
      >
        <Text style={{ fontSize: 28, fontWeight: '800', color: BRAND.charcoal, marginBottom: 4 }}>Inbox</Text>
        <Text style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
          {tasks.length > 0 ? `${tasks.length} item${tasks.length !== 1 ? 's' : ''} need your decision` : 'Inbox zero!'}
        </Text>

        {tasks.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 48 }}>&#x2728;</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: BRAND.charcoal, marginTop: 12 }}>Inbox Zero!</Text>
            <Text style={{ fontSize: 13, color: '#94a3b8', marginTop: 4, textAlign: 'center' }}>
              Everything is processed. You're in control.
            </Text>
          </View>
        ) : (
          tasks.map((task) => <TaskCardMobile key={task.id} task={task} />)
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
