'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import type { MarketingPostStatus } from '@repo/database'
import {
  approveDraft,
  deleteDraft,
  markPosted,
  rejectDraft,
  updateDraft,
} from '../actions'

/**
 * Inline editor for a single MarketingPost. The textarea defaults to
 * finalBody if present, otherwise draftBody (the LLM output). Save
 * writes back to finalBody so the original draft is preserved for
 * audit / regeneration / voice-drift comparison.
 *
 * All action buttons share one useTransition pending flag — the form
 * dims while any action is in flight.
 */
export function DraftEditor({
  id,
  status,
  draftBody,
  finalBody,
  archetype,
  topic,
  postedUrl,
  postedAt,
  rejectionReason,
}: {
  id: string
  status: MarketingPostStatus
  draftBody: string
  finalBody: string | null
  archetype: string | null
  topic: string
  postedUrl: string | null
  postedAt: Date | null
  rejectionReason: string | null
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [body, setBody] = useState(finalBody ?? draftBody)
  const [editedTopic, setEditedTopic] = useState(topic)
  const [editedArchetype, setEditedArchetype] = useState(archetype ?? '')
  const [error, setError] = useState<string | null>(null)
  const [confirmReject, setConfirmReject] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [confirmPost, setConfirmPost] = useState(false)
  const [postUrl, setPostUrl] = useState('')

  function wrap(fn: () => Promise<void>) {
    setError(null)
    start(async () => {
      try {
        await fn()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Action failed.')
      }
    })
  }

  return (
    <motion.div
      animate={{ opacity: pending ? 0.6 : 1 }}
      className="space-y-6"
    >
      <StatusBanner status={status} postedUrl={postedUrl} postedAt={postedAt} rejectionReason={rejectionReason} />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-400">
            Topic
          </span>
          <input
            value={editedTopic}
            onChange={(e) => setEditedTopic(e.target.value)}
            disabled={pending}
            className="w-full border border-white/15 bg-[#0a0a0a] px-3 py-2 font-mono text-sm text-gray-100 focus:border-orange-500 focus:outline-none"
          />
        </label>
        <label className="block space-y-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-400">
            Archetype
          </span>
          <input
            value={editedArchetype}
            onChange={(e) => setEditedArchetype(e.target.value)}
            disabled={pending}
            placeholder="(none)"
            className="w-full border border-white/15 bg-[#0a0a0a] px-3 py-2 font-mono text-sm text-gray-100 placeholder:text-gray-600 focus:border-orange-500 focus:outline-none"
          />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-400">
            Original draft (LLM output)
          </p>
          <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap border border-white/[0.08] bg-[#0a0a0a] p-3 font-mono text-[12px] leading-relaxed text-gray-400">
            {draftBody}
          </pre>
        </div>
        <div className="space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-orange-500">
            Final body (edited — this is what gets posted)
          </p>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={pending}
            rows={20}
            className="block w-full resize-y border border-white/15 bg-[#0a0a0a] p-3 font-mono text-[12px] leading-relaxed text-gray-100 focus:border-orange-500 focus:outline-none"
          />
        </div>
      </div>

      {error && (
        <p className="border border-red-500/40 bg-red-500/5 px-3 py-2 font-mono text-[11px] text-red-400">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.08] pt-4">
        <button
          disabled={pending}
          onClick={() =>
            wrap(async () => {
              await updateDraft(id, {
                finalBody: body,
                topic: editedTopic,
                archetype: editedArchetype || null,
              })
            })
          }
          className="border border-white/20 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-gray-200 hover:border-white/40 disabled:opacity-50"
        >
          Save
        </button>

        {status === 'DRAFT' && (
          <button
            disabled={pending}
            onClick={() =>
              wrap(async () => {
                if (body !== (finalBody ?? draftBody) || editedTopic !== topic || editedArchetype !== (archetype ?? '')) {
                  await updateDraft(id, {
                    finalBody: body,
                    topic: editedTopic,
                    archetype: editedArchetype || null,
                  })
                }
                await approveDraft(id)
              })
            }
            className="border border-orange-500 bg-orange-500 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-black hover:bg-orange-400 disabled:opacity-50"
          >
            Approve
          </button>
        )}

        {status === 'DRAFT' && (
          <button
            disabled={pending}
            onClick={() => setConfirmReject((v) => !v)}
            className="border border-red-500/40 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-red-400 hover:bg-red-500 hover:text-black disabled:opacity-50"
          >
            Reject
          </button>
        )}

        {status === 'APPROVED' && (
          <button
            disabled={pending}
            onClick={() => setConfirmPost((v) => !v)}
            className="border border-emerald-500/60 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-emerald-400 hover:bg-emerald-500 hover:text-black disabled:opacity-50"
          >
            Mark posted
          </button>
        )}

        <span className="grow" />

        <button
          disabled={pending}
          onClick={() => {
            if (!window.confirm('Delete this draft? This cannot be undone.')) return
            wrap(async () => {
              await deleteDraft(id)
              router.push('/admin/marketing')
            })
          }}
          className="border border-white/10 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-gray-500 hover:border-red-500/40 hover:text-red-400 disabled:opacity-50"
        >
          Delete
        </button>
      </div>

      <AnimatePresence>
        {confirmReject && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="space-y-2 border border-red-500/40 bg-red-500/5 p-4"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-red-400">
              Reject reason
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Why is this being rejected?"
              className="w-full border border-red-500/40 bg-[#0a0a0a] p-2 font-mono text-[12px] text-gray-100 placeholder:text-gray-600 focus:border-red-500 focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                disabled={pending}
                onClick={() => {
                  const r = rejectReason.trim()
                  if (!r) {
                    setError('Rejection reason is required.')
                    return
                  }
                  wrap(async () => {
                    await rejectDraft(id, r)
                    setConfirmReject(false)
                  })
                }}
                className="border border-red-500 bg-red-500 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-black hover:bg-red-400 disabled:opacity-50"
              >
                Confirm reject
              </button>
              <button
                disabled={pending}
                onClick={() => setConfirmReject(false)}
                className="border border-white/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-gray-400 hover:text-gray-200"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        {confirmPost && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="space-y-2 border border-emerald-500/40 bg-emerald-500/5 p-4"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-emerald-400">
              Posted URL
            </p>
            <input
              value={postUrl}
              onChange={(e) => setPostUrl(e.target.value)}
              placeholder="https://reddit.com/r/.../comments/..."
              className="w-full border border-emerald-500/40 bg-[#0a0a0a] p-2 font-mono text-[12px] text-gray-100 placeholder:text-gray-600 focus:border-emerald-500 focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                disabled={pending}
                onClick={() => {
                  const u = postUrl.trim()
                  if (!u) {
                    setError('Posted URL is required.')
                    return
                  }
                  wrap(async () => {
                    await markPosted(id, u)
                    setConfirmPost(false)
                  })
                }}
                className="border border-emerald-500 bg-emerald-500 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-black hover:bg-emerald-400 disabled:opacity-50"
              >
                Confirm posted
              </button>
              <button
                disabled={pending}
                onClick={() => setConfirmPost(false)}
                className="border border-white/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-gray-400 hover:text-gray-200"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function StatusBanner({
  status,
  postedUrl,
  postedAt,
  rejectionReason,
}: {
  status: MarketingPostStatus
  postedUrl: string | null
  postedAt: Date | null
  rejectionReason: string | null
}) {
  const colorMap: Record<MarketingPostStatus, string> = {
    DRAFT: 'border-gray-600 text-gray-300',
    APPROVED: 'border-orange-500 text-orange-500',
    POSTED: 'border-emerald-500 text-emerald-400',
    REJECTED: 'border-red-500/60 text-red-400',
    ERRORED: 'border-yellow-500 text-yellow-400',
  }
  return (
    <div className={`flex items-center justify-between border ${colorMap[status]} px-4 py-3`}>
      <p className="font-mono text-[11px] uppercase tracking-[0.14em]">{status}</p>
      <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-gray-500">
        {status === 'POSTED' && postedUrl && postedAt && (
          <>
            <a href={postedUrl} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">
              {postedUrl}
            </a>
            {' · '}
            {postedAt.toISOString().slice(0, 19).replace('T', ' ')} UTC
          </>
        )}
        {status === 'REJECTED' && rejectionReason && <span>{rejectionReason}</span>}
      </p>
    </div>
  )
}
