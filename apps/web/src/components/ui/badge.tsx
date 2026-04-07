import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
        brand: 'border-transparent bg-gradient-warm text-white',
        glow: 'border-transparent bg-orange-500/10 text-orange-600 dark:text-orange-400 shadow-glow-orange',
        'status-inbox': 'border-transparent bg-[var(--status-inbox)]/10 text-[var(--status-inbox)]',
        'status-open': 'border-transparent bg-[var(--status-open)]/10 text-[var(--status-open)]',
        'status-planned': 'border-transparent bg-[var(--status-planned)]/10 text-[var(--status-planned)]',
        'status-in-progress': 'border-transparent bg-[var(--status-in-progress)]/10 text-[var(--status-in-progress)]',
        'status-blocked': 'border-transparent bg-[var(--status-blocked)]/10 text-[var(--status-blocked)]',
        'status-waiting': 'border-transparent bg-[var(--status-waiting)]/10 text-[var(--status-waiting)]',
        'status-snoozed': 'border-transparent bg-[var(--status-snoozed)]/10 text-[var(--status-snoozed)]',
        'status-completed': 'border-transparent bg-[var(--status-completed)]/10 text-[var(--status-completed)]',
        'status-archived': 'border-transparent bg-[var(--status-archived)]/10 text-[var(--status-archived)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
