'use client'

import { useState } from 'react'
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

export default function AdminBloggersPage() {
  const [search, setSearch] = useState('')

  // Mock данные
  const bloggers = [
    {
      id: '1',
      user: {
        firstName: 'Анна',
        lastName: 'Иванова',
        username: '@anna_lifestyle',
        email: 'anna@example.com',
      },
      categories: [BloggerCategory.LIFESTYLE, BloggerCategory.FASHION],
      subscribersCount: 125000,
      averageViews: 45000,
      engagementRate: 4.2,
      pricePerPost: 25000,
      rating: 4.8,
      isVerified: true,
      isPublic: true,
      completedCampaigns: 24,
      totalEarnings: 890000,
    },
    {
      id: '2',
      user: {
        firstName: 'Михаил',
        lastName: 'Петров',
        username: '@tech_mike',
        email: 'mike@example.com',
      },
      categories: [BloggerCategory.TECH, BloggerCategory.EDUCATION],
      subscribersCount: 87000,
      averageViews: 32000,
      engagementRate: 5.1,
      pricePerPost: 20000,
      rating: 4.9,
      isVerified: true,
      isPublic: true,
      completedCampaigns: 18,
      totalEarnings: 650000,
    },
    {
      id: '3',
      user: {
        firstName: 'Елена',
        lastName: 'Фитнес',
        username: '@fit_elena',
        email: 'elena@example.com',
      },
      categories: [BloggerCategory.FITNESS, BloggerCategory.FOOD],
      subscribersCount: 56000,
      averageViews: 18000,
      engagementRate: 6.3,
      pricePerPost: 15000,
      rating: 4.7,
      isVerified: false,
      isPublic: true,
      completedCampaigns: 12,
      totalEarnings: 420000,
    },
  ]

  const stats = {
    total: bloggers.length,
    verified: bloggers.filter(b => b.isVerified).length,
    active: bloggers.filter(b => b.isPublic).length,
    totalEarnings: bloggers.reduce((sum, b) => sum + b.totalEarnings, 0),
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
                <div className="flex items-start gap-4">
                  <Avatar
                    firstName={blogger.user.firstName}
                    lastName={blogger.user.lastName}
                    size="lg"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          {blogger.user.firstName} {blogger.user.lastName}
                          {blogger.isVerified && (
                            <Shield className="w-4 h-4 text-telegram-primary" />
                          )}
                        </h3>
                        <p className="text-telegram-textSecondary">
                          {blogger.user.username} • {blogger.user.email}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="secondary" size="sm">
                          <Edit className="w-4 h-4 mr-1" />
                          Редактировать
                        </Button>
                        {blogger.isPublic ? (
                          <Button variant="danger" size="sm">
                            <Ban className="w-4 h-4 mr-1" />
                            Скрыть
                          </Button>
                        ) : (
                          <Button variant="success" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            Показать
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {blogger.categories.map(category => (
                        <Badge key={category} variant="default">
                          {getCategoryLabel(category)}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-telegram-textSecondary">Подписчики</p>
                        <p className="font-medium">{formatNumber(blogger.subscribersCount)}</p>
                      </div>
                      <div>
                        <p className="text-telegram-textSecondary">Ср. просмотры</p>
                        <p className="font-medium">{formatNumber(blogger.averageViews)}</p>
                      </div>
                      <div>
                        <p className="text-telegram-textSecondary">Engagement</p>
                        <p className="font-medium">{blogger.engagementRate}%</p>
                      </div>
                      <div>
                        <p className="text-telegram-textSecondary">Рейтинг</p>
                        <p className="font-medium flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          {blogger.rating}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-700/50 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-telegram-textSecondary">Цена за пост</p>
                        <p className="font-medium">{formatPrice(blogger.pricePerPost)}</p>
                      </div>
                      <div>
                        <p className="text-telegram-textSecondary">Кампаний</p>
                        <p className="font-medium">{blogger.completedCampaigns}</p>
                      </div>
                      <div>
                        <p className="text-telegram-textSecondary">Заработано</p>
                        <p className="font-medium">{formatPrice(blogger.totalEarnings)}</p>
                      </div>
                      <div>
                        <p className="text-telegram-textSecondary">Комиссия платформы</p>
                        <p className="font-medium">{formatPrice(blogger.totalEarnings * 0.1)}</p>
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

