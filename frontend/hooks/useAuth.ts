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

  const waitForTelegramReady = async (timeoutMs = 6000): Promise<void> => {
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
      const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined
      if (tg?.initDataUnsafe?.user || (tg?.initData && tg.initData.length > 0)) return
      await new Promise(r => setTimeout(r, 100))
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
        // Явно сигнализируем готовность WebApp перед чтением initData
        try { tg.ready() } catch {}
        await waitForTelegramReady()

        const attemptAuth = async (): Promise<boolean> => {
          const initData = tg.initData
          const telegramUser = tg.initDataUnsafe?.user
          try {
            console.log('🟢 Sending auth request:', {
              url: `${process.env.NEXT_PUBLIC_API_URL}/auth/telegram`,
              initData: initData ? 'exists' : 'missing',
              initDataLength: initData?.length,
              hasUser: !!telegramUser,
              userId: telegramUser?.id,
            })

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/telegram`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'X-Telegram-Init-Data': initData || ''
              },
              body: JSON.stringify({ initData, user: telegramUser || undefined }),
            })

            console.log('🟢 Response status:', response.status)
            if (!response.ok) {
              const errorText = await response.text()
              console.error('🔴 Auth failed:', response.status, errorText)
              return false
            }

            const authData = await response.json()
            console.log('🟢 Auth response:', authData)
            if (authData?.success && authData?.user?.telegramId) {
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
              return true
            }
            return false
          } catch (error) {
            console.error('Auth error:', error)
            return false
          }
        }

        let ok = await attemptAuth()
        if (!ok) {
          // Даем Телеграму время заполнить user и обновить initData
          await new Promise(r => setTimeout(r, 700))
          ok = await attemptAuth()
          if (ok) return
        } else {
          return
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