'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ADMIN_CONFIG } from '@/lib/constants'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  isLoading: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
  token: string | null
}

export function useAuth() {
  const router = useRouter()
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAdmin: false,
    isSuperAdmin: false,
    token: null,
  })

  useEffect(() => {
    initAuth()
  }, [])

  const initAuth = async () => {
    try {
      // Проверяем сохраненную сессию
      const savedToken = localStorage.getItem('influenta_token')
      const savedUser = localStorage.getItem('influenta_user')

      if (savedToken && savedUser) {
        const user = JSON.parse(savedUser)
        const isAdmin = ADMIN_CONFIG.telegramIds.includes(parseInt(user.telegramId))
        const isSuperAdmin = parseInt(user.telegramId) === ADMIN_CONFIG.telegramIds[0]

        setAuthState({
          user,
          isLoading: false,
          isAdmin,
          isSuperAdmin,
          token: savedToken,
        })
        return
      }

      // Получаем данные от Telegram WebApp
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp
        const telegramUser = tg.initDataUnsafe?.user

        if (telegramUser) {
          // Создаем пользователя из Telegram данных
          const user: User = {
            id: telegramUser.id.toString(),
            telegramId: telegramUser.id.toString(),
            firstName: telegramUser.first_name,
            lastName: telegramUser.last_name || '',
            username: telegramUser.username || '',
            photoUrl: telegramUser.photo_url || null,
            email: null,
            role: ADMIN_CONFIG.telegramIds.includes(telegramUser.id) ? 'admin' : 'blogger',
            isActive: true,
            isVerified: ADMIN_CONFIG.telegramIds.includes(telegramUser.id),
            createdAt: new Date(),
            updatedAt: new Date(),
          }

          const isAdmin = ADMIN_CONFIG.telegramIds.includes(telegramUser.id)
          const isSuperAdmin = telegramUser.id === ADMIN_CONFIG.telegramIds[0]

          // Сохраняем в localStorage для постоянной сессии
          localStorage.setItem('influenta_token', 'telegram_session_' + telegramUser.id)
          localStorage.setItem('influenta_user', JSON.stringify(user))

          setAuthState({
            user,
            isLoading: false,
            isAdmin,
            isSuperAdmin,
            token: 'telegram_session_' + telegramUser.id,
          })
        } else {
          // Нет данных от Telegram
          setAuthState({
            user: null,
            isLoading: false,
            isAdmin: false,
            isSuperAdmin: false,
            token: null,
          })
        }
      } else {
        // Не в Telegram - для dev режима
        setAuthState({
          user: null,
          isLoading: false,
          isAdmin: false,
          isSuperAdmin: false,
          token: null,
        })
      }
    } catch (error) {
      console.error('Auth error:', error)
      setAuthState({
        user: null,
        isLoading: false,
        isAdmin: false,
        isSuperAdmin: false,
        token: null,
      })
    }
  }

  const logout = () => {
    localStorage.removeItem('influenta_token')
    localStorage.removeItem('influenta_user')
    setAuthState({
      user: null,
      isLoading: false,
      isAdmin: false,
      isSuperAdmin: false,
      token: null,
    })
    
    // Закрываем Telegram WebApp
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      window.Telegram.WebApp.close()
    }
  }

  const checkAdminAccess = () => {
    if (!authState.isAdmin) {
      router.push('/')
      return false
    }
    return true
  }

  // Backward compatibility
  const adminLogin = () => false
  const adminLogout = logout
  const isAdminLoggedIn = authState.isAdmin

  return {
    ...authState,
    logout,
    checkAdminAccess,
    adminLogin,
    adminLogout,
    isAdminLoggedIn,
  }
}