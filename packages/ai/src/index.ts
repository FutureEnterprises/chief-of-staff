export * from './schemas'
export * from './prompts'
export * from './contract'

import { anthropic } from '@ai-sdk/anthropic'

export const AI_MODEL = anthropic('claude-sonnet-4-6')
export const AI_MODEL_FAST = anthropic('claude-haiku-4-5-20251001')
export const FREE_PLAN_AI_ASSISTS = 20
export const AI_ASSIST_RESET_DAYS = 30
