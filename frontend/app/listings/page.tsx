'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Filter, 
  Search as SearchIcon, 
  DollarSign, 
  Calendar,
  Eye,
  MessageSquare,
  Building,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'
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
  getStatusColor
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
  })
  const [showFilters, setShowFilters] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['listings', filters, search],
    queryFn: () => listingsApi.search({ ...filters, search }, 1, 20),
    placeholderData: (prev) => prev,
    enabled: !!user,
  })

  useEffect(() => {
    analyticsApi.track('listings_list_view')
  }, [])

  const listings = data?.data || [
  ]

  const statusTabs = [
    { value: ListingStatus.ACTIVE, label: 'Активные' },
    { value: ListingStatus.CLOSED, label: 'Закрытые' },
    { value: ListingStatus.COMPLETED, label: 'Завершенные' },
  ]

  return (
    <Layout>
      <div className="container py-4 space-y-4">
        {/* Search Bar */}
        <div className="flex gap-2">
          <Input
            type="search"
            placeholder="Поиск объявлений..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<SearchIcon className="w-4 h-4" />}
            className="flex-1"
          />
          <Button variant="secondary" onClick={() => setShowFilters(true)}>
            <Filter className="w-4 h-4" />
          </Button>
          {user?.role === 'advertiser' && (
            <Button variant="primary" onClick={() => { if (typeof window !== 'undefined') window.location.href = '/listings/create' }}>
              Создать объявление
            </Button>
          )}
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {statusTabs.map((tab) => (
            <Button
              key={tab.value}
              variant={filters.status === tab.value ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilters(prev => ({ ...prev, status: tab.value }))}
              className="whitespace-nowrap"
            >
              {tab.label}
            </Button>
          ))}
        </div>

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
                        <div className="flex items-center gap-2 text-sm text-telegram-textSecondary">
                          <Building className="w-4 h-4" />
                          <span>{listing.advertiser?.companyName}</span>
                          {listing.advertiser?.isVerified && (
                            <Badge variant="primary" className="text-xs">✓</Badge>
                          )}
                        </div>
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

                    <div className="flex items-center gap-4 text-sm text-telegram-textSecondary mb-3">
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{listing.viewsCount}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        <span>{listing.responsesCount} откликов</span>
                      </div>
                      {listing.deadline && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>до {formatDate(listing.deadline)}</span>
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
    </Layout>
  )
}









