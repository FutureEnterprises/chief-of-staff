'use client'

/**
 * CheckinsCard — settings UI for user-defined recurring check-ins.
 *
 * Lives inside /settings beneath the existing NotificationPrefs +
 * Reminders cards. Lets the user manage rows in the CheckinSchedule
 * table (see packages/database/prisma/schema.prisma) and the cron
 * dispatcher at /api/cron/custom-checkins fires them on a 1-minute
 * tick.
 *
 * Distinct from the legacy User.morningCheckinTime / nightCheckinTime
 * which stay where they are (set in the Reminders card). This surface
 * is for ADDITIONAL user-defined cadences — hourly inside a waking
 * window, weekly on a specific day, monthly on a specific day-of-
 * month.
 *
 * Per-cadence shape is enforced by the API's discriminated union
 * (see apps/web/src/app/api/v1/checkin-schedules/route.ts); the UI
 * mirrors that shape so the user only ever sees the fields relevant
 * to their chosen cadence.
 */

import { useEffect, useState, useCallback } from 'react'
import { Bell, Plus, Trash2, Loader2, MessageSquare } from 'lucide-react'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'

type Cadence = 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY'
type Channel = 'EMAIL' | 'SMS'

type Schedule = {
  id: string
  label: string
  cadence: Cadence
  channel: Channel
  intervalHours: number | null
  windowStart: string | null
  windowEnd: string | null
  dailyTime: string | null
  weeklyDay: number | null
  weeklyTime: string | null
  monthlyDay: number | null
  monthlyTime: string | null
  active: boolean
  lastFiredAt: string | null
  nextFiresAt: string | null
  message: string | null
  createdAt: string
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

type Reply = {
  id: string
  channel: 'SMS' | 'EMAIL'
  fromAddress: string
  body: string
  receivedAt: string
  processed: boolean
}

export function CheckinsCard() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/checkin-schedules')
      if (!res.ok) throw new Error('failed_to_load')
      const data = (await res.json()) as { schedules: Schedule[] }
      setSchedules(data.schedules)
    } catch {
      toast({ title: 'Could not load check-ins', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleToggle = async (id: string, next: boolean) => {
    // Optimistic — flip locally, revert on error.
    setSchedules((rows) => rows.map((r) => (r.id === id ? { ...r, active: next } : r)))
    try {
      const res = await fetch(`/api/v1/checkin-schedules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: next }),
      })
      if (!res.ok) throw new Error('toggle_failed')
      const data = (await res.json()) as { schedule: Schedule }
      setSchedules((rows) => rows.map((r) => (r.id === id ? data.schedule : r)))
    } catch {
      setSchedules((rows) => rows.map((r) => (r.id === id ? { ...r, active: !next } : r)))
      toast({ title: 'Could not update check-in', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this check-in? This cannot be undone.')) return
    const snapshot = schedules
    setSchedules((rows) => rows.filter((r) => r.id !== id))
    try {
      const res = await fetch(`/api/v1/checkin-schedules/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('delete_failed')
      toast({ title: 'Check-in deleted' })
    } catch {
      setSchedules(snapshot)
      toast({ title: 'Could not delete check-in', variant: 'destructive' })
    }
  }

  return (
    <GlassCard>
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-xl bg-orange-500/10 p-2">
          <Bell className="h-4 w-4 text-orange-500" />
        </div>
        <div>
          <h3 className="font-serif text-2xl font-normal leading-tight tracking-[-0.012em] text-[#f5f3ee]">
            Check-ins
          </h3>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.20em] text-[#8a847a]">
            Your own recurring nudges
          </p>
        </div>
      </div>

      <p className="mb-4 text-xs leading-[1.6] text-muted-foreground">
        Set your own cadence on top of the morning + night reminders.
        Hourly inside a waking window, a specific day each week, the
        first of every month &mdash; whatever shape your accountability
        needs.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
          <Loader2 className="mr-2 h-3 w-3 animate-spin" /> Loading
          your check-ins
        </div>
      ) : schedules.length === 0 && !adding ? (
        <div className="mb-4 rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-center">
          <p className="text-xs text-muted-foreground">
            No custom check-ins yet. Add one below.
          </p>
        </div>
      ) : (
        <div className="mb-4 space-y-2">
          {schedules.map((s) => (
            <ScheduleRow
              key={s.id}
              schedule={s}
              onToggle={(next) => handleToggle(s.id, next)}
              onDelete={() => handleDelete(s.id)}
            />
          ))}
        </div>
      )}

      {adding ? (
        <AddScheduleForm
          onCancel={() => setAdding(false)}
          onCreated={(row) => {
            setSchedules((rows) => [row, ...rows])
            setAdding(false)
            toast({ title: 'Check-in created' })
          }}
        />
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full border-dashed border-orange-500/30 text-orange-300 hover:bg-orange-500/10 hover:text-orange-200"
          onClick={() => setAdding(true)}
        >
          <Plus className="mr-2 h-3 w-3" /> Add a check-in
        </Button>
      )}
    </GlassCard>
  )
}

function ScheduleRow({
  schedule: s,
  onToggle,
  onDelete,
}: {
  schedule: Schedule
  onToggle: (next: boolean) => void
  onDelete: () => void
}) {
  const summary = summarizeSchedule(s)
  return (
    <div className="glass rounded-xl p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{s.label}</p>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            {summary} &middot; {s.channel}
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => onToggle(!s.active)}
            className={`text-[10px] font-mono font-semibold uppercase tracking-[0.18em] ${
              s.active ? 'text-orange-300' : 'text-gray-500'
            }`}
          >
            {s.active ? 'Active' : 'Paused'}
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete check-in"
            className="text-gray-400 hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <RepliesBadge scheduleId={s.id} />
    </div>
  )
}

/**
 * Lightweight badge that shows reply count + a hoverable preview of the
 * last 3 messages. Only renders if there are replies — silent until the
 * user has actually engaged. Fetches once per schedule when the card
 * mounts; this trades one extra round-trip per row for not having to
 * extend the main /api/v1/checkin-schedules GET response shape.
 */
function RepliesBadge({ scheduleId }: { scheduleId: string }) {
  const [replies, setReplies] = useState<Reply[] | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch(`/api/v1/checkin-schedules/${scheduleId}/replies`)
        if (!res.ok) return
        const data = (await res.json()) as { count: number; replies: Reply[] }
        if (!cancelled) setReplies(data.replies)
      } catch {
        // Silent — replies are non-critical UI.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [scheduleId])

  if (!replies || replies.length === 0) return null

  const top = replies.slice(0, 3)

  return (
    <div className="mt-2 border-t border-white/[0.04] pt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-orange-300 hover:bg-orange-500/20"
      >
        <MessageSquare className="h-2.5 w-2.5" />
        {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
      </button>
      {open && (
        <ul className="mt-2 space-y-1.5">
          {top.map((r) => (
            <li
              key={r.id}
              className="rounded-md bg-white/[0.02] p-2 text-[11px] leading-[1.4] text-muted-foreground"
            >
              <p className="line-clamp-3 text-foreground/80">{r.body}</p>
              <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/70">
                {r.channel} &middot; {new Date(r.receivedAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function summarizeSchedule(s: Schedule): string {
  switch (s.cadence) {
    case 'HOURLY':
      return `Every ${s.intervalHours}h ${s.windowStart}–${s.windowEnd}`
    case 'DAILY':
      return `Daily at ${s.dailyTime}`
    case 'WEEKLY':
      return `${WEEKDAYS[s.weeklyDay ?? 0]} at ${s.weeklyTime}`
    case 'MONTHLY':
      return `Day ${s.monthlyDay} at ${s.monthlyTime}`
    default:
      return ''
  }
}

function AddScheduleForm({
  onCancel,
  onCreated,
}: {
  onCancel: () => void
  onCreated: (s: Schedule) => void
}) {
  const [label, setLabel] = useState('')
  const [cadence, setCadence] = useState<Cadence>('DAILY')
  const [channel, setChannel] = useState<Channel>('EMAIL')
  const [message, setMessage] = useState('')

  // Per-cadence fields. UI shows/hides the relevant subset.
  const [intervalHours, setIntervalHours] = useState(4)
  const [windowStart, setWindowStart] = useState('09:00')
  const [windowEnd, setWindowEnd] = useState('21:00')
  const [dailyTime, setDailyTime] = useState('14:00')
  const [weeklyDay, setWeeklyDay] = useState(1) // Monday
  const [weeklyTime, setWeeklyTime] = useState('09:00')
  const [monthlyDay, setMonthlyDay] = useState(1)
  const [monthlyTime, setMonthlyTime] = useState('09:00')

  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!label.trim()) {
      toast({ title: 'Add a label first', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        label: label.trim(),
        cadence,
        channel,
        ...(message.trim() ? { message: message.trim() } : {}),
      }
      if (cadence === 'HOURLY') {
        body.intervalHours = intervalHours
        body.windowStart = windowStart
        body.windowEnd = windowEnd
      } else if (cadence === 'DAILY') {
        body.dailyTime = dailyTime
      } else if (cadence === 'WEEKLY') {
        body.weeklyDay = weeklyDay
        body.weeklyTime = weeklyTime
      } else if (cadence === 'MONTHLY') {
        body.monthlyDay = monthlyDay
        body.monthlyTime = monthlyTime
      }
      const res = await fetch('/api/v1/checkin-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(err.error ?? 'create_failed')
      }
      const data = (await res.json()) as { schedule: Schedule }
      onCreated(data.schedule)
    } catch (e) {
      toast({
        title: 'Could not create check-in',
        description: e instanceof Error ? e.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
      <div className="space-y-1.5">
        <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-orange-300">
          Label
        </label>
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Afternoon walk reminder"
          maxLength={80}
        />
      </div>

      <div className="space-y-1.5">
        <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-orange-300">
          Cadence
        </label>
        <div className="grid grid-cols-4 gap-1">
          {(['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY'] as Cadence[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCadence(c)}
              className={`rounded-md py-1.5 text-[10px] font-mono font-semibold uppercase tracking-[0.14em] ${
                cadence === c
                  ? 'bg-orange-500/30 text-orange-100'
                  : 'bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {cadence === 'HOURLY' && (
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1.5">
            <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-orange-300">
              Every (hours)
            </label>
            <Input
              type="number"
              min={1}
              max={12}
              value={intervalHours}
              onChange={(e) => setIntervalHours(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-orange-300">
              Window start
            </label>
            <Input type="time" value={windowStart} onChange={(e) => setWindowStart(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-orange-300">
              Window end
            </label>
            <Input type="time" value={windowEnd} onChange={(e) => setWindowEnd(e.target.value)} />
          </div>
        </div>
      )}

      {cadence === 'DAILY' && (
        <div className="space-y-1.5">
          <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-orange-300">
            Time
          </label>
          <Input type="time" value={dailyTime} onChange={(e) => setDailyTime(e.target.value)} />
        </div>
      )}

      {cadence === 'WEEKLY' && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-orange-300">
              Day
            </label>
            <div className="grid grid-cols-7 gap-1">
              {WEEKDAYS.map((d, i) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setWeeklyDay(i)}
                  className={`rounded-md py-1.5 text-[10px] font-mono font-semibold uppercase tracking-[0.10em] ${
                    weeklyDay === i
                      ? 'bg-orange-500/30 text-orange-100'
                      : 'bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06]'
                  }`}
                >
                  {d.slice(0, 1)}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-orange-300">
              Time
            </label>
            <Input type="time" value={weeklyTime} onChange={(e) => setWeeklyTime(e.target.value)} />
          </div>
        </div>
      )}

      {cadence === 'MONTHLY' && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-orange-300">
              Day of month (1-28)
            </label>
            <Input
              type="number"
              min={1}
              max={28}
              value={monthlyDay}
              onChange={(e) => setMonthlyDay(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-orange-300">
              Time
            </label>
            <Input type="time" value={monthlyTime} onChange={(e) => setMonthlyTime(e.target.value)} />
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-orange-300">
          Channel
        </label>
        <div className="grid grid-cols-2 gap-1">
          {(['EMAIL', 'SMS'] as Channel[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setChannel(c)}
              className={`rounded-md py-1.5 text-[10px] font-mono font-semibold uppercase tracking-[0.14em] ${
                channel === c
                  ? 'bg-orange-500/30 text-orange-100'
                  : 'bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        {channel === 'SMS' && (
          <p className="text-[10px] text-amber-400/80">
            SMS requires a verified phone on file (from /catch-me).
            If you haven&rsquo;t added one, the cron will fail to
            deliver and skip the row.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-orange-300">
          Message (optional)
        </label>
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What loop is loud right now?"
          maxLength={280}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={submitting}>
          {submitting ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
          Create check-in
        </Button>
      </div>
    </div>
  )
}
