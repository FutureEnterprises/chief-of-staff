import { AlertTriangle } from 'lucide-react'

/**
 * SafetyBanner — hard safety routing for pages that border on
 * crisis / addiction / dependency territory.
 *
 * COYL is a behavioral support tool that operates at the level of
 * recurring autopilot loops. It is NOT a treatment product, NOT a
 * crisis service, and NOT a substitute for clinical care. Any page
 * that could plausibly attract a user in a dependency or crisis
 * situation MUST render this banner so the routing to real help is
 * the first thing they see.
 *
 * Used on:
 *   - /recurring-loops        (variant="prominent", top of body)
 *   - /recovery               (variant="inline",   above final CTA)
 *   - /manifesto              (variant="inline",   replaces the
 *                              "behavioral support, not medical
 *                              treatment" paragraph at beat 04)
 *
 * Hard requirements (legal/strategy):
 *   - 988 must render as tel:988
 *   - SAMHSA must render as tel:1-800-662-4357
 *   - Copy is locked. Do not soften, shorten, or summarize.
 */

type SafetyBannerProps = {
  variant?: 'inline' | 'prominent'
}

export function SafetyBanner({ variant = 'prominent' }: SafetyBannerProps) {
  if (variant === 'inline') {
    return (
      <aside
        role="note"
        aria-label="Safety routing for crisis, addiction, or medical dependency"
        className="my-8 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm"
      >
        <AlertTriangle
          aria-hidden="true"
          className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-700"
        />
        <p className="text-gray-700">
          <span className="font-bold text-gray-900">
            COYL is not for crisis, addiction treatment, withdrawal, self-harm,
            or medical dependency.
          </span>{' '}
          If this involves substance dependency or immediate risk, contact{' '}
          <a
            href="tel:988"
            className="font-semibold text-gray-900 underline underline-offset-2 hover:text-amber-800"
          >
            988
          </a>{' '}
          (Suicide &amp; Crisis Lifeline),{' '}
          <a
            href="tel:1-800-662-4357"
            className="font-semibold text-gray-900 underline underline-offset-2 hover:text-amber-800"
          >
            SAMHSA
          </a>{' '}
          (1-800-662-HELP), your doctor, or emergency services.
        </p>
      </aside>
    )
  }

  return (
    <aside
      role="note"
      aria-label="Safety routing for crisis, addiction, or medical dependency"
      className="my-8 flex items-start gap-4 rounded-3xl border-2 border-amber-300 bg-amber-50 p-5 md:p-6"
    >
      <div className="flex-shrink-0 rounded-full bg-amber-100 p-2.5">
        <AlertTriangle
          aria-hidden="true"
          className="h-5 w-5 text-amber-700"
        />
      </div>
      <div className="space-y-2">
        <p className="text-base font-bold leading-snug text-gray-900 md:text-lg">
          COYL is not for crisis, addiction treatment, withdrawal, self-harm,
          or medical dependency.
        </p>
        <p className="text-sm leading-relaxed text-gray-700 md:text-base">
          If this involves substance dependency or immediate risk, contact{' '}
          <a
            href="tel:988"
            className="font-semibold text-gray-900 underline underline-offset-2 hover:text-amber-800"
          >
            988
          </a>{' '}
          (Suicide &amp; Crisis Lifeline),{' '}
          <a
            href="tel:1-800-662-4357"
            className="font-semibold text-gray-900 underline underline-offset-2 hover:text-amber-800"
          >
            SAMHSA
          </a>{' '}
          (1-800-662-HELP), your doctor, or emergency services.
        </p>
      </div>
    </aside>
  )
}
