'use client'
import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { Zap } from 'lucide-react'

// Internal tier wiring stays 'core' | 'plus' | 'premium' so the
// /api/stripe/checkout contract doesn't break. PREMIUM stays in the type
// for legacy/back-compat but is NOT displayed in the paywall — only the
// two paid consumer tiers (Rewire / Rebound) render.
type Tier = 'core' | 'plus' | 'premium'
type Interval = 'monthly' | 'annual'

// Display config keyed by the internal tier. Only 'core' (Rewire) and
// 'plus' (Rebound) are surfaced; 'premium' is intentionally omitted from
// DISPLAY_TIERS so it never shows in the picker.
//   core → Rewire  $12/mo · $99/yr
//   plus → Rebound $29/mo · $199/yr (the GLP-1 maintenance layer)
const TIERS: Record<'core' | 'plus', { name: string; tagline: string; monthly: number; annual: number; features: string[]; highlight?: boolean }> = {
  core: {
    name: 'Rewire',
    tagline: 'Catch yourself before the spiral.',
    monthly: 12,
    annual: 99,
    features: [
      'Unlimited interrupts at your danger windows',
      'AI decision support in the moment',
      'Recovery engine — no Monday reset',
      'Pattern memory that calls out your real excuses',
      'Self-Trust tracking that shows real progress',
    ],
    highlight: true,
  },
  plus: {
    name: 'Rebound',
    tagline: 'For the post-GLP-1 window.',
    monthly: 29,
    annual: 199,
    features: [
      'Everything in Rewire',
      'Window-specific interrupts (9 PM, weekend, stress, reward)',
      'Regain Risk Quiz + your rebound archetype',
      'Maintenance protocol for the post-taper window',
      'Clinician summary export for your prescriber',
    ],
  },
}

// The order tiers render in the picker. Excludes 'premium' by design.
const DISPLAY_TIERS: ('core' | 'plus')[] = ['core', 'plus']

interface PaywallDialogProps {
  open: boolean
  onClose: () => void
  trigger?: string
  defaultTier?: Tier
}

export function PaywallDialog({ open, onClose, trigger, defaultTier = 'core' }: PaywallDialogProps) {
  const [interval, setInterval] = useState<Interval>('annual')
  const [selectedTier, setSelectedTier] = useState<Tier>(defaultTier)
  const [loading, setLoading] = useState(false)
  const tracked = useRef(false)

  useEffect(() => {
    if (open && !tracked.current) {
      tracked.current = true
      fetch('/api/v1/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType: 'PAYWALL_SEEN', metadata: { trigger: trigger ?? 'unknown' } }),
      }).catch(() => {})
    }
    if (!open) tracked.current = false
  }, [open, trigger])

  async function handleUpgrade() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interval, tier: selectedTier }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error ?? 'Failed to create checkout session')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start checkout'
      toast({ title: 'Error', description: message, variant: 'destructive' })
      setLoading(false)
    }
  }

  const headline = getTriggerHeadline(trigger)
  // PREMIUM is never displayed — if it somehow arrives as defaultTier,
  // fall back to the Rewire (core) card so the dialog always renders a
  // valid paid tier. The checkout call still uses selectedTier verbatim.
  const displayTier: 'core' | 'plus' = selectedTier === 'plus' ? 'plus' : 'core'
  const tier = TIERS[displayTier]
  const price = interval === 'annual' ? tier.annual : tier.monthly

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-orange-500">Upgrade</span>
          </div>
          <DialogTitle className="text-xl leading-snug">{headline}</DialogTitle>
        </DialogHeader>

        <p className="text-sm leading-relaxed text-zinc-500">
          COYL is for the moments that usually ruin the day — late-night eating, &ldquo;I already blew it&rdquo; thinking, weekend collapse, and the shame that comes after.
        </p>

        {/* Tier picker — two paid options only (Rewire / Rebound). */}
        <div className="grid grid-cols-2 gap-2">
          {DISPLAY_TIERS.map((key) => (
            <button
              key={key}
              onClick={() => setSelectedTier(key)}
              className={`rounded-lg border p-2 text-left transition-all ${
                displayTier === key
                  ? 'border-orange-500 bg-orange-500/10'
                  : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800'
              }`}
            >
              <div className="text-xs font-bold">{TIERS[key].name}</div>
              <div className="text-[10px] text-zinc-500">
                ${interval === 'annual' ? TIERS[key].annual : TIERS[key].monthly}
                {interval === 'annual' ? '/yr' : '/mo'}
              </div>
            </button>
          ))}
        </div>

        {/* Interval toggle */}
        <div className="flex rounded-lg border p-1">
          <button
            onClick={() => setInterval('annual')}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              interval === 'annual' ? 'bg-orange-500 text-white' : 'text-zinc-500'
            }`}
          >
            Annual <span className="ml-1 text-xs opacity-80">2 months free</span>
          </button>
          <button
            onClick={() => setInterval('monthly')}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              interval === 'monthly' ? 'bg-orange-500 text-white' : 'text-zinc-500'
            }`}
          >
            Monthly
          </button>
        </div>

        {/* Selected tier details */}
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
          <div className="mb-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold">${price}</span>
            <span className="text-sm text-zinc-500">
              /{interval === 'annual' ? 'year' : 'mo'}
            </span>
          </div>
          <p className="mb-3 text-xs text-zinc-500">{tier.tagline}</p>
          <ul className="space-y-1.5">
            {tier.features.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0 text-orange-500">
                  <path d="M13 4L6 12L3 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <Button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white hover:opacity-90"
          size="lg"
        >
          {loading
            ? 'Loading…'
            : interval === 'annual'
              ? `Start 7-day trial — ${tier.name}`
              : `Upgrade to ${tier.name}`}
        </Button>

        <p className="text-center text-xs text-zinc-400">
          Secure checkout via Stripe. Cancel anytime.
        </p>
      </DialogContent>
    </Dialog>
  )
}

function getTriggerHeadline(trigger?: string): string {
  switch (trigger) {
    case 'task_limit':
      return "You've hit the free limit"
    case 'ai_quota':
      return "You've burned through your Charges"
    case 'rescue':
      return 'Stop the spiral before it starts'
    case 'recovery':
      return 'Built for bad days, not perfect users'
    case 'decision':
      return 'Catch the moment you usually lose'
    case 'partner':
      return 'Get an accountability partner'
    case 'stakes':
      return 'Put real money on the line'
    case 'simulate':
      return 'See where the script leads'
    case 'assessments':
      return 'Get your autopilot autopsy'
    default:
      return 'Catch the moment you usually lose.'
  }
}
