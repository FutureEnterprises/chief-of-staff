import { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, RefreshControl, SafeAreaView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useApiClient } from '../../lib/api'
import { BRAND, STATUS_COLORS } from '@repo/shared'
import type { CoylTask } from '@repo/shared'
import { TaskCardMobile } from '../../components/task-card'

export default function FollowUpsScreen() {
  const api = useApiClient()
  const [tasks, setTasks] = useState<CoylTask[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await api.getTasks()
      setTasks(res.tasks.filter((t: CoylTask) => t.followUpRequired && t.status !== 'COMPLETED' && t.status !== 'ARCHIVED'))
    } catch (err) {
      console.error('Failed to load follow-ups:', err)
    }
  }, [api])

  useEffect(() => { load() }, [load])

  async function onRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const now = new Date()
  const overdue = tasks.filter((t) => t.nextFollowUpAt && new Date(t.nextFollowUpAt) < now)
  const dueToday = tasks.filter((t) => {
    if (!t.nextFollowUpAt) return false
    const d = new Date(t.nextFollowUpAt)
    return d >= now && d.toDateString() === now.toDateString()
  })
  const upcoming = tasks.filter((t) => {
    if (!t.nextFollowUpAt) return false
    const d = new Date(t.nextFollowUpAt)
    return d > now && d.toDateString() !== now.toDateString()
  })
  const noDate = tasks.filter((t) => !t.nextFollowUpAt)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND.cream }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.orange} />}
      >
        <Text style={{ fontSize: 28, fontWeight: '800', color: BRAND.charcoal, marginBottom: 4 }}>Follow-ups</Text>
        <Text style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
          {tasks.length > 0 ? `${tasks.length} open follow-up${tasks.length !== 1 ? 's' : ''}` : 'All follow-ups handled'}
        </Text>

        {tasks.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Ionicons name="checkmark-circle" size={48} color={STATUS_COLORS.COMPLETED} />
            <Text style={{ fontSize: 18, fontWeight: '700', color: BRAND.charcoal, marginTop: 12 }}>All caught up</Text>
            <Text style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>No pending follow-ups.</Text>
          </View>
        )}

        {overdue.length > 0 && <Section title="Overdue" color={STATUS_COLORS.BLOCKED} tasks={overdue} />}
        {dueToday.length > 0 && <Section title="Due Today" color={BRAND.orange} tasks={dueToday} />}
        {upcoming.length > 0 && <Section title="Upcoming" color={STATUS_COLORS.IN_PROGRESS} tasks={upcoming} />}
        {noDate.length > 0 && <Section title="No Date" color="#94a3b8" tasks={noDate} />}
      </ScrollView>
    </SafeAreaView>
  )
}

function Section({ title, color, tasks }: { title: string; color: string; tasks: CoylTask[] }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
        <Text style={{ fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>{title}</Text>
        <View style={{ backgroundColor: '#f1f1f1', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: '#666' }}>{tasks.length}</Text>
        </View>
      </View>
      {tasks.map((task) => <TaskCardMobile key={task.id} task={task} />)}
    </View>
  )
}
