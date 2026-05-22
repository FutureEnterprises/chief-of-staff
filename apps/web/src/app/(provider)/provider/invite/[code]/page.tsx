import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCurrentProvider } from '@/lib/provider-rbac'
import { prisma } from '@repo/database'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'Provider · Invite',
  robots: { index: false, follow: false },
}

/**
 * /provider/invite/[code] — single-invite detail surface.
 *
 * Renders status of one invite (pending / claimed / revoked), with
 * resend + revoke affordances. Server component because the read is
 * purely informational; the mutation actions are tiny client islands
 * (not yet implemented for v0.1 — we just render the link and the
 * resend mailto: for the prescriber to copy).
 *
 * Auth: provider gate from getCurrentProvider(). The invite must
 * belong to THIS provider — we don't let one prescriber see another's
 * invite codes even if they know the URL.
 */

type PageProps = { params: Promise<{ code: string }> }

export default async function InviteDetailPage({ params }: PageProps) {
  const provider = await getCurrentProvider()
  if (!provider) return null

  const { code } = await params

  // Find the Commitment row that encodes this invite, scoped to the
  // provider's own user id. The `rule contains invite:<code>` filter +
  // the userId check together enforce "this invite belongs to me."
  const row = await prisma.commitment.findFirst({
    where: {
      userId: provider.id,
      rule: { contains: `invite:${code}` },
    },
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
  const label = lookup.label ?? 'Patient invite'
  const claimedBy = lookup.claimedBy ?? null

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://coyl.ai'
  const shareUrl = `${baseUrl}/i/provider/${code}`

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">
          Invite · {code}
        </p>
        <h1 className="mt-2 font-serif text-3xl tracking-tight text-slate-900">
          {label}
        </h1>
        <p className="mt-2 max-w-prose text-sm text-slate-600">
          Status: <span className="font-mono uppercase">{status}</span>.
          {claimedBy ? ' Claimed by an authenticated patient.' : ''}
        </p>
      </header>

      <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">
          Shareable link
        </p>
        <p className="mt-3 break-all rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-900">
          {shareUrl}
        </p>
        <p className="mt-3 text-xs text-slate-500">
          Send by email or SMS. The patient lands on a consent page and
          accepts or declines.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={`mailto:?subject=${encodeURIComponent(
              'Your COYL invite',
            )}&body=${encodeURIComponent(
              `Your clinician invited you to connect on COYL.\n\nAccept here: ${shareUrl}\n\nCOYL catches the autopilot moments your medication doesn't reach.`,
            )}`}
            className="rounded-sm border border-slate-300 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-slate-700 hover:border-slate-900 hover:text-slate-900"
          >
            Resend by email
          </a>
          <a
            href={`sms:?&body=${encodeURIComponent(
              `Your clinician invited you to connect on COYL: ${shareUrl}`,
            )}`}
            className="rounded-sm border border-slate-300 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-slate-700 hover:border-slate-900 hover:text-slate-900"
          >
            Resend by SMS
          </a>
          {status === 'pending' ? (
            <button
              type="button"
              disabled
              className="rounded-sm border border-slate-300 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400"
              title="Revocation lands in v0.2 — for now, ignore the code"
            >
              Revoke (v0.2)
            </button>
          ) : null}
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">
          What the patient sees
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
          <li>Your clinic name + the words “invited you to connect.”</li>
          <li>
            An explicit list of what gets shared with you (slip counts,
            pattern shifts, self-trust trend — no raw biometric samples).
          </li>
          <li>Two buttons: Accept, Decline.</li>
        </ul>
        <p className="mt-4 text-xs text-slate-500">
          The patient must be signed in to accept. If they decline, the
          invite is marked revoked and the link won’t resolve.
        </p>
      </section>

      <div>
        <Link
          href="/provider/invite"
          className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-500 hover:text-slate-900"
        >
          &larr; All invites
        </Link>
      </div>
    </div>
  )
}
