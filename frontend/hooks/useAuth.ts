import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ADMIN_CONFIG } from '@/lib/constants'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  isLoading: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
}

export function useAuth() {
  const router = useRouter()
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAdmin: false,
    isSuperAdmin: false,
  })

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      // Проверяем cookie для демо-режима админки
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`
        const parts = value.split(`; ${name}=`)
        if (parts.length === 2) return parts.pop()?.split(';').shift()
      }

      const adminTelegramId = getCookie('adminTelegramId')
      const token = getCookie('token')

      // Если есть админский cookie (для демо)
      if (adminTelegramId && token === 'admin-token') {
        const telegramId = parseInt(adminTelegramId)
        const isAdmin = ADMIN_CONFIG.telegramIds.includes(telegramId)
        const isSuperAdmin = telegramId === ADMIN_CONFIG.telegramIds[0]

        const userData: User = {
          id: adminTelegramId,
          telegramId: adminTelegramId,
          firstName: isSuperAdmin ? 'Супер' : 'Админ',
          lastName: isSuperAdmin ? 'Админ' : '#2',
          username: isSuperAdmin ? '@superadmin' : '@admin2',
          photoUrl: null,
          email: isSuperAdmin ? 'admin@example.com' : 'admin2@example.com',
          role: 'admin',
          isActive: true,
          isVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        setAuthState({
          user: userData,
          isLoading: false,
          isAdmin,
          isSuperAdmin,
        })
        return
      }

      // Получаем данные пользователя из Telegram WebApp
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp
        const user = tg.initDataUnsafe?.user

        if (user) {
          // Проверяем является ли пользователь админом
          const isAdmin = ADMIN_CONFIG.telegramIds.includes(user.id)
          const isSuperAdmin = user.id === ADMIN_CONFIG.telegramIds[0] // Первый ID - супер админ

          const userData: User = {
            id: String(user.id),
            telegramId: String(user.id),
            firstName: user.first_name,
            lastName: user.last_name || '',
            username: user.username,
            photoUrl: user.photo_url,
            role: isAdmin ? 'admin' : 'blogger', // По умолчанию blogger, если не админ
            isActive: true,
            isVerified: isAdmin, // Админы автоматически верифицированы
            createdAt: new Date(),
            updatedAt: new Date(),
          }

          setAuthState({
            user: userData,
            isLoading: false,
            isAdmin,
            isSuperAdmin,
          })
        } else {
          setAuthState({
            user: null,
            isLoading: false,
            isAdmin: false,
            isSuperAdmin: false,
          })
        }
      } else {
        // Если нет Telegram context и нет cookie
        setAuthState({
          user: null,
          isLoading: false,
          isAdmin: false,
          isSuperAdmin: false,
        })
      }
    } catch (error) {
      console.error('Auth check error:', error)
      setAuthState({
        user: null,
        isLoading: false,
        isAdmin: false,
        isSuperAdmin: false,
      })
    }
  }

  const login = async () => {
    // Логин через Telegram WebApp происходит автоматически
    checkAuth()
  }

  const logout = () => {
    setAuthState({
      user: null,
      isLoading: false,
      isAdmin: false,
      isSuperAdmin: false,
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

  return {
    ...authState,
    login,
    logout,
    checkAuth,
    checkAdminAccess,
  }
}
