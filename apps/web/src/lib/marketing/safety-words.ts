/**
 * Crisis-keyword safety list — used by the reply-pattern matcher and
 * any UI surface that may need to short-circuit on high-risk language.
 *
 * COYL is behavioral support, NOT clinical care. Any post that surfaces
 * crisis or clinical-treatment language MUST be escalated to the founder
 * for manual review. We never auto-reply on these.
 *
 * Bias is intentionally conservative — better to escalate too much than
 * too little. Adding to this list is cheap; missing a real crisis is not.
 *
 * Substring match (case-insensitive). Stems are deliberate (e.g.
 * "suicid" catches "suicide", "suicidal", "suicidality").
 */

export const CRISIS_KEYWORDS: readonly string[] = [
  // Self-harm / suicide
  'suicid',
  'self-harm',
  'self harm',
  'selfharm',
  'kill myself',
  'kill my self',
  'end my life',
  'end it all',
  'want to die',
  'wanna die',
  'overdose',
  'od on',
  '988',
  'crisis',
  'emergency',
  'hotline',

  // Substance / addiction-coded
  'withdrawal',
  'withdrawl',
  'addiction treatment',
  'in treatment',
  'rehab',
  'detox',
  'dependency',
  'dependent on',
  'alcoholic',
  'alcoholism',
  'aa meeting',
  'na meeting',
  'sponsor',
  'sober date',
  'sober curious',
  'relapse',
  'relapsed',
  'relapsing',

  // Compulsive / behavioral disorders
  'compulsive gambling',
  'gambling addiction',
  'porn addiction',

  // Eating-disorder coded
  'ed clinic',
  'ed treatment',
  'eating disorder',
  'anorex',
  'bulim',
  'purg',
  'restricting',
  'binge purge',

  // Generic clinical
  'inpatient',
  'outpatient',
  'psych ward',
  'committed',
] as const

/**
 * Returns whether the text contains any crisis/clinical keyword. If so,
 * also returns the first matched keyword (for logging + audit).
 */
export function containsCrisisKeyword(text: string): {
  hit: boolean
  matched: string | null
} {
  const normalized = text.toLowerCase()
  for (const kw of CRISIS_KEYWORDS) {
    if (normalized.includes(kw)) {
      return { hit: true, matched: kw }
    }
  }
  return { hit: false, matched: null }
}
