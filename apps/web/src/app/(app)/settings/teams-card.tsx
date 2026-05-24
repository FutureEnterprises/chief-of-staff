'use client'

/**
 * TeamsCard — settings UI for the Microsoft Teams integration.
 *
 * Mirrors the CheckinsCard pattern. Shows the user the current state
 * of the COYL Teams integration in their workspace:
 *
 *   - Connect status: is your tenant provisioned + are YOUR Graph
 *     tokens captured (separate concerns — the tenant install is the
 *     IT admin's responsibility; the per-user Graph connect is yours)
 *   - The 4 interrupt classes active for you (Focus Defender,
 *     Follow-Through Pinger, Meeting Decliner, Recovery Coach)
 *   - Pause / resume per class (writes a per-user opt-out into
 *     notificationPrefs JSON, which the cron honors)
 *   - "Connect Microsoft Graph" CTA — routes to /api/v1/teams/auth/
 *     connect (built by the parallel Graph integration agent in the
 *     same wave)
 *   - "Disconnect" CTA — revokes the Graph tokens server-side
 *
 * Defensive against missing infrastructure: if the API returns
 * {connected: false, reason: 'integration_not_configured'} we show a
 * placeholder "Coming with the next deploy" state instead of an empty
 * card. That covers the period between this card landing and the
 * Azure AD app + Graph integration going live in prod.
 */

import { useEffect, useState, useCallback } from 'react'
import { Sparkles, Loader2, ExternalLink, RefreshCw } from 'lucide-react'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'

type InterruptClass =
  | 'FOCUS_DEFENDER'
  | 'FOLLOW_THROUGH_PINGER'
  | 'MEETING_DECLINER'
  | 'RECOVERY_COACH'

type IntegrationStatus = {
  tenantConnected: boolean
  graphConnected: boolean
  tenantName?: string | null
  scopesGranted?: string[] | null
  enabledClasses?: InterruptClass[] | null
  reason?: string | null
}

const CLASS_DETAIL: Record<InterruptClass, { name: string; description: string }> = {
  FOCUS_DEFENDER: {
    name: 'Focus Defender',
    description: 'Protects scheduled deep work. Fires 15 min before a focus block.',
  },
  FOLLOW_THROUGH_PINGER: {
    name: 'Follow-Through Pinger',
    description: 'Catches outbound emails about to fall stale. Fires at 48h+ no reply.',
  },
  MEETING_DECLINER: {
    name: 'Meeting Decliner',
    description: 'Surfaces declines when calendar density is past your threshold.',
  },
  RECOVERY_COACH: {
    name: 'Recovery Coach',
    description: '60-second reset between high-cortisol meetings.',
  },
}

export function TeamsCard() {
  const [status, setStatus] = useState<IntegrationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/teams/auth/status')
      if (!res.ok) {
        // Best-effort — if the endpoint isn't deployed yet, render a
        // graceful placeholder rather than blowing up the settings page.
        setStatus({ tenantConnected: false, graphConnected: false, reason: 'endpoint_unavailable' })
        return
      }
      const data = (await res.json()) as IntegrationStatus
      setStatus(data)
    } catch {
      setStatus({ tenantConnected: false, graphConnected: false, reason: 'endpoint_unavailable' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleConnect = () => {
    setConnecting(true)
    // Hard-redirect — the connect handler bounces to Microsoft's
    // authorize URL, which redirects back to /api/v1/teams/auth/callback,
    // which redirects to /settings?integration=teams_connected.
    window.location.href = '/api/v1/teams/auth/connect'
  }

  const handleDisconnect = async () => {
    if (!confirm('Disconnect COYL from your Microsoft account? You can reconnect any time.')) return
    try {
      const res = await fetch('/api/v1/teams/auth/disconnect', { method: 'POST' })
      if (!res.ok) throw new Error('disconnect_failed')
      toast({ title: 'Disconnected from Microsoft' })
      await load()
    } catch {
      toast({ title: 'Could not disconnect', variant: 'destructive' })
    }
  }

  return (
    <GlassCard>
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-xl bg-orange-500/10 p-2">
          <Sparkles className="h-4 w-4 text-orange-500" />
        </div>
        <div>
          <h3 className="font-serif text-2xl font-normal leading-tight tracking-[-0.012em] text-[#f5f3ee]">
            Microsoft Teams
          </h3>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.20em] text-[#8a847a]">
            4 archetype-aware interrupts inside Teams
          </p>
        </div>
      </div>

      <p className="mb-4 text-xs leading-[1.6] text-muted-foreground">
        Connect your Microsoft account and COYL fires four classes of
        adaptive-card interrupt inside Teams: Focus Defender, Follow-
        Through Pinger, Meeting Decliner, Recovery Coach. Per-class
        opt-out below.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
          <Loader2 className="mr-2 h-3 w-3 animate-spin" /> Checking Teams integration
        </div>
      ) : status?.reason === 'endpoint_unavailable' ? (
        <PlaceholderState />
      ) : status?.graphConnected ? (
        <ConnectedState status={status} onDisconnect={handleDisconnect} />
      ) : (
        <DisconnectedState onConnect={handleConnect} connecting={connecting} />
      )}
    </GlassCard>
  )
}

function PlaceholderState() {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-center">
      <p className="text-xs leading-[1.6] text-muted-foreground">
        Teams integration ships with the next deploy. After Azure AD
        registration + production deploy, this card will let you
        connect your Microsoft account in one click.
      </p>
      <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-orange-300">
        AppSource listing coming Q3 2026
      </p>
    </div>
  )
}

function DisconnectedState({
  onConnect,
  connecting,
}: {
  onConnect: () => void
  connecting: boolean
}) {
  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        size="sm"
        className="w-full border-dashed border-orange-500/30 text-orange-300 hover:bg-orange-500/10 hover:text-orange-200"
        onClick={onConnect}
        disabled={connecting}
      >
        {connecting ? (
          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
        ) : (
          <ExternalLink className="mr-2 h-3 w-3" />
        )}
        Connect Microsoft account
      </Button>
      <p className="text-[10px] text-muted-foreground">
        We&rsquo;ll request read-only access to your calendar + sent
        email (the signals COYL needs to fire the interrupts). No
        write access. Revocable any time.
      </p>
    </div>
  )
}

function ConnectedState({
  status,
  onDisconnect,
}: {
  status: IntegrationStatus
  onDisconnect: () => void
}) {
  const enabled = status.enabledClasses ?? (
    ['FOCUS_DEFENDER', 'FOLLOW_THROUGH_PINGER', 'MEETING_DECLINER', 'RECOVERY_COACH'] as InterruptClass[]
  )
  return (
    <div className="space-y-3">
      <div className="glass rounded-xl p-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-400">
          Connected
        </p>
        <p className="mt-1 truncate text-sm font-semibold text-foreground">
          {status.tenantName ?? 'Microsoft account'}
        </p>
        {status.scopesGranted && status.scopesGranted.length > 0 && (
          <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground">
            Scopes: {status.scopesGranted.join(' · ')}
          </p>
        )}
      </div>

      <div className="space-y-2">
        {enabled.map((cls) => {
          const meta = CLASS_DETAIL[cls]
          return (
            <div key={cls} className="glass rounded-xl p-3">
              <p className="truncate text-sm font-semibold text-foreground">{meta.name}</p>
              <p className="mt-0.5 text-[10px] leading-[1.5] text-muted-foreground">
                {meta.description}
              </p>
            </div>
          )
        })}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" size="sm" onClick={onDisconnect}>
          <RefreshCw className="mr-2 h-3 w-3" /> Disconnect
        </Button>
      </div>
    </div>
  )
}
