/**
 * Identity sentence generator.
 *
 * The spec's Identity System ("You avoid after one bad day" / "You're
 * improving your recovery" / "You're still running the same loop") is
 * the retention moat: users stay for who they're becoming, not what
 * they're doing.
 *
 * This is deterministic (no AI call) so it can render server-side with
 * zero latency. The sentence comes from the user's identityState enum
 * + a signal from their recent data so each identity gets a personalized
 * flavor.
 *
 * Inputs stay minimal on purpose — only fields that already exist on
 * the User row. Call sites don't need to assemble extra data.
 */

export type IdentityInput = {
  identityState: string | null
  recoveryState?: string | null
  currentStreak: number
  longestStreak: number
  slipsThisMonth: number
  selfTrustScore: number
}

export type IdentitySentence = {
  /** The short accusatory / affirming line. "You're still running the same loop." */
  headline: string
  /** One-sentence backing evidence, grounded in the user's numbers. */
  evidence: string
  /** Emotional tone — drives accent color on the UI. */
  tone: 'warning' | 'mixed' | 'positive'
}

export function identitySentence(u: IdentityInput): IdentitySentence {
  const streak = u.currentStreak
  const slips = u.slipsThisMonth
  const selfTrust = u.selfTrustScore

  // 1. Named identity states get tuned copy. Fall through to heuristics
  //    when state is missing or generic.
  switch (u.identityState) {
    case 'SLEEPWALKING':
      return {
        headline: 'You\u2019re running the same loop.',
        evidence: `${slips} slip${slips === 1 ? '' : 's'} this month. Same pattern. We haven\u2019t interrupted it yet.`,
        tone: 'warning',
      }
    case 'AVOIDANT':
      return {
        headline: 'You avoid after one bad day.',
        evidence: `Your last slip was followed by silence. That\u2019s the loop. We catch it next time.`,
        tone: 'warning',
      }
    case 'RECOVERING':
      return {
        headline: 'You\u2019re improving your recovery.',
        evidence: `Streak ${streak}d. Slips don\u2019t own the next day anymore.`,
        tone: 'mixed',
      }
    case 'UNSTABLE_BUT_TRYING':
      return {
        headline: 'You\u2019re unstable \u2014 but you\u2019re still here.',
        evidence: `Showing up is half the fight. The other half is what we\u2019re building.`,
        tone: 'mixed',
      }
    case 'INCREASINGLY_CONSCIOUS':
      return {
        headline: 'You\u2019re catching yourself faster.',
        evidence: `Self-trust ${selfTrust}/100. A month ago this loop had you. Now you have it \u2014 mostly.`,
        tone: 'positive',
      }
    case 'RESILIENT':
      return {
        headline: 'One slip doesn\u2019t own your week anymore.',
        evidence: `Streak ${streak}d. You recover inside 24 hours now. That\u2019s the actual win.`,
        tone: 'positive',
      }
    case 'DISCIPLINED':
    case 'HIGH_SELF_TRUST':
      return {
        headline: 'You\u2019re the person who keeps your word.',
        evidence: `Longest streak ${u.longestStreak}d. Current ${streak}d. Self-trust ${selfTrust}/100. The identity is earned.`,
        tone: 'positive',
      }
  }

  // 2. Heuristics when state is missing or default.
  if (streak === 0 && slips >= 3) {
    return {
      headline: 'You\u2019re running the same loop.',
      evidence: `${slips} slips this month and no streak to protect. That\u2019s where the change starts.`,
      tone: 'warning',
    }
  }
  if (streak >= 14 && slips <= 1) {
    return {
      headline: 'You\u2019re becoming someone who doesn\u2019t fold.',
      evidence: `${streak}d streak. ${slips} slip${slips === 1 ? '' : 's'} this month. Identity is shifting.`,
      tone: 'positive',
    }
  }
  if (streak >= 3 && slips >= 2) {
    return {
      headline: 'You\u2019re improving your recovery.',
      evidence: `You slipped ${slips}x but kept showing up. That\u2019s new.`,
      tone: 'mixed',
    }
  }

  return {
    headline: 'We\u2019re still mapping your pattern.',
    evidence: 'Another week of data and the identity sharpens. Show up, log honestly.',
    tone: 'mixed',
  }
}
