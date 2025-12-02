'use client'

import { useEffect, useState, Suspense, useRef } from 'react'
// motion removed - using native divs for better touch responsiveness
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Search as SearchIcon, 
  SlidersHorizontal, 
  Users, 
  Shield, 
  Eye, 
  MessageCircle, 
  Star,
  ArrowLeft 
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { formatNumber, formatPrice, getCategoryLabel } from '@/lib/utils'
import { bloggersApi } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { useScrollRestoration } from '@/hooks/useScrollRestoration'
import { BloggerFilters } from '@/types'
import { FilterModal } from '@/components/bloggers/FilterModal'
import { VerificationTooltip } from '@/components/VerificationTooltip'

import { Layout } from '@/components/layout/Layout'

// Компонент с контентом страницы (внутри Suspense)
function BloggersPageContent() {
  const router = useRouter()
  
  // Ленивая инициализация поиска из sessionStorage
  const [search, setSearch] = useState(() => {
    if (typeof window === 'undefined') return ''
    try {
      const raw = sessionStorage.getItem('__bloggers_filters_v1')
      return raw ? (JSON.parse(raw).search || '') : ''
    } catch { return '' }
  })

  // Ленивая инициализация фильтров из sessionStorage
  const [filters, setFilters] = useState<BloggerFilters>(() => {
    if (typeof window === 'undefined') return {}
    try {
      const raw = sessionStorage.getItem('__bloggers_filters_v1')
      if (raw) {
        const saved = JSON.parse(raw)
        const f = saved.filters || {}
        if (!f.categories) f.categories = []
        return f
      }
    } catch {}
    return {}
  })

  const [bloggers, setBloggers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, isAdmin } = useAuth()
  const [showFilters, setShowFilters] = useState(false)

  useScrollRestoration()

  // Сохраняем фильтры и поиск при изменении
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      sessionStorage.setItem(
        '__bloggers_filters_v1',
        JSON.stringify({ search, filters }),
      )
    } catch {}
  }, [search, filters])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const query: any = { ...filters }
      if (search && search.trim().length > 0) query.search = search.trim()
      
      const data = await bloggersApi.search(query, 1, 500)
      const items = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : [])
      setBloggers(items)
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Ошибка загрузки'
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const onFocus = () => loadData()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [search, filters])

  const activeFiltersCount = Object.keys(filters).filter(k => {
    const val = filters[k as keyof BloggerFilters]
    return Array.isArray(val) ? val.length > 0 : val !== undefined
  }).length

  if (isLoading && bloggers.length === 0) {
    return (
      <div className="min-h-screen bg-telegram-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-telegram-primary mx-auto mb-4"></div>
          <p className="text-telegram-textSecondary">Поиск блогеров...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header & Search */}
      <div className="sticky top-0 z-40 bg-telegram-bg py-4 space-y-4 border-b border-white/5 -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Блогеры</h1>
            <p className="text-sm text-telegram-textSecondary">
              {bloggers.length} {bloggers.length === 1 ? 'блогер' : 'блогеров'} найдено
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-telegram-textSecondary pointer-events-none" />
            <Input
              type="search"
              placeholder="Поиск по имени..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-telegram-bgSecondary border-white/5 focus:border-telegram-primary/50 transition-colors"
            />
          </div>
          <button 
            type="button"
            onClick={() => {
              setShowFilters(true)
            }}
            onTouchEnd={(e) => {
              e.preventDefault()
              setShowFilters(true)
            }}
            className={`relative z-50 min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl font-medium select-none active:opacity-70 ${activeFiltersCount > 0 ? 'bg-telegram-primary text-white' : 'bg-telegram-bgSecondary text-telegram-textSecondary'}`}
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          >
            <SlidersHorizontal className="w-5 h-5 pointer-events-none" />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white border-2 border-telegram-bg pointer-events-none">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Bloggers Grid */}
      <div className="grid grid-cols-1 gap-4">
        {bloggers.map((blogger, index) => (
          <div
            id={`blogger-${blogger.id}`}
            key={blogger.id}
          >
            <Link
              href={`/bloggers/${blogger.id}`}
              scroll={false}
              className="block"
              style={{ touchAction: 'manipulation' }}
              onClick={(e) => {
                if (typeof window === 'undefined') return
                sessionStorage.setItem('__bloggers_last_id', String(blogger.id))
              }}
              onTouchEnd={(e) => {
                e.preventDefault()
                if (typeof window === 'undefined') return
                sessionStorage.setItem('__bloggers_last_id', String(blogger.id))
                router.push(`/bloggers/${blogger.id}`)
              }}
            >
              <Card className={`group relative overflow-hidden border-white/5 bg-[#1C1E20] active:scale-[0.98] transition-transform duration-100 ${blogger.isFeatured ? 'ring-1 ring-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]' : ''}`} style={{ touchAction: 'manipulation' }}>
                {/* Subtle highlight on hover (desktop only) */}
                <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent opacity-0 md:group-hover:opacity-100 transition-opacity pointer-events-none ${blogger.isFeatured ? 'via-amber-500/10' : ''}`} />
                
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="relative">
                      <Avatar
                        src={blogger.user?.photoUrl}
                        firstName={blogger.user?.firstName || ''}
                        lastName={blogger.user?.lastName || ''}
                        className={`w-14 h-14 rounded-full border-2 ${blogger.isFeatured ? 'border-amber-500' : 'border-telegram-bg ring-2 ring-white/5'}`}
                      />
                      {blogger.isVerified && (
                        <VerificationTooltip className="absolute -bottom-1 -right-1 z-10" />
                      )}
                      {blogger.isFeatured && (
                        <div className="absolute -top-2 -left-2 z-20 bg-amber-500 text-black rounded-full p-0.5 border-2 border-[#1C1E20] shadow-lg shadow-amber-500/40">
                           <Star className="w-3 h-3 fill-current" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Name & Username */}
                      <div>
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-white truncate pr-2 text-[17px]">
                            {blogger.user?.firstName} {blogger.user?.lastName}
                          </h3>
                          {/* Price Tag - Gold Accent */}
                          {blogger.pricePerPost > 0 && (
                            <div className="flex-shrink-0 text-telegram-accent font-bold text-sm bg-telegram-accent/10 px-2 py-1 rounded-lg">
                              {formatPrice(blogger.pricePerPost)}
                            </div>
                          )}
                        </div>
                        {isAdmin && (
                          <p className="text-sm text-telegram-textSecondary truncate">
                            @{blogger.user?.username || blogger.user?.telegramUsername || 'username'}
                          </p>
                        )}
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-2 py-2 border-t border-white/5 border-b mb-2">
                        <div className="text-center px-1">
                          <div className="flex items-center justify-center gap-1 text-telegram-textSecondary text-xs mb-0.5">
                            <Users className="w-3 h-3" />
                            <span>Подп.</span>
                          </div>
                          <div className="font-semibold text-sm text-white">
                            {formatNumber(blogger.subscribersCount || 0)}
                          </div>
                        </div>
                        <div className="text-center px-1 border-l border-white/5">
                          <div className="flex items-center justify-center gap-1 text-telegram-textSecondary text-xs mb-0.5">
                            <Eye className="w-3 h-3" />
                            <span>Просм.</span>
                          </div>
                          <div className="font-semibold text-sm text-white">
                            {formatNumber(blogger.averageViews || 0)}
                          </div>
                        </div>
                        <div className="text-center px-1 border-l border-white/5">
                          <div className="flex items-center justify-center gap-1 text-telegram-textSecondary text-xs mb-0.5">
                            <Star className="w-3 h-3" />
                            <span>ER</span>
                          </div>
                          <div className="font-semibold text-sm text-white">
                            {blogger.engagementRate || 0}%
                          </div>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-1.5">
                        {blogger.isFeatured && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-400 to-orange-500 text-black border border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)] flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" />
                            TOP
                          </span>
                        )}
                        {(blogger.categories || []).slice(0, 3).map((c: string) => (
                          <span 
                            key={c} 
                            className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/5 text-telegram-textSecondary border border-white/5"
                          >
                            {getCategoryLabel(c)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        ))}
      </div>

      {/* Пустое состояние */}
      {!isLoading && bloggers.length === 0 && (
        <div className="text-center py-12 opacity-60">
          <div className="bg-telegram-bgSecondary w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <SearchIcon className="w-8 h-8 text-telegram-textSecondary" />
          </div>
          <h3 className="text-lg font-medium mb-1">Ничего не найдено</h3>
          <p className="text-sm text-telegram-textSecondary">Попробуйте изменить фильтры</p>
        </div>
      )}

      <FilterModal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApply={setFilters}
      />
    </div>
  )
}

export default function BloggersPage() {
  return (
    <Layout>
      <div className="container min-h-screen bg-telegram-bg">
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-telegram-primary"></div></div>}>
          <BloggersPageContent />
        </Suspense>
      </div>
    </Layout>
  )
}

