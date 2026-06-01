/**
 * Archetype data + deterministic scoring for the consumer quiz flow.
 *
 * This is a self-contained module for the public `(quiz)` route group — it has
 * no dependency on auth, the EAP coordinator, or the signed-in API surface. The
 * quiz tallies Q1 + Q2 toward a behavioural "family"; the highest-scoring family
 * wins, ties broken by the Q1 answer (the strongest single signal).
 *
 * NEDA-SAFETY: every string here is behavioural / pattern framing. There is
 * deliberately no calorie / weight / body / diet language anywhere — this is a
 * self-knowledge artefact, not a health tool.
 */

export type FamilySlug =
  | 'the-9pm-negotiator'
  | 'the-monday-resetter'
  | 'the-deserver'
  | 'the-one-more-tabber'
  | 'the-spiral-extender'
  | 'the-capitulator'

export type Family = {
  name: string
  essence: string
  signature: string
  prevalence: string
  window: string
}

export const FAMILIES: Record<FamilySlug, Family> = {
  'the-9pm-negotiator': {
    name: 'The 9 PM Negotiator',
    essence: 'You bargain with yourself the moment your willpower drops.',
    signature: '"One time won\'t matter."',
    prevalence: '69% of you tell yourself this — and 0% have ever been right about it.',
    window: '9:00 PM – 11:30 PM · Thu–Sat',
  },
  'the-monday-resetter': {
    name: 'The Monday Resetter',
    essence: 'Tomorrow is the script. Today is the break.',
    signature: '"I\'ll start tomorrow."',
    prevalence: '82% of you say "tomorrow" 3× a week — the average tomorrow is six tomorrows away.',
    window: 'Sunday evening · the night before every "fresh start"',
  },
  'the-deserver': {
    name: 'The Deserver',
    essence: 'Reward language is your favourite trapdoor.',
    signature: '"I deserve this."',
    prevalence: '78% of you say this within 90 minutes of finishing something hard.',
    window: 'After a hard day · 6:00 – 9:00 PM',
  },
  'the-one-more-tabber': {
    name: 'The One-More-Tabber',
    essence: 'Focus dies one tab, one scroll, one tiny detour at a time.',
    signature: '"Just one more thing."',
    prevalence: '71% of you lost a deep-work block this week to a tab you opened "just to check."',
    window: 'Mid-morning · 11 AM, the first detour',
  },
  'the-spiral-extender': {
    name: 'The Spiral Extender',
    essence: 'One slip becomes the whole night.',
    signature: '"I already messed up anyway."',
    prevalence: '74% of you fold the whole day after one slip — the cost is the spiral, not the slip.',
    window: 'Right after the first slip · any time',
  },
  'the-capitulator': {
    name: 'The Capitulator',
    essence: 'Other people\'s presence is your override switch.',
    signature: '"I couldn\'t say no."',
    prevalence: '66% of you fold under social pressure, not appetite — and don\'t notice the difference.',
    window: 'Whenever you\'re not alone',
  },
}

export const FAMILY_SLUGS = Object.keys(FAMILIES) as FamilySlug[]

export function isFamilySlug(value: unknown): value is FamilySlug {
  return typeof value === 'string' && (FAMILY_SLUGS as string[]).includes(value)
}

/**
 * A single tap option. `family` is the family this option points at; `weight`
 * lets a few options nudge harder than others (defaults to 1).
 */
export type QuizOption = {
  id: string
  label: string
  family: FamilySlug
  weight?: number
}

export type QuizQuestion = {
  id: 'q1' | 'q2' | 'q3'
  prompt: string
  options: QuizOption[]
}

/**
 * Q1 is the diagnostic question — each option is the inner-voice line of one
 * family, so it maps 1:1 and also serves as the tie-breaker.
 */
const Q1: QuizQuestion = {
  id: 'q1',
  prompt: "When you're about to break a rule you set, the voice in your head says…",
  options: [
    { id: 'q1-negotiator', label: '"One time won\'t matter."', family: 'the-9pm-negotiator' },
    { id: 'q1-resetter', label: '"I\'ll start tomorrow."', family: 'the-monday-resetter' },
    { id: 'q1-deserver', label: '"I deserve this."', family: 'the-deserver' },
    { id: 'q1-tabber', label: '"Just one more thing."', family: 'the-one-more-tabber' },
    { id: 'q1-spiral', label: '"I already messed up anyway."', family: 'the-spiral-extender' },
    { id: 'q1-capitulator', label: '"I couldn\'t say no."', family: 'the-capitulator' },
  ],
}

/**
 * Q2 is the timing question. Each option points at the family whose danger
 * window matches that moment, and also drives the time-band shown on the
 * reveal card (see `windowFromQ2`).
 */
const Q2: QuizQuestion = {
  id: 'q2',
  prompt: 'Your pattern shows up most…',
  options: [
    { id: 'q2-late-night', label: 'late at night', family: 'the-9pm-negotiator' },
    { id: 'q2-tomorrow', label: 'first thing tomorrow', family: 'the-monday-resetter' },
    { id: 'q2-after-hard', label: 'right after something hard', family: 'the-deserver' },
    { id: 'q2-deep-in', label: "when you're deep in something", family: 'the-one-more-tabber' },
    { id: 'q2-after-slip', label: "after you've already slipped", family: 'the-spiral-extender' },
    { id: 'q2-others', label: 'when other people are around', family: 'the-capitulator' },
  ],
}

/**
 * Q3 is the cost question. It does NOT affect scoring (per spec: tally Q1 + Q2)
 * — it's a reflective beat that sharpens the felt cost before the reveal. We
 * keep the family mapping on each option anyway so the data stays symmetric and
 * future tweaks can weight it in without restructuring.
 */
const Q3: QuizQuestion = {
  id: 'q3',
  prompt: 'The cost is usually…',
  options: [
    { id: 'q3-one-bad', label: 'one bad choice', family: 'the-9pm-negotiator' },
    { id: 'q3-wasted-week', label: 'a wasted week', family: 'the-monday-resetter' },
    { id: 'q3-reward', label: "a reward you didn't need", family: 'the-deserver' },
    { id: 'q3-afternoon', label: 'a lost afternoon', family: 'the-one-more-tabber' },
    { id: 'q3-night-gone', label: 'a whole night gone', family: 'the-spiral-extender' },
    { id: 'q3-yes-regret', label: 'a yes you regret', family: 'the-capitulator' },
  ],
}

export const QUESTIONS: QuizQuestion[] = [Q1, Q2, Q3]

/**
 * Answers keyed by question id; value is the chosen option id. Partial because
 * the quiz fills it in one tap at a time.
 */
export type QuizAnswers = Partial<Record<QuizQuestion['id'], string>>

function optionById(question: QuizQuestion, optionId: string | undefined): QuizOption | undefined {
  if (!optionId) return undefined
  return question.options.find((o) => o.id === optionId)
}

/**
 * Deterministic resolver. Tallies Q1 + Q2 toward each family; the family with
 * the most points wins. Ties are broken by the family Q1 pointed at (the single
 * strongest signal). Falls back to the-9pm-negotiator only if Q1 is somehow
 * unanswered — in normal flow Q1 is always set before this runs.
 */
export function resolveFamily(answers: QuizAnswers): FamilySlug {
  const q1Option = optionById(Q1, answers.q1)
  const q2Option = optionById(Q2, answers.q2)

  const scores = {} as Record<FamilySlug, number>
  for (const slug of FAMILY_SLUGS) scores[slug] = 0

  if (q1Option) scores[q1Option.family] += q1Option.weight ?? 1
  if (q2Option) scores[q2Option.family] += q2Option.weight ?? 1

  // Tie-break toward the family Q1 pointed at (the strongest single signal);
  // if Q1 is unanswered, fall back to the first declared family order.
  const tieBreak = q1Option?.family ?? FAMILY_SLUGS[0]

  const maxScore = Math.max(...FAMILY_SLUGS.map((s) => scores[s]))
  const topFamilies = FAMILY_SLUGS.filter((s) => scores[s] === maxScore)

  return topFamilies.includes(tieBreak) ? tieBreak : topFamilies[0]
}

/**
 * Derives the "danger window" copy shown on the reveal card from the Q2 timing
 * answer. This makes the card feel personalised to the tap the user just made,
 * rather than always echoing the winning family's static window. Falls back to
 * the resolved family's own window when Q2 is unanswered or unmapped.
 */
export function windowFromQ2(answers: QuizAnswers, resolved: FamilySlug): string {
  const Q2_WINDOWS: Record<string, string> = {
    'q2-late-night': '9:00 PM – 11:30 PM · Thu–Sat',
    'q2-tomorrow': 'Sunday evening · the night before every "fresh start"',
    'q2-after-hard': 'After a hard day · 6:00 – 9:00 PM',
    'q2-deep-in': 'Mid-morning · 11:00 AM, the first detour',
    'q2-after-slip': 'Right after the first slip · any time',
    'q2-others': "Whenever you're not alone",
  }
  const fromAnswer = answers.q2 ? Q2_WINDOWS[answers.q2] : undefined
  return fromAnswer ?? FAMILIES[resolved].window
}
