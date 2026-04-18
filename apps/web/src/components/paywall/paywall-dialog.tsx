'use client'
import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { Zap } from 'lucide-react'

type Tier = 'core' | 'plus' | 'premium'
type Interval = 'monthly' | 'annual'

const TIERS: Record<Tier, { name: string; tagline: string; monthly: number; annual: number; features: string[]; highlight?: boolean }> = {
  core: {
    name: 'Core',
    tagline: 'Interrupt the script, recover fast.',
    monthly: 19,
    annual: 179,
    features: [
      'Unlimited commitments',
      '500 Charges / month',
      'Full rescue + recovery flows',
      'Autopilot map + excuse detection',
      'AI assessments',
    ],
    highlight: true,
  },
  plus: {
    name: 'Plus',
    tagline: 'Accountability + precision.',
    monthly: 29,
    annual: 279,
    features: [
      'Everything in Core',
      '1,500 Charges / month',
      'Accountability partner',
      'Challenge pods',
      'Precision interrupts (JITAI)',
    ],
  },
  premium: {
    name: 'Premium',
    tagline: 'The full operator stack.',
    monthly: 49,
    annual: 469,
    features: [
      'Everything in Plus',
      'Unlimited Charges',
      'Scenario simulator',
      'Financial stakes',
      'Health + calendar integrations',
    ],
  },
}

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
  const tier = TIERS[selectedTier]
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

        {/* Tier picker */}
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(TIERS) as Tier[]).map((key) => (
            <button
              key={key}
              onClick={() => setSelectedTier(key)}
              className={`rounded-lg border p-2 text-left transition-all ${
                selectedTier === key
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
            Annual <span className="ml-1 text-xs opacity-80">save ~20%</span>
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
    case 'follow_up_automation':
      return 'Never miss a follow-up again'
    case 'insights':
      return 'Unlock deep pattern insights'
    case 'escalation':
      return 'Enable relentless accountability'
    case 'assessments':
      return 'Get your autopilot autopsy'
    case 'rescue':
      return 'Stop the spiral in the moment'
    case 'recovery':
      return 'Built for bad days, not perfect users'
    case 'decision':
      return 'Upgrade the decision engine'
    case 'partner':
      return 'Get an accountability partner'
    case 'stakes':
      return 'Put real money on the line'
    case 'simulate':
      return 'See where the script leads'
    default:
      return 'Stop the script before it runs your life.'
  }
}
