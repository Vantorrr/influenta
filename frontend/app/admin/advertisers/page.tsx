'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Search as SearchIcon, 
  Filter,
  Building,
  Globe,
  Shield,
  Ban,
  Edit,
  FileText,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatDate } from '@/lib/utils'
import { adminApi } from '@/lib/api'

interface AdvertiserData {
  id: string
  userId: string
  companyName: string
  email: string | null
  website: string | null
  isVerified: boolean
  totalSpent: number
  activeListings: number
  createdAt: string
  lastActivity: string
}

export default function AdminAdvertisersPage() {
  const [search, setSearch] = useState('')
  const [advertisers, setAdvertisers] = useState<AdvertiserData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const data = await adminApi.getAdvertisers()
        setAdvertisers(Array.isArray(data) ? data : [])
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || 'Не удалось загрузить')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const filtered = advertisers.filter(a => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      (a.companyName || '').toLowerCase().includes(q) ||
      (a.email || '').toLowerCase().includes(q) ||
      (a.website || '').toLowerCase().includes(q)
    )
  })

  const stats = {
    total: advertisers.length,
    verified: advertisers.filter(a => a.isVerified).length,
    totalSpent: advertisers.reduce((sum, a) => sum + (a.totalSpent || 0), 0),
    activeListings: advertisers.reduce((sum, a) => sum + (a.activeListings || 0), 0),
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-telegram-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-telegram-textSecondary">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Управление рекламодателями</h1>
        <p className="text-telegram-textSecondary">
          Всего рекламодателей: {stats.total}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-telegram-textSecondary">Всего</p>
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
                <p className="text-sm text-telegram-textSecondary">Верифицир.</p>
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
                <p className="text-sm text-telegram-textSecondary">Объявлений</p>
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
                <p className="text-sm text-telegram-textSecondary">Расходы</p>
              </div>
              <Globe className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

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

      <div className="space-y-4">
        {filtered.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-telegram-textSecondary">
              {search ? 'Ничего не найдено' : 'Нет рекламодателей'}
            </CardContent>
          </Card>
        )}
        {filtered.map((advertiser, index) => (
          <motion.div
            key={advertiser.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card hover>
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col gap-3 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-telegram-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building className="w-5 h-5 text-telegram-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-base flex items-center gap-2 flex-wrap">
                        <span className="truncate">{advertiser.companyName || '—'}</span>
                        {advertiser.isVerified && (
                          <Shield className="w-4 h-4 text-telegram-primary flex-shrink-0" />
                        )}
                      </h3>
                      {advertiser.email && (
                        <p className="text-telegram-textSecondary text-sm truncate">
                          {advertiser.email}
                        </p>
                      )}
                      {advertiser.website && (
                        <a 
                          href={advertiser.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-telegram-primary hover:underline flex items-center gap-1"
                        >
                          <Globe className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{advertiser.website}</span>
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" size="sm" onClick={() => window.location.href = `/admin/advertisers/${advertiser.id}`}>
                      <Edit className="w-4 h-4 mr-1" />
                      Подробнее
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-telegram-bg rounded-lg p-3">
                    <p className="text-xs text-telegram-textSecondary mb-1">Потрачено</p>
                    <p className="font-semibold text-sm">{formatPrice(advertiser.totalSpent || 0)}</p>
                  </div>
                  <div className="bg-telegram-bg rounded-lg p-3">
                    <p className="text-xs text-telegram-textSecondary mb-1">Активных объявлений</p>
                    <p className="font-semibold text-sm">{advertiser.activeListings || 0}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-telegram-textSecondary">
                  <p>Регистрация: {advertiser.createdAt ? formatDate(new Date(advertiser.createdAt)) : '—'}</p>
                  <p>Активность: {advertiser.lastActivity ? formatDate(new Date(advertiser.lastActivity)) : '—'}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
