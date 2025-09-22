'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  language_code?: string
}

interface AuthState {
  user: TelegramUser | null
  isAuthenticated: boolean
  isLoading: boolean
  token: string | null
}

export function useTelegramAuth() {
  const router = useRouter()
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    token: null,
  })

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Проверяем сохраненную сессию
        const savedToken = localStorage.getItem('influenta_token')
        const savedUser = localStorage.getItem('influenta_user')

        if (savedToken && savedUser) {
          setAuthState({
            user: JSON.parse(savedUser),
            isAuthenticated: true,
            isLoading: false,
            token: savedToken,
          })
          return
        }

        // Получаем данные от Telegram WebApp
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
          const tg = window.Telegram.WebApp
          const initData = tg.initData
          const user = tg.initDataUnsafe?.user

          if (user && initData) {
            // Отправляем данные на сервер для проверки и получения токена
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/telegram`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                initData,
                user,
              }),
            })

            if (response.ok) {
              const data = await response.json()
              
              // Сохраняем токен и пользователя
              localStorage.setItem('influenta_token', data.token)
              localStorage.setItem('influenta_user', JSON.stringify(user))

              setAuthState({
                user,
                isAuthenticated: true,
                isLoading: false,
                token: data.token,
              })
            } else {
              throw new Error('Authentication failed')
            }
          } else {
            // Нет данных от Telegram - показываем ошибку
            setAuthState({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              token: null,
            })
          }
        } else {
          // Не в Telegram - для тестирования
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            token: null,
          })
        }
      } catch (error) {
        console.error('Auth error:', error)
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          token: null,
        })
      }
    }

    initAuth()
  }, [])

  const logout = () => {
    localStorage.removeItem('influenta_token')
    localStorage.removeItem('influenta_user')
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      token: null,
    })
    router.push('/')
  }

  const isAdmin = () => {
    if (!authState.user) return false
    const adminIds = [741582706, 8141463258]
    return adminIds.includes(authState.user.id)
  }

  const isSuperAdmin = () => {
    if (!authState.user) return false
    return authState.user.id === 741582706
  }

  return {
    ...authState,
    logout,
    isAdmin: isAdmin(),
    isSuperAdmin: isSuperAdmin(),
  }
}
