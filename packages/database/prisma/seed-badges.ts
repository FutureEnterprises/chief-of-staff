import { PrismaClient } from '../../../apps/web/.prisma/client'

const prisma = new PrismaClient()

const BADGES = [
  // Streak badges
  { slug: 'streak-7', name: 'Week Warrior', description: '7-day completion streak', emoji: '🔥', category: 'streak', xpReward: 20, requirement: { type: 'streak', value: 7 } },
  { slug: 'streak-14', name: 'Two-Week Terror', description: '14-day completion streak', emoji: '💪', category: 'streak', xpReward: 40, requirement: { type: 'streak', value: 14 } },
  { slug: 'streak-30', name: 'Monthly Machine', description: '30-day completion streak', emoji: '⚡', category: 'streak', xpReward: 100, requirement: { type: 'streak', value: 30 } },
  { slug: 'streak-60', name: 'Relentless', description: '60-day completion streak', emoji: '🏆', category: 'streak', xpReward: 200, requirement: { type: 'streak', value: 60 } },
  { slug: 'streak-100', name: 'Unstoppable', description: '100-day completion streak', emoji: '👑', category: 'streak', xpReward: 500, requirement: { type: 'streak', value: 100 } },

  // Score badges
  { slug: 'score-50', name: 'Getting Serious', description: 'Execution Score hit 50', emoji: '📈', category: 'completion', xpReward: 15, requirement: { type: 'score', value: 50 } },
  { slug: 'score-70', name: 'High Performer', description: 'Execution Score hit 70', emoji: '🎯', category: 'completion', xpReward: 30, requirement: { type: 'score', value: 70 } },
  { slug: 'score-90', name: 'Elite Executor', description: 'Execution Score hit 90', emoji: '💎', category: 'completion', xpReward: 75, requirement: { type: 'score', value: 90 } },

  // Completion badges
  { slug: 'complete-10', name: 'First Ten', description: 'Complete 10 tasks', emoji: '✅', category: 'completion', xpReward: 10, requirement: { type: 'completions', value: 10 } },
  { slug: 'complete-50', name: 'Half Century', description: 'Complete 50 tasks', emoji: '🔨', category: 'completion', xpReward: 25, requirement: { type: 'completions', value: 50 } },
  { slug: 'complete-100', name: 'Centurion', description: 'Complete 100 tasks', emoji: '💯', category: 'completion', xpReward: 50, requirement: { type: 'completions', value: 100 } },
  { slug: 'complete-500', name: 'Task Destroyer', description: 'Complete 500 tasks', emoji: '🗡️', category: 'completion', xpReward: 150, requirement: { type: 'completions', value: 500 } },

  // Level badges
  { slug: 'level-5', name: 'Enforcer', description: 'Reach Level 5', emoji: '🛡️', category: 'enforcement', xpReward: 0, requirement: { type: 'level', value: 5 } },
  { slug: 'level-10', name: 'Apex Predator', description: 'Reach Level 10', emoji: '🦁', category: 'enforcement', xpReward: 0, requirement: { type: 'level', value: 10 } },
]

const CHALLENGES = [
  {
    slug: 'beast-mode-7',
    name: '7-Day Beast Mode',
    description: 'Complete at least 1 task every day for 7 days straight. No excuses.',
    emoji: '🔥',
    durationDays: 7,
    rules: { type: 'daily_completions', min: 1 },
    xpReward: 75,
    badgeSlug: 'streak-7',
  },
  {
    slug: 'no-excuses-14',
    name: '14-Day No Excuses',
    description: 'Two weeks of daily execution. Miss one day and you fail.',
    emoji: '💀',
    durationDays: 14,
    rules: { type: 'daily_completions', min: 1 },
    xpReward: 150,
    badgeSlug: 'streak-14',
  },
  {
    slug: 'score-attack',
    name: 'Score Attack',
    description: 'Get your Execution Score above 80 within 30 days.',
    emoji: '🎯',
    durationDays: 30,
    rules: { type: 'score_threshold', min: 80 },
    xpReward: 200,
    badgeSlug: 'score-90',
  },
  {
    slug: 'task-blitz',
    name: 'Task Blitz',
    description: 'Complete 50 tasks in 7 days. Speed run your backlog.',
    emoji: '⚡',
    durationDays: 7,
    rules: { type: 'total_completions', min: 50 },
    xpReward: 100,
    badgeSlug: null,
  },
]

async function main() {
  console.log('Seeding badges...')
  for (const badge of BADGES) {
    await prisma.badge.upsert({
      where: { slug: badge.slug },
      update: badge,
      create: badge,
    })
  }
  console.log(`Seeded ${BADGES.length} badges`)

  console.log('Seeding challenges...')
  for (const challenge of CHALLENGES) {
    await prisma.challenge.upsert({
      where: { slug: challenge.slug },
      update: challenge,
      create: challenge,
    })
  }
  console.log(`Seeded ${CHALLENGES.length} challenges`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
