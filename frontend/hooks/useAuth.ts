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

  const waitForTelegramReady = async (timeoutMs = 2000): Promise<void> => {
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user) return
      await new Promise(r => setTimeout(r, 50))
    }
  }

  const initAuth = async () => {
    try {
      console.log('🔵 InitAuth started')
      console.log('🔵 Telegram WebApp available:', !!window.Telegram?.WebApp)
      console.log('🔵 Telegram user:', window.Telegram?.WebApp?.initDataUnsafe?.user)
      
      // Проверяем сохраненную сессию
      const savedToken = localStorage.getItem('influenta_token')
      const savedUser = localStorage.getItem('influenta_user')
      console.log('🔵 SavedToken:', !!savedToken)
      console.log('🔵 SavedUser:', !!savedUser)

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
            const maybeUser = (data && (data.user ?? data)) || null
            if (maybeUser?.id) {
              localStorage.setItem('influenta_user', JSON.stringify(maybeUser))
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
        await waitForTelegramReady()
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
              } else {
                // Повторная попытка один раз через короткую задержку
                await new Promise(r => setTimeout(r, 200))
                return initAuth()
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
        // Не в Telegram - для dev режима создаем тестового пользователя
        console.log('Creating dev user for testing')
        const devUser = {
          id: 'dev-user-123',
          telegramId: '123456789',
          firstName: 'Тест',
          lastName: 'Пользователь',
          username: 'testuser',
          photoUrl: null,
          email: 'test@example.com',
          role: 'blogger',
          isActive: true,
          isVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        
        localStorage.setItem('influenta_token', 'dev-token-123')
        localStorage.setItem('influenta_user', JSON.stringify(devUser))
        
        setAuthState({
          user: devUser,
          isLoading: false,
          isAdmin: false,
          isSuperAdmin: false,
          token: 'dev-token-123',
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