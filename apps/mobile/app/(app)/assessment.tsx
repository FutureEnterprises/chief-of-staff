import { useState, useRef } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  SafeAreaView, ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND } from '@repo/shared'
import { useAuth } from '@clerk/clerk-expo'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://www.coyl.ai'

type AssessmentMode = 'considerate' | 'nobs' | null

export default function AssessmentScreen() {
  const { getToken } = useAuth()
  const [mode, setMode] = useState<AssessmentMode>(null)
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const scrollRef = useRef<ScrollView>(null)

  async function runAssessment(selectedMode: 'considerate' | 'nobs') {
    setMode(selectedMode)
    setResult('')
    setError('')
    setLoading(true)

    try {
      const token = await getToken()
      const chatMode = selectedMode === 'considerate' ? 'assessment-considerate' : 'assessment-nobs'
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Run my 30-day performance assessment.' }],
          mode: chatMode,
        }),
      })

      if (res.status === 402) {
        setError('Assessment is a Pro feature. Upgrade to get your performance review.')
        return
      }

      const data = await res.text()
      setResult(data)
    } catch (err) {
      console.error('Assessment error:', err)
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setMode(null)
    setResult('')
    setError('')
  }

  if (!mode) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BRAND.cream }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: BRAND.orange, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Ionicons name="analytics" size={28} color="#fff" />
          </View>
          <Text style={{ fontSize: 22, fontWeight: '800', color: BRAND.charcoal, marginBottom: 6 }}>
            30-Day Assessment
          </Text>
          <Text style={{ fontSize: 14, color: '#94a3b8', textAlign: 'center', maxWidth: 300, marginBottom: 32 }}>
            AI analyzes your patterns and gives you a performance review. Pick your style.
          </Text>

          {/* Considerate */}
          <TouchableOpacity
            onPress={() => runAssessment('considerate')}
            style={{
              width: '100%', maxWidth: 340, backgroundColor: '#fff', borderRadius: 16,
              padding: 20, marginBottom: 12,
              shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${BRAND.orange}15`, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="heart" size={20} color={BRAND.orange} />
              </View>
              <Text style={{ fontSize: 17, fontWeight: '700', color: BRAND.charcoal }}>Considerate</Text>
            </View>
            <Text style={{ fontSize: 13, color: '#94a3b8', lineHeight: 18 }}>
              Supportive coach. Celebrates wins, gently surfaces growth areas.
            </Text>
          </TouchableOpacity>

          {/* No BS */}
          <TouchableOpacity
            onPress={() => runAssessment('nobs')}
            style={{
              width: '100%', maxWidth: 340, backgroundColor: '#fff', borderRadius: 16,
              padding: 20,
              shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#ef44441a', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="flame" size={20} color="#ef4444" />
              </View>
              <Text style={{ fontSize: 17, fontWeight: '700', color: BRAND.charcoal }}>No BS Mode</Text>
            </View>
            <Text style={{ fontSize: 13, color: '#94a3b8', lineHeight: 18 }}>
              Brutally honest. Calls out avoidance and dropped balls. No fluff.
            </Text>
          </TouchableOpacity>

          <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 20 }}>
            Pro feature &middot; Analyzes 30 days of task data
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND.cream }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e0d8' }}>
        <TouchableOpacity onPress={handleReset} style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#f1f1f1', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="arrow-back" size={18} color={BRAND.charcoal} />
        </TouchableOpacity>
        <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: mode === 'considerate' ? BRAND.orange : '#ef4444', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={mode === 'considerate' ? 'heart' : 'flame'} size={18} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: BRAND.charcoal }}>
            {mode === 'considerate' ? 'Considerate' : 'No BS'} Assessment
          </Text>
          <Text style={{ fontSize: 11, color: '#94a3b8' }}>30-day analysis</Text>
        </View>
        {!loading && result && (
          <TouchableOpacity onPress={handleReset} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#e5e0d8' }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#94a3b8' }}>New</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 20 }}>
        {loading && (
          <View style={{ alignItems: 'center', paddingVertical: 40, gap: 12 }}>
            <ActivityIndicator size="large" color={mode === 'considerate' ? BRAND.orange : '#ef4444'} />
            <Text style={{ fontSize: 14, color: '#94a3b8' }}>
              {mode === 'considerate' ? 'Analyzing your patterns thoughtfully...' : 'Preparing your reality check...'}
            </Text>
          </View>
        )}

        {error ? (
          <View style={{ alignItems: 'center', paddingVertical: 40, gap: 12 }}>
            <Ionicons name="lock-closed" size={32} color={BRAND.orange} />
            <Text style={{ fontSize: 15, fontWeight: '600', color: BRAND.charcoal, textAlign: 'center' }}>{error}</Text>
            <TouchableOpacity onPress={handleReset} style={{ marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: BRAND.orange }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Go back</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {result ? (
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 }}>
            <Text style={{ fontSize: 15, lineHeight: 24, color: BRAND.charcoal }}>{result}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  )
}
