'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton, useClerk } from '@clerk/nextjs'
import { motion } from 'motion/react'
import type { User } from '@repo/database'
import {
  Brain, CheckSquare, Clock, Flame, FolderOpen, Home,
  Inbox, LogOut, MessageSquare, Settings, TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CoylLogo } from '@/components/brand/logo'

const navItems = [
  { label: 'Today', href: '/today', icon: Home },
  { label: 'Inbox', href: '/inbox', icon: Inbox },
  { label: 'Tasks', href: '/tasks', icon: CheckSquare },
  { label: 'Follow-ups', href: '/follow-ups', icon: Clock },
  { label: 'Projects', href: '/projects', icon: FolderOpen },
  { label: 'Insights', href: '/insights', icon: TrendingUp },
  { label: 'Assessment', href: '/assessment', icon: Brain },
  { label: 'Chat', href: '/chat', icon: MessageSquare },
]

interface AppSidebarProps { user: User }

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname()
  const { signOut } = useClerk()

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar))] backdrop-blur-xl">
      {/* Brand */}
      <div className="flex h-14 items-center border-b border-[hsl(var(--sidebar-border))] px-5">
        <CoylLogo size="sm" />
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3 pt-4">
        {navItems.map((item, i) => {
          const isActive = pathname === item.href || (item.href !== '/today' && pathname.startsWith(item.href))
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03, duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            >
              <Link
                href={item.href}
                className={cn(
                  'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/10 to-transparent border-l-2 border-orange-500"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
                <item.icon className={cn(
                  'relative h-4 w-4 shrink-0 transition-colors',
                  isActive && 'text-orange-500'
                )} />
                <span className="relative">{item.label}</span>
              </Link>
            </motion.div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-[hsl(var(--sidebar-border))] p-3">
        {/* Execution Score + Streak */}
        <div className="mb-2 flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500/10 to-transparent px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/20 text-sm font-black text-orange-500">
            {user.executionScore ?? 0}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Execution</p>
            <div className="flex items-center gap-1">
              <Flame className="h-3 w-3 text-orange-500" />
              <span className="text-[11px] font-bold text-orange-500">{user.currentStreak ?? 0}d streak</span>
            </div>
          </div>
        </div>

        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
            pathname === '/settings'
              ? 'bg-gradient-to-r from-orange-500/10 to-transparent border-l-2 border-orange-500 text-foreground'
              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
          )}
        >
          <Settings className={cn('h-4 w-4 shrink-0', pathname === '/settings' && 'text-orange-500')} />
          Settings
        </Link>
        <div className="mt-2 glass rounded-xl px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            <UserButton afterSignOutUrl="/" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground">{user.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {user.planType === 'FREE' ? (
                  <span>Free plan <span className="text-orange-500">&#183; Upgrade</span></span>
                ) : (
                  <span className="text-orange-500">Pro</span>
                )}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => signOut({ redirectUrl: '/' })}
          className="mt-1.5 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-muted/50 hover:text-foreground"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
