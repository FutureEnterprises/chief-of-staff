import { useState, useEffect, useRef } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND } from '@repo/shared'
import { useAuth } from '@clerk/clerk-expo'
import * as Haptics from 'expo-haptics'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://www.coyl.ai'

const TRIGGERS = [
  { key: 'BINGE_URGE', label: 'I want to binge', emoji: '🍔' },
  { key: 'DELIVERY_URGE', label: "I'm ordering food", emoji: '📦' },
  { key: 'NICOTINE_URGE', label: 'I want nicotine', emoji: '💨' },
  { key: 'ALCOHOL_URGE', label: 'I want to drink', emoji: '🍷' },
  { key: 'SKIP_WORKOUT', label: 'Skip today', emoji: '😴' },
  { key: 'SKIP_WEIGHIN', label: 'Skip weigh-in', emoji: '⚖️' },
  { key: 'DOOMSCROLL', label: "I'm scrolling", emoji: '📱' },
  { key: 'IMPULSE_SPEND', label: 'Impulse buy', emoji: '💳' },
  { key: 'ALREADY_SLIPPED', label: 'I slipped', emoji: '💥' },
  { key: 'SPIRALING', label: "I'm spiraling", emoji: '🌀' },
]

export default function RescueScreen() {
  const { getToken } = useAuth()
  const [selected, setSelected] = useState<(typeof TRIGGERS)[number] | null>(null)
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [timer, setTimer] = useState(0)
  const [timerActive, setTimerActive] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function trigger(t: (typeof TRIGGERS)[number]) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setSelected(t)
    setResponse('')
    setLoading(true)
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/v1/rescue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ trigger: t.key }),
      })
      const text = await res.text()
      setResponse(text)
    } finally {
      setLoading(false)
    }
  }

  function startTimer() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    setTimerActive(true)
    setTimer(600)
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          setTimerActive(false)
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          return 0
        }
        return t - 1
      })
    }, 1000)
  }

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, [])

  function reset() {
    setSelected(null); setResponse(''); setTimerActive(false); setTimer(0)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  if (!selected) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BRAND.cream }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e0d8' }}>
          <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="flame" size={18} color="#fff" />
          </View>
          <View>
            <Text style={{ fontSize: 14, fontWeight: '700', color: BRAND.charcoal }}>Rescue</Text>
            <Text style={{ fontSize: 11, color: '#94a3b8' }}>Tap what&apos;s happening</Text>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          {TRIGGERS.map((t) => (
            <TouchableOpacity
              key={t.key}
              onPress={() => trigger(t)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 10 }}
            >
              <Text style={{ fontSize: 24 }}>{t.emoji}</Text>
              <Text style={{ fontSize: 15, fontWeight: '600', color: BRAND.charcoal }}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND.cream }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e0d8' }}>
        <TouchableOpacity onPress={reset} style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#f1f1f1', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="arrow-back" size={18} color={BRAND.charcoal} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20 }}>{selected.emoji}</Text>
        <Text style={{ fontSize: 14, fontWeight: '700', color: BRAND.charcoal, flex: 1 }}>{selected.label}</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        {loading && <ActivityIndicator size="large" color={BRAND.orange} />}
        {response ? (
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 18 }}>
            <Text style={{ fontSize: 14, lineHeight: 22, color: BRAND.charcoal }}>{response}</Text>
          </View>
        ) : null}

        {!loading && response && (
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            <TouchableOpacity
              onPress={startTimer}
              disabled={timerActive}
              style={{ flex: 1, backgroundColor: BRAND.orange, borderRadius: 12, padding: 14, alignItems: 'center', opacity: timerActive ? 0.7 : 1 }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
                {timerActive ? formatTime(timer) : 'Start 10-min delay'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={reset} style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center' }}>
              <Text style={{ color: BRAND.charcoal, fontWeight: '600', fontSize: 14 }}>I got it</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function formatTime(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
