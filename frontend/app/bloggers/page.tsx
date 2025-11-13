'use client'
import { Suspense } from 'react'
import { useEffect, useState } from 'react'
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
import { useSearchParams } from 'next/navigation'

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
  }, [])

  const searchParams = useSearchParams()

  // Save scroll position continuously while scrolling
  useEffect(() => {
    const saveScroll = () => {
      try {
        const pos = window.scrollY || document.documentElement.scrollTop || 0
        sessionStorage.setItem('bloggers-scroll-pos', String(pos))
        localStorage.setItem('bloggers-scroll-pos', String(pos))
      } catch {}
    }

    let scrollTimeout: NodeJS.Timeout
    const handleScroll = () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(saveScroll, 150)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    
    // Also save on page unload
    const handleBeforeUnload = () => {
      saveScroll()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    // Save on visibility change (when leaving tab)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        saveScroll()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearTimeout(scrollTimeout)
      // Final save on unmount
      saveScroll()
    }
  }, [])

  // Restore scroll position on mount and pageshow (back/forward navigation)
  useEffect(() => {
    if (typeof window === 'undefined' || isLoading) return

    let restoreInterval: NodeJS.Timeout | null = null

    const restoreScroll = () => {
      try {
        const saved = sessionStorage.getItem('bloggers-scroll-pos') || localStorage.getItem('bloggers-scroll-pos')
        if (!saved) return
        const target = parseInt(saved, 10)
        if (isNaN(target) || target <= 0) return

        // Force scroll with multiple attempts
        const forceScroll = () => {
          try {
            window.scrollTo(0, target)
            document.documentElement.scrollTop = target
            document.body.scrollTop = target
          } catch {}
        }

        // Try immediately and multiple times with delays
        forceScroll()
        requestAnimationFrame(forceScroll)
        setTimeout(forceScroll, 50)
        setTimeout(forceScroll, 100)
        setTimeout(forceScroll, 200)
        setTimeout(forceScroll, 300)
        setTimeout(forceScroll, 500)
        setTimeout(forceScroll, 800)
        setTimeout(forceScroll, 1200)
        setTimeout(forceScroll, 2000)
        
        // Also use interval for persistent restoration (clear previous if exists)
        if (restoreInterval) clearInterval(restoreInterval)
        let attempts = 0
        const maxAttempts = 60
        restoreInterval = setInterval(() => {
          attempts++
          try {
            const current = window.scrollY || document.documentElement.scrollTop || 0
            if (Math.abs(current - target) > 5) {
              forceScroll()
            } else {
              if (restoreInterval) clearInterval(restoreInterval)
              restoreInterval = null
            }
          } catch {}
          if (attempts >= maxAttempts) {
            if (restoreInterval) clearInterval(restoreInterval)
            restoreInterval = null
          }
        }, 100)
      } catch {}
    }

    // Restore on mount with multiple delays
    const timeouts: NodeJS.Timeout[] = []
    timeouts.push(setTimeout(restoreScroll, 100))
    timeouts.push(setTimeout(restoreScroll, 300))
    timeouts.push(setTimeout(restoreScroll, 600))
    timeouts.push(setTimeout(restoreScroll, 1000))
    timeouts.push(setTimeout(restoreScroll, 2000))

    // Restore on pageshow (back/forward navigation)
    const handlePageshow = () => {
      restoreScroll()
    }
    window.addEventListener('pageshow', handlePageshow)

    // Also restore on visibility change
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        restoreScroll()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      timeouts.forEach(clearTimeout)
      if (restoreInterval) clearInterval(restoreInterval)
      window.removeEventListener('pageshow', handlePageshow)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isLoading])

  // Also restore when restore query param is present
  useEffect(() => {
    if (searchParams?.get('restore') !== '1') return
    try {
      const saved = sessionStorage.getItem('bloggers-scroll-pos') || localStorage.getItem('bloggers-scroll-pos')
      if (!saved) return
      const target = parseInt(saved, 10)
      if (isNaN(target) || target <= 0) return

      let attempts = 0
      const maxAttempts = 120
      const interval = setInterval(() => {
        attempts++
        try {
          window.scrollTo(0, target)
          const current = window.scrollY || document.documentElement.scrollTop || 0
          if (Math.abs(current - target) < 5) {
            clearInterval(interval)
          }
        } catch {}
        if (attempts >= maxAttempts) clearInterval(interval)
      }, 50)
      return () => clearInterval(interval)
    } catch {}
  }, [searchParams])

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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Link href={`/bloggers/${blogger.id}`} scroll={false} onClick={() => {
                try {
                  const pos = window.scrollY || document.documentElement.scrollTop || 0
                  sessionStorage.setItem('bloggers-scroll-pos', String(pos))
                  localStorage.setItem('bloggers-scroll-pos', String(pos))
                } catch {}
              }}>
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
              </Link>
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






















