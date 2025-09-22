import { forwardRef, InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  icon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, icon, ...props }, ref) => {
    return (
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-telegram-textSecondary">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            'w-full px-4 py-2 bg-telegram-bg border rounded-lg text-telegram-text placeholder-telegram-textSecondary focus:outline-none transition-colors',
            icon && 'pl-10',
            error
              ? 'border-telegram-danger focus:border-telegram-danger'
              : 'border-gray-600 focus:border-telegram-primary',
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }


