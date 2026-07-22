/**
 * Shared trigger enum for both rescue surfaces (text chat + voice call).
 * Kept in one place so the two routes can't drift on what a valid
 * RescueTrigger string is.
 */
export const VALID_TRIGGERS = [
  'BINGE_URGE', 'DELIVERY_URGE', 'NICOTINE_URGE', 'ALCOHOL_URGE',
  'SKIP_WORKOUT', 'SKIP_WEIGHIN', 'ALREADY_SLIPPED', 'SPIRALING',
  'DOOMSCROLL', 'IMPULSE_SPEND', 'OTHER',
] as const

export type RescueTriggerValue = (typeof VALID_TRIGGERS)[number]
