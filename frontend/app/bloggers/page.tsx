'use client'
import { Suspense } from 'react'
import { useEffect, useLayoutEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  SlidersHorizontal, 
  Search as SearchIcon, 
  Users, 
  Eye, 
  Star,
  ChevronRight,
  X,
  CheckCircle,
  Send
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { VerificationTooltip } from '@/components/VerificationTooltip'
import { 
  formatNumber, 
  formatPrice, 
  getCategoryLabel,
  cn,
  formatNumberInput,
  parseNumberInput
} from '@/lib/utils'
import { bloggersApi, analyticsApi, socialPlatformsApi } from '@/lib/api'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { BloggerCategory, type BloggerFilters } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { getPlatformIcon } from '@/components/icons/PlatformIcons'
import { useSearchParams, useRouter } from 'next/navigation'

function BloggersContent() {
  // APP VERSION: v0.2.0 - Build timestamp: 2025-11-11T12:14:00
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<BloggerFilters>({
    categories: [],
    verifiedOnly: false,
  })

  const { user, isAdmin } = useAuth()
  const queryClient = useQueryClient()
  const router = useRouter()
  
  // Загружаем всех блогеров одним запросом, но с оптимизацией
  const { data, isLoading } = useQuery({
    queryKey: ['bloggers', filters, search],
    queryFn: () => bloggersApi.search({ ...filters, search }, 1, 500),
    staleTime: 5 * 60 * 1000, // Кеш на 5 минут
    gcTime: 10 * 60 * 1000, // Держим в памяти 10 минут
    enabled: !!user,
  })

  useEffect(() => {
    analyticsApi.track('bloggers_list_view')
    
    // Disable Next.js automatic scroll restoration
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  const searchParams = useSearchParams()

  // Restore scroll position by finding the saved blogger element
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return

    // Reset flag on mount to allow restoration
    ;(window as any).__bloggersScrollRestored = false

    const restoreScroll = () => {
      // Get saved blogger ID from URL or storage
      const urlParams = new URLSearchParams(window.location.search)
      let savedBloggerId = urlParams.get('blogger-id')
      
      if (!savedBloggerId) {
        savedBloggerId = sessionStorage.getItem('bloggers-scroll-blogger-id') || localStorage.getItem('bloggers-scroll-blogger-id')
      }
      
      if (!savedBloggerId) {
        return false
      }
      
      // Find the element and scroll to it
      const element = document.getElementById(`blogger-${savedBloggerId}`)
      
      if (element) {
        const rect = element.getBoundingClientRect()
        const elementTop = rect.top + window.scrollY
        const targetPosition = elementTop - 20
        
        // Check if already at correct position (within 100px to be more lenient)
        const currentScroll = window.scrollY || document.documentElement.scrollTop || 0
        if (Math.abs(currentScroll - targetPosition) < 100) {
          ;(window as any).__bloggersScrollRestored = true
          return true
        }
        
        // Restore scroll (flag prevents duplicate calls from other effects)
        element.scrollIntoView({ behavior: 'auto', block: 'start' })
        // Also try window.scrollTo as backup
        setTimeout(() => {
          window.scrollTo({ top: targetPosition, behavior: 'auto' })
          ;(window as any).__bloggersScrollRestored = true
        }, 0)
        return true
      }
      
      return false
    }

    // Restore immediately
    restoreScroll()
    
    // Keep trying until element is found (up to 5 seconds)
    let attempts = 0
    const maxAttempts = 50 // 5 seconds (50 * 100ms)
    const monitorInterval = setInterval(() => {
      attempts++
      if (attempts >= maxAttempts) {
        clearInterval(monitorInterval)
        return
      }
      
      if (restoreScroll()) {
        clearInterval(monitorInterval)
      }
    }, 100)
    
    // Also restore after delays
    const timeouts = [
      setTimeout(() => restoreScroll(), 50),
      setTimeout(() => restoreScroll(), 150),
      setTimeout(() => restoreScroll(), 300),
      setTimeout(() => restoreScroll(), 500),
      setTimeout(() => restoreScroll(), 1000),
      setTimeout(() => restoreScroll(), 2000),
    ]
    
    // Also restore when page becomes visible (user navigated back)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        restoreScroll()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Also restore on window focus
    const handleFocus = () => {
      restoreScroll()
    }
    window.addEventListener('focus', handleFocus)
    
    return () => {
      clearInterval(monitorInterval)
      timeouts.forEach(clearTimeout)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])


  // Aggressive scroll restoration with MutationObserver
  useEffect(() => {
    if (typeof window === 'undefined' || isLoading) return

    const restore = () => {
      try {
        // Get saved blogger ID from URL or storage
        const urlParams = new URLSearchParams(window.location.search)
        let savedBloggerId = urlParams.get('blogger-id')
        
        if (!savedBloggerId) {
          savedBloggerId = sessionStorage.getItem('bloggers-scroll-blogger-id') || localStorage.getItem('bloggers-scroll-blogger-id')
        }
        
        if (!savedBloggerId) return
        
        // Find the element and scroll to it
        const element = document.getElementById(`blogger-${savedBloggerId}`)
        if (element) {
          const rect = element.getBoundingClientRect()
          const elementTop = rect.top + window.scrollY
          const targetPosition = elementTop - 20
          
          // Check if already at correct position (within 100px)
          const currentScroll = window.scrollY || document.documentElement.scrollTop || 0
          if (Math.abs(currentScroll - targetPosition) < 100) {
            ;(window as any).__bloggersScrollRestored = true
            return
          }
          
          // Only restore if flag is not set
          if (!(window as any).__bloggersScrollRestored) {
            element.scrollIntoView({ behavior: 'auto', block: 'start' })
            // Also try window.scrollTo as backup
            setTimeout(() => {
              window.scrollTo({ top: targetPosition, behavior: 'auto' })
              ;(window as any).__bloggersScrollRestored = true
            }, 0)
          }
        }
      } catch {}
    }

    // Restore immediately
    restore()

    // Use MutationObserver to restore when DOM changes
    const observer = new MutationObserver(() => {
      const target = getTarget()
      if (target && target > 0) {
        const current = window.scrollY || document.documentElement.scrollTop || 0
        if (Math.abs(current - target) > 10) {
          restore()
        }
      }
    })

    // Observe the container
    const container = document.querySelector('.container')
    if (container) {
      observer.observe(container, {
        childList: true,
        subtree: true,
      })
    }

    // Also try multiple times with delays
    const timeouts = [
      setTimeout(restore, 50),
      setTimeout(restore, 150),
      setTimeout(restore, 300),
      setTimeout(restore, 500),
      setTimeout(restore, 800),
      setTimeout(restore, 1200),
    ]

    // Persistent restoration using requestAnimationFrame
    let rafId: number | null = null
    let attempts = 0
    const persistentRestore = () => {
      attempts++
      const target = getTarget()
      if (target && target > 0) {
        const current = window.scrollY || document.documentElement.scrollTop || 0
        if (Math.abs(current - target) > 10 && attempts < 300) {
          restore()
          rafId = requestAnimationFrame(persistentRestore)
        } else {
          rafId = null
        }
      } else {
        rafId = null
      }
    }
    rafId = requestAnimationFrame(persistentRestore)

    // Also use interval as backup
    let intervalAttempts = 0
    const interval = setInterval(() => {
      intervalAttempts++
      const target = getTarget()
      if (target && target > 0) {
        const current = window.scrollY || document.documentElement.scrollTop || 0
        if (Math.abs(current - target) > 10 && intervalAttempts < 100) {
          restore()
        } else {
          clearInterval(interval)
        }
      } else {
        clearInterval(interval)
      }
    }, 100)

    return () => {
      timeouts.forEach(clearTimeout)
      clearInterval(interval)
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
      observer.disconnect()
    }
  }, [isLoading])

  // Also restore when searchParams change (navigation back)
  useEffect(() => {
    if (typeof window === 'undefined' || isLoading) return

    // Reset flag when searchParams change (navigation back)
    ;(window as any).__bloggersScrollRestored = false

    const restore = () => {
      // Get saved blogger ID from URL or storage
      const urlParams = new URLSearchParams(window.location.search)
      let savedBloggerId = urlParams.get('blogger-id')
      
      if (!savedBloggerId) {
        savedBloggerId = sessionStorage.getItem('bloggers-scroll-blogger-id') || localStorage.getItem('bloggers-scroll-blogger-id')
      }
      
      if (!savedBloggerId) return
      
      // Find the element and scroll to it
      const element = document.getElementById(`blogger-${savedBloggerId}`)
      if (element) {
        const rect = element.getBoundingClientRect()
        const elementTop = rect.top + window.scrollY
        const targetPosition = elementTop - 20
        
        // Check if already at correct position (within 100px)
        const currentScroll = window.scrollY || document.documentElement.scrollTop || 0
        if (Math.abs(currentScroll - targetPosition) < 100) {
          ;(window as any).__bloggersScrollRestored = true
          return
        }
        
        // Only restore if flag is not set
        if (!(window as any).__bloggersScrollRestored) {
          element.scrollIntoView({ behavior: 'auto', block: 'start' })
          // Also try window.scrollTo as backup
          setTimeout(() => {
            window.scrollTo({ top: targetPosition, behavior: 'auto' })
            ;(window as any).__bloggersScrollRestored = true
          }, 0)
        }
      }
    }

    // Immediate restore on navigation with multiple attempts
    restore()
    requestAnimationFrame(() => {
      restore()
      setTimeout(restore, 50)
      setTimeout(restore, 150)
      setTimeout(restore, 300)
      setTimeout(restore, 500)
      setTimeout(restore, 800)
      setTimeout(restore, 1200)
    })
  }, [searchParams, isLoading])

  // Handle browser back/forward navigation
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handlePopState = () => {
      // Reset flag when navigating back to allow restoration
      ;(window as any).__bloggersScrollRestored = false
      
      // Restore scroll position by finding the saved blogger element
      const urlParams = new URLSearchParams(window.location.search)
      let savedBloggerId = urlParams.get('blogger-id')
      
      if (!savedBloggerId) {
        savedBloggerId = sessionStorage.getItem('bloggers-scroll-blogger-id') || localStorage.getItem('bloggers-scroll-blogger-id')
      }
      
      if (!savedBloggerId) return
      
      // Multiple attempts to find and scroll to element
      const restore = () => {
        if ((window as any).__bloggersScrollRestored) return
        
        const element = document.getElementById(`blogger-${savedBloggerId}`)
        if (element) {
          const rect = element.getBoundingClientRect()
          const elementTop = rect.top + window.scrollY
          const targetPosition = elementTop - 20
          
          element.scrollIntoView({ behavior: 'auto', block: 'start' })
          // Also try window.scrollTo as backup
          setTimeout(() => {
            window.scrollTo({ top: targetPosition, behavior: 'auto' })
            ;(window as any).__bloggersScrollRestored = true
          }, 0)
        }
      }
      
      // Try multiple times to ensure restoration
      setTimeout(restore, 50)
      setTimeout(restore, 150)
      setTimeout(restore, 300)
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  useEffect(() => {
    const handler = () => {
      try {
        queryClient.invalidateQueries({ queryKey: ['bloggers'] })
      } catch {}
    }
    window.addEventListener('user-verified' as any, handler as any)
    return () => {
      window.removeEventListener('user-verified' as any, handler as any)
    }
  }, [queryClient])

  const categories = Object.values(BloggerCategory)

  const toggleCategory = (category: BloggerCategory) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories?.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...(prev.categories || []), category]
    }))
  }

  const clearFilters = () => {
    setFilters({
      categories: [],
      verifiedOnly: false,
    })
  }

  const activeFiltersCount = 
    (filters.categories?.length || 0) + 
    (filters.verifiedOnly ? 1 : 0) +
    (filters.minSubscribers ? 1 : 0) +
    (filters.minPrice || filters.maxPrice ? 1 : 0) +
    (filters.platform ? 1 : 0)

  // Используем данные из React Query (они кешируются автоматически)
  const bloggers = data?.data || []

  return (
    <Layout>
      <div className="container py-4 space-y-4">
        {/* Search Bar */}
        <div className="flex gap-2">
          <Input
            type="search"
            placeholder="Поиск блогеров..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<SearchIcon className="w-4 h-4" />}
            className="flex-1"
          />
          <Button
            variant="secondary"
            onClick={() => setShowFilters(true)}
            className="relative"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-telegram-primary text-white text-xs rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>

        {/* Active Filters */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {filters.categories?.map(category => (
              <Badge key={category} variant="primary">
                {getCategoryLabel(category)}
                <button
                  onClick={() => toggleCategory(category)}
                  className="ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
            {filters.verifiedOnly && (
              <Badge variant="primary">
                Только верифицированные
                <button
                  onClick={() => setFilters(prev => ({ ...prev, verifiedOnly: false }))}
                  className="ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            <button
              onClick={clearFilters}
              className="text-sm text-telegram-primary"
            >
              Сбросить все
            </button>
          </div>
        )}

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-telegram-textSecondary">
            Найдено блогеров: {data?.total || bloggers.length}
          </p>
        </div>

        {/* Bloggers List */}
        <div className="space-y-3">
          {bloggers.map((blogger, index) => (
            <motion.div
              key={blogger.id}
              id={`blogger-${blogger.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <div
                onClick={(e) => {
                  e.preventDefault()
                  try {
                    // Reset restoration flag for next time
                    ;(window as any).__bloggersScrollRestored = false
                    
                    // Find the first visible blogger card in viewport (top of screen)
                    const cards = document.querySelectorAll('[id^="blogger-"]')
                    let firstVisibleId = ''
                    
                    for (let i = 0; i < cards.length; i++) {
                      const card = cards[i] as HTMLElement
                      const rect = card.getBoundingClientRect()
                      
                      // Check if card is visible in viewport (at least partially)
                      if (rect.top >= 0 && rect.top < window.innerHeight) {
                        firstVisibleId = card.id.replace('blogger-', '')
                        break
                      }
                    }
                    
                    // If no card is visible at top, find the first card that's partially visible
                    if (!firstVisibleId) {
                      for (let i = 0; i < cards.length; i++) {
                        const card = cards[i] as HTMLElement
                        const rect = card.getBoundingClientRect()
                        
                        // Card is partially visible (top is above viewport but bottom is in viewport)
                        if (rect.top < 0 && rect.bottom > 0) {
                          firstVisibleId = card.id.replace('blogger-', '')
                          break
                        }
                      }
                    }
                    
                    // Fallback: find the card closest to top of viewport
                    if (!firstVisibleId) {
                      let closestId = ''
                      let closestDistance = Infinity
                      
                      for (let i = 0; i < cards.length; i++) {
                        const card = cards[i] as HTMLElement
                        const rect = card.getBoundingClientRect()
                        const distance = Math.abs(rect.top)
                        
                        if (distance < closestDistance) {
                          closestDistance = distance
                          closestId = card.id.replace('blogger-', '')
                        }
                      }
                      
                      firstVisibleId = closestId
                    }
                    
                    // Save the first visible blogger ID
                    if (firstVisibleId) {
                      sessionStorage.setItem('bloggers-scroll-blogger-id', firstVisibleId)
                      localStorage.setItem('bloggers-scroll-blogger-id', firstVisibleId)
                      
                      // Also save in URL for browser history
                      const currentUrl = new URL(window.location.href)
                      currentUrl.searchParams.set('blogger-id', firstVisibleId)
                      window.history.replaceState(
                        { ...window.history.state, scrollBloggerId: firstVisibleId },
                        '',
                        currentUrl.toString()
                      )
                    }
                    
                    // Navigate to blogger page
                    router.push(`/bloggers/${blogger.id}`)
                  } catch (err) {
                    console.error('❌ Error saving scroll position:', err)
                  }
                }}
                className="cursor-pointer"
              >
                <Card hover className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar
                        src={blogger.user?.photoUrl}
                        firstName={blogger.user?.firstName || ''}
                        lastName={blogger.user?.lastName || ''}
                        size="lg"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <h3 className="font-semibold flex items-center gap-1">
                              {blogger.user?.firstName} {blogger.user?.lastName}
                              {blogger.isVerified && <VerificationTooltip />}
                            </h3>
                            <p className="text-sm text-telegram-textSecondary">
                              {blogger.categories && blogger.categories.length > 0 
                                ? getCategoryLabel(blogger.categories[0])
                                : 'Блогер'}
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-telegram-textSecondary flex-shrink-0" />
                        </div>
                        
                        <p className="text-sm text-telegram-textSecondary mb-3 line-clamp-2">
                          {blogger.bio}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          {blogger.categories.slice(0, 3).map(category => (
                            <Badge key={category} variant="default">
                              {getCategoryLabel(category)}
                            </Badge>
                          ))}
                          {blogger.categories.length > 3 && (
                            <Badge variant="default">
                              +{blogger.categories.length - 3}
                            </Badge>
                          )}
                        </div>
                        
                        {isAdmin && (blogger.user?.username || blogger.user?.telegramUsername) && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              const username = (blogger.user?.username || blogger.user?.telegramUsername || '').replace('@', '')
                              window.open(`https://t.me/${username}`, '_blank')
                            }}
                            className="mt-2"
                          >
                            <Send className="w-3 h-3 mr-1" />
                            Telegram
                          </Button>
                        )}

                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          ))}
        </div>

      </div>

      {/* Filters Modal */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowFilters(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30 }}
              className="absolute bottom-0 left-0 right-0 bg-telegram-bgSecondary rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Фильтры</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 hover:bg-telegram-bg rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">Категории</h4>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => toggleCategory(category)}
                      className={cn(
                        'p-3 rounded-lg border-2 text-sm transition-all',
                        filters.categories?.includes(category)
                          ? 'border-telegram-primary bg-telegram-primary/20'
                          : 'border-gray-600 hover:border-gray-500'
                      )}
                    >
                      {getCategoryLabel(category)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Social Platforms */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">Социальные сети</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'telegram', label: 'Telegram' },
                    { value: 'instagram', label: 'Instagram' },
                    { value: 'youtube', label: 'YouTube' },
                    { value: 'tiktok', label: 'TikTok' },
                    { value: 'vk', label: 'VKontakte' },
                    { value: 'other', label: 'Другие' },
                  ].map(platform => (
                    <button
                      key={platform.value}
                      onClick={() => {
                        setFilters(prev => ({
                          ...prev,
                          platform: prev.platform === platform.value ? undefined : platform.value
                        }))
                      }}
                      className={cn(
                        'p-3 rounded-lg border-2 text-sm transition-all',
                        filters.platform === platform.value
                          ? 'border-telegram-primary bg-telegram-primary/20'
                          : 'border-gray-600 hover:border-gray-500'
                      )}
                    >
                      {platform.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subscribers Range */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">Количество подписчиков</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="От"
                    value={formatNumberInput(filters.minSubscribers)}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      minSubscribers: parseNumberInput(e.target.value) || undefined
                    }))}
                  />
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="До"
                    value={formatNumberInput(filters.maxSubscribers)}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      maxSubscribers: parseNumberInput(e.target.value) || undefined
                    }))}
                  />
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">Цена за пост (₽)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="От"
                    value={formatNumberInput(filters.minPrice)}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      minPrice: parseNumberInput(e.target.value) || undefined
                    }))}
                  />
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="До"
                    value={formatNumberInput(filters.maxPrice)}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      maxPrice: parseNumberInput(e.target.value) || undefined
                    }))}
                  />
                </div>
              </div>

              {/* Other Filters */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">Дополнительно</h4>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.verifiedOnly}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      verifiedOnly: e.target.checked
                    }))}
                    className="w-4 h-4 rounded border-gray-600 text-telegram-primary focus:ring-telegram-primary"
                  />
                  <span>Только верифицированные</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => {
                    clearFilters()
                    setShowFilters(false)
                  }}
                >
                  Сбросить
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => setShowFilters(false)}
                >
                  Применить
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  )
}

export default function BloggersPage() {
  return (
    <Suspense fallback={null}>
      <BloggersContent />
    </Suspense>
  )
}






















