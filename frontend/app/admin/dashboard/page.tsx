'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, UserCheck, Briefcase, FileText, TrendingUp,
  MessageSquare, Shield, Crown, Send, RefreshCw, Activity
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatNumber, formatPrice, getRelativeTime } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

interface AdminStats {
  totalUsers: number
  activeUsers: number
  onboardedUsers: number
  onboardingRate: number
  totalBloggers: number
  totalAdvertisers: number
  verifiedUsers: number
  verificationRate: number
  newToday: number
  newUsersLast24h: number
  newUsersWeek: number
  newUsersMonth: number
  activeToday: number
  userGrowth: number
  totalListings: number
  activeListings: number
  newListingsWeek: number
  listingGrowth: number
  totalResponses: number
  responsesWeek: number
  totalMessages: number
  messagesWeek: number
  totalOffers: number
  offersWeek: number
  platformCommission: number
}

export default function AdminDashboardPage() {
  const { user, isSuperAdmin } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [topBloggers, setTopBloggers] = useState<any[]>([])

  const fetchStats = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('influenta_token')
      const headers = { 'Authorization': `Bearer ${token}` }
      const base = process.env.NEXT_PUBLIC_API_URL

      const [statsRes, raRes, tbRes] = await Promise.all([
        fetch(`${base}/admin/stats`, { headers }),
        fetch(`${base}/admin/recent-activity`, { headers }),
        fetch(`${base}/admin/top-bloggers`, { headers }),
      ])

      if (statsRes.ok) {
        setStats(await statsRes.json())
        setLastUpdated(new Date())
      }
      if (raRes.ok) {
        const data = await raRes.json()
        setRecentActivity(Array.isArray(data) ? data.map((i: any) => ({
          id: i.id, type: i.type, title: i.title || '',
          time: i.time ? new Date(i.time) : new Date(),
          status: i.status, amount: i.amount,
        })) : [])
      }
      if (tbRes.ok) {
        const data = await tbRes.json()
        setTopBloggers(Array.isArray(data) ? data.map((b: any) => ({
          id: b.id, name: b.name || '', username: b.username || '',
          subscribers: Number(b.subscribers || 0),
          earnings: Number(b.earnings || 0),
          campaigns: Number(b.campaigns || 0),
        })) : [])
      }
    } catch {}
    finally { setIsLoading(false) }
  }

  useEffect(() => { fetchStats() }, [])

  if (isLoading && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-telegram-primary mx-auto mb-3" />
          <p className="text-telegram-textSecondary text-sm">Загрузка статистики...</p>
        </div>
      </div>
    )
  }

  const s = stats

  return (
    <div className="space-y-5 pb-10">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-telegram-primary to-telegram-accent rounded-xl p-5 text-white"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              {user?.firstName} {isSuperAdmin ? <Crown className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
            </h2>
            <p className="text-sm opacity-80 mt-0.5">Дашборд платформы Influenta</p>
            {lastUpdated && (
              <p className="text-xs opacity-60 mt-1">
                Обновлено: {lastUpdated.toLocaleTimeString('ru-RU')}
              </p>
            )}
          </div>
          <button onClick={fetchStats} className="opacity-70 hover:opacity-100 transition-opacity mt-1 p-2">
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </motion.div>

      {/* Прирост */}
      <div>
        <p className="text-xs font-semibold text-telegram-textSecondary uppercase tracking-wider mb-1">📈 Прирост пользователей</p>
        <p className="text-xs text-telegram-textSecondary mb-3">Сегодня считается по Москве. Отдельно показываем регистрации и активные входы.</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Новых сегодня', value: s?.newToday ?? 0, color: 'from-green-500 to-emerald-500' },
            { label: 'Активных сегодня', value: s?.activeToday ?? 0, color: 'from-cyan-500 to-sky-500' },
            { label: 'За 24 часа', value: s?.newUsersLast24h ?? 0, color: 'from-blue-500 to-indigo-500' },
            { label: 'За 7 дней', value: s?.newUsersWeek ?? 0, color: 'from-violet-500 to-purple-500' },
          ].map((item, i) => (
            <motion.div key={item.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div className={`bg-gradient-to-br ${item.color} rounded-xl p-3 text-white`}>
                <p className="text-xs opacity-80 mb-1">{item.label}</p>
                <p className="text-2xl font-bold">{formatNumber(item.value)}</p>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-2 mt-2">
          <div className="bg-white/[0.04] rounded-xl p-3 border border-white/[0.06]">
            <p className="text-xs text-telegram-textSecondary mb-1">Новых за 30 дней</p>
            <p className="text-xl font-bold">{formatNumber(s?.newUsersMonth ?? 0)}</p>
          </div>
        </div>
      </div>

      {/* Аудитория */}
      <div>
        <p className="text-xs font-semibold text-telegram-textSecondary uppercase tracking-wider mb-3">👥 Аудитория</p>
        <div className="grid grid-cols-2 gap-3 items-stretch">
          {[
            { label: 'Зарегистрировано', value: s?.totalUsers ?? 0, sub: ' ', icon: Users, color: '#3b82f6' },
            { label: 'Заполнили профиль', value: s?.onboardedUsers ?? 0, sub: `${s?.onboardingRate ?? 0}% от активных`, icon: UserCheck, color: '#10b981' },
            { label: 'Блогеров', value: s?.totalBloggers ?? 0, sub: ' ', icon: Users, color: '#ec4899' },
            { label: 'Рекламодателей', value: s?.totalAdvertisers ?? 0, sub: ' ', icon: Briefcase, color: '#f97316' },
          ].map((item, i) => (
            <motion.div key={item.label} className="h-full" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.05 }}>
              <Card className="h-full">
                <CardContent className="p-4 flex flex-col justify-between h-full">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: item.color + '22' }}>
                      <item.icon className="w-4 h-4" style={{ color: item.color }} />
                    </div>
                    <p className="text-xs text-telegram-textSecondary">{item.label}</p>
                  </div>
                  <p className="text-2xl font-bold">{formatNumber(item.value)}</p>
                  <p className="text-xs text-telegram-textSecondary mt-0.5">{item.sub}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Реальная активность */}
      <div>
        <p className="text-xs font-semibold text-telegram-textSecondary uppercase tracking-wider mb-3">💬 Реальная активность</p>
        <div className="grid grid-cols-2 gap-3 items-stretch">
          {[
            { label: 'Откликов', value: s?.totalResponses ?? 0, sub: `+${s?.responsesWeek ?? 0} за 7 дн.`, icon: Activity, color: '#6366f1' },
            { label: 'Сообщений', value: s?.totalMessages ?? 0, sub: `+${s?.messagesWeek ?? 0} за 7 дн.`, icon: MessageSquare, color: '#0ea5e9' },
            { label: 'Прямых офферов', value: s?.totalOffers ?? 0, sub: `+${s?.offersWeek ?? 0} за 7 дн.`, icon: Send, color: '#8b5cf6' },
            { label: 'Объявлений', value: s?.activeListings ?? 0, sub: `+${s?.newListingsWeek ?? 0} за 7 дн.`, icon: FileText, color: '#f97316' },
          ].map((item, i) => (
            <motion.div key={item.label} className="h-full" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
              <Card className="h-full">
                <CardContent className="p-4 flex flex-col justify-between h-full">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: item.color + '22' }}>
                      <item.icon className="w-4 h-4" style={{ color: item.color }} />
                    </div>
                    <p className="text-xs text-telegram-textSecondary">{item.label}</p>
                  </div>
                  <p className="text-2xl font-bold">{formatNumber(item.value)}</p>
                  <p className="text-xs text-telegram-textSecondary mt-0.5">{item.sub}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Верификация */}
      <div>
        <p className="text-xs font-semibold text-telegram-textSecondary uppercase tracking-wider mb-3">✅ Качество</p>
        <div className="grid grid-cols-2 gap-3 items-stretch">
          {[
            { label: 'Верифицировано', value: s?.verifiedUsers ?? 0, sub: `${s?.verificationRate ?? 0}% от всех`, icon: Shield, color: '#eab308' },
            { label: 'Объявлений всего', value: s?.totalListings ?? 0, sub: ' ', icon: FileText, color: '#6b7280' },
          ].map((item, i) => (
            <motion.div key={item.label} className="h-full" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
              <Card className="h-full">
                <CardContent className="p-4 flex flex-col justify-between h-full">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: item.color + '22' }}>
                      <item.icon className="w-4 h-4" style={{ color: item.color }} />
                    </div>
                    <p className="text-xs text-telegram-textSecondary">{item.label}</p>
                  </div>
                  <p className="text-2xl font-bold">{formatNumber(item.value)}</p>
                  <p className="text-xs text-telegram-textSecondary mt-0.5">{item.sub}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Последняя активность */}
      {recentActivity.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Последняя активность</CardTitle>
              <Activity className="w-4 h-4 text-telegram-textSecondary" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-telegram-primary mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{activity.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-telegram-textSecondary">{getRelativeTime(activity.time)}</p>
                        {activity.amount && (
                          <Badge variant="default" className="text-xs">{formatPrice(activity.amount)}</Badge>
                        )}
                      </div>
                    </div>
                    {activity.status === 'pending' && <Badge variant="warning">Ожидает</Badge>}
                    {activity.status === 'complaint' && <Badge variant="danger">Жалоба</Badge>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Топ блогеры */}
      {topBloggers.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Топ блогеры</CardTitle>
              <TrendingUp className="w-4 h-4 text-telegram-textSecondary" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topBloggers.map((blogger, index) => (
                  <div key={blogger.id} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-telegram-primary/20 text-telegram-primary font-bold text-sm flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{blogger.name}</p>
                      <p className="text-xs text-telegram-textSecondary truncate">{blogger.username}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium">{formatNumber(blogger.subscribers)} подп.</p>
                      {blogger.campaigns > 0 && (
                        <p className="text-xs text-telegram-textSecondary">{blogger.campaigns} кампаний</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
