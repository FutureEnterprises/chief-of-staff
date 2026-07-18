import { useEffect, useState } from 'react'
import { Redirect } from 'expo-router'
import { useAuth } from '@clerk/clerk-expo'
import { hasSeenQuiz } from '../lib/activation'

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth()
  // null = still reading the device flag (typically a single frame).
  const [quizSeen, setQuizSeen] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    // Race the flag read against a short timeout so a hung AsyncStorage read
    // can't blank-screen the app forever. Timing out fails OPEN to true —
    // same policy as hasSeenQuiz's own error path: fall back to the pre-quiz
    // behaviour (sign-in) rather than risk looping a returning user through
    // the quiz.
    let timer: ReturnType<typeof setTimeout> | undefined
    const timeout = new Promise<boolean>((resolve) => {
      timer = setTimeout(() => resolve(true), 2500)
    })
    Promise.race([hasSeenQuiz(), timeout]).then((seen) => {
      if (!cancelled) setQuizSeen(seen)
    })
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [])

  // Wait for Clerk to restore the session before routing anywhere. On the
  // first frames isSignedIn is undefined while the token cache loads, and if
  // the AsyncStorage read wins that race a SIGNED-IN user would be redirected
  // to sign-in (flash, then bounced back) — or, worse, an existing signed-in
  // user upgrading to a build with the quiz (no coyl.quizSeen flag yet) would
  // be dropped into the quiz funnel.
  if (!isLoaded) return null

  // Signed-in users go straight home — unchanged.
  if (isSignedIn) return <Redirect href="/(app)/today" />

  if (quizSeen === null) return null

  // Cold start: a signed-out user who has never reached the archetype reveal
  // gets the 3-tap quiz (value before any account wall). Returning signed-out
  // users (coyl.quizSeen set by the reveal) go to sign-in exactly as before.
  return <Redirect href={quizSeen ? '/(auth)/sign-in' : '/(quiz)'} />
}
