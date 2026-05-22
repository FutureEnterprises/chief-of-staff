import Link from 'next/link'
import { NewDraftForm } from './new-draft-form'


/**
 * "New draft" — picks platform + archetype + topic + model, hands off
 * to generateDraft() server action. Redirects to the edit page on
 * success.
 */
export default function NewMarketingDraftPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange-500">
            Marketing queue
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">New draft</h1>
        </div>
        <Link
          href="/admin/marketing"
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500 hover:text-gray-200"
        >
          ← back to queue
        </Link>
      </div>

      <NewDraftForm />
    </div>
  )
}
