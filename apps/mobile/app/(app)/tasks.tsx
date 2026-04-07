import { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, RefreshControl, SafeAreaView, TouchableOpacity } from 'react-native'
import { useApiClient } from '../../lib/api'
import { BRAND, STATUS_LABELS, STATUS_COLORS } from '@repo/shared'
import type { CoylTask } from '@repo/shared'
import { TaskCardMobile } from '../../components/task-card'

const FILTERS = ['Active', 'Completed', 'All'] as const
const STATUS_ORDER = ['IN_PROGRESS', 'PLANNED', 'OPEN', 'INBOX', 'BLOCKED', 'WAITING', 'SNOOZED', 'COMPLETED']

export default function TasksScreen() {
  const api = useApiClient()
  const [tasks, setTasks] = useState<CoylTask[]>([])
  const [filter, setFilter] = useState<typeof FILTERS[number]>('Active')
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await api.getTasks()
      setTasks(res.tasks)
    } catch (err) {
      console.error('Failed to load tasks:', err)
    }
  }, [api])

  useEffect(() => { load() }, [load])

  async function onRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const filtered = filter === 'Active'
    ? tasks.filter((t) => !['COMPLETED', 'ARCHIVED'].includes(t.status))
    : filter === 'Completed'
      ? tasks.filter((t) => t.status === 'COMPLETED')
      : tasks

  const grouped = STATUS_ORDER.reduce<Record<string, CoylTask[]>>((acc, status) => {
    const group = filtered.filter((t) => t.status === status)
    if (group.length > 0) acc[status] = group
    return acc
  }, {})

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND.cream }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.orange} />}
      >
        <Text style={{ fontSize: 28, fontWeight: '800', color: BRAND.charcoal, marginBottom: 4 }}>All Tasks</Text>
        <Text style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>{tasks.length} total</Text>

        {/* Filter tabs */}
        <View style={{ flexDirection: 'row', gap: 4, marginBottom: 20 }}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={{
                paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12,
                backgroundColor: filter === f ? BRAND.orange : 'transparent',
              }}
            >
              <Text style={{
                fontSize: 13, fontWeight: '600',
                color: filter === f ? '#fff' : '#94a3b8',
              }}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {Object.entries(grouped).map(([status, statusTasks]) => (
          <View key={status} style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: STATUS_COLORS[status] ?? '#94a3b8' }} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>
                {STATUS_LABELS[status] ?? status}
              </Text>
              <View style={{ backgroundColor: '#f1f1f1', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#666' }}>{statusTasks.length}</Text>
              </View>
            </View>
            {statusTasks.map((task) => <TaskCardMobile key={task.id} task={task} />)}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}
