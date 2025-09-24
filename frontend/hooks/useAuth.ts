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

      // Если есть токен, но нет пользователя — подтягиваем профиль с сервера
      if (savedToken && !savedUser) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
            headers: {
              Authorization: `Bearer ${savedToken}`,
            },
          })
          if (res.ok) {
            const data = await res.json()
            if (data?.user) {
              localStorage.setItem('influenta_user', JSON.stringify(data.user))
            }
          }
        } catch {}
      }

      const effectiveUser = localStorage.getItem('influenta_user')
      if (savedToken && effectiveUser) {
        const user = JSON.parse(effectiveUser)
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
        const initData = tg.initData
        const telegramUser = tg.initDataUnsafe?.user

        if (telegramUser && initData) {
          try {
            // Отправляем данные на сервер для авторизации
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/telegram`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                initData,
                user: telegramUser,
              }),
            })

            if (response.ok) {
              const authData = await response.json()
              
              if (authData.success) {
                // Сохраняем токен и пользователя
                localStorage.setItem('influenta_token', authData.token)
                localStorage.setItem('influenta_user', JSON.stringify(authData.user))

                const isAdmin = ADMIN_CONFIG.telegramIds.includes(parseInt(authData.user.telegramId))
                const isSuperAdmin = parseInt(authData.user.telegramId) === ADMIN_CONFIG.telegramIds[0]

                setAuthState({
                  user: authData.user,
                  isLoading: false,
                  isAdmin,
                  isSuperAdmin,
                  token: authData.token,
                })
                return
              }
            }
          } catch (error) {
            console.error('Auth error:', error)
          }
        }
        
        // Если авторизация не удалась
        setAuthState({
          user: null,
          isLoading: false,
          isAdmin: false,
          isSuperAdmin: false,
          token: null,
        })
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