import { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, RefreshControl, SafeAreaView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useApiClient } from '../../lib/api'
import { BRAND, PRIORITY_LABELS } from '@repo/shared'
import type { CoylTask } from '@repo/shared'

export default function InsightsScreen() {
  const api = useApiClient()
  const [tasks, setTasks] = useState<CoylTask[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await api.getTasks()
      setTasks(res.tasks)
    } catch (err) {
      console.error('Failed to load insights:', err)
    }
  }, [api])

  useEffect(() => { load() }, [load])

  async function onRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const completed = tasks.filter((t) => t.status === 'COMPLETED')
  const completedLast30 = completed.filter((t) => t.completedAt && new Date(t.completedAt) >= thirtyDaysAgo)
  const completedLast7 = completed.filter((t) => t.completedAt && new Date(t.completedAt) >= sevenDaysAgo)
  const open = tasks.filter((t) => !['COMPLETED', 'ARCHIVED'].includes(t.status))
  const overdue = open.filter((t) => t.dueAt && new Date(t.dueAt) < now)

  const completionRate = completedLast30.length + open.length > 0
    ? Math.round((completedLast30.length / (completedLast30.length + open.length)) * 100)
    : 0

  // Priority distribution
  const priorities: Record<string, number> = {}
  for (const t of tasks) {
    priorities[t.priority] = (priorities[t.priority] ?? 0) + 1
  }
  const maxCount = Math.max(...Object.values(priorities), 1)

  // Coaching notes
  const notes: string[] = []
  if (overdue.length > 5) notes.push('You have more than 5 overdue tasks. Time for a triage session.')
  if (completedLast7.length >= 10) notes.push('Great execution this week — keep the momentum.')
  if (completedLast7.length === 0 && open.length > 0) notes.push('Zero completions this week. Pick one small task and finish it today.')
  if (overdue.length === 0 && completionRate >= 70) notes.push('Clean slate. The system is working.')

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND.cream }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.orange} />}
      >
        <Text style={{ fontSize: 28, fontWeight: '800', color: BRAND.charcoal, marginBottom: 4 }}>Insights</Text>
        <Text style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>Last 30 days</Text>

        {/* Metrics */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
          <MetricCard icon="checkmark-circle" label="Done (7d)" value={completedLast7.length} color="#22c55e" />
          <MetricCard icon="trending-up" label="Done (30d)" value={completedLast30.length} color={BRAND.orange} />
          <MetricCard icon="time-outline" label="Open" value={open.length} color="#3b82f6" />
          <MetricCard icon="alert-circle" label="Overdue" value={overdue.length} color={overdue.length > 0 ? '#ef4444' : '#22c55e'} />
        </View>

        {/* Completion rate */}
        <View style={{
          backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16,
          shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8,
        }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#94a3b8', marginBottom: 8 }}>COMPLETION RATE</Text>
          <Text style={{ fontSize: 36, fontWeight: '800', color: BRAND.charcoal }}>{completionRate}%</Text>
          <View style={{ height: 6, backgroundColor: '#f1f1f1', borderRadius: 3, marginTop: 8, overflow: 'hidden' }}>
            <View style={{ height: '100%', width: `${completionRate}%`, backgroundColor: BRAND.orange, borderRadius: 3 }} />
          </View>
        </View>

        {/* Priority breakdown */}
        <View style={{
          backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16,
          shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8,
        }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#94a3b8', marginBottom: 12 }}>BY PRIORITY</Text>
          {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'SOMEDAY'].map((p) => {
            const count = priorities[p] ?? 0
            const pct = maxCount > 0 ? (count / maxCount) * 100 : 0
            return (
              <View key={p} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#94a3b8', width: 60 }}>
                  {PRIORITY_LABELS[p] ?? p}
                </Text>
                <View style={{ flex: 1, height: 6, backgroundColor: '#f1f1f1', borderRadius: 3, overflow: 'hidden' }}>
                  <View style={{ height: '100%', width: `${pct}%`, backgroundColor: BRAND.orange, borderRadius: 3 }} />
                </View>
                <Text style={{ fontSize: 11, fontWeight: '700', color: BRAND.charcoal, width: 24, textAlign: 'right' }}>{count}</Text>
              </View>
            )
          })}
        </View>

        {/* Coaching notes */}
        {notes.length > 0 && (
          <View style={{
            backgroundColor: '#fff', borderRadius: 16, padding: 16, borderLeftWidth: 3, borderLeftColor: BRAND.orange,
            shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8,
          }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#94a3b8', marginBottom: 8 }}>COACHING</Text>
            {notes.map((note, i) => (
              <Text key={i} style={{ fontSize: 14, color: BRAND.charcoal, lineHeight: 20, marginBottom: i < notes.length - 1 ? 8 : 0 }}>
                {note}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function MetricCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <View style={{
      flex: 1, minWidth: '45%', backgroundColor: '#fff', borderRadius: 16, padding: 14,
      borderLeftWidth: 3, borderLeftColor: color,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8,
    }}>
      <Ionicons name={icon as any} size={18} color={color} />
      <Text style={{ fontSize: 24, fontWeight: '800', color: BRAND.charcoal, marginTop: 4 }}>{value}</Text>
      <Text style={{ fontSize: 10, fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
    </View>
  )
}
