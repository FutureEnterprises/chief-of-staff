import { useEffect, useState } from 'react'
import { Redirect } from 'expo-router'
import { useAuth } from '@clerk/clerk-expo'
import { hasSeenQuiz } from '../lib/activation'

export default function Index() {
  const { isSignedIn } = useAuth()
  // null = still reading the device flag (typically a single frame).
  const [quizSeen, setQuizSeen] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    hasSeenQuiz().then((seen) => {
      if (!cancelled) setQuizSeen(seen)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Signed-in users go straight home — unchanged.
  if (isSignedIn) return <Redirect href="/(app)/today" />

  if (quizSeen === null) return null

  // Cold start: a signed-out user who has never reached the archetype reveal
  // gets the 3-tap quiz (value before any account wall). Returning signed-out
  // users (coyl.quizSeen set by the reveal) go to sign-in exactly as before.
  return <Redirect href={quizSeen ? '/(auth)/sign-in' : '/(quiz)'} />
}
