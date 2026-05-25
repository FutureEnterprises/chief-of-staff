/**
 * Family taxonomy bridge — general audit families ↔ GLP-1 Rebound families.
 *
 * Per the v4 audit (May 2026): "Consider grouping the six families into
 * broader categories (Night, Weekend, Stress, Reward) to match the GLP-1
 * Rebound archetypes." Direct collapse loses signal — the six general
 * families are distinct behavioral patterns; the four Rebound families
 * are weight-specific.
 *
 * Instead, this module bridges the two taxonomies by mapping each
 * general family to its closest Rebound family. Used on:
 *   - the audit result page (/a/[slug]) when the user picked the 'weight'
 *     wedge — surfaces "In GLP-1 terms, you're a <Rebound family>"
 *   - the /rebound page when comparing the two taxonomies for a visitor
 *     curious which audit they should take
 *   - any future cross-pollination between the two funnels
 *
 * Mapping rationale (calibrated against the families' signature scripts):
 *   - 9 PM Negotiator → Night Rebounder    (signature: late-night negotiation)
 *   - Monday Resetter → Weekend Rebounder  (signature: weekend collapse + Monday repair)
 *   - Deserver        → Reward Rebounder   (signature: "I deserve this")
 *   - One-More-Tabber → Stress Rebounder   (signature: stress-displacement loop)
 *   - Spiral Extender → Stress Rebounder   (signature: post-slip catastrophe)
 *   - Capitulator     → Weekend Rebounder  (signature: "I already broke it, write off the rest")
 *
 * If new general families are added (or Rebound families revised), update
 * the GENERAL_TO_REBOUND_FAMILY map below. Tests should fail loudly when
 * a general family lacks a mapping.
 */

import type { ArchetypeFamily } from './audit-archetype'
import type { ReboundFamily } from './rebound-archetype'

/**
 * Each general audit family → the closest GLP-1 Rebound family.
 *
 * NOTE: this is a SIGNAL bridge, not a hard equivalence. A 9 PM Negotiator
 * is not literally a Night Rebounder; the bridge is "if you took the audit
 * and got this family, the Rebound family that resembles your pattern
 * most closely is X." The full Rebound result needs the Rebound quiz —
 * this bridge primes the user to take it.
 */
export const GENERAL_TO_REBOUND_FAMILY: Record<ArchetypeFamily, ReboundFamily> = {
  'the-9pm-negotiator': 'night-rebounder',
  'the-monday-resetter': 'weekend-rebounder',
  'the-deserver': 'reward-rebounder',
  'the-one-more-tabber': 'stress-rebounder',
  'the-spiral-extender': 'stress-rebounder',
  'the-capitulator': 'weekend-rebounder',
}

/**
 * Display labels for each Rebound family — used when surfacing the
 * bridge mapping in copy. Kept in this file so consumers don't need to
 * import the full rebound-archetype module just for a label.
 */
export const REBOUND_FAMILY_LABEL: Record<ReboundFamily, string> = {
  'night-rebounder': 'Night Rebounder',
  'weekend-rebounder': 'Weekend Rebounder',
  'stress-rebounder': 'Stress Rebounder',
  'reward-rebounder': 'Reward Rebounder',
}

/**
 * Convenience: given a general audit family, return both the Rebound
 * family slug AND a display-ready label.
 */
export function reboundEquivalent(
  generalFamily: ArchetypeFamily,
): { slug: ReboundFamily; label: string } {
  const slug = GENERAL_TO_REBOUND_FAMILY[generalFamily]
  return { slug, label: REBOUND_FAMILY_LABEL[slug] }
}
