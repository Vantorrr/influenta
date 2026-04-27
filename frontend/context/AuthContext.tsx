'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import { ADMIN_CONFIG } from '@/lib/constants'
import type { User } from '@/types'

const TOKEN_KEY = 'influenta_token'
const USER_KEY = 'influenta_user'
const ONBOARDING_KEY = 'onboarding_completed'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
  /** true, если страница не была открыта внутри Telegram WebApp */
  isOutsideTelegram: boolean
  /** Заполнено, если в процессе авторизации произошла ошибка */
  error: string | null
}

interface AuthContextValue extends AuthState {
  /** Обновить локальное состояние пользователя (вызывается после updateProfile) */
  setUser: (user: User | null) => void
  /** Принудительно перетянуть профиль с сервера */
  refresh: () => Promise<User | null>
  /** Повторить авторизацию через Telegram (например, после 401) */
  reauth: () => Promise<boolean>
  /** Выйти и почистить сессию */
  logout: () => void
}

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  isAdmin: false,
  isSuperAdmin: false,
  isOutsideTelegram: false,
  error: null,
}

const AuthContext = createContext<AuthContextValue | null>(null)

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

const computeAdminFlags = (user: User | null) => {
  if (!user?.telegramId) return { isAdmin: false, isSuperAdmin: false }
  const tgId = parseInt(String(user.telegramId), 10)
  if (!Number.isFinite(tgId)) return { isAdmin: false, isSuperAdmin: false }
  return {
    isAdmin: ADMIN_CONFIG.telegramIds.includes(tgId),
    isSuperAdmin: tgId === ADMIN_CONFIG.telegramIds[0],
  }
}

const safeParseUser = (raw: string | null): User | null => {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && parsed.id) return parsed as User
  } catch {
    // ignore
  }
  return null
}

const waitForTelegram = async (timeoutMs: number) => {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined
    if (tg?.initDataUnsafe?.user?.id && tg?.initData && tg.initData.length > 10) {
      return true
    }
    await new Promise((r) => setTimeout(r, 120))
  }
  return false
}

/**
 * Сначала ждём, пока Telegram WebApp SDK прогрузится в `window.Telegram.WebApp`.
 * Сам объект может появиться позже, чем смонтируется AuthProvider, поскольку
 * скрипт telegram-web-app.js подключён в <head>. Нам нужно отличать «не открыто
 * в Telegram» от «открыто, но SDK ещё не успел загрузиться».
 */
const waitForTelegramObject = async (timeoutMs: number) => {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) return true
    await new Promise((r) => setTimeout(r, 80))
  }
  return false
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [state, setState] = useState<AuthState>(initialState)
  /**
   * Глобальная защита от параллельных авторизаций.
   * useAuth раньше вызывался из 17+ компонентов и каждое монтирование плодило
   * собственный POST /auth/telegram → гонки на токен/локалсторадж.
   * Здесь auth выполняется ровно один раз на жизнь приложения.
   */
  const initializedRef = useRef(false)
  const inflightAuthRef = useRef<Promise<boolean> | null>(null)
  const refreshInflightRef = useRef<Promise<User | null> | null>(null)

  const writeSession = useCallback((token: string | null, user: User | null) => {
    if (typeof window === 'undefined') return
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token)
      else localStorage.removeItem(TOKEN_KEY)
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
      else localStorage.removeItem(USER_KEY)
      if (user?.onboardingCompleted) {
        localStorage.setItem(ONBOARDING_KEY, 'true')
      }
    } catch (e) {
      console.warn('AuthContext: localStorage write failed', e)
    }
  }, [])

  const applyUser = useCallback((user: User | null, token: string | null) => {
    const adminFlags = computeAdminFlags(user)
    setState((prev) => ({
      ...prev,
      user,
      token,
      isAuthenticated: !!user && !!token,
      isLoading: false,
      isAdmin: adminFlags.isAdmin,
      isSuperAdmin: adminFlags.isSuperAdmin,
      error: null,
    }))
  }, [])

  const fetchProfile = useCallback(async (token: string): Promise<User | null> => {
    if (!API_URL) return null
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
      if (!res.ok) return null
      const data = await res.json()
      return ((data && (data.user ?? data)) as User) || null
    } catch {
      return null
    }
  }, [])

  const refresh = useCallback(async (): Promise<User | null> => {
    if (refreshInflightRef.current) return refreshInflightRef.current
    const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null
    if (!token) return null
    const promise = (async () => {
      const fresh = await fetchProfile(token)
      if (fresh?.id) {
        writeSession(token, fresh)
        applyUser(fresh, token)
      }
      return fresh
    })()
    refreshInflightRef.current = promise
    try {
      return await promise
    } finally {
      refreshInflightRef.current = null
    }
  }, [applyUser, fetchProfile, writeSession])

  const performTelegramAuth = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false
    const tg = window.Telegram?.WebApp
    if (!tg) return false

    try {
      tg.ready()
    } catch {
      // ignore — некоторые версии могут бросать
    }

    const ready = await waitForTelegram(8000)
    if (!ready) return false

    const initData = tg.initData
    const telegramUser = tg.initDataUnsafe?.user
    if (!telegramUser?.id || !initData) return false

    const maxAttempts = 4
    let lastError: any = null
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(`${API_URL}/auth/telegram`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Telegram-Init-Data': initData,
          },
          body: JSON.stringify({ initData, user: telegramUser }),
        })

        if (!response.ok) {
          const text = await response.text().catch(() => '')
          lastError = `${response.status}: ${text}`
          // 4xx (кроме 401) — повторять бессмысленно
          if (response.status >= 400 && response.status < 500 && response.status !== 401) {
            console.warn('Auth: client error, not retrying', lastError)
            break
          }
        } else {
          const authData = await response.json()
          if (authData?.success && authData?.token && authData?.user?.telegramId) {
            writeSession(authData.token, authData.user)
            applyUser(authData.user, authData.token)
            // Подтянуть свежий профиль (онбординг, верификация и пр.)
            void refresh()
            return true
          }
          lastError = 'Malformed auth response'
        }
      } catch (err: any) {
        lastError = err?.message || String(err)
      }
      await new Promise((r) => setTimeout(r, 350 * (attempt + 1)))
    }

    console.error('Telegram auth failed after retries:', lastError)
    setState((prev) => ({
      ...prev,
      error: 'Не удалось авторизоваться через Telegram. Перезапустите мини-приложение.',
      isLoading: false,
    }))
    return false
  }, [applyUser, refresh, writeSession])

  const reauth = useCallback(async (): Promise<boolean> => {
    if (inflightAuthRef.current) return inflightAuthRef.current
    const promise = performTelegramAuth()
    inflightAuthRef.current = promise
    try {
      return await promise
    } finally {
      inflightAuthRef.current = null
    }
  }, [performTelegramAuth])

  const logout = useCallback(() => {
    writeSession(null, null)
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(ONBOARDING_KEY)
      } catch {
        // ignore
      }
    }
    setState({ ...initialState, isLoading: false })
    try {
      router.push('/')
    } catch {
      // ignore
    }
  }, [router, writeSession])

  const setUser = useCallback(
    (user: User | null) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null
      writeSession(token, user)
      applyUser(user, token)
    },
    [applyUser, writeSession],
  )

  // Главная инициализация: запускаем ровно один раз при монтировании AuthProvider
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    const init = async () => {
      // Сначала даём шанс telegram-web-app.js загрузиться (он подключён в <head>).
      // Эта проверка избавляет от ложного «откройте через Telegram» при медленной загрузке SDK.
      const hasTelegram = await waitForTelegramObject(2500)

      if (typeof window !== 'undefined' && hasTelegram) {
        try {
          window.Telegram!.WebApp.ready()
        } catch {
          // ignore
        }
      }

      // Сразу подгружаем кеш — UI не будет «прыгать»
      const cachedUser = safeParseUser(typeof window !== 'undefined' ? localStorage.getItem(USER_KEY) : null)

      // Если открыто в Telegram — сверяем кеш с актуальным telegramId, чтобы не подменить аккаунт
      if (hasTelegram && cachedUser) {
        await waitForTelegram(1500)
        const currentTgId = String(window.Telegram?.WebApp?.initDataUnsafe?.user?.id || '')
        const cachedTgId = String(cachedUser.telegramId || '')
        if (currentTgId && cachedTgId && currentTgId !== cachedTgId) {
          console.warn('AuthContext: cached session belongs to a different Telegram user, resetting')
          writeSession(null, null)
        }
      }

      const tokenAfter = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null
      const userAfter = safeParseUser(typeof window !== 'undefined' ? localStorage.getItem(USER_KEY) : null)

      if (tokenAfter && userAfter) {
        applyUser(userAfter, tokenAfter)
        // Фоном подтягиваем свежий профиль
        void refresh()
      } else {
        // Кеш отсутствует или сброшен — пробуем чистую авторизацию
        if (hasTelegram) {
          await reauth()
        } else {
          // Не в Telegram — НЕ создаём фейкового пользователя.
          // Показываем явный экран «откройте через Telegram».
          setState({
            ...initialState,
            isLoading: false,
            isOutsideTelegram: true,
          })
        }
      }
    }

    void init()
  }, [applyUser, reauth, refresh, writeSession])

  // Пере-фетч профиля при возврате во вкладку — чтобы видеть свежий статус верификации и т.п.
  useEffect(() => {
    const handleFocus = () => {
      if (state.isAuthenticated) void refresh()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refresh, state.isAuthenticated])

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      setUser,
      refresh,
      reauth,
      logout,
    }),
    [state, setUser, refresh, reauth, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuthContext must be used within <AuthProvider>')
  }
  return ctx
}

/** Только для внутреннего использования (например, чтобы избежать throw в SSR/тестах). */
export function useAuthContextOptional(): AuthContextValue | null {
  return useContext(AuthContext)
}
