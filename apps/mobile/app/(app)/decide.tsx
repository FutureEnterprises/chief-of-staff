import { useState, useRef, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND } from '@repo/shared'
import { useAuth } from '@clerk/clerk-expo'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://www.coyl.ai'

const EXAMPLES = [
  'Should I eat this?',
  'Should I skip the workout?',
  'Should I order takeout?',
  'Should I drink tonight?',
  'Should I buy this?',
]

type Message = { id: string; role: 'user' | 'assistant'; content: string }

export default function DecideScreen() {
  const { getToken } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<ScrollView>(null)

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true })
  }, [messages])

  async function send(text: string) {
    const t = text.trim()
    if (!t || loading) return
    setInput('')
    const user: Message = { id: `u${Date.now()}`, role: 'user', content: t }
    setMessages((p) => [...p, user])
    setLoading(true)
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/v1/decide`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages: [...messages, user].map((m) => ({ role: m.role, content: m.content })),
          context: t,
        }),
      })
      const reply = await res.text()
      setMessages((p) => [...p, { id: `a${Date.now()}`, role: 'assistant', content: reply }])
    } catch {
      setMessages((p) => [...p, { id: `e${Date.now()}`, role: 'assistant', content: 'Something went wrong.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND.cream }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e0d8' }}>
          <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: BRAND.orange, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="bulb" size={18} color="#fff" />
          </View>
          <View>
            <Text style={{ fontSize: 14, fontWeight: '700', color: BRAND.charcoal }}>Decide</Text>
            <Text style={{ fontSize: 11, color: '#94a3b8' }}>What are you deciding right now?</Text>
          </View>
        </View>

        <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 12 }}>
          {messages.length === 0 && (
            <View>
              <Text style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>Try one:</Text>
              {EXAMPLES.map((e) => (
                <TouchableOpacity
                  key={e}
                  onPress={() => send(e)}
                  style={{ backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 8 }}
                >
                  <Text style={{ fontSize: 14, color: BRAND.charcoal }}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {messages.map((m) => (
            <View
              key={m.id}
              style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '88%',
                backgroundColor: m.role === 'user' ? BRAND.orange : '#fff',
                borderRadius: 16,
                padding: 12,
              }}
            >
              <Text style={{ fontSize: 14, lineHeight: 20, color: m.role === 'user' ? '#fff' : BRAND.charcoal }}>
                {m.content}
              </Text>
            </View>
          ))}
          {loading && (
            <View style={{ alignSelf: 'flex-start', padding: 12, backgroundColor: '#fff', borderRadius: 16 }}>
              <ActivityIndicator size="small" color={BRAND.orange} />
            </View>
          )}
        </ScrollView>

        <View style={{ borderTopWidth: 1, borderTopColor: '#e5e0d8', paddingHorizontal: 16, paddingVertical: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 }}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="What are you deciding?"
              placeholderTextColor="#94a3b8"
              multiline
              style={{ flex: 1, fontSize: 14, maxHeight: 100, color: BRAND.charcoal }}
              editable={!loading}
              onSubmitEditing={() => send(input)}
            />
            <TouchableOpacity
              onPress={() => send(input)}
              disabled={!input.trim() || loading}
              style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: input.trim() ? BRAND.orange : '#e5e5e5', alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="send" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
