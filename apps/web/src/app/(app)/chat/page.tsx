import { Metadata } from 'next'
import { Suspense } from 'react'
import { ChatInterface } from './chat-interface'

export const metadata: Metadata = { title: 'Chat' }

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-zinc-400">Loading...</div>}>
      <ChatInterface />
    </Suspense>
  )
}
