'use client'
/**
 * LUXURY EDITORIAL OVERHAUL — May 2026 (operator surface, dark)
 * Refero references applied:
 *   - 50c47480-9451-420b-a372-eb42eda75e56 (Sequel): refined dark-mode editorial,
 *     cream typography on warm canvas, gallery restraint over decorative gloss.
 *   - 067fe2b3-9411-42b9-9ea4-39338344f66d (Liron Moran): muted charcoal canvas,
 *     oversized serif headline as monumental composition, generous breathing room.
 *   - c18d1c89-bb32-4a3c-bdc8-42d3355b8905 (DNA Capital): premium dark fintech,
 *     serif display + whispered authority, ONE accent moment per surface.
 *   - c00d3961-a100-4c22-91fe-75f6e488e579 (Pipe): dark canvas + a single
 *     molten orange spotlight — exact analog for COYL brand mark.
 *   - 75236d28-494c-457f-81f3-3c2f2679bb2b (V7labs): warm dark operational
 *     surface, refined serif paired with mono metadata, orange as energy.
 *   - 76c30104-1a19-42e7-a585-19505882f600 (Monopo Saigon): warm earthy
 *     dark tones, calm editorial restraint, type-led atmosphere.
 *
 * Body sans (Geist) for utility text. Instrument Serif (font-serif) for
 * the daily ritual moments — greeting, Today's Rule, identity read.
 * Mono (Geist Mono) for metadata only. Background warm charcoal #0e0d0b,
 * NOT pure black, NOT Linear blue-black. Single orange focal moment.
 */
import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import type { Task, User, Tag } from '@repo/database'
import { Separator } from '@/components/ui/separator'
import { TaskCard } from '@/components/tasks/task-card'
import { TaskCreateModal } from '@/components/tasks/task-create-modal'
import { StaggerList, StaggerItem, PageTransition, AnimatedCounter } from '@/components/motion/animations'
import {
  Sun, Moon, Plus, CheckCircle2, AlertTriangle,
  RefreshCw, Clock, Flame, Brain,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { CalloutPanel } from '@/components/callout/callout-panel'
import { WebPushEnableBanner } from '@/components/web-push/enable-banner'
import { InterruptHistory } from '@/components/interrupt-history/interrupt-history'
import { DailyCard } from '@/components/daily-number/daily-card'
import { QuickSlipButton } from '@/components/slip/quick-slip-button'
import { identitySentence } from '@/lib/identity-sentence'

type TaskWithRelations = Task & {
  tags: Array<{ tag: Tag }>
  project?: { id: string; name: string } | null
}

type ActiveCommitment = { id: string; rule: string; keepCount: number; breakCount: number } | null
type NextDangerWindow = { label: string; whenText: string; hoursUntil: number } | null
type ActiveDangerWindow = { id: string; label: string; startHour: number; endHour: number; minutesIn: number } | null

interface TodayViewProps {
  dueTodayTasks: TaskWithRelations[]
  followUpsDueToday: Array<Task & { tags: Array<{ tag: Tag }> }>
  overdueTasks: Array<Task & { tags: Array<{ tag: Tag }> }>
  recentlyCompleted: Task[]
  user: User
  activeCommitment?: ActiveCommitment
  nextDangerWindow?: NextDangerWindow
  /** The window the user is INSIDE right now (their local time matches an
   *  active danger window). When present, /today renders a real-time
   *  intervention banner instead of waiting for the user to find Rescue. */
  activeDangerWindow?: ActiveDangerWindow
  topExcuseCategory?: string | null
  topExcuseCount?: number
  selfTrustDelta?: number | null
  /** "Tonight at 9:30 PM"-style label for the user's queued first catch
   *  (a PENDING ScheduledInterrupt). Lets the interrupt-history empty
   *  state promise a concrete moment instead of a vague "next time." */
  pendingCatch?: string | null
  hasWebPushSubscription?: boolean
  hasMobilePush?: boolean
  hasDangerWindows?: boolean
}

// The word COYL uses to name this excuse category when calling it out.
// "That's your 'tomorrow' excuse again" — the short tag goes inside the
// quote. Keeps the spec voice consistent with onboarding + patterns.
const EXCUSE_TAG: Record<string, string> = {
  DELAY: 'tomorrow',
  REWARD: 'deserving',
  MINIMIZATION: 'just this once',
  COLLAPSE: 'I already blew it',
  EXHAUSTION: 'too tired',
  EXCEPTION: 'special week',
  COMPENSATION: "I'll make up for it",
  SOCIAL_PRESSURE: "couldn't say no",
}

export function TodayView({
  dueTodayTasks,
  followUpsDueToday,
  overdueTasks,
  recentlyCompleted,
  user,
  activeCommitment,
  nextDangerWindow,
  activeDangerWindow,
  topExcuseCategory,
  topExcuseCount,
  selfTrustDelta,
  pendingCatch,
  hasWebPushSubscription = false,
  hasMobilePush = false,
  hasDangerWindows = false,
}: TodayViewProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = user.name.split(' ')[0] ?? user.name
  const totalAttention = dueTodayTasks.length + overdueTasks.length + followUpsDueToday.length
  const criticalTasks = [...dueTodayTasks, ...overdueTasks]
    .filter((t) => t.priority === 'CRITICAL' || t.priority === 'HIGH')
    .slice(0, 3)

  return (
    <PageTransition className="relative mx-auto max-w-3xl px-6 py-10 sm:py-12">
      {/* Warm charcoal canvas wash. Sequel/Liron Moran-style restrained
          ambient — a whisper of orange in the top-right, never enough to
          compete with the serif. Single focal accent doctrine. */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-70"
        style={{
          background:
            'radial-gradient(800px at 90% -10%, rgba(255,102,0,0.07), transparent 65%), radial-gradient(600px at -10% 100%, rgba(255,102,0,0.03), transparent 70%)',
        }}
      />

      {/* EDITORIAL MASTHEAD — serif greeting as the page's signature.
          Liron Moran's monumental headline pattern translated into a daily
          ritual surface. Mono timestamp slipped underneath like a
          gallery wall label. */}
      <header className="mb-10 border-b border-white/[0.05] pb-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8a847a]">
          {formatDate(new Date())}
        </p>
        <h1 className="mt-3 font-serif text-4xl font-normal leading-[1.02] tracking-[-0.015em] text-[#f5f3ee] sm:text-5xl">
          {greeting},
          <br />
          <span className="text-[#f5f3ee]/85">{firstName}.</span>
        </h1>
      </header>

      {/* Browser push enablement — only renders if the user has danger
          windows mapped, no existing subscription, and hasn't dismissed
          recently. Closes the "I get the value at risk windows" promise
          for users who don't have the mobile app yet. */}
      <WebPushEnableBanner
        alreadySubscribed={hasWebPushSubscription}
        hasDangerWindows={hasDangerWindows}
        hasMobilePush={hasMobilePush}
      />

      {/* RECOVERY MODE — explicit banner when the user just slipped.
          Per the May 2026 audit §4.4: the brand promise is "no restart,
          continue." This banner makes the promise visible. Hides streak
          surface in the IDENTITY LINE below by short-circuiting the
          warning tone — recovery is its own state, not a guilt state.
          Auto-clears 24h after the slip via the existing recoveryState
          state machine in lib/user-state.ts. */}
      {(user.recoveryState === 'SLIPPED' || user.recoveryState === 'RECOVERING') && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-3 overflow-hidden rounded-md border border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.06] via-emerald-500/[0.02] to-transparent p-4"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <span className="text-sm font-bold">↺</span>
            </div>
            <div className="flex-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-emerald-400">RECOVERY MODE · 24H</p>
              <p className="mt-1.5 text-base font-semibold leading-tight tracking-[-0.01em] text-foreground">
                You slipped. Good. Now we stop the damage.
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                Streak preserved. No Monday reset. One tiny better move and you&rsquo;re back.
              </p>
              <Link
                href="/slip"
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-sm border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20"
              >
                Build the recovery plan →
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* INSIDE A DANGER WINDOW RIGHT NOW.
          The single most important UI state in the product. When the user
          is currently inside a known risk window, /today turns into a
          live intervention surface — pulsing red border, the window name,
          how many minutes they've been in it, and a one-tap rescue path.
          The same matching logic the danger-window-interrupt cron uses
          for push notifications, surfaced server-side at page render so
          a user without mobile installed (Core, or pre-launch mobile)
          still sees the moment. */}
      {activeDangerWindow && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          className="mb-3 overflow-hidden rounded-md border border-red-500/60 bg-gradient-to-br from-red-500/[0.10] via-orange-500/[0.05] to-transparent p-4 shadow-[0_0_36px_-10px_rgba(239,68,68,0.45),inset_0_1px_0_0_rgba(255,255,255,0.02)]"
        >
          <div className="flex items-start gap-3">
            <motion.div
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-red-500/30 bg-red-500/15 text-red-300"
            >
              <Flame className="h-4 w-4" />
            </motion.div>
            <div className="flex-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-red-400 tabular-nums">
                YOU&rsquo;RE IN: {activeDangerWindow.label.toUpperCase()} &middot; {activeDangerWindow.minutesIn} MIN IN
              </p>
              <p className="mt-1.5 text-lg font-semibold leading-tight tracking-[-0.015em] text-foreground sm:text-xl">
                This is the moment your autopilot runs.
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                You already know how it ends if nothing interrupts it. One tap, one different choice, the night doesn&rsquo;t turn into the week.
              </p>
              <Link
                href={`/rescue?windowId=${activeDangerWindow.id}&from=danger_window`}
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-sm bg-gradient-to-r from-red-500 to-orange-500 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-white shadow-[0_0_16px_-3px_rgba(239,68,68,0.6)] transition-shadow hover:shadow-[0_0_24px_-3px_rgba(239,68,68,0.8)]"
              >
                Open rescue &rarr;
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* IDENTITY LINE — the accusatory/affirming one-liner from
          identity-sentence.ts. Sets the emotional register for the page.
          Deterministic from user data, no AI latency. */}
      {(() => {
        const id = identitySentence({
          identityState: user.identityState ?? null,
          recoveryState: user.recoveryState ?? null,
          currentStreak: user.currentStreak,
          longestStreak: user.longestStreak,
          slipsThisMonth: user.slipsThisMonth,
          selfTrustScore: user.selfTrustScore ?? 0,
        })
        const borderColor =
          id.tone === 'warning' ? 'border-red-500/30'
          : id.tone === 'positive' ? 'border-emerald-500/30'
          : 'border-orange-500/30'
        const textColor =
          id.tone === 'warning' ? 'text-red-300'
          : id.tone === 'positive' ? 'text-emerald-300'
          : 'text-orange-300'
        return (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={`mb-10 border-l-[1.5px] ${borderColor} pl-6 py-1`}
          >
            <p className={`font-mono text-[10px] uppercase tracking-[0.22em] ${textColor}`}>
              Identity read
            </p>
            <p className="mt-2 font-serif text-2xl font-normal leading-[1.15] tracking-[-0.012em] text-[#f5f3ee] sm:text-[28px]">
              {id.headline}
            </p>
            <p className="mt-2 font-sans text-[13px] leading-relaxed text-[#a39d92]">{id.evidence}</p>
          </motion.div>
        )
      })()}

      {/* TODAY'S RULE — the focal serif moment. This is the page's gallery
          centerpiece. Pipe-style single orange spotlight, Liron Moran's
          oversized serif as the signature. Ambient orange glow behind it
          is the ONE accent moment on the page. */}
      {activeCommitment ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
          className="relative mb-12 overflow-hidden border-y border-orange-500/15 py-10"
        >
          {/* Ambient warm spotlight behind the rule — the only luxury glow
              on the page. Restraint per Sequel/DNA: one focal moment, not
              every accent simultaneously. */}
          <div
            className="pointer-events-none absolute inset-0 -z-10 opacity-80"
            style={{
              background:
                'radial-gradient(420px at 18% 50%, rgba(255,102,0,0.10), transparent 70%)',
            }}
          />
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-orange-500/70" />
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-orange-400">
              Today&rsquo;s rule
            </p>
          </div>
          <p className="mt-5 font-serif text-[34px] font-normal leading-[1.08] tracking-[-0.015em] text-[#f5f3ee] sm:text-5xl">
            {activeCommitment.rule}
          </p>
          <div className="mt-7 flex items-center justify-between border-t border-white/[0.05] pt-4 font-mono text-[11px] tabular-nums">
            <span className="text-[#8a847a]">
              <span className="text-emerald-400/90">{activeCommitment.keepCount} kept</span>
              {activeCommitment.breakCount > 0 && (
                <> &middot; <span className="text-red-400/90">{activeCommitment.breakCount} broken</span></>
              )}
            </span>
            <Link
              href="/commitments"
              className="uppercase tracking-[0.18em] text-orange-400 transition-colors hover:text-orange-300"
            >
              Manage &rarr;
            </Link>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mb-12 border-y border-white/[0.06] py-10"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a847a]">No rule yet</p>
          <p className="mt-4 font-serif text-3xl font-normal leading-[1.1] tracking-[-0.012em] text-[#f5f3ee] sm:text-4xl">
            Write the line you&rsquo;ll either keep or break today.
          </p>
          <Link
            href="/commitments"
            className="mt-5 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.20em] text-orange-400 transition-colors hover:text-orange-300"
          >
            Set today&rsquo;s rule &rarr;
          </Link>
        </motion.div>
      )}

      {/* QUICK SLIP — the one-tap zero-friction confession affordance.
          Slip logging was 3-8 taps; we removed the form. Sits right above
          the three-primitives grid so that when a user is mid-slip or
          inside an active danger window, the FIRST thing they can do is
          confess in a single click. POST is fully inferred server-side
          (trigger from active window, optional commitment link), and
          the 90-second rescue ritual is one link away if they want it. */}
      <QuickSlipButton />

      {/* THREE PRIMITIVES — quiet, equal-weight. The Today's Rule callout
          already owns the orange spotlight, so these recede into refined
          warm-charcoal cards with hairline borders. Single orange index
          stroke on hover, no rainbow accents. */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="mb-12 grid grid-cols-1 gap-[1px] overflow-hidden border border-white/[0.06] bg-white/[0.04] md:grid-cols-3"
      >
        {[
          { href: '/rescue', icon: Flame, eyebrow: 'Crisis', label: 'I’m about to mess up' },
          { href: '/decide', icon: Brain, eyebrow: 'Support', label: 'What should I do' },
          { href: '/slip', icon: AlertTriangle, eyebrow: 'Recovery', label: 'I already slipped' },
        ].map(({ href, icon: Icon, eyebrow, label }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col gap-3 bg-[#0e0d0b] px-5 py-6 transition-colors hover:bg-[#13110d]"
          >
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8a847a] transition-colors group-hover:text-orange-400/80">
                {eyebrow}
              </p>
              <Icon className="h-3.5 w-3.5 text-[#8a847a] transition-colors group-hover:text-orange-400" />
            </div>
            <p className="font-serif text-[19px] font-normal leading-[1.15] tracking-[-0.01em] text-[#f5f3ee]">
              {label}.
            </p>
          </Link>
        ))}
      </motion.div>

      {/* Editorial metrics rail — gallery-label aesthetic. Tiny mono
          eyebrow, serif read for the figure that matters, mono for the
          delta line. Hairline divider grid in cream tones, not boxes. */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.5 }}
        className="mb-12 grid grid-cols-1 gap-px overflow-hidden border-y border-white/[0.05] bg-white/[0.04] md:grid-cols-3"
      >
        <div className="bg-[#0e0d0b] px-5 py-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8a847a]">Next danger window</p>
          {nextDangerWindow ? (
            <>
              <p className="mt-3 font-serif text-xl font-normal leading-snug tracking-[-0.01em] text-[#f5f3ee]">
                {nextDangerWindow.label}
              </p>
              <p className="mt-1 font-mono text-[11px] tabular-nums text-[#8a847a]">{nextDangerWindow.whenText}</p>
            </>
          ) : (
            <p className="mt-3 font-serif text-xl font-normal text-[#8a847a]">None mapped yet.</p>
          )}
        </div>

        <div className="bg-[#0e0d0b] px-5 py-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8a847a]">Self-trust</p>
          <div className="mt-3 flex items-baseline gap-2">
            <AnimatedCounter
              value={user.selfTrustScore ?? 0}
              className="font-serif text-4xl font-normal tabular-nums tracking-[-0.02em] text-[#f5f3ee]"
            />
            <span className="font-mono text-[11px] tabular-nums text-[#8a847a]">/ 100</span>
          </div>
          {selfTrustDelta != null && selfTrustDelta !== 0 && (
            <p
              className={`mt-1 font-mono text-[10px] uppercase tracking-[0.18em] tabular-nums ${
                selfTrustDelta > 0 ? 'text-emerald-400/90' : 'text-red-400/90'
              }`}
            >
              {selfTrustDelta > 0 ? '↑' : '↓'} {Math.abs(selfTrustDelta)} this week
            </p>
          )}
        </div>

        <div className="bg-[#0e0d0b] px-5 py-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8a847a]">Excuse detected</p>
          {topExcuseCategory && topExcuseCount && topExcuseCount > 1 ? (
            <>
              <p className="mt-3 font-serif text-lg font-normal italic leading-snug tracking-[-0.005em] text-[#f5f3ee]">
                &ldquo;{EXCUSE_TAG[topExcuseCategory] ?? topExcuseCategory.toLowerCase().replace('_', ' ')}&rdquo;
              </p>
              <p className="mt-1 font-mono text-[10px] tabular-nums text-[#8a847a]">
                {topExcuseCount}&times; this week &middot; we&rsquo;ll catch it
              </p>
            </>
          ) : (
            <p className="mt-3 font-serif text-lg font-normal italic text-[#8a847a]">Not enough yet.</p>
          )}
        </div>
      </motion.div>

      {/* DAILY NUMBER — the Wordle-style ritual card. ONE number, ONE
          identity sentence, one-tap share; same atom the public /d/[code]
          page and the 1080×1080 PNG render. The cream card is a
          deliberate tonal break on the dark canvas — the shareable
          artifact should read as an object, not another panel. Width
          capped so it stays a card, not a takeover. */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.26, duration: 0.5 }}
        className="mb-12"
      >
        <div className="mb-5 flex items-baseline justify-between border-b border-white/[0.05] pb-3">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a847a]">
            Today&rsquo;s number
          </h2>
        </div>
        <div className="max-w-md">
          <DailyCard />
        </div>
      </motion.div>

      {/* Recent interrupts — visible proof the JITAI claim is real.
          planType drives the empty-state copy: FREE users see the
          3-a-week cap + upgrade hook; paid users see the standard line.
          pendingCatch swaps the empty state for the concrete first-catch
          promise ("Tonight at 9:30 PM. We'll catch you there."). */}
      <div className="mb-12">
        <InterruptHistory planType={user.planType} pendingCatch={pendingCatch} />
      </div>

      {/* Quiet text-link rail — ghosted ritual entry points. Editorial
          column-of-links pattern from Christopher Ireland Creative
          (refero f293bacf), translated into a horizontal rail. */}
      <div className="mb-12 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/[0.05] pt-6 font-mono text-[11px] uppercase tracking-[0.18em]">
        <Link
          href="/chat?mode=morning"
          className="inline-flex items-center gap-2 text-[#a39d92] transition-colors hover:text-[#f5f3ee]"
        >
          <Sun className="h-3 w-3 text-[#8a847a]" />
          Set today&rsquo;s rule
        </Link>
        <Link
          href="/chat?mode=night"
          className="inline-flex items-center gap-2 text-[#a39d92] transition-colors hover:text-[#f5f3ee]"
        >
          <Moon className="h-3 w-3 text-[#8a847a]" />
          Did you keep your word
        </Link>
        <CalloutPanel
          userId={user.id}
          trigger={
            <span className="inline-flex items-center gap-2 text-[#a39d92] transition-colors hover:text-orange-400">
              <Flame className="h-3 w-3 text-orange-400/80" />
              Be brutally honest
            </span>
          }
        />
      </div>

      {/* Daily numerals — Sequel-style ledger row. Serif numbers, mono
          labels, hairline-bordered surfaces. No colored badges, no
          rainbow icon backgrounds. Calm operator data. */}
      <StaggerList className="mb-12 grid grid-cols-2 gap-px overflow-hidden border-y border-white/[0.05] bg-white/[0.04] sm:grid-cols-4">
        {[
          { label: 'Due today', value: dueTodayTasks.length, icon: Clock },
          { label: 'Overdue', value: overdueTasks.length, icon: AlertTriangle },
          { label: 'Follow-ups', value: followUpsDueToday.length, icon: RefreshCw },
          { label: 'Done today', value: recentlyCompleted.length, icon: CheckCircle2 },
        ].map((stat) => (
          <StaggerItem key={stat.label}>
            <div className="flex h-full flex-col justify-between bg-[#0e0d0b] px-4 py-5">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8a847a]">
                  {stat.label}
                </p>
                <stat.icon className="h-3 w-3 text-[#8a847a]" />
              </div>
              <AnimatedCounter
                value={stat.value}
                className="mt-4 font-serif text-3xl font-normal leading-none tabular-nums tracking-[-0.02em] text-[#f5f3ee]"
              />
            </div>
          </StaggerItem>
        ))}
      </StaggerList>

      {/* Top priorities */}
      {criticalTasks.length > 0 && (
        <Section title="Top priorities" count={criticalTasks.length} className="mb-10">
          <StaggerList className="space-y-1.5">
            {criticalTasks.map((task) => (
              <StaggerItem key={task.id}>
                <TaskCard task={task} compact />
              </StaggerItem>
            ))}
          </StaggerList>
        </Section>
      )}

      {/* Due today */}
      {dueTodayTasks.length > 0 && (
        <Section title="Due today" count={dueTodayTasks.length} className="mb-10">
          <StaggerList className="space-y-1.5">
            {dueTodayTasks.map((task) => (
              <StaggerItem key={task.id}>
                <TaskCard task={task} />
              </StaggerItem>
            ))}
          </StaggerList>
        </Section>
      )}

      {/* Follow-ups */}
      {followUpsDueToday.length > 0 && (
        <Section title="Follow-ups due" count={followUpsDueToday.length} className="mb-10">
          <StaggerList className="space-y-1.5">
            {followUpsDueToday.map((task) => (
              <StaggerItem key={task.id}>
                <TaskCard task={task} showFollowUp />
              </StaggerItem>
            ))}
          </StaggerList>
        </Section>
      )}

      {/* Overdue */}
      {overdueTasks.length > 0 && (
        <Section
          title="Overdue"
          count={overdueTasks.length}
          countVariant="destructive"
          className="mb-10"
        >
          <StaggerList className="space-y-1.5">
            {overdueTasks.map((task) => (
              <StaggerItem key={task.id}>
                <TaskCard task={task} showOverdue />
              </StaggerItem>
            ))}
          </StaggerList>
        </Section>
      )}

      {/* All-caught-up — serif moment, not a celebratory medal. The
          luxury read is "calm", not "congratulations". */}
      {totalAttention === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="border-y border-white/[0.05] py-16 text-center"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a847a]">
            Today
          </p>
          <p className="mx-auto mt-4 max-w-md font-serif text-3xl font-normal leading-[1.12] tracking-[-0.012em] text-[#f5f3ee] sm:text-4xl">
            All clear. The quiet is the reward.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.20em] text-orange-400 transition-colors hover:text-orange-300"
          >
            <Plus className="h-3 w-3" /> Add a task
          </button>
        </motion.div>
      )}

      {/* Recently completed */}
      <AnimatePresence>
        {recentlyCompleted.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-12">
            <Separator className="mb-8 bg-white/[0.05]" />
            <Section title="Completed today" count={recentlyCompleted.length}>
              <ul className="divide-y divide-white/[0.04]">
                {recentlyCompleted.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center gap-3 py-2.5 transition-colors hover:bg-white/[0.02]"
                  >
                    <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500/80" />
                    <span className="font-sans text-[13px] text-[#8a847a] line-through decoration-[#8a847a]/40">
                      {task.title}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB — refined warm-orange disc, the second restrained orange
          touchpoint. Editorial gallery icon button, not a glowing alarm. */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.35, type: 'spring', stiffness: 360, damping: 24 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-8 right-8 flex h-12 w-12 items-center justify-center rounded-full border border-orange-500/30 bg-[#13110d] text-orange-400 shadow-[0_0_28px_-8px_rgba(255,102,0,0.45)] transition-colors hover:border-orange-500/55 hover:text-orange-300"
        aria-label="Add task"
      >
        <Plus className="h-4 w-4" />
      </motion.button>

      <AnimatePresence>
        {showCreateModal && (
          <TaskCreateModal onClose={() => setShowCreateModal(false)} />
        )}
      </AnimatePresence>
    </PageTransition>
  )
}

function Section({
  title,
  count,
  countVariant = 'secondary',
  children,
  className,
}: {
  title: string
  count?: number
  countVariant?: 'secondary' | 'destructive'
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={className}>
      <div className="mb-5 flex items-baseline justify-between border-b border-white/[0.05] pb-3">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#8a847a]">
          {title}
        </h2>
        {count !== undefined && (
          <span
            className={`font-mono text-[10px] tabular-nums ${
              countVariant === 'destructive' ? 'text-red-400/80' : 'text-[#8a847a]'
            }`}
          >
            {String(count).padStart(2, '0')}
          </span>
        )}
      </div>
      {children}
    </section>
  )
}
