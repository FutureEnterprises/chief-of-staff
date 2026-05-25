import type { ReactNode, ElementType } from 'react'
import { cn } from '@/lib/utils'

/**
 * Capsule — the COYL "pill-O" brand signature primitive.
 *
 * Wraps a short string in the brand-orange stadium outline that echoes
 * the pill-O in the COYL wordmark. The pill is conceptually the same
 * as the half-ring C of the mark — both are CONTAINERS. The mark
 * catches the signal; the pill catches the letter; the product catches
 * you. Use the capsule when you want to make that "containment" moment
 * visible in copy.
 *
 * Design rules (preserve the signature — don't water it down):
 *   1. ONE capsule per visual moment. If three of these land in one
 *      paragraph, the signature dies. Save it for the pivot word.
 *   2. Reserved for SHORT content — 1 to 3 words, ideally one. Long
 *      content reads as "tagged with a chip," not "caught."
 *   3. Pair with restraint. Don't bold, italicize, or color the wrapped
 *      text additionally — the capsule is doing the work.
 *   4. Not for buttons, CTAs, or nav links — those are interactive
 *      controls and should use the standard `rounded-full` button
 *      styles. The capsule is a TYPOGRAPHIC device, not a control.
 *
 * Sizing scales with the surrounding font size (everything is `em`).
 * Drop it in any heading, paragraph, or label — stroke, padding, and
 * radius all scale proportionally. No size prop needed.
 *
 * Examples:
 *   <h1>Catch yourself before you do it <Capsule>again</Capsule></h1>
 *   <p>You&rsquo;re a <Capsule>9 PM Negotiator</Capsule>.</p>
 *   <p>Pricing starts at <Capsule>$12/mo</Capsule>.</p>
 *
 * Where it earns real estate (per the brand brief, May 24 2026):
 *   - Hero pivot words ("AGAIN", "NOW", "CAUGHT")
 *   - Audit family name on result pages
 *   - Pricing tier highlights
 *   - OG share cards (`/i/[code]`)
 *   - Editorial section kickers
 *
 * Where it would be noise:
 *   - Every O in body text (typographic gimmick → kills the special)
 *   - Standard CTA buttons (already use rounded-full)
 *   - Nav labels (clutters the bar)
 */

interface CapsuleProps {
  children: ReactNode
  /**
   * The HTML element to render. Defaults to `span` (inline). Use
   * `strong` or `em` if the semantic meaning is emphasis. Use `mark`
   * if it's a highlighting moment (the capsule already visually
   * highlights, so `mark` is rarely necessary).
   */
  as?: 'span' | 'strong' | 'em' | 'mark'
  /**
   * Optional per-instance class overrides. Useful for tone shifts
   * (e.g., `text-orange-600` on a heading where the wrapped text
   * should also be orange) or for nudging vertical alignment if the
   * surrounding leading is unusual.
   */
  className?: string
}

export function Capsule({
  children,
  as = 'span',
  className,
}: CapsuleProps) {
  const Tag = as as ElementType
  return (
    <Tag
      className={cn(
        // Layout — inline-block so vertical-align works predictably
        // with surrounding text, no line-breaking inside the pill.
        'inline-block whitespace-nowrap',
        // Stadium shape — rounded-full on any width gives a clean
        // pill geometry regardless of content length.
        'rounded-full',
        // Outline only, no fill — the brand orange #ff6600 stroke is
        // the entire visual treatment. Stroke weight is em-based so
        // it scales with the surrounding font size.
        'border-[0.08em] border-[#ff6600]',
        // Padding — generous horizontal, minimal vertical. All em
        // so the pill keeps its proportions at any font size.
        'px-[0.55em] py-[0.04em]',
        // Line-height: 1 so the pill is exactly font-size tall plus
        // the small vertical padding. Without this, leading bleeds
        // into the pill height and the geometry breaks.
        'leading-none',
        // Vertical-align nudge: shifts the pill down slightly so its
        // visual center aligns with the cap-height of surrounding
        // text instead of sitting too high relative to the baseline.
        // Tuned by eye; override via className if your context needs
        // a different lift.
        'align-[-0.05em]',
        className,
      )}
    >
      {children}
    </Tag>
  )
}
