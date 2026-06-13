import { useSignUp } from '@clerk/clerk-expo'
import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native'
import { Link, useRouter } from 'expo-router'
import { BRAND } from '@repo/shared'

const inputStyle = {
  height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#e5e5e5',
  paddingHorizontal: 16, marginBottom: 12, backgroundColor: '#fff', fontSize: 15,
} as const

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // Clerk's default email/password flow requires email-code verification, so
  // sign-up is a two-step flow: create the account, then confirm the 6-digit
  // code Clerk emails. Without this step `create()` returns missing_requirements
  // and the screen would silently do nothing.
  const [pendingVerification, setPendingVerification] = useState(false)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSignUp() {
    if (!isLoaded) return
    setLoading(true)
    setError('')
    try {
      const result = await signUp.create({ emailAddress: email, password })
      // Some Clerk instances have verification disabled → account is complete now.
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.replace('/(app)/today')
        return
      }
      // Otherwise send the verification code and switch to the confirm step.
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setPendingVerification(true)
    } catch (err: any) {
      setError(err?.errors?.[0]?.message ?? 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify() {
    if (!isLoaded) return
    setLoading(true)
    setError('')
    try {
      const result = await signUp.attemptEmailAddressVerification({ code: code.trim() })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.replace('/(app)/today')
      } else {
        setError('That code didn’t complete sign-up. Try again.')
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message ?? 'Invalid code')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (!isLoaded) return
    setError('')
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
    } catch (err: any) {
      setError(err?.errors?.[0]?.message ?? 'Could not resend code')
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND.cream }}>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
        {pendingVerification ? (
          <>
            <Text style={{ fontSize: 32, fontWeight: '800', color: BRAND.charcoal, marginBottom: 4 }}>
              Check your email
            </Text>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 32 }}>
              Enter the 6-digit code we sent to {email}
            </Text>

            <TextInput
              placeholder="123456"
              value={code}
              onChangeText={setCode}
              autoCapitalize="none"
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              maxLength={6}
              style={{ ...inputStyle, letterSpacing: 8, textAlign: 'center', fontSize: 22, marginBottom: 16 }}
            />

            {error ? <Text style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</Text> : null}

            <TouchableOpacity
              onPress={handleVerify}
              disabled={loading}
              style={{
                height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                backgroundColor: BRAND.orange,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Verify & continue</Text>
              )}
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24, gap: 4 }}>
              <Text style={{ color: '#666', fontSize: 14 }}>Didn’t get it?</Text>
              <Text onPress={handleResend} style={{ color: BRAND.orange, fontWeight: '600', fontSize: 14 }}>
                Resend code
              </Text>
            </View>
          </>
        ) : (
          <>
            <Text style={{ fontSize: 32, fontWeight: '800', color: BRAND.charcoal, marginBottom: 4 }}>
              Get started
            </Text>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 32 }}>
              Create your COYL account
            </Text>

            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
              style={inputStyle}
            />
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="newPassword"
              style={{ ...inputStyle, marginBottom: 16 }}
            />

            {error ? <Text style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</Text> : null}

            <TouchableOpacity
              onPress={handleSignUp}
              disabled={loading}
              style={{
                height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                backgroundColor: BRAND.orange,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24, gap: 4 }}>
              <Text style={{ color: '#666', fontSize: 14 }}>Already have an account?</Text>
              <Link href="/(auth)/sign-in" style={{ color: BRAND.orange, fontWeight: '600', fontSize: 14 }}>
                Sign In
              </Link>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  )
}
