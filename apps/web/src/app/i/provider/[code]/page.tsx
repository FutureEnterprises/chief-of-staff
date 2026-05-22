import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@repo/database'
import { CoylLogo } from '@/components/brand/logo'
import { ClaimActions } from './claim-actions'

/**
 * /i/provider/[code] — patient-facing invite landing page.
 *
 * Public route (registered in proxy.ts isPublicRoute matcher) so an
 * unauthenticated patient who clicks a clinic email can read the
 * consent copy BEFORE deciding to sign in. The Accept button itself
 * still requires Clerk auth — it posts to /api/v1/provider/claim/[code]
 * which is Clerk-gated.
 *
 * Lookup: we resolve the code to the issuing provider by finding the
 * Commitment row with `rule contains invite:<code>` and reading the
 * issuing provider's name + clinic from the related User. Status checks
 * happen here so a revoked code doesn't render the consent screen.
 *
 * Style: cream + Instrument Serif, same warmth as /clinician. The
 * patient is reading this on their phone after a clinic visit; the
 * page has to feel like a continuation of the doctor's recommendation,
 * not a software pop-up.
 */

type PageProps = { params: Promise<{ code: string }> }

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { code } = await params
  return {
    title: `Your clinician invited you to COYL — ${code}`,
    description:
      'Connect your COYL account to your clinician so they can see the patterns the medication doesn’t reach.',
    robots: { index: false, follow: false },
  }
}

export default async function ProviderInviteLandingPage({
  params,
}: PageProps) {
  const { code } = await params

  // Look up the invite + the issuing provider. The Commitment.rule
  // encoding is { invite:<code> | providerId:<id> | label:<lbl> | status:<s> }
  // — same pattern as the route handler. We only render the screen for
  // pending invites; claimed/revoked codes 404.
  const row = await prisma.commitment.findFirst({
    where: { rule: { contains: `invite:${code}` } },
    include: { user: { select: { id: true, name: true, biggestGoal: true } } },
  })

  if (!row) notFound()

  const parts = row.rule.split('|')
  const lookup: Record<string, string> = {}
  for (const p of parts) {
    const eq = p.indexOf(':')
    if (eq === -1) continue
    lookup[p.slice(0, eq)] = p.slice(eq + 1)
  }
  const status = lookup.status ?? 'pending'
  if (status === 'revoked') notFound()

  // Pull the clinic name out of the provider's biggestGoal-encoded tag
  // (set during /clinician/onboarding). Falls back to a generic label
  // if the provider didn't go through the onboarding wizard.
  const providerName = row.user?.name ?? 'Your clinician'
  const clinicTag = row.user?.biggestGoal ?? ''
  const clinicMatch = clinicTag.match(/clinic:([^|]+)/)
  const clinicName = clinicMatch ? clinicMatch[1] : 'your clinic'

  const alreadyClaimed = status === 'claimed'

  return (
    <main className="min-h-screen bg-[#fafaf7] text-gray-900">
      <header className="border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/">
            <CoylLogo size="sm" theme="light" />
          </Link>
          <Link
            href="/clinician"
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500 hover:text-gray-900"
          >
            For clinicians
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-12 md:py-16">
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-orange-600">
          You’re invited
        </p>
        <h1 className="mt-3 max-w-2xl font-serif text-4xl font-normal leading-[1.1] tracking-[-0.02em] text-gray-900 md:text-5xl">
          {providerName} at{' '}
          <span className="italic text-orange-600">{clinicName}</span>{' '}
          invited you to connect on COYL.
        </h1>
        <p className="mt-6 max-w-prose text-lg leading-[1.65] text-gray-700">
          COYL is the behavioral interrupt that catches autopilot moments your
          medication doesn’t reach. Accepting this invite shares a small
          slice of your pattern data with your clinician so they can step
          in before a slip becomes a story.
        </p>

        <section className="mt-12 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-orange-600">
            What this shares with your clinician
          </p>
          <ul className="mt-4 space-y-3 text-base text-gray-800">
            <li className="flex items-start gap-3">
              <span
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500"
                aria-hidden
              />
              <span>
                Slip counts &mdash; how often the autopilot fired this week.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500"
                aria-hidden
              />
              <span>
                Pattern shifts &mdash; the time-of-day and trigger themes
                that changed in the last 30 days.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500"
                aria-hidden
              />
              <span>
                Self-Trust trend &mdash; the 0&ndash;100 score that tracks
                how often you keep your own commitments.
              </span>
            </li>
          </ul>

          <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.32em] text-gray-500">
            What this does NOT share
          </p>
          <ul className="mt-4 space-y-3 text-base text-gray-800">
            <li className="flex items-start gap-3">
              <span
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300"
                aria-hidden
              />
              <span>
                Raw biometric samples (Withings / CGM / wearable streams).
                Your clinician sees decimated rollups, not minute-by-minute
                weight or glucose data.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300"
                aria-hidden
              />
              <span>
                The text of any rescue conversation. AI exchanges are yours.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300"
                aria-hidden
              />
              <span>
                Your contact list, location history, or app activity
                outside COYL.
              </span>
            </li>
          </ul>
        </section>

        {alreadyClaimed ? (
          <section className="mt-10 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">
            <p className="font-mono text-[10px] uppercase tracking-[0.32em]">
              Already claimed
            </p>
            <p className="mt-3 text-base">
              This invite has already been accepted. Head to your{' '}
              <Link href="/today" className="font-bold underline">
                Today view
              </Link>{' '}
              to keep going.
            </p>
          </section>
        ) : (
          <ClaimActions code={code} />
        )}

        <p className="mt-10 text-center text-xs text-gray-500">
          You can revoke this connection at any time from{' '}
          <Link href="/profile" className="underline">
            your profile
          </Link>
          . COYL is behavioral support, not medical treatment.
        </p>
      </div>
    </main>
  )
}
