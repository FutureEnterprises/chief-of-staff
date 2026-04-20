import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND, PRIORITY_COLORS, STATUS_COLORS, PRIORITY_LABELS } from '@repo/shared'
import type { CoylTask } from '@repo/shared'
import * as Haptics from 'expo-haptics'

export function TaskCardMobile({ task, onComplete }: { task: CoylTask; onComplete?: (id: string) => void }) {
  return (
    <View style={{
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: 14,
      marginBottom: 8,
      borderLeftWidth: 3,
      borderLeftColor: STATUS_COLORS[task.status] ?? STATUS_COLORS.OPEN,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
        <TouchableOpacity
          style={{ marginTop: 2 }}
          onPress={() => {
            if (onComplete && task.status !== 'COMPLETED') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
              onComplete(task.id)
            }
          }}
        >
          <Ionicons
            name={task.status === 'COMPLETED' ? 'checkmark-circle' : 'ellipse-outline'}
            size={20}
            color={task.status === 'COMPLETED' ? STATUS_COLORS.COMPLETED : '#d4d4d8'}
          />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{
              width: 8, height: 8, borderRadius: 4,
              backgroundColor: PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.MEDIUM,
            }} />
            <Text style={{
              fontSize: 14, fontWeight: '600', color: BRAND.charcoal,
              textDecorationLine: task.status === 'COMPLETED' ? 'line-through' : 'none',
              flex: 1,
            }}>
              {task.title}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
            <View style={{
              backgroundColor: `${PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.MEDIUM}15`,
              borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2,
            }}>
              <Text style={{
                fontSize: 10, fontWeight: '700',
                color: PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.MEDIUM,
              }}>
                {PRIORITY_LABELS[task.priority] ?? 'Medium'}
              </Text>
            </View>

            {task.dueAt && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Ionicons name="time-outline" size={12} color="#94a3b8" />
                <Text style={{ fontSize: 11, color: '#94a3b8' }}>
                  {new Date(task.dueAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
            )}

            {task.project && (
              <Text style={{ fontSize: 11, color: '#c4c4c4' }}>{task.project.name}</Text>
            )}

            {task.tags?.slice(0, 2).map((tag) => (
              <View key={tag.id} style={{ backgroundColor: '#f5f5f5', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
                <Text style={{ fontSize: 10, fontWeight: '500', color: '#94a3b8' }}>{tag.name}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  )
}
