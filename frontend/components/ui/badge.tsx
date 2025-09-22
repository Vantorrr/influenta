import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-telegram-bgSecondary text-telegram-text',
    primary: 'bg-telegram-primary/20 text-telegram-primary',
    success: 'bg-telegram-success/20 text-telegram-success',
    warning: 'bg-telegram-warning/20 text-telegram-warning',
    danger: 'bg-telegram-danger/20 text-telegram-danger',
  }

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    />
  )
}


