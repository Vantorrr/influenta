'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

export function useScrollRestoration() {
  const pathname = usePathname()
  // Используем только pathname для ключа, без searchParams чтобы избежать проблем с Suspense
  const key = `__scroll__${pathname}`
  const restoredRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Восстанавливаем после монтирования
    const saved = sessionStorage.getItem(key)
    if (saved && !restoredRef.current) {
      try {
        const { x, y } = JSON.parse(saved)
        if (y > 0) {
          // Множественные попытки восстановления
          const restore = () => {
            window.scrollTo(x ?? 0, y ?? 0)
            document.documentElement.scrollTop = y ?? 0
            document.body.scrollTop = y ?? 0
          }

          // Первая попытка сразу
          requestAnimationFrame(restore)

          // Повторные попытки с задержками
          setTimeout(() => restore(), 50)
          setTimeout(() => restore(), 150)
          setTimeout(() => restore(), 300)
          setTimeout(() => restore(), 500)

          restoredRef.current = true
        }
      } catch (e) {
        console.error('Failed to restore scroll:', e)
      }
    }

    // На размонтаж — сохраняем позицию
    return () => {
      if (typeof window !== 'undefined') {
        const scrollY = window.scrollY || document.documentElement.scrollTop || 0
        if (scrollY > 0) {
          sessionStorage.setItem(
            key,
            JSON.stringify({ x: window.scrollX, y: scrollY })
          )
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
}

