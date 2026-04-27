'use client'

import { useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContextOptional } from '@/context/AuthContext'

/**
 * Тонкий wrapper над AuthContext.
 *
 * Все 17+ компонентов, которые раньше держали собственный экземпляр useAuth,
 * теперь читают единое глобальное состояние авторизации из контекста.
 * Это устраняет:
 *   • параллельные POST /auth/telegram при каждом монтировании страницы;
 *   • гонки на запись в localStorage;
 *   • конфликтующие window.location.href редиректы из разных хуков.
 *
 * Сигнатура (поля и методы) сохранена, чтобы существующие потребители
 * продолжали работать без изменений.
 */
export function useAuth() {
  const router = useRouter()
  const ctx = useAuthContextOptional()

  const checkAdminAccess = useCallback(() => {
    if (!ctx?.isAdmin) {
      router.push('/')
      return false
    }
    return true
  }, [ctx?.isAdmin, router])

  return useMemo(() => {
    if (!ctx) {
      // Безопасный фолбэк: если кто-то использует useAuth вне AuthProvider
      // (например, в SSR без провайдера), вернём «не авторизован, не загружается».
      return {
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
        isAdmin: false,
        isSuperAdmin: false,
        isOutsideTelegram: false,
        error: null,
        logout: () => {},
        refresh: async () => null,
        reauth: async () => false,
        setUser: () => {},
        checkAdminAccess: () => false,
        // Backwards compatibility shims
        adminLogin: () => false,
        adminLogout: () => {},
        isAdminLoggedIn: false,
      }
    }

    return {
      user: ctx.user,
      token: ctx.token,
      isLoading: ctx.isLoading,
      isAuthenticated: ctx.isAuthenticated,
      isAdmin: ctx.isAdmin,
      isSuperAdmin: ctx.isSuperAdmin,
      isOutsideTelegram: ctx.isOutsideTelegram,
      error: ctx.error,
      logout: ctx.logout,
      refresh: ctx.refresh,
      reauth: ctx.reauth,
      setUser: ctx.setUser,
      checkAdminAccess,
      // Backwards compatibility shims
      adminLogin: () => false,
      adminLogout: ctx.logout,
      isAdminLoggedIn: ctx.isAdmin,
    }
  }, [ctx, checkAdminAccess])
}
