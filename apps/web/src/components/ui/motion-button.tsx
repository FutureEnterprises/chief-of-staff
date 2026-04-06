'use client'
import { motion } from 'motion/react'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import type { VariantProps } from 'class-variance-authority'

interface MotionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const MotionButton = forwardRef<HTMLButtonElement, MotionButtonProps>(
  ({ className, variant, size, children, loading, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.1, ease: [0.23, 1, 0.32, 1] }}
        className={cn(buttonVariants({ variant, size }), 'cursor-pointer', className)}
        disabled={disabled || loading}
        {...(props as any)}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {children}
          </span>
        ) : (
          children
        )}
      </motion.button>
    )
  }
)
MotionButton.displayName = 'MotionButton'

export { MotionButton }
