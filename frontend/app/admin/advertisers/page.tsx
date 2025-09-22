'use client'

import { useState } from 'react'
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

export default function AdminAdvertisersPage() {
  const [search, setSearch] = useState('')

  // Mock данные
  const advertisers = [
    {
      id: '1',
      companyName: 'TechBrand',
      email: 'contact@techbrand.com',
      website: 'https://techbrand.com',
      isVerified: true,
      isActive: true,
      rating: 4.7,
      completedCampaigns: 15,
      totalSpent: 2500000,
      activeListings: 3,
      createdAt: new Date('2024-01-15'),
      lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
    {
      id: '2',
      companyName: 'BeautyWorld',
      email: 'info@beautyworld.ru',
      website: 'https://beautyworld.ru',
      isVerified: true,
      isActive: true,
      rating: 4.9,
      completedCampaigns: 23,
      totalSpent: 3800000,
      activeListings: 5,
      createdAt: new Date('2023-11-20'),
      lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
    {
      id: '3',
      companyName: 'FoodDelivery Pro',
      email: 'partners@fooddelivery.com',
      website: 'https://fooddelivery.com',
      isVerified: false,
      isActive: true,
      rating: 4.2,
      completedCampaigns: 8,
      totalSpent: 980000,
      activeListings: 1,
      createdAt: new Date('2024-03-10'),
      lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    },
  ]

  const stats = {
    total: advertisers.length,
    verified: advertisers.filter(a => a.isVerified).length,
    active: advertisers.filter(a => a.isActive).length,
    totalSpent: advertisers.reduce((sum, a) => sum + a.totalSpent, 0),
    activeListings: advertisers.reduce((sum, a) => sum + a.activeListings, 0),
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
        {advertisers.map((advertiser, index) => (
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
                  
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm">
                      <Edit className="w-4 h-4 mr-1" />
                      Редактировать
                    </Button>
                    {advertiser.isActive ? (
                      <Button variant="danger" size="sm">
                        <Ban className="w-4 h-4 mr-1" />
                        Заблокировать
                      </Button>
                    ) : (
                      <Button variant="success" size="sm">
                        Разблокировать
                      </Button>
                    )}
                    {!advertiser.isVerified && (
                      <Button variant="primary" size="sm">
                        <Shield className="w-4 h-4 mr-1" />
                        Верифицировать
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

