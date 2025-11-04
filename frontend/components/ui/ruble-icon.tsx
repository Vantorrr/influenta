import { cn } from '@/lib/utils'

interface RubIconProps {
  className?: string
}

export function RubIcon({ className }: RubIconProps) {
  return (
    <span className={cn('inline-flex items-center justify-center font-semibold leading-none', className)}>
      ₽
    </span>
  )
}
