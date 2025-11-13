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

    // Initialize global scroll position from storage
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('bloggers-scroll-pos') || localStorage.getItem('bloggers-scroll-pos')
      if (saved) {
        const pos = parseInt(saved, 10)
        if (!isNaN(pos) && pos > 0) {
          ;(window as any).__bloggersScrollPos = pos
        }
      }
    }
  }, [])

  const searchParams = useSearchParams()

  // Restore scroll immediately on mount (before render)
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return

    console.log('🔄 Attempting to restore scroll position...')

    // Try history state first (most reliable for back navigation)
    let target: number | null = null
    let savedBloggerId: string | null = null
    
    const historyState = window.history.state
    if (historyState?.scrollY) {
      target = historyState.scrollY
      console.log('✅ Found scroll position in history.state:', target)
    }
    
    // Try URL hash
    if (!target) {
      const hash = window.location.hash
      if (hash && hash.startsWith('#scroll-')) {
        const hashValue = hash.replace('#scroll-', '')
        const parsed = parseInt(hashValue, 10)
        if (!isNaN(parsed) && parsed > 0) {
          target = parsed
          console.log('✅ Found scroll position in URL hash:', target)
        }
      }
    }
    
    // Try query parameter for blogger ID
    const urlParams = new URLSearchParams(window.location.search)
    savedBloggerId = urlParams.get('blogger-id')

    // Fallback to global variable
    if (!target && (window as any).__bloggersScrollPos) {
      target = (window as any).__bloggersScrollPos
      console.log('✅ Found scroll position in global variable:', target)
    }
    
    // Fallback to sessionStorage
    if (!target) {
      const saved = sessionStorage.getItem('bloggers-scroll-pos')
      if (saved) {
        const parsed = parseInt(saved, 10)
        if (!isNaN(parsed) && parsed > 0) {
          target = parsed
          console.log('✅ Found scroll position in sessionStorage:', target)
        }
      }
    }
    
    if (!savedBloggerId) {
      savedBloggerId = sessionStorage.getItem('bloggers-scroll-blogger-id')
    }

    if (target !== null && target > 0) {
      console.log('📍 Restoring to position:', target, 'blogger ID:', savedBloggerId)
      try {
        // Try by element ID first
        if (savedBloggerId) {
          const element = document.getElementById(`blogger-${savedBloggerId}`)
          if (element) {
            const rect = element.getBoundingClientRect()
            const elementTop = rect.top + window.scrollY
            console.log('📍 Scrolling to element:', savedBloggerId, 'at position:', elementTop - 20)
            window.scrollTo(0, elementTop - 20)
            return
          } else {
            console.log('⚠️ Element not found:', `blogger-${savedBloggerId}`)
          }
        }
        console.log('📍 Scrolling to position:', target)
        window.scrollTo(0, target)
      } catch (err) {
        console.error('❌ Error restoring scroll:', err)
      }
    } else {
      console.log('⚠️ No scroll position found to restore')
    }
  }, [])

  // Save scroll position - use global window object (persists across client-side navigation)
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Initialize global scroll position storage
    if (!(window as any).__bloggersScrollPos) {
      ;(window as any).__bloggersScrollPos = 0
    }

    const saveScroll = () => {
      try {
        const pos = window.scrollY || document.documentElement.scrollTop || 0
        // Save in multiple places for reliability
        ;(window as any).__bloggersScrollPos = pos
        sessionStorage.setItem('bloggers-scroll-pos', String(pos))
        localStorage.setItem('bloggers-scroll-pos', String(pos))
      } catch {}
    }

    // Save on scroll (throttled)
    let scrollTimeout: NodeJS.Timeout
    const handleScroll = () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(saveScroll, 100)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    // Save before navigation
    const handleBeforeUnload = () => {
      saveScroll()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      clearTimeout(scrollTimeout)
      saveScroll() // Final save
    }
  }, [])

  // Aggressive scroll restoration with MutationObserver
  useEffect(() => {
    if (typeof window === 'undefined' || isLoading) return

    const getTarget = (): number | null => {
      // Try URL hash first (most reliable for back navigation)
      const hash = window.location.hash
      if (hash && hash.startsWith('#scroll-')) {
        const hashValue = hash.replace('#scroll-', '')
        const parsed = parseInt(hashValue, 10)
        if (!isNaN(parsed) && parsed > 0) {
          return parsed
        }
      }
      
      // Try global variable
      if ((window as any).__bloggersScrollPos) {
        return (window as any).__bloggersScrollPos
      }
      
      // Fallback to storage
      const saved = sessionStorage.getItem('bloggers-scroll-pos') || localStorage.getItem('bloggers-scroll-pos')
      if (saved) {
        const parsed = parseInt(saved, 10)
        if (!isNaN(parsed) && parsed > 0) {
          return parsed
        }
      }
      return null
    }
    
    const getSavedBloggerId = (): string | null => {
      const urlParams = new URLSearchParams(window.location.search)
      return urlParams.get('blogger-id') || sessionStorage.getItem('bloggers-scroll-blogger-id')
    }

    const restore = () => {
      try {
        const target = getTarget()
        if (!target || target <= 0) return

        const current = window.scrollY || document.documentElement.scrollTop || 0
        if (Math.abs(current - target) < 5) return // Already at target

        // Try by element ID first
        const savedBloggerId = getSavedBloggerId()
        if (savedBloggerId) {
          const element = document.getElementById(`blogger-${savedBloggerId}`)
          if (element) {
            const rect = element.getBoundingClientRect()
            const elementTop = rect.top + window.scrollY
            window.scrollTo({ top: elementTop - 20, behavior: 'auto' })
            return
          }
        }
        
        // Fallback to position
        window.scrollTo({ top: target, behavior: 'auto' })
      } catch {}
    }

    // Restore immediately
    console.log('🔄 Restoring scroll after data load...')
    restore()

    // Use MutationObserver to restore when DOM changes
    const observer = new MutationObserver(() => {
      const target = getTarget()
      if (target && target > 0) {
        const current = window.scrollY || document.documentElement.scrollTop || 0
        if (Math.abs(current - target) > 10) {
          console.log('🔄 DOM changed, restoring scroll from', current, 'to', target)
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

    const restore = () => {
      try {
        // Try URL hash first
        let target: number | null = null
        const hash = window.location.hash
        if (hash && hash.startsWith('#scroll-')) {
          const hashValue = hash.replace('#scroll-', '')
          const parsed = parseInt(hashValue, 10)
          if (!isNaN(parsed) && parsed > 0) {
            target = parsed
          }
        }
        
        // Fallback to global variable
        if (!target && (window as any).__bloggersScrollPos) {
          target = (window as any).__bloggersScrollPos
        }
        
        // Fallback to storage
        if (!target) {
          const saved = sessionStorage.getItem('bloggers-scroll-pos') || localStorage.getItem('bloggers-scroll-pos')
          if (saved) {
            const parsed = parseInt(saved, 10)
            if (!isNaN(parsed) && parsed > 0) {
              target = parsed
            }
          }
        }

        if (!target || target <= 0) return

        // Try by element ID first
        const urlParams = new URLSearchParams(window.location.search)
        const savedBloggerId = urlParams.get('blogger-id') || sessionStorage.getItem('bloggers-scroll-blogger-id')
        if (savedBloggerId) {
          const element = document.getElementById(`blogger-${savedBloggerId}`)
          if (element) {
            const rect = element.getBoundingClientRect()
            const elementTop = rect.top + window.scrollY
            window.scrollTo({ top: elementTop - 20, behavior: 'auto' })
            return
          }
        }
        
        window.scrollTo({ top: target, behavior: 'auto' })
      } catch {}
    }

    // Immediate restore on navigation
    requestAnimationFrame(() => {
      restore()
      setTimeout(restore, 100)
      setTimeout(restore, 300)
      setTimeout(restore, 500)
      setTimeout(restore, 800)
    })
  }, [searchParams, isLoading])

  // Handle browser back/forward navigation
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handlePopState = () => {
      // Restore scroll position from URL hash when navigating back
      const hash = window.location.hash
      if (hash && hash.startsWith('#scroll-')) {
        const hashValue = hash.replace('#scroll-', '')
        const parsed = parseInt(hashValue, 10)
        if (!isNaN(parsed) && parsed > 0) {
          setTimeout(() => {
            window.scrollTo({ top: parsed, behavior: 'auto' })
          }, 0)
        }
      }
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
                    const pos = window.scrollY || document.documentElement.scrollTop || 0
                    
                    console.log('💾 Saving scroll position:', pos)
                    
                    // Save in multiple places for maximum reliability
                    ;(window as any).__bloggersScrollPos = pos
                    sessionStorage.setItem('bloggers-scroll-pos', String(pos))
                    localStorage.setItem('bloggers-scroll-pos', String(pos))
                    
                    // Save in history state
                    const currentState = window.history.state || {}
                    window.history.replaceState(
                      { ...currentState, scrollY: pos, savedAt: Date.now() },
                      '',
                      window.location.href
                    )
                    
                    // Find nearest blogger card above current position
                    const cards = document.querySelectorAll('[id^="blogger-"]')
                    let savedBloggerId = ''
                    for (let i = cards.length - 1; i >= 0; i--) {
                      const card = cards[i] as HTMLElement
                      const cardTop = card.getBoundingClientRect().top + window.scrollY
                      if (cardTop <= pos + 50) {
                        savedBloggerId = card.id.replace('blogger-', '')
                        sessionStorage.setItem('bloggers-scroll-blogger-id', savedBloggerId)
                        break
                      }
                    }
                    
                    console.log('💾 Saved blogger ID:', savedBloggerId)
                    
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






















