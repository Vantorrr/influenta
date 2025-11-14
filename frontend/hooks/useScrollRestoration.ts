'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function useScrollRestoration() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const key = `__scroll__${pathname}?${searchParams?.toString() ?? ''}`

  useEffect(() => {
    // Восстанавливаем после монтирования
    const saved = sessionStorage.getItem(key)
    if (saved) {
      const { x, y } = JSON.parse(saved)
      // Дождёмся первого кадра, чтобы DOM успел отрисоваться
      requestAnimationFrame(() => window.scrollTo(x ?? 0, y ?? 0))
    }

    // На размонтаж — сохраняем позицию
    return () => {
      sessionStorage.setItem(
        key,
        JSON.stringify({ x: window.scrollX, y: window.scrollY })
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
}

