'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null
  alt?: string
  fallback?: string
  firstName?: string
  lastName?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
}

export function Avatar({ 
  src, 
  alt, 
  fallback,
  firstName,
  lastName,
  size = 'md',
  className, 
  ...props 
}: AvatarProps) {
  const [imageError, setImageError] = React.useState(false)

  // Генерируем инициалы если нет fallback
  const getInitials = () => {
    if (fallback) return fallback
    if (firstName) {
      const first = firstName.charAt(0).toUpperCase()
      const last = lastName?.charAt(0).toUpperCase() || ''
      return first + last
    }
    if (alt) return alt.charAt(0).toUpperCase()
    return '?'
  }

  return (
    <div
      className={cn(
        'relative flex shrink-0 overflow-hidden rounded-full bg-telegram-primary/20',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {src && !imageError ? (
        <img
          src={src}
          alt={alt}
          onError={() => setImageError(true)}
          className="aspect-square h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-medium text-telegram-primary">
          {getInitials()}
        </div>
      )}
    </div>
  )
}

