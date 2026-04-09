'use client'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { CheckCircle2, Zap } from 'lucide-react'

const PRO_BENEFITS = [
  'Unlimited active tasks',
  'Unlimited AI clarification and decomposition',
  'Follow-up automation with escalation',
  'Relentless reminder logic — overdue rescue',
  'Advanced insights and completion analytics',
  'Daily email briefings',
  'Priority support',
]

interface PaywallDialogProps {
  open: boolean
  onClose: () => void
  trigger?: string // why the paywall was shown
}

export function PaywallDialog({ open, onClose, trigger }: PaywallDialogProps) {
  const [interval, setInterval] = useState<'monthly' | 'annual'>('annual')
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interval }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error ?? 'Failed to create checkout session')
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
      setLoading(false)
    }
  }

  const headline = getTriggerHeadline(trigger)

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            <Badge variant="secondary" className="text-xs">
              COYL Pro
            </Badge>
          </div>
          <DialogTitle className="text-xl leading-snug">{headline}</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-zinc-500">
          Upgrade to Pro to stop dropping balls. Your commitments get tracked, resurfaced, and
          closed — automatically.
        </p>

        {/* Interval toggle */}
        <div className="mt-2 flex rounded-lg border p-1">
          <button
            onClick={() => setInterval('annual')}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              interval === 'annual'
                ? 'bg-zinc-900 text-white'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            Annual <span className="ml-1 text-xs text-green-500">Save 33%</span>
          </button>
          <button
            onClick={() => setInterval('monthly')}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              interval === 'monthly'
                ? 'bg-zinc-900 text-white'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            Monthly
          </button>
        </div>

        <div className="text-center">
          <div className="text-3xl font-bold text-zinc-900">
            {interval === 'annual' ? '$79.99' : '$9.99'}
            <span className="text-base font-normal text-zinc-400">
              /{interval === 'annual' ? 'year' : 'mo'}
            </span>
          </div>
          {interval === 'annual' && (
            <p className="mt-0.5 text-xs text-zinc-400">7-day free trial. Cancel anytime.</p>
          )}
        </div>

        <ul className="space-y-2">
          {PRO_BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-center gap-2 text-sm text-zinc-700">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
              {benefit}
            </li>
          ))}
        </ul>

        <Button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full bg-zinc-900 hover:bg-zinc-800"
          size="lg"
        >
          {loading
            ? 'Loading...'
            : interval === 'annual'
              ? 'Start 7-day free trial'
              : 'Upgrade to Pro'}
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
      return "You've hit the free plan limit"
    case 'ai_quota':
      return "You've used all your AI assists"
    case 'follow_up_automation':
      return 'Never miss a follow-up again'
    case 'insights':
      return 'Unlock advanced insights'
    case 'escalation':
      return 'Enable relentless accountability'
    case 'assessments':
      return 'Get your AI performance assessment'
    default:
      return 'Capture it once. We make sure it gets done.'
  }
}
