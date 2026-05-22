/**
 * archetype-defaults — deterministic mapping from a user's audit-resolved
 * archetype family to:
 *   - 2-3 inferred DangerWindow rows we can persist immediately
 *   - 2-3 suggested Commitment rules the user can one-tap activate
 *
 * Why this exists:
 * Today, the audit ends with the user "knowing themselves" but standing in
 * front of an empty app. We watched that handoff drop conversion through the
 * floor. This file is the closed-loop fix: the moment we know the family,
 * we pre-build defaults that match the family's *actual* behavior — the
 * 9 PM Negotiator gets late-night kitchen windows, the Monday Resetter
 * gets Sunday-night + Monday-morning windows, the Deserver gets
 * post-effort reward windows, etc. The user lands on /today already
 * partially set up.
 *
 * Why deterministic (no AI call):
 *   - Sub-100ms latency. The audit-completion handoff is the worst place
 *     to add a network-bound model invocation.
 *   - Reliability. The defaults are curated, not stochastic.
 *   - Cost. This runs on every audit completion.
 *
 * The shape of windows + commitments tracks the existing schema (see
 * packages/database/prisma/schema.prisma): DangerWindow has a `source`
 * column that we set to 'inferred' so the user (and the UI) can tell
 * what the system pre-built vs what they built themselves. Commitments
 * are RETURNED ONLY — we do not create Commitment rows here. The user
 * has to confirm via the one-tap activate surface; that confirmation
 * keeps the trust contract honest.
 *
 * Each family ships with 2-3 windows + 2-3 suggestions, picked from the
 * archetype's signature script + behavioral fingerprint in
 * `audit-archetype.ts`. Quality over count: a family with no clean third
 * default gets two well-aimed ones.
 */
import type { ArchetypeFamily } from '@/lib/audit-archetype'
import type { CommitmentDomain } from '@repo/database'

/**
 * Default DangerWindow shape we'll persist with `source: 'inferred'`.
 * Mirrors the DangerWindow Prisma model columns we set on create —
 * userId + source are added at insert time.
 *
 *   dayOfWeek: 0 (Sun)..6 (Sat), or -1 for "all days"
 *   triggerType: 'stress' | 'social' | 'idle' | 'post-work' | 'late-night'
 *     (matches the values used in the existing onboarding seed and the
 *      dangerWindowInference prompt's allowed set)
 */
export type DefaultDangerWindow = {
  label: string
  dayOfWeek: number
  startHour: number
  endHour: number
  triggerType: string
}

/**
 * Suggested commitment shape returned to the client for one-tap activate.
 * The rationale is the *user-facing* sentence — one line, recognizable.
 * The client surface displays it directly.
 */
export type SuggestedCommitment = {
  rule: string
  domain: CommitmentDomain
  rationale: string
}

export type ArchetypeDefaults = {
  defaultWindows: DefaultDangerWindow[]
  suggestedCommitments: SuggestedCommitment[]
}

/**
 * The big table — one entry per archetype family.
 *
 * The behavioral logic:
 *
 *   the-9pm-negotiator    — bargains after dark; signature "I deserve / one
 *                           time won't matter". Windows: late-night kitchen
 *                           (every day) + weekend negotiation extension.
 *
 *   the-monday-resetter   — resets every week; signature "I'll start
 *                           tomorrow". Windows: Sunday-night reset prep +
 *                           Monday morning execution + mid-week wobble.
 *
 *   the-deserver          — bargains with logic; signature "I deserve
 *                           this". Windows: post-work reward, post-workout
 *                           reward, end-of-meeting reward.
 *
 *   the-one-more-tabber   — drifts during workday focus; signature "just
 *                           one more". Windows: mid-morning tab drift +
 *                           post-lunch slump + afternoon collapse.
 *
 *   the-spiral-extender   — extends one slip into the whole day; signature
 *                           "I already messed up". Windows: post-slip
 *                           afternoon + post-slip evening (both flagged
 *                           as collapse-triggered, all-day to capture any
 *                           slip-time).
 *
 *   the-capitulator       — folds under social presence; signature "I
 *                           couldn't say no". Windows: Friday/Saturday
 *                           evenings (peak social pressure) + post-meeting
 *                           "team agreed" windows.
 */
export const ARCHETYPE_DEFAULTS: Record<ArchetypeFamily, ArchetypeDefaults> = {
  'the-9pm-negotiator': {
    defaultWindows: [
      {
        label: 'Late-night kitchen',
        dayOfWeek: -1,
        startHour: 21,
        endHour: 23,
        triggerType: 'late-night',
      },
      {
        label: 'Weekend late-night extension',
        dayOfWeek: 5, // Fri night spilling into Sat
        startHour: 22,
        endHour: 23,
        triggerType: 'late-night',
      },
      {
        label: 'Sunday-night wind-down',
        dayOfWeek: 0,
        startHour: 21,
        endHour: 23,
        triggerType: 'idle',
      },
    ],
    suggestedCommitments: [
      {
        rule: 'No food after 9 PM',
        domain: 'FOOD',
        rationale:
          'The 9 PM kitchen is where "one time won\'t matter" fires. Hard line, not negotiable.',
      },
      {
        rule: 'Brush teeth at 9 PM as the commit signal',
        domain: 'SLEEP',
        rationale:
          'Toothpaste closes the kitchen. A physical signal lands harder than willpower at hour 14.',
      },
      {
        rule: 'If hungry at 9 PM, drink water and wait 15 minutes',
        domain: 'CRAVING',
        rationale:
          'The 15-minute pause kills the impulse roughly 70% of the time. Decide after, not during.',
      },
    ],
  },

  'the-monday-resetter': {
    defaultWindows: [
      {
        label: 'Sunday night reset prep',
        dayOfWeek: 0,
        startHour: 19,
        endHour: 23,
        triggerType: 'idle',
      },
      {
        label: 'Monday morning execution',
        dayOfWeek: 1,
        startHour: 5,
        endHour: 9,
        triggerType: 'post-work',
      },
      {
        label: 'Wednesday wobble (mid-week reset risk)',
        dayOfWeek: 3,
        startHour: 14,
        endHour: 19,
        triggerType: 'stress',
      },
    ],
    suggestedCommitments: [
      {
        rule: 'Start the one thing today, not tomorrow',
        domain: 'FOCUS',
        rationale:
          '"Tomorrow" is the script. Today is the break. Pick the smallest unit and start it now.',
      },
      {
        rule: 'No "I\'ll start Monday" — pick a Wednesday start instead',
        domain: 'OTHER',
        rationale:
          'Monday is the trap. A Wednesday start refuses the calendar reset and lands inside the week.',
      },
      {
        rule: 'Sunday-night plan: write 1 sentence for Monday',
        domain: 'FOCUS',
        rationale:
          'Sunday-night you bets on Monday-morning you. One specific sentence beats a vague reset.',
      },
    ],
  },

  'the-deserver': {
    defaultWindows: [
      {
        label: 'Post-work reward window',
        dayOfWeek: -1,
        startHour: 17,
        endHour: 20,
        triggerType: 'post-work',
      },
      {
        label: 'Post-workout "earned it" window',
        dayOfWeek: -1,
        startHour: 18,
        endHour: 21,
        triggerType: 'stress',
      },
      {
        label: 'End-of-meeting reward burst',
        dayOfWeek: -1,
        startHour: 11,
        endHour: 14,
        triggerType: 'stress',
      },
    ],
    suggestedCommitments: [
      {
        rule: 'No reward food within 90 minutes of finishing something hard',
        domain: 'FOOD',
        rationale:
          '"I deserve this" fires inside a 90-minute window after effort. Name the window, lose the script.',
      },
      {
        rule: 'Walk 10 minutes before any "I earned this" decision',
        domain: 'EXERCISE',
        rationale:
          'A 10-minute walk strips the urgency out of the reward script. Decide after the walk.',
      },
      {
        rule: 'No reward purchases on the same day as the effort',
        domain: 'SPENDING',
        rationale:
          'Spend-language is the same logic as food-language. Sleep on it, then decide.',
      },
    ],
  },

  'the-one-more-tabber': {
    defaultWindows: [
      {
        label: 'Mid-morning tab drift',
        dayOfWeek: -1,
        startHour: 10,
        endHour: 12,
        triggerType: 'idle',
      },
      {
        label: 'Post-lunch focus collapse',
        dayOfWeek: -1,
        startHour: 13,
        endHour: 15,
        triggerType: 'idle',
      },
      {
        label: 'Late-afternoon scroll vortex',
        dayOfWeek: -1,
        startHour: 15,
        endHour: 17,
        triggerType: 'idle',
      },
    ],
    suggestedCommitments: [
      {
        rule: 'No new tabs during a 25-minute focus block',
        domain: 'FOCUS',
        rationale:
          'The first tab is innocent. The seventh is the afternoon gone. Block the first.',
      },
      {
        rule: 'Phone in another room during deep work',
        domain: 'DIGITAL',
        rationale:
          'The "just to check" reach is the actual loop. Distance kills it cheaper than willpower.',
      },
      {
        rule: 'Close all tabs at 4 PM and restart',
        domain: 'FOCUS',
        rationale:
          'Tab count is a leading indicator of focus state. A clean restart at 4 PM resets the drift.',
      },
    ],
  },

  'the-spiral-extender': {
    defaultWindows: [
      {
        label: 'Post-slip afternoon spiral',
        dayOfWeek: -1,
        startHour: 12,
        endHour: 18,
        triggerType: 'stress',
      },
      {
        label: 'Post-slip evening collapse',
        dayOfWeek: -1,
        startHour: 18,
        endHour: 23,
        triggerType: 'late-night',
      },
    ],
    suggestedCommitments: [
      {
        rule: 'A slip is one slip — the day still counts',
        domain: 'OTHER',
        rationale:
          'The spiral is louder and more expensive than the slip. Name it the moment you hear "I already messed up."',
      },
      {
        rule: 'After a slip, do one tiny commitment-aligned thing within 30 minutes',
        domain: 'OTHER',
        rationale:
          'A 30-minute counter-move interrupts the spiral. The smallest counter-move is enough.',
      },
    ],
  },

  'the-capitulator': {
    defaultWindows: [
      {
        label: 'Friday evening social pressure',
        dayOfWeek: 5,
        startHour: 18,
        endHour: 23,
        triggerType: 'social',
      },
      {
        label: 'Saturday afternoon group plans',
        dayOfWeek: 6,
        startHour: 14,
        endHour: 19,
        triggerType: 'social',
      },
      {
        label: 'Post-meeting "team agreed" capitulation',
        dayOfWeek: -1,
        startHour: 11,
        endHour: 16,
        triggerType: 'social',
      },
    ],
    suggestedCommitments: [
      {
        rule: 'Pre-commit your answer before walking into a social setting',
        domain: 'OTHER',
        rationale:
          'Decisions made alone hold. Decisions made in the room break. Pre-commit beats willpower.',
      },
      {
        rule: 'One "no" per social event, said out loud',
        domain: 'RELATIONSHIP',
        rationale:
          'Practice the "no" before you need it. The first one is the cliff; the next ones are cheap.',
      },
      {
        rule: 'Text a witness your line before the event starts',
        domain: 'RELATIONSHIP',
        rationale:
          'A witnessed line is a load-bearing line. Social context dissolves private rules — make it social-proof.',
      },
    ],
  },
}

/**
 * Get defaults for a family. Returns the table entry — no fallback needed
 * because the type system constrains the input.
 */
export function getArchetypeDefaults(family: ArchetypeFamily): ArchetypeDefaults {
  return ARCHETYPE_DEFAULTS[family]
}

/**
 * Regex extractor for "extra" windows from raw audit Q&A text.
 *
 * The /api/v1/audit/finalize endpoint passes the user's answer strings
 * through this. If the user mentioned a specific time ("I struggle at
 * 9 PM", "Friday nights are hardest"), we synthesize an additional
 * DangerWindow on top of the archetype defaults. The output is merged
 * de-duplicated by (dayOfWeek, startHour) — same time-of-day on the
 * same day is one window.
 *
 * Deliberately NOT an AI call. Patterns:
 *   - "9 PM", "9pm", "21:00", "9:30 PM"  → an hour anchor (one-hour window)
 *   - "Friday", "Saturday", ... ("nights" → late-night context)
 *   - "weekends" → both Sat and Sun
 *
 * Conservative — bad parses just don't fire. False positives are worse
 * than false negatives here; the archetype defaults already give us a
 * floor.
 */
export function extractWindowsFromAnswers(
  answers: Array<{ q: string; a: string }>,
): DefaultDangerWindow[] {
  const out: DefaultDangerWindow[] = []
  const seen = new Set<string>()

  const dayMap: Record<string, number[]> = {
    sunday: [0],
    monday: [1],
    tuesday: [2],
    wednesday: [3],
    thursday: [4],
    friday: [5],
    saturday: [6],
    weekend: [0, 6],
    weekends: [0, 6],
    weekday: [1, 2, 3, 4, 5],
    weekdays: [1, 2, 3, 4, 5],
  }

  for (const { a } of answers) {
    if (!a || typeof a !== 'string') continue
    const lower = a.toLowerCase()

    // Find any time references first. Match "9 PM", "9pm", "9:30 PM", "21:00".
    const times: Array<{ hour: number; ampm: boolean }> = []
    const timeRegex = /(\b\d{1,2})(?::(\d{2}))?\s*(am|pm)\b|\b([01]?\d|2[0-3]):([0-5]\d)\b/gi
    let m: RegExpExecArray | null
    while ((m = timeRegex.exec(lower)) !== null) {
      if (m[1] && m[3]) {
        // 12-hour format
        let h = Number(m[1])
        if (h < 1 || h > 12) continue
        if (m[3] === 'pm' && h !== 12) h += 12
        else if (m[3] === 'am' && h === 12) h = 0
        times.push({ hour: h, ampm: true })
      } else if (m[4]) {
        // 24-hour format
        const h = Number(m[4])
        if (h >= 0 && h <= 23) times.push({ hour: h, ampm: false })
      }
    }

    // Find day references.
    const days = new Set<number>()
    for (const word of Object.keys(dayMap)) {
      if (lower.includes(word)) {
        for (const d of dayMap[word]!) days.add(d)
      }
    }
    // "night" / "nights" mentioned without a specific time → bias to 21-23.
    const nightOnly = (lower.includes('night') || lower.includes('evening')) && times.length === 0

    const effectiveDays = days.size > 0 ? Array.from(days) : [-1]

    if (times.length > 0) {
      for (const t of times) {
        for (const d of effectiveDays) {
          const startHour = t.hour
          const endHour = Math.min(23, startHour + 1)
          const trigger =
            startHour >= 21 || startHour < 5
              ? 'late-night'
              : startHour >= 17
                ? 'post-work'
                : 'stress'
          const key = `${d}|${startHour}`
          if (seen.has(key)) continue
          seen.add(key)
          out.push({
            label: `User-mentioned window (${formatHour(startHour)})`,
            dayOfWeek: d,
            startHour,
            endHour,
            triggerType: trigger,
          })
        }
      }
    } else if (nightOnly) {
      for (const d of effectiveDays) {
        const key = `${d}|21`
        if (seen.has(key)) continue
        seen.add(key)
        out.push({
          label: `User-mentioned late-night window`,
          dayOfWeek: d,
          startHour: 21,
          endHour: 23,
          triggerType: 'late-night',
        })
      }
    }
  }

  // Cap at 3 extras so we don't blow past the archetype defaults.
  return out.slice(0, 3)
}

function formatHour(h: number): string {
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  const meridiem = h < 12 ? 'AM' : 'PM'
  return `${h12} ${meridiem}`
}
