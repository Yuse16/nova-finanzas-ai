'use client'

import { cn } from '@/lib/utils'
import { motion, type HTMLMotionProps } from 'framer-motion'

type GlassCardProps = HTMLMotionProps<'div'> & {
  variant?: 'default' | 'strong' | 'subtle'
}

export function GlassCard({
  className,
  variant = 'default',
  children,
  ...props
}: GlassCardProps) {
  const variantClass =
    variant === 'strong'
      ? 'glass-strong'
      : variant === 'subtle'
        ? 'glass-subtle'
        : 'glass'

  return (
    <motion.div
      className={cn('rounded-3xl', variantClass, className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}
