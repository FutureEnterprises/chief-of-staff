'use client'

import { cn } from '@/lib/utils'
import { type ReactNode } from 'react'

interface GlassCardProps {
  variant?: 'default' | 'orange-glow' | 'success-glow'
  hover?: boolean
  borderColor?: string
  className?: string
  children: ReactNode
}

export function GlassCard({ variant = 'default', hover = false, borderColor, className, children }: GlassCardProps) {
  return (
    <div
      className={cn(
        'glass rounded-2xl p-4',
        hover && 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover dark:hover:shadow-card-hover-dark',
        variant === 'orange-glow' && hover && 'hover:shadow-glow-orange',
        variant === 'success-glow' && hover && 'hover:shadow-glow-success',
        className
      )}
      style={borderColor ? { borderLeft: `3px solid ${borderColor}` } : undefined}
    >
      {children}
    </div>
  )
}

export function GlassCardHeader({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('mb-3', className)}>{children}</div>
}

export function GlassCardTitle({ className, children }: { className?: string; children: ReactNode }) {
  return <h3 className={cn('heading-4 text-foreground', className)}>{children}</h3>
}
