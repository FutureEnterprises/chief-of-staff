import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDraft } from '../actions'
import { DraftEditor } from './draft-editor'

export const dynamic = 'force-dynamic'

/**
 * Single-post view + edit. Server fetches the post, hands off to the
 * client island for the editable surface.
 */
export default async function MarketingDraftPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const draft = await getDraft(id)
  if (!draft) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-orange-500">
            Marketing queue · draft
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {draft.topic}
          </h1>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-gray-500">
            {draft.platform.toLowerCase().replaceAll('_', '-')}
            {draft.archetype && ` · ${draft.archetype}`}
            {' · '}
            {draft.model}
            {' · '}
            {draft.generatedAt.toISOString().slice(0, 19).replace('T', ' ')} UTC
          </p>
        </div>
        <Link
          href="/admin/marketing"
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500 hover:text-gray-200"
        >
          ← back to queue
        </Link>
      </div>

      <DraftEditor
        id={draft.id}
        status={draft.status}
        draftBody={draft.draftBody}
        finalBody={draft.finalBody}
        archetype={draft.archetype}
        topic={draft.topic}
        postedUrl={draft.postedUrl}
        postedAt={draft.postedAt}
        rejectionReason={draft.rejectionReason}
      />
    </div>
  )
}
