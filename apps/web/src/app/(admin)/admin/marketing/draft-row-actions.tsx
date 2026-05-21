'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { motion } from 'motion/react'
import type { MarketingPostStatus } from '@repo/database'
import { approveDraft, deleteDraft, markPosted, rejectDraft } from './actions'

/**
 * Inline row actions for the marketing queue list. Lives next to each
 * draft in the list view. All state-changing buttons fan into the same
 * useTransition pending flag so the row dims while ANY action is in
 * flight — keeps the UI honest with multi-second LLM calls happening
 * elsewhere.
 */
export function DraftRowActions({
  id,
  status,
}: {
  id: string
  status: MarketingPostStatus
}) {
  const [pending, start] = useTransition()

  return (
    <motion.div
      animate={{ opacity: pending ? 0.45 : 1 }}
      className="flex shrink-0 items-center gap-1.5"
    >
      <Link
        href={`/admin/marketing/${id}`}
        className="border border-white/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-gray-300 hover:border-white/30 hover:text-gray-100"
      >
        View
      </Link>

      {status === 'DRAFT' && (
        <>
          <button
            disabled={pending}
            onClick={() => start(async () => { await approveDraft(id) })}
            className="border border-orange-500/60 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-orange-500 hover:bg-orange-500 hover:text-black disabled:opacity-50"
          >
            Approve
          </button>
          <button
            disabled={pending}
            onClick={() => {
              const reason = window.prompt('Reject reason?')
              if (!reason) return
              start(async () => { await rejectDraft(id, reason) })
            }}
            className="border border-red-500/40 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-red-400 hover:bg-red-500 hover:text-black disabled:opacity-50"
          >
            Reject
          </button>
        </>
      )}

      {status === 'APPROVED' && (
        <button
          disabled={pending}
          onClick={() => {
            const url = window.prompt('Posted URL?')
            if (!url) return
            start(async () => { await markPosted(id, url) })
          }}
          className="border border-emerald-500/60 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-emerald-400 hover:bg-emerald-500 hover:text-black disabled:opacity-50"
        >
          Mark posted
        </button>
      )}

      <button
        disabled={pending}
        onClick={() => {
          if (!window.confirm('Delete this draft? This cannot be undone.')) return
          start(async () => { await deleteDraft(id) })
        }}
        className="border border-white/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-gray-500 hover:border-red-500/40 hover:text-red-400 disabled:opacity-50"
      >
        Delete
      </button>
    </motion.div>
  )
}
