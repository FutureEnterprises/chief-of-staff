import { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, RefreshControl, SafeAreaView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useApiClient } from '../../lib/api'
import { BRAND } from '@repo/shared'
import type { CoylTask } from '@repo/shared'

export default function ProjectsScreen() {
  const api = useApiClient()
  const [tasks, setTasks] = useState<CoylTask[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await api.getTasks()
      setTasks(res.tasks)
    } catch (err) {
      console.error('Failed to load projects:', err)
    }
  }, [api])

  useEffect(() => { load() }, [load])

  async function onRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  // Group tasks by project name (or "No Project")
  const grouped: Record<string, { tasks: CoylTask[]; completed: number; total: number }> = {}
  for (const t of tasks) {
    const name = t.projectId ?? 'No Project'
    if (!grouped[name]) grouped[name] = { tasks: [], completed: 0, total: 0 }
    grouped[name].tasks.push(t)
    grouped[name].total++
    if (t.status === 'COMPLETED') grouped[name].completed++
  }

  const projectEntries = Object.entries(grouped).sort(([a], [b]) => {
    if (a === 'No Project') return 1
    if (b === 'No Project') return -1
    return a.localeCompare(b)
  })

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND.cream }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.orange} />}
      >
        <Text style={{ fontSize: 28, fontWeight: '800', color: BRAND.charcoal, marginBottom: 4 }}>Projects</Text>
        <Text style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
          {projectEntries.length} project{projectEntries.length !== 1 ? 's' : ''}
        </Text>

        {projectEntries.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Ionicons name="folder-open-outline" size={48} color="#94a3b8" />
            <Text style={{ fontSize: 18, fontWeight: '700', color: BRAND.charcoal, marginTop: 12 }}>No projects yet</Text>
            <Text style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Create tasks with projects on web to see them here.</Text>
          </View>
        )}

        {projectEntries.map(([name, data]) => {
          const pct = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0
          return (
            <View
              key={name}
              style={{
                backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
                shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="folder" size={18} color={BRAND.orange} />
                  <Text style={{ fontSize: 15, fontWeight: '700', color: BRAND.charcoal }}>{name}</Text>
                </View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#94a3b8' }}>
                  {data.completed}/{data.total}
                </Text>
              </View>

              {/* Progress bar */}
              <View style={{ height: 4, backgroundColor: '#f1f1f1', borderRadius: 2, overflow: 'hidden' }}>
                <View style={{ height: '100%', width: `${pct}%`, backgroundColor: BRAND.orange, borderRadius: 2 }} />
              </View>
              <Text style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>{pct}% complete</Text>
            </View>
          )
        })}
      </ScrollView>
    </SafeAreaView>
  )
}
