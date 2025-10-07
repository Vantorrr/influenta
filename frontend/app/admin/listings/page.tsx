"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { formatDateTime, formatPrice, getPostFormatLabel } from '@/lib/utils'

type AdminListing = {
  id: string
  title: string
  description?: string
  format?: string
  budget?: number
  status?: string
  createdAt?: string
  viewsCount?: number
  responsesCount?: number
  advertiser?: {
    id: string
    userId?: string
    companyName?: string
    user?: { id: string; telegramId?: string; username?: string } | undefined
  } | undefined
}

export default function AdminListingsPage() {
  const [items, setItems] = useState<AdminListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/listings`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('influenta_token')}` },
          cache: 'no-store',
        })
        if (!resp.ok) throw new Error('Не удалось загрузить объявления')
        const data = await resp.json()
        const arr = Array.isArray(data) ? data : []
        setItems(arr as any)
      } catch (e: any) {
        setError(e?.message || 'Ошибка загрузки')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    if (!s) return items
    return items.filter(l => {
      const hay = `${l.title || ''} ${l.description || ''} ${l.advertiser?.companyName || ''} ${l.advertiser?.user?.username || ''}`.toLowerCase()
      return hay.includes(s)
    })
  }, [items, search])

  if (loading) return <div className="text-telegram-textSecondary">Загрузка объявлений…</div>
  if (error) return (
    <Card><CardContent className="p-6 text-telegram-danger">{error}</CardContent></Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold">Объявления</h1>
        <Badge variant="default">Всего: {items.length}</Badge>
        <div className="ml-auto w-full sm:w-72">
          <Input placeholder="Поиск по названию/рекламодателю" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-telegram-bgSecondary text-telegram-textSecondary">
              <tr>
                <th className="text-left px-4 py-3">Название</th>
                <th className="text-left px-4 py-3">Рекламодатель</th>
                <th className="text-left px-4 py-3">Формат</th>
                <th className="text-left px-4 py-3">Бюджет</th>
                <th className="text-left px-4 py-3">Просм.</th>
                <th className="text-left px-4 py-3">Отклики</th>
                <th className="text-left px-4 py-3">Статус</th>
                <th className="text-left px-4 py-3">Создано</th>
                <th className="text-left px-4 py-3">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="border-t border-gray-700/50">
                  <td className="px-4 py-3 whitespace-nowrap max-w-[280px] truncate">{l.title}</td>
                  <td className="px-4 py-3 whitespace-nowrap max-w-[220px] truncate">{l.advertiser?.companyName || l.advertiser?.user?.username || '—'}</td>
                  <td className="px-4 py-3">{getPostFormatLabel(l.format || '')}</td>
                  <td className="px-4 py-3">{typeof l.budget === 'number' ? formatPrice(l.budget) : '—'}</td>
                  <td className="px-4 py-3">{l.viewsCount ?? 0}</td>
                  <td className="px-4 py-3">{l.responsesCount ?? 0}</td>
                  <td className="px-4 py-3">
                    <Badge variant="default">{l.status || '—'}</Badge>
                  </td>
                  <td className="px-4 py-3">{formatDateTime(l.createdAt as any)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/listings/${l.id}`} className="text-telegram-primary hover:underline">Открыть</Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-telegram-textSecondary" colSpan={9}>Ничего не найдено</td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
import { useState } from 'react'
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

export default function AdminListingsPage() {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<ListingStatus | 'all'>('all')

  // Mock данные
  const listings = [
    {
      id: '1',
      title: 'Реклама мобильного приложения для медитации',
      advertiser: {
        companyName: 'MindfulTech',
        isVerified: true,
      },
      targetCategories: [BloggerCategory.LIFESTYLE, BloggerCategory.FITNESS],
      budget: 150000,
      format: PostFormat.POST_AND_STORY,
      deadline: new Date('2024-12-31'),
      status: ListingStatus.ACTIVE,
      viewsCount: 245,
      responsesCount: 12,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    },
    {
      id: '2',
      title: 'Продвижение онлайн-курса по программированию',
      advertiser: {
        companyName: 'CodeAcademy',
        isVerified: true,
      },
      targetCategories: [BloggerCategory.TECH, BloggerCategory.EDUCATION],
      budget: 200000,
      format: PostFormat.POST,
      deadline: new Date('2024-12-15'),
      status: ListingStatus.ACTIVE,
      viewsCount: 189,
      responsesCount: 8,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    },
    {
      id: '3',
      title: 'Реклама косметического бренда',
      advertiser: {
        companyName: 'NaturalBeauty',
        isVerified: false,
      },
      targetCategories: [BloggerCategory.BEAUTY, BloggerCategory.LIFESTYLE],
      budget: 80000,
      format: PostFormat.ANY,
      status: ListingStatus.PAUSED,
      viewsCount: 432,
      responsesCount: 24,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
    },
    {
      id: '4',
      title: 'Промо криптовалютной биржи',
      advertiser: {
        companyName: 'CryptoExchange',
        isVerified: false,
      },
      targetCategories: [BloggerCategory.BUSINESS, BloggerCategory.TECH],
      budget: 500000,
      format: PostFormat.POST,
      status: ListingStatus.CLOSED,
      viewsCount: 567,
      responsesCount: 45,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
      closedReason: 'Нарушение правил платформы',
    },
  ]

  const filteredListings = listings.filter(listing => {
    const matchesSearch = 
      listing.title.toLowerCase().includes(search.toLowerCase()) ||
      listing.advertiser.companyName.toLowerCase().includes(search.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || listing.status === filterStatus
    
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: listings.length,
    active: listings.filter(l => l.status === ListingStatus.ACTIVE).length,
    paused: listings.filter(l => l.status === ListingStatus.PAUSED).length,
    closed: listings.filter(l => l.status === ListingStatus.CLOSED).length,
    totalBudget: listings.reduce((sum, l) => sum + l.budget, 0),
    totalResponses: listings.reduce((sum, l) => sum + l.responsesCount, 0),
  }

  const statusTabs = [
    { value: 'all', label: 'Все', count: stats.total },
    { value: ListingStatus.ACTIVE, label: 'Активные', count: stats.active },
    { value: ListingStatus.PAUSED, label: 'На паузе', count: stats.paused },
    { value: ListingStatus.CLOSED, label: 'Закрытые', count: stats.closed },
  ]

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
                      <span>{listing.advertiser.companyName}</span>
                      {listing.advertiser.isVerified && (
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
                  {listing.targetCategories.map(category => (
                    <Badge key={category} variant="default">
                      {getCategoryLabel(category)}
                    </Badge>
                  ))}
                  <Badge variant="default">
                    {getPostFormatLabel(listing.format)}
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
                      {listing.viewsCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-telegram-textSecondary">Отклики</p>
                    <p className="font-medium flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      {listing.responsesCount}
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


