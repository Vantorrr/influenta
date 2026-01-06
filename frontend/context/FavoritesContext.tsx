'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { favoritesApi } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'

interface FavoritesContextType {
  favorites: Record<string, boolean>
  favoritesCount: number
  toggleFavorite: (bloggerId: string) => Promise<void>
  checkFavorite: (bloggerId: string) => boolean
  loadingIds: Record<string, boolean>
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<Record<string, boolean>>({})
  const [favoritesCount, setFavoritesCount] = useState(0)
  const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({})
  const [initialized, setInitialized] = useState(false)

  // Загрузка начального состояния (счетчик и список ID)
  useEffect(() => {
    if (!user) {
      setFavorites({})
      setFavoritesCount(0)
      return
    }

    const init = async () => {
      try {
        // Получаем общее количество
        const countRes = await favoritesApi.getCount()
        setFavoritesCount(countRes.count)

        // Получаем ID всех избранных (для быстрого доступа)
        // Запрашиваем первую страницу с большим лимитом, чтобы заполнить кеш
        // В идеале нужен эндпоинт для получения только ID, но пока так
        const listRes = await favoritesApi.getList(1, 1000)
        const favMap: Record<string, boolean> = {}
        if (listRes.data && Array.isArray(listRes.data)) {
          listRes.data.forEach((b: any) => {
            favMap[b.id] = true
          })
        }
        setFavorites(favMap)
      } catch (e) {
        console.error('Failed to init favorites', e)
      } finally {
        setInitialized(true)
      }
    }

    init()
  }, [user])

  const toggleFavorite = useCallback(async (bloggerId: string) => {
    if (!user) return

    // Оптимистичное обновление
    const isFav = !!favorites[bloggerId]
    setFavorites(prev => ({ ...prev, [bloggerId]: !isFav }))
    setFavoritesCount(prev => (isFav ? prev - 1 : prev + 1))
    setLoadingIds(prev => ({ ...prev, [bloggerId]: true }))

    // Haptic
    try {
      const haptic = (window as any).Telegram?.WebApp?.HapticFeedback
      if (haptic) {
        haptic.impactOccurred('heavy')
      } else if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    } catch {}

    try {
      await favoritesApi.toggle(bloggerId)
    } catch (e) {
      console.error('Toggle favorite error', e)
      // Откат
      setFavorites(prev => ({ ...prev, [bloggerId]: isFav }))
      setFavoritesCount(prev => (isFav ? prev + 1 : prev - 1))
    } finally {
      setLoadingIds(prev => {
        const next = { ...prev }
        delete next[bloggerId]
        return next
      })
    }
  }, [user, favorites])

  const checkFavorite = useCallback((bloggerId: string) => {
    return !!favorites[bloggerId]
  }, [favorites])

  return (
    <FavoritesContext.Provider value={{ favorites, favoritesCount, toggleFavorite, checkFavorite, loadingIds }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }
  return context
}






