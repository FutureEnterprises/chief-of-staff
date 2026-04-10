'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'

export function CookieConsent() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('coyl_cookie_consent')
    if (!consent) {
      // Small delay so it doesn't flash on page load
      const timer = setTimeout(() => setShow(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  function accept() {
    localStorage.setItem('coyl_cookie_consent', 'accepted')
    document.cookie = 'coyl_cookie_consent=accepted; max-age=31536000; path=/; SameSite=Lax'
    setShow(false)
  }

  function decline() {
    localStorage.setItem('coyl_cookie_consent', 'declined')
    document.cookie = 'coyl_cookie_consent=declined; max-age=31536000; path=/; SameSite=Lax'
    setShow(false)
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#1a1a1a]/95 p-5 shadow-2xl backdrop-blur-xl md:left-auto md:right-6 md:bottom-6"
        >
          <p className="mb-3 text-sm leading-relaxed text-gray-300">
            We use essential cookies to keep you signed in and functional cookies to remember your
            preferences.{' '}
            <Link href="/cookies" className="text-orange-500 underline underline-offset-2 hover:text-orange-400">
              Cookie Policy
            </Link>
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={accept}
              className="rounded-xl bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-orange-600"
            >
              Accept all
            </button>
            <button
              onClick={decline}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-gray-400 transition-all hover:bg-white/10 hover:text-white"
            >
              Essential only
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
