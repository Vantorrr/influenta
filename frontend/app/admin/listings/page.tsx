'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Search as SearchIcon, 
  Filter,
  FileText,
  DollarSign,
  Calendar,
  Eye,
  MessageSquare,
  Building,
  TrendingUp,
  Pause,
  Play,
  X
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  formatPrice, 
  formatDate,
  getCategoryLabel,
  getPostFormatLabel,
  getStatusLabel,
  getStatusColor
} from '@/lib/utils'
import { 
  BloggerCategory, 
  ListingStatus,
  PostFormat
} from '@/types'
import { listingsApi } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'

export default function AdminListingsPage() {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<ListingStatus | 'all'>('all')
  const [listings, setListings] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const loadListings = async () => {
    try {
      const data = await listingsApi.search(
        { status: filterStatus === 'all' ? undefined : filterStatus, search },
        1,
        50
      )
      setListings(data.data || [])
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message
      setError(Array.isArray(msg) ? msg.join(', ') : (msg || 'Ошибка загрузки объявлений'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return
    setIsLoading(true)
    loadListings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const filteredListings = listings.filter(listing => {
    const matchesSearch = 
      (listing.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (listing.advertiser?.companyName || listing.advertiser?.user?.firstName || '').toLowerCase().includes(search.toLowerCase())
    const matchesStatus = filterStatus === 'all' || listing.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: listings.length,
    active: listings.filter(l => l.status === ListingStatus.ACTIVE).length,
    paused: listings.filter(l => l.status === ListingStatus.PAUSED).length,
    closed: listings.filter(l => l.status === ListingStatus.CLOSED).length,
    totalBudget: listings.reduce((sum, l) => sum + (l.budget || 0), 0),
    totalResponses: listings.reduce((sum, l) => sum + (l.responsesCount || 0), 0),
  }

  const statusTabs = [
    { value: 'all', label: 'Все', count: stats.total },
    { value: ListingStatus.ACTIVE, label: 'Активные', count: stats.active },
    { value: ListingStatus.PAUSED, label: 'На паузе', count: stats.paused },
    { value: ListingStatus.CLOSED, label: 'Закрытые', count: stats.closed },
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-telegram-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-telegram-primary mx-auto mb-4"></div>
          <p className="text-telegram-textSecondary">Загрузка объявлений...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-telegram-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-2">Ошибка</div>
          <p className="text-telegram-textSecondary">{error}</p>
          <Button variant="secondary" className="mt-3" onClick={() => { setError(null); loadListings() }}>Повторить</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Управление объявлениями</h1>
        <p className="text-telegram-textSecondary">
          Всего объявлений: {stats.total}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-telegram-textSecondary">Всего</p>
              </div>
              <FileText className="w-8 h-8 text-telegram-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-sm text-telegram-textSecondary">Активных</p>
              </div>
              <Play className="w-8 h-8 text-telegram-success" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.paused}</p>
                <p className="text-sm text-telegram-textSecondary">На паузе</p>
              </div>
              <Pause className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.closed}</p>
                <p className="text-sm text-telegram-textSecondary">Закрытых</p>
              </div>
              <X className="w-8 h-8 text-telegram-danger" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold">{formatPrice(stats.totalBudget)}</p>
                <p className="text-sm text-telegram-textSecondary">Общий бюджет</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.totalResponses}</p>
                <p className="text-sm text-telegram-textSecondary">Откликов</p>
              </div>
              <MessageSquare className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <Input
            type="search"
            placeholder="Поиск объявлений..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<SearchIcon className="w-4 h-4" />}
            className="flex-1"
          />
          <Button variant="secondary">
            <Filter className="w-4 h-4 mr-2" />
            Фильтры
          </Button>
        </div>
        
        <div className="flex gap-2">
          {statusTabs.map((tab) => (
            <Button
              key={tab.value}
              variant={filterStatus === tab.value ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilterStatus(tab.value as any)}
            >
              {tab.label}
              <Badge variant="default" className="ml-2">
                {tab.count}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Listings */}
      <div className="space-y-4">
        {filteredListings.map((listing, index) => (
          <motion.div
            key={listing.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card hover>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">
                      {listing.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-telegram-textSecondary">
                      <Building className="w-4 h-4" />
                      <span>{listing.advertiser?.companyName || listing.advertiser?.user?.firstName || '—'}</span>
                      {listing.advertiser?.isVerified && (
                        <Badge variant="primary" className="text-xs">✓</Badge>
                      )}
                    </div>
                  </div>
                  
                  <Badge
                    variant={
                      listing.status === ListingStatus.ACTIVE ? 'success' :
                      listing.status === ListingStatus.PAUSED ? 'warning' :
                      'danger'
                    }
                  >
                    {getStatusLabel(listing.status)}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {(listing.targetCategories || []).map((category: BloggerCategory) => (
                    <Badge key={category} variant="default">
                      {getCategoryLabel(category)}
                    </Badge>
                  ))}
                  <Badge variant="default">
                    {getPostFormatLabel(listing.format || PostFormat.ANY)}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-telegram-textSecondary">Бюджет</p>
                    <p className="font-medium">{formatPrice(listing.budget)}</p>
                  </div>
                  <div>
                    <p className="text-telegram-textSecondary">Просмотры</p>
                    <p className="font-medium flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {listing.viewsCount || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-telegram-textSecondary">Отклики</p>
                    <p className="font-medium flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      {listing.responsesCount || 0}
                    </p>
                  </div>
                  {listing.deadline && (
                    <div>
                      <p className="text-telegram-textSecondary">Дедлайн</p>
                      <p className="font-medium flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(listing.deadline)}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-telegram-textSecondary">Создано</p>
                    <p className="font-medium">{formatDate(listing.createdAt)}</p>
                  </div>
                </div>

                {listing.closedReason && (
                  <div className="bg-telegram-danger/10 text-telegram-danger rounded-lg p-3 mb-4">
                    <p className="text-sm">
                      <strong>Причина закрытия:</strong> {listing.closedReason}
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="secondary" size="sm">
                    <Eye className="w-4 h-4 mr-1" />
                    Просмотреть
                  </Button>
                  
                  {listing.status === ListingStatus.ACTIVE && (
                    <Button variant="warning" size="sm">
                      <Pause className="w-4 h-4 mr-1" />
                      Приостановить
                    </Button>
                  )}
                  
                  {listing.status === ListingStatus.PAUSED && (
                    <Button variant="success" size="sm">
                      <Play className="w-4 h-4 mr-1" />
                      Активировать
                    </Button>
                  )}
                  
                  {listing.status !== ListingStatus.CLOSED && (
                    <Button variant="danger" size="sm">
                      <X className="w-4 h-4 mr-1" />
                      Закрыть
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}


