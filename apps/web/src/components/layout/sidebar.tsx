'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import {
  Calendar,
  CheckCircle2,
  Clock,
  FolderOpen,
  Home,
  Inbox,
  MessageSquare,
  Settings,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Today', href: '/today', icon: Home },
  { name: 'Inbox', href: '/inbox', icon: Inbox },
  { name: 'All Tasks', href: '/tasks', icon: CheckCircle2 },
  { name: 'Follow-ups', href: '/follow-ups', icon: Clock },
  { name: 'Projects', href: '/projects', icon: FolderOpen },
  { name: 'Insights', href: '/insights', icon: TrendingUp },
  { name: 'Chat', href: '/chat', icon: MessageSquare },
]

const secondary = [{ name: 'Settings', href: '/settings', icon: Settings }]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-60 flex-col border-r bg-zinc-50/50">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-900">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-semibold tracking-tight">Chief of Staff</span>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 space-y-0.5 p-2 pt-3">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Secondary Nav + User */}
      <div className="border-t p-2">
        {secondary.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-zinc-100 text-zinc-900'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.name}
            </Link>
          )
        })}
        <div className="mt-2 flex items-center gap-2 rounded-md px-3 py-2">
          <UserButton afterSignOutUrl="/" />
          <span className="text-xs text-zinc-500">Account</span>
        </div>
      </div>
    </div>
  )
}
