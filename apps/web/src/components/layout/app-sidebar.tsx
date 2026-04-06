'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { motion } from 'motion/react'
import type { User } from '@repo/database'
import {
  CheckSquare, Clock, FolderOpen, Home,
  Inbox, MessageSquare, Settings, TrendingUp,
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
  { label: 'Chat', href: '/chat', icon: MessageSquare },
]

interface AppSidebarProps { user: User }

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      style={{ backgroundColor: 'hsl(var(--sidebar))', borderColor: 'hsl(var(--sidebar-border))' }}
      className="flex h-full w-56 shrink-0 flex-col border-r"
    >
      {/* Brand */}
      <div className="flex h-14 items-center border-b px-4" style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
        <CoylLogo size="sm" />
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2 pt-3">
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
                  'relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-md bg-muted"
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                  />
                )}
                <item.icon className="relative h-4 w-4 shrink-0" />
                <span className="relative">{item.label}</span>
              </Link>
            </motion.div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-2" style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
            pathname === '/settings'
              ? 'bg-muted text-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          Settings
        </Link>
        <div className="mt-1 flex items-center gap-2.5 rounded-md px-2.5 py-2">
          <UserButton afterSignOutUrl="/" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-foreground">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.planType === 'FREE' ? 'Free plan' : 'Pro'}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
