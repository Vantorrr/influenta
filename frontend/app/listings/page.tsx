'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  SlidersHorizontal, 
  Search as SearchIcon, 
  Calendar,
  Eye,
  MessageSquare,
  Building,
  ChevronRight,
  PlusCircle
} from 'lucide-react'
import Link from 'next/link'
import { RubIcon } from '@/components/ui/ruble-icon'
import { Layout } from '@/components/layout/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { 
  formatPrice, 
  formatDate,
  getCategoryLabel,
  getPostFormatLabel,
  getStatusLabel,
  getStatusColor,
  formatNumberInput,
  parseNumberInput
} from '@/lib/utils'
import { listingsApi, analyticsApi } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { 
  BloggerCategory, 
  ListingStatus,
  PostFormat,
  type ListingFilters 
} from '@/types'
import { useAuth } from '@/hooks/useAuth'

export default function ListingsPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<ListingFilters>({
    status: ListingStatus.ACTIVE,
    categories: [],
  })
  const [showFilters, setShowFilters] = useState(false)

  const { data: rawData, isLoading } = useQuery({
    queryKey: ['listings', user?.role, search, filters],
    queryFn: async () => {
      // Рекламодатели видят только свои объявления (все статусы)
      if (user?.role === 'advertiser') {
        return await listingsApi.getMyListings(1, 100) // Берем все, фильтруем на фронте
      }
      // Блогеры видят все активные объявления
      return await listingsApi.search({ status: ListingStatus.ACTIVE, search }, 1, 100)
    },
    enabled: !!user,
  })

  // Фильтруем на фронте
  const data = rawData?.data ? {
    ...rawData,
    data: rawData.data.filter((listing: any) => {
      // Фильтр по статусу (только для рекламодателей)
      if (user?.role === 'advertiser') {
        if (filters.status === 'archive') {
          return listing.status !== 'active'
        }
        return listing.status === filters.status
      }
      return true
    }).filter((listing: any) => {
      // Фильтр по поиску
      if (!search) return true
      const haystack = `${listing.title} ${listing.description}`.toLowerCase()
      return haystack.includes(search.toLowerCase())
    }).filter((listing: any) => {
      // Фильтр по категориям
      if (!filters.categories || filters.categories.length === 0) return true
      return listing.targetCategories?.some((cat: string) => 
        filters.categories?.includes(cat)
      )
    }).filter((listing: any) => {
      // Фильтр по минимальному бюджету
      if (filters.minBudget && listing.budget < filters.minBudget) return false
      // Фильтр по максимальному бюджету
      if (filters.maxBudget && listing.budget > filters.maxBudget) return false
      return true
    }).filter((listing: any) => {
      // Фильтр по формату
      if (!filters.format) return true
      return listing.format === filters.format
    })
  } : rawData

  useEffect(() => {
    analyticsApi.track('listings_list_view')
  }, [])

  const listings = data?.data || [
  ]

  const statusTabs = [
    { value: ListingStatus.ACTIVE, label: 'Активные' },
    { value: 'archive' as any, label: 'Архив' },
  ]

  return (
    <Layout>
      <div className="container py-4 space-y-4">
        {/* Search Bar */}
        <div className="bg-telegram-bgSecondary/60 backdrop-blur rounded-xl p-3 flex gap-2 items-center relative flex-wrap">
          <Input
            type="search"
            placeholder="Поиск объявлений..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<SearchIcon className="w-4 h-4" />}
            className="flex-1 h-11 rounded-lg"
          />
          <Button variant="secondary" onClick={() => setShowFilters(true)} className="h-11 rounded-lg px-3 shrink-0 pointer-events-auto relative">
            <SlidersHorizontal className="w-4 h-4" />
            {(() => {
              const activeCount = (filters.minBudget ? 1 : 0) + (filters.maxBudget ? 1 : 0) + (filters.format ? 1 : 0) + ((filters.categories?.length || 0) > 0 ? 1 : 0)
              return activeCount > 0 ? (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-telegram-primary text-white text-xs rounded-full flex items-center justify-center">
                  {activeCount}
                </span>
              ) : null
            })()}
          </Button>
          {user?.role === 'advertiser' && (
            <Button variant="primary" onClick={() => { if (typeof window !== 'undefined') window.location.href = '/listings/create' }} className="h-11 rounded-lg px-4 shrink-0 pointer-events-auto flex items-center gap-2">
              <PlusCircle className="w-5 h-5" />
              <span className="font-medium">Создать</span>
            </Button>
          )}
        </div>

        {/* Status Tabs - только для рекламодателей */}
        {user?.role === 'advertiser' && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {statusTabs.map((tab) => (
              <Button
                key={tab.value}
                variant={filters.status === tab.value ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, status: tab.value }))}
                className="whitespace-nowrap"
              >
                {tab.label}
              </Button>
            ))}
          </div>
        )}

        {/* Results Count */}
        <p className="text-sm text-telegram-textSecondary">
          Найдено объявлений: {data?.total || listings.length}
        </p>

        {/* Listings */}
        <div className="space-y-3">
          {listings.map((listing, index) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/listings/${listing.id}`}>
                <Card hover>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg line-clamp-2 mb-1">
                          {listing.title}
                        </h3>
                        {(listing.advertiser?.companyName && listing.advertiser?.companyName !== 'undefined') && (
                          <div className="flex items-center gap-2 text-sm text-telegram-textSecondary">
                            <Building className="w-4 h-4" />
                            <span className="truncate">{listing.advertiser?.companyName}</span>
                            {listing.advertiser?.isVerified && (
                              <Badge variant="primary" className="text-xs">✓</Badge>
                            )}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-telegram-textSecondary flex-shrink-0" />
                    </div>

                    <p className="text-sm text-telegram-textSecondary mb-3 line-clamp-2">
                      {listing.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {listing.targetCategories.slice(0, 2).map(category => (
                        <Badge key={category} variant="default">
                          {getCategoryLabel(category)}
                        </Badge>
                      ))}
                      {listing.targetCategories.length > 2 && (
                        <Badge variant="default">
                          +{listing.targetCategories.length - 2}
                        </Badge>
                      )}
                      <Badge variant="default">
                        {getPostFormatLabel(listing.format)}
                      </Badge>
                    </div>

                    <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-sm text-telegram-textSecondary mb-3">
                      <div className="flex items-center gap-1 shrink-0">
                        <Eye className="w-4 h-4" />
                        <span>{listing.viewsCount}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <MessageSquare className="w-4 h-4" />
                        <span>{listing.responsesCount} {pluralizeResponses(listing.responsesCount)}</span>
                      </div>
                      {listing.deadline && (
                        <div className="flex items-center gap-1 shrink-0">
                          <Calendar className="w-4 h-4" />
                          <span className="whitespace-nowrap">до {formatDate(listing.deadline)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
                      <div>
                        <p className="text-xs text-telegram-textSecondary">Бюджет</p>
                        <p className="font-semibold text-lg">
                          {formatPrice(listing.budget)}
                        </p>
                      </div>
                      
                      {listing.requirements && (
                        <div className="text-right text-sm">
                          {listing.requirements.minSubscribers && (
                            <p className="text-telegram-textSecondary">
                              от {listing.requirements.minSubscribers / 1000}K подписчиков
                            </p>
                          )}
                          {listing.requirements.verifiedOnly && (
                            <Badge variant="primary">Только верифицированные</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Load More */}
        {data?.hasMore && (
          <div className="flex justify-center pt-4">
            <Button variant="secondary">
              Загрузить еще
            </Button>
          </div>
        )}
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
                <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-telegram-bg rounded-lg">✕</button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <Input type="text" inputMode="numeric" placeholder="Мин. бюджет"
                  value={formatNumberInput(filters.minBudget)}
                  onChange={(e) => setFilters(prev => ({ ...prev, minBudget: parseNumberInput(e.target.value) || undefined }))}
                />
                <Input type="text" inputMode="numeric" placeholder="Макс. бюджет"
                  value={formatNumberInput(filters.maxBudget)}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxBudget: parseNumberInput(e.target.value) || undefined }))}
                />
              </div>

              {/* Format */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">Формат</h4>
                <select
                  className="input"
                  value={filters.format || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, format: e.target.value || undefined }))}
                >
                  <option value="">Любой</option>
                  <option value="post">Пост</option>
                  <option value="story">Сторис</option>
                  <option value="live">Эфир/Reels</option>
                </select>
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">Категории</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(BloggerCategory).map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        setFilters(prev => ({
                          ...prev,
                          categories: prev.categories?.includes(category)
                            ? prev.categories.filter(c => c !== category)
                            : [...(prev.categories || []), category]
                        }))
                      }}
                      className={`p-3 rounded-lg border-2 text-sm transition-all ${
                        filters.categories?.includes(category)
                          ? 'border-telegram-primary bg-telegram-primary/20'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      {getCategoryLabel(category)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" fullWidth onClick={() => { setFilters({ status: filters.status, categories: [] }); setShowFilters(false) }}>Сбросить</Button>
                <Button variant="primary" fullWidth onClick={() => setShowFilters(false)}>Применить</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  )
}

function pluralizeResponses(count: number): string {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return 'отклик'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'отклика'
  return 'откликов'
}









