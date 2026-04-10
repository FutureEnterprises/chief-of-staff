'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Share2, Twitter, Copy, Check } from 'lucide-react'

interface ShareCardProps {
  userId: string
  executionScore: number
  currentStreak: number
  userName: string
}

export function ShareButton({ userId, executionScore, currentStreak, userName }: ShareCardProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareUrl = `https://coyl.ai/api/share/${userId}`
  const firstName = userName.split(' ')[0]
  const tweetText = encodeURIComponent(
    `My COYL Execution Score: ${executionScore}/100 | ${currentStreak}-day streak 🔥\n\nThe behavior enforcement engine that doesn't let me slack.\ncoyl.ai`
  )

  function copyLink() {
    navigator.clipboard.writeText(`https://coyl.ai`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
      >
        <Share2 className="h-3 w-3" />
        Share
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-border bg-card p-4 shadow-xl"
          >
            {/* Preview */}
            <div className="mb-3 overflow-hidden rounded-lg border border-border">
              <img
                src={shareUrl}
                alt="Share card preview"
                className="h-auto w-full"
                loading="lazy"
              />
            </div>

            <p className="mb-3 text-xs text-muted-foreground">
              {firstName}&apos;s Execution Score: <strong className="text-foreground">{executionScore}/100</strong> &middot; {currentStreak}-day streak
            </p>

            <div className="flex gap-2">
              <a
                href={`https://twitter.com/intent/tweet?text=${tweetText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#1DA1F2] px-3 py-2 text-xs font-semibold text-white transition-all hover:bg-[#1a8cd8]"
              >
                <Twitter className="h-3 w-3" />
                Post on X
              </a>
              <button
                onClick={copyLink}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
              >
                {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
