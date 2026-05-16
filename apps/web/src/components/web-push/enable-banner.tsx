'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Bell, X } from 'lucide-react'

/**
 * <WebPushEnableBanner /> — one-tap browser-push enablement.
 *
 * Closes the gap for users who don't have the mobile app yet (Core/Free
 * tier, or pre-App-Store-launch). Without web push, those users only
 * see precision interrupts when they happen to be on /today inside a
 * danger window. With web push, the browser fires a real notification
 * even when the tab isn't open.
 *
 * Shown to users who:
 *   - Have at least one mapped danger window (otherwise there's nothing
 *     to fire on)
 *   - Don't already have a web push subscription saved
 *   - Haven't dismissed the banner in the last 7 days
 *
 * Consent flow:
 *   1. Show a soft banner explaining what will happen (transparent prompt)
 *   2. On Enable: request browser permission via PushManager
 *   3. On grant: subscribe with VAPID public key, POST to backend
 *   4. On deny: hide the banner for 30 days (don't nag)
 *
 * This is the consent-architecture promise made on /pricing and
 * /science: opt-in, transparent, easy to disable.
 */

const DISMISS_KEY = 'coyl_webpush_dismissed_at'
const DISMISS_GRACE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

interface Props {
  /** True if the user already has a saved web push subscription. */
  alreadySubscribed: boolean
  /** True if the user has at least one mapped danger window. */
  hasDangerWindows: boolean
  /** Optional: hide when the user already has a mobile push token. */
  hasMobilePush?: boolean
}

export function WebPushEnableBanner({
  alreadySubscribed,
  hasDangerWindows,
  hasMobilePush = false,
}: Props) {
  const [visible, setVisible] = useState(false)
  const [state, setState] = useState<'idle' | 'subscribing' | 'success' | 'denied' | 'error'>('idle')

  useEffect(() => {
    if (alreadySubscribed || !hasDangerWindows) return
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    // Respect dismissal
    try {
      const dismissedAt = window.localStorage.getItem(DISMISS_KEY)
      if (dismissedAt && Date.now() - parseInt(dismissedAt, 10) < DISMISS_GRACE_MS) {
        return
      }
    } catch {
      // localStorage might be blocked; show the banner anyway
    }

    // Don't show if permission was already explicitly denied — re-prompts
    // get blocked by the browser and just look like a broken UI.
    if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
      return
    }

    setVisible(true)
  }, [alreadySubscribed, hasDangerWindows])

  function dismiss() {
    try {
      window.localStorage.setItem(DISMISS_KEY, Date.now().toString())
    } catch {
      // ignore
    }
    setVisible(false)
  }

  async function enable() {
    setState('subscribing')
    try {
      const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublic) {
        console.warn('NEXT_PUBLIC_VAPID_PUBLIC_KEY missing — web push not configured')
        setState('error')
        return
      }

      // Register service worker (idempotent — getRegistration returns
      // the existing one if already installed).
      const registration =
        (await navigator.serviceWorker.getRegistration('/sw.js')) ??
        (await navigator.serviceWorker.register('/sw.js'))

      // Wait for it to be active before subscribing.
      if (registration.installing) {
        await new Promise<void>((resolve) => {
          const worker = registration.installing!
          worker.addEventListener('statechange', () => {
            if (worker.state === 'activated') resolve()
          })
        })
      }

      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setState('denied')
        setTimeout(() => dismiss(), 2000)
        return
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        // The DOM lib's PushSubscriptionOptions types are stricter than
        // the spec — Uint8Array is a valid BufferSource at runtime. Cast
        // through the BufferSource interface to satisfy TS.
        applicationServerKey: urlBase64ToUint8Array(vapidPublic) as BufferSource,
      })

      const res = await fetch('/api/v1/user/web-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      })
      if (!res.ok) {
        setState('error')
        return
      }
      setState('success')
      setTimeout(() => setVisible(false), 2000)
    } catch (err) {
      console.error('Failed to subscribe to web push', err)
      setState('error')
    }
  }

  // Don't render anything if the user already has mobile push — the
  // mobile pipeline is the primary channel; doubling up just spams.
  if (hasMobilePush) return null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="mb-4 overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/[0.08] to-transparent p-4"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/15 text-orange-300">
              <Bell className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="label-xs text-orange-400">Browser interrupts</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {state === 'success'
                  ? 'On. We&rsquo;ll catch you next time.'
                  : state === 'denied'
                    ? 'Blocked. Re-enable in your browser settings if you change your mind.'
                    : state === 'error'
                      ? "Couldn't enable. Check your browser settings."
                      : 'Get the interrupt at your danger windows, even when COYL isn&rsquo;t open.'}
              </p>
              {state === 'idle' && (
                <p className="mt-1 text-xs text-muted-foreground">
                  One push per window. Easy to disable. Never marketing.
                </p>
              )}
              {state === 'idle' && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={enable}
                    className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-4 py-1.5 text-xs font-bold text-white shadow-[0_0_14px_-2px_rgba(255,102,0,0.4)]"
                  >
                    Turn on interrupts
                  </button>
                  <button
                    onClick={dismiss}
                    className="rounded-full border border-white/10 px-4 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    Not now
                  </button>
                </div>
              )}
              {state === 'subscribing' && (
                <p className="mt-2 text-xs text-muted-foreground">Setting it up…</p>
              )}
            </div>
            <button
              onClick={dismiss}
              aria-label="Dismiss"
              className="ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-white/5 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Convert a URL-safe base64 VAPID public key into a Uint8Array, which is
 * what the PushManager API expects. Browser-native atob handles base64;
 * we just have to pad and translate the URL-safe alphabet.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    output[i] = rawData.charCodeAt(i)
  }
  return output
}
