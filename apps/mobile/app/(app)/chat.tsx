import { useState, useRef, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND } from '@repo/shared'
import { useAuth } from '@clerk/clerk-expo'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://www.coyl.ai'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export default function ChatScreen() {
  const { getToken } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<ScrollView>(null)

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true })
  }, [messages])

  async function handleSend() {
    if (!input.trim() || loading) return
    const text = input.trim()
    setInput('')

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          mode: 'chat',
        }),
      })

      const data = await res.text()
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data,
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err) {
      console.error('Chat error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND.cream }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e0d8' }}>
          <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: BRAND.orange, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="flash" size={18} color="#fff" />
          </View>
          <View>
            <Text style={{ fontSize: 14, fontWeight: '700', color: BRAND.charcoal }}>AI Assistant</Text>
            <Text style={{ fontSize: 11, color: '#94a3b8' }}>COYL AI</Text>
          </View>
        </View>

        {/* Messages */}
        <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 12 }}>
          {messages.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: BRAND.orange, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Ionicons name="flash" size={28} color="#fff" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: BRAND.charcoal }}>Your COYL is ready</Text>
              <Text style={{ fontSize: 13, color: '#94a3b8', marginTop: 4, textAlign: 'center', maxWidth: 280 }}>
                Capture a task, plan your day, or tell me what's on your mind.
              </Text>
            </View>
          )}
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                backgroundColor: msg.role === 'user' ? BRAND.orange : '#fff',
                borderRadius: 16,
                padding: 12,
                shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4,
              }}
            >
              <Text style={{ fontSize: 14, lineHeight: 20, color: msg.role === 'user' ? '#fff' : BRAND.charcoal }}>
                {msg.content}
              </Text>
            </View>
          ))}
          {loading && (
            <View style={{ alignSelf: 'flex-start', flexDirection: 'row', gap: 4, padding: 12, backgroundColor: '#fff', borderRadius: 16 }}>
              <ActivityIndicator size="small" color={BRAND.orange} />
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={{ borderTopWidth: 1, borderTopColor: '#e5e0d8', paddingHorizontal: 16, paddingVertical: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 }}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Capture a task or ask anything..."
              placeholderTextColor="#94a3b8"
              multiline
              style={{ flex: 1, fontSize: 14, maxHeight: 100, color: BRAND.charcoal }}
              editable={!loading}
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={!input.trim() || loading}
              style={{
                width: 36, height: 36, borderRadius: 12,
                backgroundColor: input.trim() ? BRAND.orange : '#e5e5e5',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Ionicons name="send" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
