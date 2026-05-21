import { describe, it, expect } from 'vitest'
import { matchReply, matchEscalation } from './reply-patterns'
import { containsCrisisKeyword, CRISIS_KEYWORDS } from './safety-words'

describe('matchEscalation — crisis keyword routing', () => {
  it('flags explicit suicide mention', () => {
    const r = matchEscalation('been thinking about suicide a lot')
    expect(r?.escalate).toBe(true)
    expect(r?.reason).toMatch(/suicid/i)
  })

  it('flags "kill myself" phrasing', () => {
    const r = matchEscalation("I want to kill myself")
    expect(r?.escalate).toBe(true)
  })

  it('flags 988 reference', () => {
    const r = matchEscalation('they told me to call 988')
    expect(r?.escalate).toBe(true)
  })

  it('flags eating disorder language', () => {
    const r = matchEscalation('struggling with anorexia for years')
    expect(r?.escalate).toBe(true)
  })

  it('flags addiction-treatment language', () => {
    const r = matchEscalation('just out of rehab and looking for tools')
    expect(r?.escalate).toBe(true)
  })

  it('flags relapse', () => {
    const r = matchEscalation('I relapsed last weekend')
    expect(r?.escalate).toBe(true)
  })

  it('returns null on benign text', () => {
    expect(matchEscalation('just trying to drink less coffee')).toBeNull()
  })

  it('is case-insensitive', () => {
    expect(matchEscalation('SUICIDAL thoughts')?.escalate).toBe(true)
  })
})

describe('matchReply — crisis short-circuit', () => {
  it('returns null when crisis keyword present, regardless of other signals', () => {
    // Archetype self-id + a crisis keyword → crisis wins, return null.
    expect(
      matchReply("I'm the Deserver and I just relapsed last week"),
    ).toBeNull()
  })

  it('returns null on bare crisis text', () => {
    expect(matchReply('I want to die')).toBeNull()
  })

  it('returns null on relapse text even with positive sentiment', () => {
    expect(matchReply('love this idea but I just relapsed')).toBeNull()
  })
})

describe('matchReply — archetype self-identification', () => {
  it('matches "I\'m the Deserver"', () => {
    const r = matchReply("I'm the Deserver, this thread is me.")
    expect(r?.kind).toBe('archetype')
    expect(r?.familySlug).toBe('the-deserver')
    expect(r?.suggestion).toMatch(/the-deserver/i)
    expect(r?.suggestion).toMatch(/coyl\.ai\/audit\/the-deserver/)
  })

  it('matches "I\'m a 9pm Negotiator"', () => {
    const r = matchReply("I'm a 9pm negotiator for sure")
    expect(r?.kind).toBe('archetype')
    expect(r?.familySlug).toBe('the-9pm-negotiator')
  })

  it('matches "I\'m the Monday Resetter"', () => {
    const r = matchReply("I'm the monday resetter, every single week")
    expect(r?.kind).toBe('archetype')
    expect(r?.familySlug).toBe('the-monday-resetter')
  })

  it('matches "I am the One More Tabber"', () => {
    const r = matchReply('i am the one more tabber, always')
    expect(r?.kind).toBe('archetype')
    expect(r?.familySlug).toBe('the-one-more-tabber')
  })

  it('matches "I\'m a Spiral Extender"', () => {
    const r = matchReply("I'm a spiral extender lol")
    expect(r?.kind).toBe('archetype')
    expect(r?.familySlug).toBe('the-spiral-extender')
  })

  it('matches "I\'m the Capitulator"', () => {
    const r = matchReply("yep i'm the capitulator")
    expect(r?.kind).toBe('archetype')
    expect(r?.familySlug).toBe('the-capitulator')
  })

  it('is case-insensitive on archetype', () => {
    const r = matchReply("I'M THE DESERVER")
    expect(r?.familySlug).toBe('the-deserver')
  })

  it('archetype suggestion ends with an engagement question', () => {
    const r = matchReply("I'm the deserver")
    expect(r?.suggestion).toMatch(/\?$/)
  })
})

describe('matchReply — wedge interest signals', () => {
  it('matches GLP-1 trial language', () => {
    const r = matchReply('tried coyl for GLP-1 cravings and it kind of worked')
    expect(r?.kind).toBe('wedge')
    expect(r?.suggestion).toMatch(/GLP-1/)
  })

  it('matches "tried it for late-night eating"', () => {
    const r = matchReply('tried it for late-night eating')
    expect(r?.kind).toBe('wedge')
  })

  it('matches doom-scroll', () => {
    const r = matchReply('I doom-scroll every night before bed')
    expect(r?.kind).toBe('wedge')
    expect(r?.suggestion).toMatch(/tab-switch|one-more-tabber/i)
  })

  it('matches tab switch language', () => {
    const r = matchReply('I tab switch every 20 seconds when I should be doing deep work')
    expect(r?.kind).toBe('wedge')
  })

  it('matches "I\'ll start Monday"', () => {
    const r = matchReply("I'll start Monday, I swear")
    expect(r?.kind).toBe('wedge')
    expect(r?.suggestion).toMatch(/monday/i)
  })

  it('matches "start tomorrow"', () => {
    const r = matchReply("I always say I'll start tomorrow")
    expect(r?.kind).toBe('wedge')
  })

  it('all wedge suggestions include the audit link', () => {
    const r = matchReply('I doomscroll all day')
    expect(r?.suggestion).toMatch(/coyl\.ai\/audit/)
  })
})

describe('matchReply — audit-curious', () => {
  it('matches "what is coyl"', () => {
    const r = matchReply('what is coyl exactly?')
    expect(r?.kind).toBe('audit-curious')
    expect(r?.suggestion).toMatch(/coyl\.ai\/audit/)
  })

  it('matches "how does coyl work"', () => {
    const r = matchReply('curious — how does coyl work?')
    expect(r?.kind).toBe('audit-curious')
  })

  it('matches "is this a habit app" with category framing', () => {
    const r = matchReply('is this a habit app or what?')
    expect(r?.kind).toBe('audit-curious')
    expect(r?.suggestion).toMatch(/manifesto/)
  })

  it('matches "is this therapy" with category framing', () => {
    // "addiction treatment" is a crisis keyword (short-circuits), but
    // "is this therapy" should route through audit-curious + manifesto.
    const r = matchReply('is this therapy or what?')
    expect(r?.kind).toBe('audit-curious')
    expect(r?.suggestion).toMatch(/manifesto/)
  })
})

describe('matchReply — positive mention', () => {
  it('matches "love this"', () => {
    const r = matchReply('love this, where do I sign up')
    expect(r?.kind).toBe('positive-mention')
  })

  it('matches "this is great"', () => {
    const r = matchReply('honestly this is great')
    expect(r?.kind).toBe('positive-mention')
  })

  it('matches "interesting idea"', () => {
    const r = matchReply('interesting idea, never seen this framing before')
    expect(r?.kind).toBe('positive-mention')
  })

  it('positive suggestion routes to the audit', () => {
    const r = matchReply('this is brilliant')
    expect(r?.suggestion).toMatch(/coyl\.ai\/audit/)
  })
})

describe('matchReply — ambiguity / null returns', () => {
  it('returns null on empty string', () => {
    expect(matchReply('')).toBeNull()
  })

  it('returns null on whitespace', () => {
    expect(matchReply('   \n\t  ')).toBeNull()
  })

  it('returns null on generic unrelated text', () => {
    expect(matchReply('saw the dodgers game last night')).toBeNull()
  })

  it('returns null on a question that does not name coyl or a pattern', () => {
    expect(matchReply('what apps do you all use for tracking?')).toBeNull()
  })

  it('returns null on bare positive emoji-style text', () => {
    expect(matchReply('nice')).toBeNull()
  })

  it('returns null on a generic comment without trigger words', () => {
    expect(matchReply('been a long week and I am tired')).toBeNull()
  })
})

describe('safety-words export', () => {
  it('CRISIS_KEYWORDS has a substantial set (≥ 30)', () => {
    expect(CRISIS_KEYWORDS.length).toBeGreaterThanOrEqual(30)
  })

  it('containsCrisisKeyword returns the first match', () => {
    const r = containsCrisisKeyword('thinking about overdose')
    expect(r.hit).toBe(true)
    expect(r.matched).toBe('overdose')
  })

  it('containsCrisisKeyword is case-insensitive', () => {
    const r = containsCrisisKeyword('I AM SUICIDAL')
    expect(r.hit).toBe(true)
  })

  it('containsCrisisKeyword returns no-hit on safe text', () => {
    const r = containsCrisisKeyword('having a normal day')
    expect(r.hit).toBe(false)
    expect(r.matched).toBeNull()
  })
})
