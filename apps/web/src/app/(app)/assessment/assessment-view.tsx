'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { PageTransition } from '@/components/motion/animations'
import { PaywallDialog } from '@/components/paywall/paywall-dialog'
import { Heart, Flame, ArrowLeft, RotateCcw, Bot } from 'lucide-react'

type AssessmentMode = 'considerate' | 'nobs' | null

export function AssessmentView() {
  const [mode, setMode] = useState<AssessmentMode>(null)
  const [paywallOpen, setPaywallOpen] = useState(false)
  const initialSentRef = useRef(false)

  function handleReset() {
    setMode(null)
    initialSentRef.current = false
  }

  return (
    <PageTransition className="flex h-full flex-col">
      {mode === null ? (
        <ModeSelection onSelect={setMode} />
      ) : (
        <AssessmentChat
          mode={mode}
          initialSentRef={initialSentRef}
          onBack={handleReset}
          onPaywall={() => setPaywallOpen(true)}
        />
      )}
      <PaywallDialog
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        trigger="assessments"
      />
    </PageTransition>
  )
}

function ModeSelection({ onSelect }: { onSelect: (m: AssessmentMode) => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-warm shadow-glow-orange"
      >
        <Bot className="h-7 w-7 text-white" />
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="heading-2 mb-2 text-center"
      >
        30-Day Performance Assessment
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-10 max-w-md text-center text-sm text-muted-foreground"
      >
        AI analyzes your task history, completion patterns, and follow-through to deliver a personalized assessment. Choose your style.
      </motion.p>

      <div className="flex w-full max-w-2xl flex-col gap-4 md:flex-row">
        {/* Considerate */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          whileHover={{ y: -4, boxShadow: '0 0 30px rgba(255, 102, 0, 0.15)' }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect('considerate')}
          className="glass group flex flex-1 flex-col items-start rounded-2xl p-6 text-left transition-all hover:border-orange-500/30"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 transition-transform group-hover:scale-110">
            <Heart className="h-6 w-6" />
          </div>
          <h3 className="heading-3 mb-1">Considerate</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Supportive, empathetic feedback. Celebrates wins, gently surfaces areas for growth. Like a coach who believes in you.
          </p>
          <div className="mt-4 rounded-lg bg-orange-500/5 px-3 py-1.5 text-xs font-medium text-orange-500">
            Constructive &middot; Encouraging &middot; Actionable
          </div>
        </motion.button>

        {/* No BS */}
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          whileHover={{ y: -4, boxShadow: '0 0 30px rgba(239, 68, 68, 0.15)' }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect('nobs')}
          className="glass group flex flex-1 flex-col items-start rounded-2xl p-6 text-left transition-all hover:border-red-500/30"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-500 transition-transform group-hover:scale-110">
            <Flame className="h-6 w-6" />
          </div>
          <h3 className="heading-3 mb-1">No BS Mode</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Brutally honest, zero fluff. Calls out procrastination, avoidance, and dropped balls. A drill sergeant who respects you enough not to lie.
          </p>
          <div className="mt-4 rounded-lg bg-red-500/5 px-3 py-1.5 text-xs font-medium text-red-500">
            Brutal &middot; Direct &middot; No Excuses
          </div>
        </motion.button>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 text-xs text-muted-foreground"
      >
        Pro feature &middot; Analyzes 30 days of task data
      </motion.p>
    </div>
  )
}

function AssessmentChat({
  mode,
  initialSentRef,
  onBack,
  onPaywall,
}: {
  mode: 'considerate' | 'nobs'
  initialSentRef: React.MutableRefObject<boolean>
  onBack: () => void
  onPaywall: () => void
}) {
  const chatMode = mode === 'considerate' ? 'assessment-considerate' : 'assessment-nobs'

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { mode: chatMode },
    }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'
  const isDone = messages.length > 1 && !isLoading

  // Auto-send on mount
  useEffect(() => {
    if (initialSentRef.current) return
    initialSentRef.current = true
    sendMessage({ text: 'Run my 30-day performance assessment.' })
  }, [sendMessage, initialSentRef])

  // Handle 402 paywall
  useEffect(() => {
    if (error) {
      try {
        const parsed = JSON.parse(error.message)
        if (parsed?.error === 'feature_gated' || parsed?.error === 'ai_quota_exceeded') {
          onPaywall()
        }
      } catch {
        // Not JSON — check if it's a 402 status text
        if (error.message.includes('402') || error.message.includes('feature_gated')) {
          onPaywall()
        }
      }
    }
  }, [error, onPaywall])

  const modeLabel = mode === 'considerate' ? 'Considerate Assessment' : 'No BS Assessment'
  const ModeIcon = mode === 'considerate' ? Heart : Flame
  const accentColor = mode === 'considerate' ? 'orange' : 'red'

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-6 py-4">
        <button
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
          accentColor === 'orange' ? 'bg-gradient-warm' : 'bg-gradient-to-br from-red-500 to-red-700'
        }`}>
          <ModeIcon className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-sm font-semibold">{modeLabel}</h1>
          <p className="text-xs text-muted-foreground">30-day analysis</p>
        </div>
        {isDone && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" />
            New assessment
          </motion.button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-2xl">
          <AnimatePresence initial={false}>
            {messages
              .filter((m) => m.role === 'assistant')
              .map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                  className="glass rounded-2xl p-6"
                >
                  <div className="prose prose-sm prose-zinc dark:prose-invert max-w-none">
                    {message.parts?.map((part, pi) =>
                      part.type === 'text' ? (
                        <span key={pi} className="whitespace-pre-wrap leading-relaxed">
                          {part.text}
                        </span>
                      ) : null
                    )}
                  </div>
                </motion.div>
              ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass flex items-center gap-3 rounded-2xl p-6"
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                accentColor === 'orange' ? 'bg-gradient-warm' : 'bg-gradient-to-br from-red-500 to-red-700'
              }`}>
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {mode === 'considerate' ? 'Analyzing your patterns thoughtfully...' : 'Preparing your reality check...'}
                </span>
                <div className="flex items-center gap-1">
                  {[0, 0.15, 0.3].map((delay, i) => (
                    <motion.div
                      key={i}
                      animate={{ opacity: [0.4, 1, 0.4], y: [0, -3, 0] }}
                      transition={{ duration: 0.8, delay, repeat: Infinity }}
                      className={`h-1.5 w-1.5 rounded-full ${accentColor === 'orange' ? 'bg-orange-500' : 'bg-red-500'}`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {error && !paywallTriggered(error) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-2xl border-destructive/50 p-6 text-center"
            >
              <p className="text-sm text-destructive">Something went wrong. Please try again.</p>
              <button
                onClick={onBack}
                className="mt-3 text-sm font-medium text-muted-foreground underline hover:text-foreground"
              >
                Go back
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

function paywallTriggered(error: Error): boolean {
  try {
    const parsed = JSON.parse(error.message)
    return parsed?.error === 'feature_gated' || parsed?.error === 'ai_quota_exceeded'
  } catch {
    return error.message.includes('402')
  }
}
