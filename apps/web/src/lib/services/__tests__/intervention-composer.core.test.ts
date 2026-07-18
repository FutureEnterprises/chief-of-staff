/**
 * intervention-composer.core — deterministic prompt-shape + safety tests.
 *
 * No live API calls, no prisma, no @repo/ai: the core module is pure
 * by design so this suite pins down (1) what the model is shown,
 * (2) what output we accept, and (3) the NEDA-safety guarantee that
 * unsafe copy can never reach a push or email — the regex fires the
 * template fallback regardless of what the prompt produced.
 */

import { describe, it, expect } from 'vitest'
import {
  buildCheckinContextBlock,
  buildCheckinPrompt,
  buildInterruptPrompt,
  parseComposedCopy,
  violatesCopySafety,
  CHECKIN_COPY_LIMITS,
  INTERRUPT_COPY_LIMITS,
  type CheckinComposerContext,
  type InterruptComposerContext,
} from '../intervention-composer.core'

/* ──────────────────── fixtures ──────────────────── */

const interruptCtx: InterruptComposerContext = {
  firstName: 'Maya',
  archetypeName: 'The Deserver',
  archetypeSignature: 'I deserve this.',
  windowLabel: 'Late-night kitchen',
  localTimeLabel: 'Tue 9:00 PM',
  toneMode: 'NO_BS',
  currentStreak: 6,
  recentOutcomes: [
    { kind: 'DANGER_WINDOW', feedback: 'caught_me', at: '2026-07-15T02:00:00.000Z' },
    { kind: 'DANGER_WINDOW', feedback: 'ignored', at: '2026-07-13T02:10:00.000Z' },
  ],
  recentExcuse: { category: 'REWARD', text: 'long day, I earned this' },
}

const checkinCtx: CheckinComposerContext = {
  mode: 'night',
  firstName: 'Maya',
  archetypeName: 'The Deserver',
  archetypeSignature: 'I deserve this.',
  windows: [{ label: 'Late-night kitchen', startHour: 21, endHour: 23 }],
  currentStreak: 6,
  recentOutcome: 'caught their last interrupt (held it)',
  localTimeLabel: 'Tue 9:45 PM',
}

/* ──────────────────── prompt shape ──────────────────── */

describe('buildInterruptPrompt', () => {
  it('serializes every context signal the composer is promised', () => {
    const prompt = buildInterruptPrompt(interruptCtx)
    const parsed = JSON.parse(prompt)
    expect(parsed.firstName).toBe('Maya')
    expect(parsed.archetype).toEqual({
      family: 'The Deserver',
      signatureScript: 'I deserve this.',
    })
    expect(parsed.window).toEqual({ label: 'Late-night kitchen', localTime: 'Tue 9:00 PM' })
    expect(parsed.currentStreakDays).toBe(6)
    expect(parsed.recentInterruptOutcomes).toHaveLength(2)
    expect(parsed.recentInterruptOutcomes[0].feedback).toBe('caught_me')
    expect(parsed.mostRecentExcuse.category).toBe('REWARD')
    expect(parsed.toneMode).toBe('NO_BS')
  })

  it('caps outcome history at 5 and tolerates missing archetype', () => {
    const prompt = buildInterruptPrompt({
      ...interruptCtx,
      archetypeName: null,
      archetypeSignature: null,
      recentOutcomes: Array.from({ length: 9 }, (_, i) => ({
        kind: 'DANGER_WINDOW',
        feedback: null,
        at: `2026-07-0${(i % 9) + 1}T00:00:00.000Z`,
      })),
    })
    const parsed = JSON.parse(prompt)
    expect(parsed.archetype).toBeNull()
    expect(parsed.recentInterruptOutcomes).toHaveLength(5)
  })
})

describe('buildCheckinPrompt', () => {
  it('serializes mode, windows, streak, and outcome', () => {
    const parsed = JSON.parse(buildCheckinPrompt(checkinCtx))
    expect(parsed.mode).toBe('night')
    expect(parsed.dangerWindows[0].label).toBe('Late-night kitchen')
    expect(parsed.currentStreakDays).toBe(6)
    expect(parsed.recentOutcome).toContain('caught')
  })
})

/* ──────────────────── output parsing ──────────────────── */

describe('parseComposedCopy', () => {
  // Example composed outputs — the register the composer prompt asks for.
  it('accepts a well-formed interrupt example', () => {
    const raw = JSON.stringify({
      title: 'Maya. 9 PM. You know this one.',
      body: '"I deserve this." That is the script, not you. You caught it twice this week. Make it three.',
    })
    const copy = parseComposedCopy(raw, INTERRUPT_COPY_LIMITS)
    expect(copy).not.toBeNull()
    expect(copy!.title.length).toBeLessThanOrEqual(40)
    expect(copy!.body.length).toBeLessThanOrEqual(120)
  })

  it('accepts a fenced check-in example and strips the fence', () => {
    const raw = [
      '```json',
      '{"title": "Day 6 held. The kitchen window did not.",',
      ' "body": "You caught the 9 PM loop tonight. Close the day before it reopens."}',
      '```',
    ].join('\n')
    const copy = parseComposedCopy(raw, CHECKIN_COPY_LIMITS)
    expect(copy).toEqual({
      title: 'Day 6 held. The kitchen window did not.',
      body: 'You caught the 9 PM loop tonight. Close the day before it reopens.',
    })
  })

  it('returns null on non-JSON, empty, or field-missing output', () => {
    expect(parseComposedCopy('The moment is now, Maya.', INTERRUPT_COPY_LIMITS)).toBeNull()
    expect(parseComposedCopy('', INTERRUPT_COPY_LIMITS)).toBeNull()
    expect(parseComposedCopy('{"title": "Maya. This is the moment."}', INTERRUPT_COPY_LIMITS)).toBeNull()
    expect(parseComposedCopy('{"title": "", "body": ""}', INTERRUPT_COPY_LIMITS)).toBeNull()
    expect(parseComposedCopy('[1,2,3]', INTERRUPT_COPY_LIMITS)).toBeNull()
  })

  it('truncates over-length copy at a word boundary within limits', () => {
    const raw = JSON.stringify({
      title: 'Maya. The window is open and the script is already reaching for the handle.',
      body: 'B'.repeat(80) + ' tail words here',
    })
    const copy = parseComposedCopy(raw, INTERRUPT_COPY_LIMITS)
    expect(copy).not.toBeNull()
    expect(copy!.title.length).toBeLessThanOrEqual(40)
    expect(copy!.title.endsWith(' ')).toBe(false)
    expect(copy!.body.length).toBeLessThanOrEqual(120)
  })

  it('rejects NEDA-unsafe output even when structurally valid', () => {
    const unsafe = JSON.stringify({
      title: 'Maya. Think of the calories.',
      body: 'Skip the snack and burn it off tomorrow morning.',
    })
    expect(parseComposedCopy(unsafe, INTERRUPT_COPY_LIMITS)).toBeNull()
  })
})

/* ──────────────────── NEDA-safety regex ──────────────────── */

describe('violatesCopySafety', () => {
  it.each([
    'Think of the calories you saved',
    'Your weight is the story tonight',
    'Just burn it off tomorrow',
    'You should be ashamed of this loop',
    'That was a pathetic showing',
    'Your body will thank you',
    'This medication window matters',
    'Stop the binge before it starts',
  ])('blocks: %s', (text) => {
    expect(violatesCopySafety(text)).toBe(true)
  })

  it.each([
    'Maya. This is the moment.',
    'You already know how this ends. Open before it does.',
    'Everybody negotiates. You do it at 9 PM.',   // "everybody" must not trip "body"
    '"I deserve this." That is the script, not you.',
    'Day 6 held. The kitchen window did not.',
  ])('allows: %s', (text) => {
    expect(violatesCopySafety(text)).toBe(false)
  })
})

/* ──────────────────── chat context block ──────────────────── */

describe('buildCheckinContextBlock', () => {
  it('renders archetype, windows, streak, and outcome inside the token budget', () => {
    const block = buildCheckinContextBlock(checkinCtx)
    expect(block).toContain('The Deserver')
    expect(block).toContain('"I deserve this."')
    expect(block).toContain("Tonight's danger windows")
    expect(block).toContain('Late-night kitchen (9pm-11pm)')
    expect(block).toContain('Current streak: 6 days')
    expect(block).toContain('caught their last interrupt')
    // <300 tokens ≈ <1200 chars, hard-capped in the builder
    expect(block.length).toBeLessThanOrEqual(1200)
  })

  it('degrades gracefully with no archetype/windows/outcome', () => {
    const block = buildCheckinContextBlock({
      ...checkinCtx,
      mode: 'morning',
      archetypeName: null,
      archetypeSignature: null,
      windows: [],
      recentOutcome: null,
      currentStreak: 1,
    })
    expect(block).toContain('Current streak: 1 day')
    expect(block).not.toContain('danger windows')
    expect(block).not.toContain('Archetype')
  })
})
