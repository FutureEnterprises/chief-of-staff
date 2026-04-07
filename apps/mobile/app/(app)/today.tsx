import { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, RefreshControl, SafeAreaView, TouchableOpacity } from 'react-native'
import { useApiClient } from '../../lib/api'
import { BRAND, STATUS_COLORS } from '@repo/shared'
import type { TodayResponse, CoylTask } from '@repo/shared'
import { TaskCardMobile } from '../../components/task-card'
import { Ionicons } from '@expo/vector-icons'

export default function TodayScreen() {
  const api = useApiClient()
  const [data, setData] = useState<TodayResponse | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await api.getToday()
      setData(res)
    } catch (err) {
      console.error('Failed to load today:', err)
    }
  }, [api])

  useEffect(() => { load() }, [load])

  async function onRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  if (!data) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BRAND.cream }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#94a3b8' }}>Loading...</Text>
        </View>
      </SafeAreaView>
    )
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = data.user.name.split(' ')[0]
  const totalAttention = data.dueTodayTasks.length + data.overdueTasks.length + data.followUpsDueToday.length

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND.cream }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.orange} />}
      >
        {/* Header */}
        <Text style={{ fontSize: 28, fontWeight: '800', color: BRAND.charcoal, marginBottom: 4 }}>
          {greeting}, <Text style={{ color: BRAND.orange }}>{firstName}</Text>.
        </Text>
        <Text style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>

        {/* Stats row */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
          <StatCard label="Due" value={data.dueTodayTasks.length} color={STATUS_COLORS.OPEN} />
          <StatCard label="Overdue" value={data.overdueTasks.length} color={data.overdueTasks.length > 0 ? STATUS_COLORS.BLOCKED : STATUS_COLORS.COMPLETED} />
          <StatCard label="Follow" value={data.followUpsDueToday.length} color={STATUS_COLORS.IN_PROGRESS} />
          <StatCard label="Done" value={data.recentlyCompleted.length} color={STATUS_COLORS.COMPLETED} />
        </View>

        {/* Sections */}
        {data.overdueTasks.length > 0 && (
          <TaskSection title="Overdue" color={STATUS_COLORS.BLOCKED} tasks={data.overdueTasks} />
        )}
        {data.dueTodayTasks.length > 0 && (
          <TaskSection title="Due Today" color={STATUS_COLORS.OPEN} tasks={data.dueTodayTasks} />
        )}
        {data.followUpsDueToday.length > 0 && (
          <TaskSection title="Follow-ups" color={STATUS_COLORS.IN_PROGRESS} tasks={data.followUpsDueToday} />
        )}

        {totalAttention === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Ionicons name="checkmark-circle" size={48} color={STATUS_COLORS.COMPLETED} />
            <Text style={{ fontSize: 18, fontWeight: '700', color: BRAND.charcoal, marginTop: 12 }}>
              All caught up
            </Text>
            <Text style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
              Nothing urgent needs your attention.
            </Text>
          </View>
        )}

        {data.recentlyCompleted.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              Completed Today
            </Text>
            {data.recentlyCompleted.map((task) => (
              <View key={task.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 }}>
                <Ionicons name="checkmark-circle" size={16} color={STATUS_COLORS.COMPLETED} />
                <Text style={{ fontSize: 13, color: '#94a3b8', textDecorationLine: 'line-through' }}>{task.title}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={{
      flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 12,
      borderLeftWidth: 3, borderLeftColor: color,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8,
    }}>
      <Text style={{ fontSize: 22, fontWeight: '800', color: BRAND.charcoal }}>{value}</Text>
      <Text style={{ fontSize: 10, fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>{label}</Text>
    </View>
  )
}

function TaskSection({ title, color, tasks }: { title: string; color: string; tasks: CoylTask[] }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
        <Text style={{ fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>{title}</Text>
        <View style={{ backgroundColor: '#f1f1f1', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: '#666' }}>{tasks.length}</Text>
        </View>
      </View>
      {tasks.map((task) => (
        <TaskCardMobile key={task.id} task={task} />
      ))}
    </View>
  )
}
