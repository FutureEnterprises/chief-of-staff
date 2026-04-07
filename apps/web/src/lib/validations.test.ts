import { describe, it, expect } from 'vitest'
import {
  createTaskSchema,
  patchTaskSchema,
  updateUserSchema,
  pushTokenSchema,
  checkoutSchema,
} from './validations'

describe('createTaskSchema', () => {
  it('accepts valid input', () => {
    const result = createTaskSchema.safeParse({ title: 'Buy groceries' })
    expect(result.success).toBe(true)
  })

  it('rejects empty title', () => {
    const result = createTaskSchema.safeParse({ title: '' })
    expect(result.success).toBe(false)
  })

  it('rejects missing title', () => {
    const result = createTaskSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('accepts full input with all optional fields', () => {
    const result = createTaskSchema.safeParse({
      title: 'Deploy v2',
      description: 'Ship the new version',
      priority: 'HIGH',
      dueAt: '2026-04-10T00:00:00.000Z',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid priority', () => {
    const result = createTaskSchema.safeParse({ title: 'Test', priority: 'URGENT' })
    expect(result.success).toBe(false)
  })

  it('rejects title over 500 chars', () => {
    const result = createTaskSchema.safeParse({ title: 'x'.repeat(501) })
    expect(result.success).toBe(false)
  })
})

describe('patchTaskSchema', () => {
  it('accepts complete action', () => {
    const result = patchTaskSchema.safeParse({
      taskId: 'clxyz123456789abcde',
      action: 'complete',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing taskId', () => {
    const result = patchTaskSchema.safeParse({ action: 'complete' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid action', () => {
    const result = patchTaskSchema.safeParse({
      taskId: 'clxyz123456789abcde',
      action: 'delete',
    })
    expect(result.success).toBe(false)
  })
})

describe('updateUserSchema', () => {
  it('accepts valid timezone', () => {
    const result = updateUserSchema.safeParse({ timezone: 'America/New_York' })
    expect(result.success).toBe(true)
  })

  it('accepts valid time format', () => {
    const result = updateUserSchema.safeParse({ morningCheckinTime: '08:00' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid time format', () => {
    const result = updateUserSchema.safeParse({ morningCheckinTime: '8am' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid reminderIntensity', () => {
    const result = updateUserSchema.safeParse({ reminderIntensity: 'EXTREME' })
    expect(result.success).toBe(false)
  })

  it('accepts valid emailBriefingDays', () => {
    const result = updateUserSchema.safeParse({ emailBriefingDays: ['MON', 'WED', 'FRI'] })
    expect(result.success).toBe(true)
  })

  it('rejects invalid day', () => {
    const result = updateUserSchema.safeParse({ emailBriefingDays: ['MONDAY'] })
    expect(result.success).toBe(false)
  })
})

describe('pushTokenSchema', () => {
  it('accepts valid Expo push token', () => {
    const result = pushTokenSchema.safeParse({
      expoPushToken: 'ExponentPushToken[abc123]',
    })
    expect(result.success).toBe(true)
  })

  it('rejects non-Expo token', () => {
    const result = pushTokenSchema.safeParse({
      expoPushToken: 'some-random-string',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty string', () => {
    const result = pushTokenSchema.safeParse({ expoPushToken: '' })
    expect(result.success).toBe(false)
  })
})

describe('checkoutSchema', () => {
  it('accepts monthly', () => {
    const result = checkoutSchema.safeParse({ interval: 'monthly' })
    expect(result.success).toBe(true)
  })

  it('accepts annual', () => {
    const result = checkoutSchema.safeParse({ interval: 'annual' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid interval', () => {
    const result = checkoutSchema.safeParse({ interval: 'weekly' })
    expect(result.success).toBe(false)
  })
})
