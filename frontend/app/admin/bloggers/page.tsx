'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Search as SearchIcon, 
  Filter,
  Star,
  Users,
  Eye,
  Shield,
  Ban,
  Edit,
  DollarSign,
  TrendingUp
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { formatNumber, formatPrice, getCategoryLabel } from '@/lib/utils'
import { BloggerCategory } from '@/types'
import { bloggersApi } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'

export default function AdminBloggersPage() {
  const [search, setSearch] = useState('')
  const [bloggers, setBloggers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return
    ;(async () => {
      try {
        const filters: any = {}
        if (search && search.trim().length > 0) filters.search = search.trim()
        const data = await bloggersApi.search(filters, 1, 50)
        setBloggers(data.data || [])
      } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || 'Ошибка загрузки'
        setError(Array.isArray(msg) ? msg.join(', ') : String(msg))
      } finally {
        setIsLoading(false)
      }
    })()
  }, [user])

  const stats = {
    total: bloggers.length,
    verified: bloggers.filter(b => !!b.isVerified).length,
    active: bloggers.filter(b => (b.subscribersCount || 0) > 0).length,
    totalEarnings: bloggers.reduce((sum, b) => sum + ((b.completedCampaigns || 0) * (b.pricePerPost || 0)), 0),
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-telegram-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-telegram-primary mx-auto mb-4"></div>
          <p className="text-telegram-textSecondary">Загрузка блогеров...</p>
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
        <h1 className="text-3xl font-bold mb-2">Управление блогерами</h1>
        <p className="text-telegram-textSecondary">
          Всего блогеров: {stats.total}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-telegram-textSecondary">Всего блогеров</p>
              </div>
              <Users className="w-8 h-8 text-telegram-primary" />
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
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-sm text-telegram-textSecondary">Активных</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{formatPrice(stats.totalEarnings)}</p>
                <p className="text-sm text-telegram-textSecondary">Общий заработок</p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <Input
          type="search"
          placeholder="Поиск блогеров..."
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

      {/* Bloggers List */}
      <div className="space-y-4">
        {bloggers.map((blogger, index) => (
          <motion.div
            key={blogger.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card hover>
              <CardContent className="p-6">
                <div className="flex items-start gap-4 min-w-0">
                  <Avatar
                    firstName={blogger.user?.firstName || ''}
                    lastName={blogger.user?.lastName || ''}
                    size="lg"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2 gap-3">
                      <div className="min-w-0" dir="auto">
                        <h3 className="font-semibold text-lg flex items-center gap-2 truncate">
                          <span className="truncate">
                            {blogger.user?.firstName || ''} {blogger.user?.lastName || ''}
                          </span>
                          {blogger.isVerified && (
                            <Shield className="w-4 h-4 text-telegram-primary flex-shrink-0" />
                          )}
                        </h3>
                        <p className="text-telegram-textSecondary truncate">
                          {blogger.user?.username || ''}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1 flex-shrink-0 whitespace-nowrap">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="px-2"
                          onClick={() => { if (typeof window !== 'undefined') window.location.href = `/bloggers/${blogger.id}` }}
                          title="Редактировать"
                        >
                          <Edit className="w-4 h-4" />
                          <span className="hidden md:inline ml-1">Редактировать</span>
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="px-2"
                          onClick={() => { if (typeof window !== 'undefined') window.location.href = `/bloggers/${blogger.id}` }}
                          title="Просмотр"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="hidden md:inline ml-1">Просмотр</span>
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(blogger.categories || []).slice(0, 2).map((category: string) => (
                        <Badge key={category} variant="default">
                          {getCategoryLabel(category)}
                        </Badge>
                      ))}
                      {(blogger.categories || []).length > 2 && (
                        <Badge variant="default">+{(blogger.categories || []).length - 2}</Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-telegram-textSecondary">Подписчики</p>
                        <p className="font-medium">{formatNumber(blogger.subscribersCount || 0)}</p>
                      </div>
                      <div>
                        <p className="text-telegram-textSecondary">Ср. просмотры</p>
                        <p className="font-medium">{formatNumber(blogger.averageViews || 0)}</p>
                      </div>
                      <div>
                        <p className="text-telegram-textSecondary">Engagement</p>
                        <p className="font-medium">{blogger.engagementRate || 0}%</p>
                      </div>
                      <div>
                        <p className="text-telegram-textSecondary">Рейтинг</p>
                        <p className="font-medium flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          {blogger.rating || 0}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-700/50 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-telegram-textSecondary">Цена за пост</p>
                        <p className="font-medium">{formatPrice(blogger.pricePerPost || 0)}</p>
                      </div>
                      <div>
                        <p className="text-telegram-textSecondary">Кампаний</p>
                        <p className="font-medium">{blogger.completedCampaigns || 0}</p>
                      </div>
                      <div>
                        <p className="text-telegram-textSecondary">Оцен. оборот</p>
                        <p className="font-medium">{formatPrice((blogger.completedCampaigns || 0) * (blogger.pricePerPost || 0))}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}





