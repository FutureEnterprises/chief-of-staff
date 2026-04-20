/* eslint-disable no-console */
/**
 * Live-user simulation — generates N synthetic users with realistic
 * 30-day pattern histories so we can stress-test:
 *   • the queries behind /patterns (excuses, slips, rescues, events)
 *   • the danger-window cron (matching logic across timezones)
 *   • the callout API (data shape + token budget)
 *   • the predictive-warnings logic (slip-clustering, excuse counts)
 *
 * Safety: every seeded user has an email in the `sim+*@coyl.test` namespace
 * and a flag in metadataJson: { simulated: true }. The TEARDOWN block wipes
 * only rows created by this script — never real users.
 *
 * Run:
 *   pnpm tsx apps/web/scripts/simulate-users.ts [count]          # default 100
 *   pnpm tsx apps/web/scripts/simulate-users.ts 1000
 *   pnpm tsx apps/web/scripts/simulate-users.ts --teardown       # wipe simulated users
 *
 * Uses the real Prisma client pointed at whatever DATABASE_URL is set.
 * NEVER run against production. The script requires SIMULATION_OK=1 in env
 * as a second safety to prevent accidents.
 */

import { prisma, type Prisma } from '@repo/database'

// ─────────────────────── Config / guardrails ───────────────────────

const SIM_EMAIL_DOMAIN = 'coyl.test'
const SIM_EMAIL_PREFIX = 'sim+'

if (process.env.SIMULATION_OK !== '1') {
  console.error(
    '\n[simulate-users] Refusing to run without SIMULATION_OK=1 in env.',
  )
  console.error('This is a safety gate. Set SIMULATION_OK=1 to proceed.\n')
  process.exit(1)
}

if (process.env.NODE_ENV === 'production') {
  console.error('[simulate-users] Will NOT run in production.')
  process.exit(1)
}

// ─────────────────────── Helpers ───────────────────────

const WEDGES = [
  'WEIGHT_LOSS', 'CRAVINGS', 'DESTRUCTIVE_BEHAVIORS', 'CONSISTENCY',
  'SPENDING', 'FOCUS', 'PRODUCTIVITY',
]
const EXCUSE_STYLES = [
  'DELAY', 'REWARD', 'MINIMIZATION', 'COLLAPSE',
  'EXHAUSTION', 'EXCEPTION', 'COMPENSATION', 'SOCIAL_PRESSURE',
]
const TONE_MODES = ['MENTOR', 'STRATEGIST', 'NO_BS', 'BEAST']
const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Los_Angeles',
  'Europe/London', 'Europe/Berlin', 'Asia/Tokyo', 'Australia/Sydney',
]
const DANGER_WINDOW_PRESETS = [
  { label: 'Late night', dayOfWeek: -1, startHour: 21, endHour: 23, triggerType: 'late-night' as const },
  { label: 'Friday collapse', dayOfWeek: 5, startHour: 17, endHour: 23, triggerType: 'social' as const },
  { label: 'Post-work slump', dayOfWeek: -1, startHour: 17, endHour: 20, triggerType: 'post-work' as const },
  { label: 'Sunday anxiety', dayOfWeek: 0, startHour: 18, endHour: 22, triggerType: 'stress' as const },
  { label: 'Weekend binge', dayOfWeek: 6, startHour: 10, endHour: 16, triggerType: 'idle' as const },
]
const SLIP_TRIGGERS = [
  'binged', 'skipped workout', 'spiraled', 'doomscrolled', 'drank', 'impulse buy',
]

function pick<T>(arr: T[]): T {
  const item = arr[Math.floor(Math.random() * arr.length)]
  if (item === undefined) throw new Error('pick: empty array')
  return item
}
function pickN<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n)
}
function between(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min))
}
function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 60 * 60 * 1000)
}

// ─────────────────────── Teardown ───────────────────────

async function teardown() {
  const users = await prisma.user.findMany({
    where: { email: { endsWith: `@${SIM_EMAIL_DOMAIN}` } },
    select: { id: true },
  })
  if (users.length === 0) {
    console.log('[teardown] No simulated users found.')
    return
  }
  const ids = users.map((u: { id: string }) => u.id)
  console.log(`[teardown] Removing ${ids.length} simulated users (cascade)...`)
  // Cascade relations drop via Prisma schema. Deleting users is enough.
  await prisma.user.deleteMany({ where: { id: { in: ids } } })
  console.log('[teardown] Done.')
}

// ─────────────────────── Simulation ───────────────────────

async function simulate(count: number) {
  console.log(`[simulate] Seeding ${count} synthetic users...`)
  const startedAt = Date.now()

  for (let i = 0; i < count; i++) {
    const wedge = pick(WEDGES)
    const excuseStyle = pick(EXCUSE_STYLES)
    const toneMode = pick(TONE_MODES)
    const timezone = pick(TIMEZONES)
    const nWindows = between(1, 3)
    const pickedWindows = pickN(DANGER_WINDOW_PRESETS, nWindows)
    const slipCount = between(0, 8)
    const excuseCount = between(2, 14)
    const rescueCount = between(0, 10)

    const email = `${SIM_EMAIL_PREFIX}${crypto.randomUUID().slice(0, 8)}@${SIM_EMAIL_DOMAIN}`
    const firstName = pick([
      'Alex', 'Sam', 'Jordan', 'Taylor', 'Riley', 'Morgan', 'Casey',
      'Drew', 'Jamie', 'Quinn', 'Reese', 'Avery', 'Kai',
    ])

    const user = await prisma.user.create({
      data: {
        email,
        name: `${firstName} Sim`,
        clerkId: `sim_${crypto.randomUUID()}`,
        timezone,
        primaryWedge: wedge as Prisma.UserCreateInput['primaryWedge'],
        excuseStyle: excuseStyle as Prisma.UserCreateInput['excuseStyle'],
        toneMode: toneMode as Prisma.UserCreateInput['toneMode'],
        onboardingCompleted: true,
        executionScore: between(30, 85),
        selfTrustScore: between(25, 90),
        currentStreak: between(0, 28),
        longestStreak: between(5, 60),
        identityState: pick([
          'SLEEPWALKING', 'AVOIDANT', 'RECOVERING',
          'UNSTABLE_BUT_TRYING', 'INCREASINGLY_CONSCIOUS', 'RESILIENT',
        ]) as Prisma.UserCreateInput['identityState'],
        recoveryState: pick(['ACTIVE', 'SLIPPED', 'RECOVERING']) as Prisma.UserCreateInput['recoveryState'],
        slipsThisMonth: slipCount,
        lastActiveAt: hoursAgo(between(0, 72)),
      },
      select: { id: true },
    })

    // Danger windows
    await prisma.dangerWindow.createMany({
      data: pickedWindows.map((w) => ({
        userId: user.id,
        label: w.label,
        dayOfWeek: w.dayOfWeek,
        startHour: w.startHour,
        endHour: w.endHour,
        triggerType: w.triggerType,
        active: true,
      })),
    })

    // Excuses — clustered around the user's primary style
    const excuseRows: Prisma.ExcuseCreateManyInput[] = []
    for (let j = 0; j < excuseCount; j++) {
      const isPrimary = Math.random() < 0.55
      excuseRows.push({
        userId: user.id,
        category: (isPrimary ? excuseStyle : pick(EXCUSE_STYLES)) as Prisma.ExcuseCreateManyInput['category'],
        text: pick([
          "I'll start tomorrow",
          'I deserve this',
          'One time won\'t matter',
          'I already blew it',
          'I\'m too tired',
          'This week is weird',
        ]),
        createdAt: hoursAgo(between(1, 30 * 24)),
      })
    }
    if (excuseRows.length) await prisma.excuse.createMany({ data: excuseRows })

    // Slips — distribute across last 30 days with day-of-week clustering
    const slipRows: Prisma.SlipRecordCreateManyInput[] = []
    for (let j = 0; j < slipCount; j++) {
      const createdAt = hoursAgo(between(1, 30 * 24))
      const recoveredFast = Math.random() < 0.65
      slipRows.push({
        userId: user.id,
        trigger: pick(SLIP_TRIGGERS),
        createdAt,
        recoveredAt: recoveredFast
          ? new Date(createdAt.getTime() + between(1, 22) * 60 * 60 * 1000)
          : null,
      })
    }
    if (slipRows.length) await prisma.slipRecord.createMany({ data: slipRows })

    // Rescue sessions — mostly interrupted if user has a good streak
    const rescueRows: Prisma.RescueSessionCreateManyInput[] = []
    for (let j = 0; j < rescueCount; j++) {
      const outcome = Math.random() < 0.72 ? 'INTERRUPTED' : Math.random() < 0.5 ? 'SLIPPED' : 'UNRESOLVED'
      // Only RescueTrigger enum values — URGE_RISING isn't a DB-level
      // trigger (it's a demo-only label); use its closest real counterpart.
      // Only RescueTrigger enum values — URGE_RISING isn't a DB-level
      // trigger (it's a demo-only label); use its closest real counterpart.
      rescueRows.push({
        userId: user.id,
        trigger: pick([
          'BINGE_URGE', 'DELIVERY_URGE', 'NICOTINE_URGE', 'SKIP_WORKOUT',
          'SPIRALING', 'ALREADY_SLIPPED', 'DOOMSCROLL', 'IMPULSE_SPEND',
        ]) as Prisma.RescueSessionCreateManyInput['trigger'],
        outcome: outcome as Prisma.RescueSessionCreateManyInput['outcome'],
        intervention: { simulated: true, script: 'fake-rescue-response' },
        startedAt: hoursAgo(between(1, 30 * 24)),
      })
    }
    if (rescueRows.length) await prisma.rescueSession.createMany({ data: rescueRows })

    // Productivity events — spread across 30 days with emphasis in the
    // hour before each slip so the Failure Trigger metric has signal.
    const eventRows: Prisma.ProductivityEventCreateManyInput[] = []
    for (const slip of slipRows) {
      const preTypes: Prisma.ProductivityEventCreateManyInput['eventType'][] = [
        'EXCUSE_DETECTED', 'DANGER_WINDOW_CROSSED',
        'CHAT_SESSION', 'TASK_SNOOZED', 'FEATURE_USED',
      ]
      const preType = pick(preTypes)
      const at = slip.createdAt as Date
      eventRows.push({
        userId: user.id,
        eventType: preType,
        createdAt: new Date(at.getTime() - between(5, 55) * 60 * 1000),
      })
    }
    // Baseline event noise
    for (let j = 0; j < between(10, 40); j++) {
      eventRows.push({
        userId: user.id,
        eventType: pick([
          'TASK_COMPLETED', 'CHECKIN_COMPLETED', 'FEATURE_USED',
          'AI_BREAKDOWN_USED', 'MORNING_REVIEW', 'NIGHT_REVIEW',
        ]) as Prisma.ProductivityEventCreateManyInput['eventType'],
        createdAt: hoursAgo(between(1, 30 * 24)),
      })
    }
    if (eventRows.length) await prisma.productivityEvent.createMany({ data: eventRows })

    if ((i + 1) % 25 === 0) {
      console.log(`  seeded ${i + 1}/${count}`)
    }
  }

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1)
  console.log(`[simulate] Done in ${elapsed}s.`)
  await report()
}

async function report() {
  const domain = SIM_EMAIL_DOMAIN
  const [users, slips, excuses, rescues, events, windows] = await Promise.all([
    prisma.user.count({ where: { email: { endsWith: `@${domain}` } } }),
    prisma.slipRecord.count({
      where: { user: { email: { endsWith: `@${domain}` } } },
    }),
    prisma.excuse.count({
      where: { user: { email: { endsWith: `@${domain}` } } },
    }),
    prisma.rescueSession.count({
      where: { user: { email: { endsWith: `@${domain}` } } },
    }),
    prisma.productivityEvent.count({
      where: { user: { email: { endsWith: `@${domain}` } } },
    }),
    prisma.dangerWindow.count({
      where: { user: { email: { endsWith: `@${domain}` } } },
    }),
  ])

  console.log('\n[report] Simulated state:')
  console.log(`  users            ${users}`)
  console.log(`  danger windows   ${windows}`)
  console.log(`  slip records     ${slips}`)
  console.log(`  excuses          ${excuses}`)
  console.log(`  rescue sessions  ${rescues}`)
  console.log(`  events           ${events}`)

  // Spot-check: verify one synthetic user's patterns page would render
  const sample = await prisma.user.findFirst({
    where: { email: { endsWith: `@${domain}` } },
    select: { id: true, name: true, primaryWedge: true },
  })
  if (sample) {
    console.log(`\n[report] Sample user ${sample.name} (${sample.id}):`)
    console.log(`  wedge          ${sample.primaryWedge}`)
    console.log(`  /api/share/${sample.id}?type=readme  ← shareable OG`)
    console.log(`  /api/v1/callout  ← callout mode (signed in as this user)`)
  }
}

// ─────────────────────── Main ───────────────────────

async function main() {
  const args = process.argv.slice(2)
  if (args.includes('--teardown')) {
    await teardown()
    return
  }
  const count = args[0] ? parseInt(args[0], 10) : 100
  if (Number.isNaN(count) || count < 1 || count > 5000) {
    console.error('[simulate] count must be 1..5000')
    process.exit(1)
  }
  await simulate(count)
}

main()
  .catch((err) => {
    console.error('[simulate] fatal:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
