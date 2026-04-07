import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, Modal,
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND, PRIORITY_COLORS } from '@repo/shared'
import type { TaskPriority } from '@repo/shared'
import * as Haptics from 'expo-haptics'

interface TaskCreateSheetProps {
  visible: boolean
  onClose: () => void
  onSubmit: (title: string, priority: TaskPriority) => Promise<void>
}

const PRIORITIES: { key: TaskPriority; label: string }[] = [
  { key: 'CRITICAL', label: 'Critical' },
  { key: 'HIGH', label: 'High' },
  { key: 'MEDIUM', label: 'Medium' },
  { key: 'LOW', label: 'Low' },
]

export function TaskCreateSheet({ visible, onClose, onSubmit }: TaskCreateSheetProps) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!title.trim() || loading) return
    setLoading(true)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    try {
      await onSubmit(title.trim(), priority)
      setTitle('')
      setPriority('MEDIUM')
      onClose()
    } catch (err) {
      console.error('Failed to create task:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: 'flex-end' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <SafeAreaView style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 20 }}>
          <View style={{ padding: 20 }}>
            {/* Handle */}
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#e5e5e5', alignSelf: 'center', marginBottom: 16 }} />

            <Text style={{ fontSize: 18, fontWeight: '700', color: BRAND.charcoal, marginBottom: 16 }}>
              Quick capture
            </Text>

            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="What needs to get done?"
              placeholderTextColor="#94a3b8"
              multiline
              autoFocus
              style={{
                fontSize: 15, color: BRAND.charcoal, minHeight: 60,
                backgroundColor: '#f8f8f8', borderRadius: 12, padding: 12,
                marginBottom: 12,
              }}
            />

            {/* Priority selector */}
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Priority
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
              {PRIORITIES.map((p) => (
                <TouchableOpacity
                  key={p.key}
                  onPress={() => {
                    setPriority(p.key)
                    Haptics.selectionAsync()
                  }}
                  style={{
                    flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center',
                    backgroundColor: priority === p.key ? PRIORITY_COLORS[p.key] : '#f5f5f5',
                  }}
                >
                  <Text style={{
                    fontSize: 12, fontWeight: '600',
                    color: priority === p.key ? '#fff' : '#666',
                  }}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Submit */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!title.trim() || loading}
              style={{
                height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
                backgroundColor: title.trim() ? BRAND.orange : '#e5e5e5',
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Add Task</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  )
}
