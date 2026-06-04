/**
 * /admin/waitlist — the invite-only control room.
 *
 * Shows live counts (total / waiting / granted / redeemed) and the
 * "open a wave" control. The (admin) layout already gates the route
 * group; requireAdmin() here is defense-in-depth for the data read.
 */

import { requireAdmin } from '@/lib/admin/is-admin'
import { getWaitlistCounts } from '@/lib/waitlist'
import { isGateEnabled } from '@/lib/waitlist-gate'
import { GrantWaveForm } from './grant-wave-form'

export default async function AdminWaitlistPage() {
  await requireAdmin()
  const counts = await getWaitlistCounts()
  const gated = isGateEnabled()

  const stats: Array<{ label: string; value: number; hint: string }> = [
    { label: 'Total joined', value: counts.total, hint: 'everyone on the list' },
    { label: 'Waiting', value: counts.waiting, hint: 'not yet granted' },
    { label: 'Granted', value: counts.granted, hint: 'invite sent / sendable' },
    { label: 'Redeemed', value: counts.redeemed, hint: 'claimed their link' },
  ]

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-black text-gray-900">Waitlist</h1>
      <p className="mt-1 text-sm text-gray-500">
        Open access in waves. Granting emails each person a claim link
        (<code className="rounded bg-gray-100 px-1">/redeem/[code]</code>).
      </p>

      <div
        className="mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
        style={{
          borderColor: gated ? '#fdba74' : '#e5e7eb',
          background: gated ? '#fff7ed' : '#f9fafb',
          color: gated ? '#c2410c' : '#6b7280',
        }}
      >
        Sign-up gate: {gated ? 'ON (invite required)' : 'OFF (sign-up open)'}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-2xl font-black text-gray-900">{s.value.toLocaleString('en-US')}</p>
            <p className="mt-1 text-xs font-semibold text-gray-700">{s.label}</p>
            <p className="text-[11px] text-gray-400">{s.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <GrantWaveForm waiting={counts.waiting} />
      </div>

      <p className="mt-6 text-xs leading-relaxed text-gray-400">
        The gate is controlled by <code>WAITLIST_GATE_ENABLED</code> (env).
        When OFF, sign-up is open and granting still works (it just emails
        invites people can use immediately). When ON, only redeemed
        invites (or B2B/clinical bypass refs) can reach sign-up.
      </p>
    </div>
  )
}
