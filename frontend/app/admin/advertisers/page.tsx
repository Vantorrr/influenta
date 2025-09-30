'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Search as SearchIcon, 
  Filter,
  Building,
  DollarSign,
  FileText,
  Globe,
  Shield,
  Ban,
  Edit,
  TrendingUp,
  BarChart
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatDate } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

export default function AdminAdvertisersPage() {
  const [search, setSearch] = useState('')
  const [advertisers, setAdvertisers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return
    ;(async () => {
      try {
        const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/advertisers`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('influenta_token')}`
          }
        })
        if (!resp.ok) {
          const txt = await resp.text().catch(() => '')
          throw new Error(`API ${resp.status}: ${txt || 'Failed to load advertisers'}`)
        }
        const data = await resp.json()
        setAdvertisers(Array.isArray(data) ? data : [])
      } catch (e: any) {
        setError(e?.message || 'Ошибка загрузки рекламодателей')
      } finally {
        setIsLoading(false)
      }
    })()
  }, [user])

  const stats = {
    total: advertisers.length,
    verified: advertisers.filter(a => a.isVerified).length,
    active: advertisers.length,
    totalSpent: advertisers.reduce((sum, a) => sum + (a.totalSpent || 0), 0),
    activeListings: advertisers.reduce((sum, a) => sum + (a.activeListings || 0), 0),
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-telegram-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-telegram-primary mx-auto mb-4"></div>
          <p className="text-telegram-textSecondary">Загрузка рекламодателей...</p>
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
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Управление рекламодателями</h1>
        <p className="text-telegram-textSecondary">
          Всего рекламодателей: {stats.total}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-telegram-textSecondary">Всего компаний</p>
              </div>
              <Building className="w-8 h-8 text-telegram-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.verified}</p>
                <p className="text-sm text-telegram-textSecondary">Верифицированных</p>
              </div>
              <Shield className="w-8 h-8 text-telegram-success" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.activeListings}</p>
                <p className="text-sm text-telegram-textSecondary">Активных объявлений</p>
              </div>
              <FileText className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{formatPrice(stats.totalSpent)}</p>
                <p className="text-sm text-telegram-textSecondary">Общие расходы</p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{formatPrice(stats.totalSpent * 0.1)}</p>
                <p className="text-sm text-telegram-textSecondary">Комиссия платформы</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <Input
          type="search"
          placeholder="Поиск рекламодателей..."
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

      {/* Advertisers List */}
      <div className="space-y-4">
        {advertisers
          .filter(a => (a.companyName || '').toLowerCase().includes(search.toLowerCase()))
          .map((advertiser, index) => (
          <motion.div
            key={advertiser.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card hover>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-telegram-primary/20 rounded-lg flex items-center justify-center">
                      <Building className="w-6 h-6 text-telegram-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        {advertiser.companyName}
                        {advertiser.isVerified && (
                          <Shield className="w-4 h-4 text-telegram-primary" />
                        )}
                      </h3>
                      <p className="text-telegram-textSecondary text-sm">
                        {advertiser.email}
                      </p>
                      <a 
                        href={advertiser.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-telegram-primary hover:underline flex items-center gap-1"
                      >
                        <Globe className="w-3 h-3" />
                        {advertiser.website}
                      </a>
                    </div>
                  </div>
                  
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <Button variant="secondary" size="sm" className="px-2 min-w-[44px]">
                      <Edit className="w-4 h-4 mr-1" />
                    <span className="hidden md:inline">Редактировать</span>
                    </Button>
                  <Button variant="secondary" size="sm" className="px-2 min-w-[44px]">
                      <BarChart className="w-4 h-4 mr-1" />
                    <span className="hidden md:inline">Статистика</span>
                    </Button>
                  {!advertiser.isVerified && (
                    <Button variant="primary" size="sm" className="px-2 min-w-[44px]">
                        <Shield className="w-4 h-4 mr-1" />
                      <span className="hidden md:inline">Верифицировать</span>
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  <div className="bg-telegram-bg rounded-lg p-3">
                    <p className="text-xs text-telegram-textSecondary mb-1">Кампаний</p>
                    <p className="font-semibold">{advertiser.completedCampaigns}</p>
                  </div>
                  <div className="bg-telegram-bg rounded-lg p-3">
                    <p className="text-xs text-telegram-textSecondary mb-1">Потрачено</p>
                    <p className="font-semibold">{formatPrice(advertiser.totalSpent)}</p>
                  </div>
                  <div className="bg-telegram-bg rounded-lg p-3">
                    <p className="text-xs text-telegram-textSecondary mb-1">Активных объявлений</p>
                    <p className="font-semibold">{advertiser.activeListings}</p>
                  </div>
                  <div className="bg-telegram-bg rounded-lg p-3">
                    <p className="text-xs text-telegram-textSecondary mb-1">Рейтинг</p>
                    <p className="font-semibold">⭐ {advertiser.rating}</p>
                  </div>
                  <div className="bg-telegram-bg rounded-lg p-3">
                    <p className="text-xs text-telegram-textSecondary mb-1">Комиссия</p>
                    <p className="font-semibold">{formatPrice(advertiser.totalSpent * 0.1)}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-telegram-textSecondary">
                  <p>Зарегистрирован: {formatDate(advertiser.createdAt)}</p>
                  <p>Последняя активность: {formatDate(advertiser.lastActivity)}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Top Spenders Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="w-5 h-5" />
            Топ рекламодателей по расходам
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 bg-telegram-bg rounded-lg flex items-center justify-center">
            <p className="text-telegram-textSecondary">График будет доступен позже</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


