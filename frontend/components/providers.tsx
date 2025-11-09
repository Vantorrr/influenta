'use client'

import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LoadingScreen } from './LoadingScreen'
import { chatService } from '@/lib/chat.service'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Инициализация Telegram WebApp
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      
      // Инициализация
      tg.ready()
      
      // ПОЛНОЭКРАННЫЙ РЕЖИМ
      tg.expand()
      tg.enableClosingConfirmation()
      
      // Скрываем стандартные элементы Telegram
      if (tg.BackButton) {
        tg.BackButton.hide()
      }
      
      // Установка цветовой схемы
      tg.setHeaderColor('#17212B')
      tg.setBackgroundColor('#17212B')
      
      // Настройка viewport для полного экрана
      const setViewportHeight = () => {
        const height = tg.viewportHeight || window.innerHeight
        const isWide = window.innerWidth >= 1024
        // На широких экранах не форсим высоту, чтобы не ломать десктопную вёрстку админки
        if (!isWide) {
          document.documentElement.style.setProperty('--tg-viewport-height', `${height}px`)
          document.documentElement.style.height = `${height}px`
          document.body.style.height = `${height}px`
          const root = document.getElementById('__next')
          if (root) {
            root.style.height = `${height}px`
            root.style.overflow = 'hidden'
          }
        } else {
          // Сбрасываем возможные принудительные стили
          document.documentElement.style.removeProperty('height')
          document.body.style.removeProperty('height')
          const root = document.getElementById('__next')
          if (root) {
            root.style.height = ''
            root.style.overflow = ''
          }
        }
      }
      
      // Устанавливаем высоту сразу
      setViewportHeight()
      
      // Обработчик изменения размера
      const handleViewportChanged = () => {
        setViewportHeight()
      }
      
      tg.onEvent('viewportChanged', handleViewportChanged)
      window.addEventListener('resize', handleViewportChanged)
      
      // Настройка скролла для мини-аппа
      document.body.style.overflowX = 'hidden'
      document.body.style.overflowY = 'auto'
      document.documentElement.style.overflowX = 'hidden'
      document.documentElement.style.overflowY = 'auto'

      // Обработка deep-link параметров (start_param) от Telegram
      try {
        const initDataRaw = tg.initData || ''
        const urlParams = new URLSearchParams(initDataRaw)
        const startParam = urlParams.get('start_param') || ''
        // Формат: listing_<id>
        if (startParam && startParam.startsWith('listing_')) {
          const listingId = startParam.replace('listing_', '')
          if (listingId) {
            // Откроем конкретное объявление
            window.location.href = `/listings/${listingId}?source=bot&focus=response`
          }
        }
      } catch {}
      
      // Cleanup
      return () => {
        tg.offEvent('viewportChanged', handleViewportChanged)
      }
    }
  }, [])

  // Подключение WebSocket чата при наличии токена
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('influenta_token')
      if (token) {
        chatService.connect(token)
      }
      return () => chatService.disconnect()
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <LoadingScreen />
      {children}
    </QueryClientProvider>
  )
}

// Типы для Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void
        expand: () => void
        close: () => void
        setHeaderColor: (color: string) => void
        setBackgroundColor: (color: string) => void
        MainButton: {
          text: string
          color: string
          textColor: string
          isVisible: boolean
          isActive: boolean
          isProgressVisible: boolean
          show: () => void
          hide: () => void
          enable: () => void
          disable: () => void
          showProgress: (leaveActive: boolean) => void
          hideProgress: () => void
          onClick: (callback: () => void) => void
          offClick: (callback: () => void) => void
        }
        BackButton: {
          isVisible: boolean
          show: () => void
          hide: () => void
          onClick: (callback: () => void) => void
          offClick: (callback: () => void) => void
        }
        initData: string
        initDataUnsafe: {
          query_id?: string
          user?: {
            id: number
            is_bot: boolean
            first_name: string
            last_name?: string
            username?: string
            language_code?: string
            photo_url?: string
          }
          auth_date: number
          hash: string
        }
        version: string
        platform: string
        colorScheme: 'light' | 'dark'
        themeParams: {
          bg_color?: string
          text_color?: string
          hint_color?: string
          link_color?: string
          button_color?: string
          button_text_color?: string
        }
        isExpanded: boolean
        viewportHeight: number
        viewportStableHeight: number
        isClosingConfirmationEnabled: boolean
        headerColor: string
        backgroundColor: string
        sendData: (data: string) => void
        openLink: (url: string) => void
        openTelegramLink: (url: string) => void
        openInvoice: (url: string, callback?: (status: string) => void) => void
        showPopup: (params: {
          title?: string
          message: string
          buttons?: Array<{
            id?: string
            type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive'
            text?: string
          }>
        }, callback?: (id: string) => void) => void
        showAlert: (message: string, callback?: () => void) => void
        showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void
        enableClosingConfirmation: () => void
        disableClosingConfirmation: () => void
        onEvent: (eventType: string, eventHandler: () => void) => void
        offEvent: (eventType: string, eventHandler: () => void) => void
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void
          selectionChanged: () => void
        }
      }
    }
  }
}


