import { useSignIn } from '@clerk/clerk-expo'
import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native'
import { Link } from 'expo-router'
import { BRAND } from '@repo/shared'

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSignIn() {
    if (!isLoaded) return
    setLoading(true)
    setError('')
    try {
      const result = await signIn.create({ identifier: email, password })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message ?? 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND.cream }}>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
        <Text style={{ fontSize: 32, fontWeight: '800', color: BRAND.charcoal, marginBottom: 4 }}>
          Welcome back
        </Text>
        <Text style={{ fontSize: 14, color: '#666', marginBottom: 32 }}>
          Sign in to your COYL account
        </Text>

        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={{
            height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#e5e5e5',
            paddingHorizontal: 16, marginBottom: 12, backgroundColor: '#fff', fontSize: 15,
          }}
        />
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{
            height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#e5e5e5',
            paddingHorizontal: 16, marginBottom: 16, backgroundColor: '#fff', fontSize: 15,
          }}
        />

        {error ? <Text style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</Text> : null}

        <TouchableOpacity
          onPress={handleSignIn}
          disabled={loading}
          style={{
            height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
            backgroundColor: BRAND.orange,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Sign In</Text>
          )}
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24, gap: 4 }}>
          <Text style={{ color: '#666', fontSize: 14 }}>Don't have an account?</Text>
          <Link href="/(auth)/sign-up" style={{ color: BRAND.orange, fontWeight: '600', fontSize: 14 }}>
            Sign Up
          </Link>
        </View>
      </View>
    </SafeAreaView>
  )
}
