'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, UserCheck, Briefcase, FileText, TrendingUp,
  MessageSquare, Shield, Crown, Send, RefreshCw, Activity
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNumber } from '@/lib/utils'
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
  newUsersWeek: number
  newUsersMonth: number
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

function StatCard({ title, value, sub, icon: Icon, color, delay = 0 }: {
  title: string
  value: string | number
  sub?: string
  icon: any
  color: string
  delay?: number
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <p className="text-xs text-telegram-textSecondary leading-tight">{title}</p>
          </div>
          <p className="text-2xl font-bold text-white">{typeof value === 'number' ? formatNumber(value) : value}</p>
          {sub && <p className="text-xs text-telegram-textSecondary mt-0.5">{sub}</p>}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function AdminDashboardPage() {
  const { user, isSuperAdmin } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchStats = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('influenta_token')}` }
      })
      if (res.ok) {
        setStats(await res.json())
        setLastUpdated(new Date())
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
          <p className="text-telegram-textSecondary text-sm">Загружаем данные...</p>
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
          </div>
          <button onClick={fetchStats} className="opacity-70 hover:opacity-100 transition-opacity mt-1">
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        {lastUpdated && (
          <p className="text-xs opacity-60 mt-2">
            Обновлено: {lastUpdated.toLocaleTimeString('ru-RU')}
          </p>
        )}
      </motion.div>

      {/* Прирост сегодня / неделя / месяц */}
      <div>
        <h3 className="text-sm font-semibold text-telegram-textSecondary uppercase tracking-wider mb-3">📈 Прирост пользователей</h3>
        <div className="grid grid-cols-3 gap-3">
          <StatCard title="За сегодня" value={s?.newToday ?? 0} icon={TrendingUp} color="from-green-500 to-emerald-500" delay={0.05} />
          <StatCard title="За 7 дней" value={s?.newUsersWeek ?? 0} icon={TrendingUp} color="from-blue-500 to-cyan-500" delay={0.1} />
          <StatCard title="За 30 дней" value={s?.newUsersMonth ?? 0} icon={TrendingUp} color="from-violet-500 to-purple-500" delay={0.15} />
        </div>
      </div>

      {/* Пользователи */}
      <div>
        <h3 className="text-sm font-semibold text-telegram-textSecondary uppercase tracking-wider mb-3">👥 Аудитория</h3>
        <div className="grid grid-cols-2 gap-3">
          <StatCard title="Всего зарегистрировано" value={s?.totalUsers ?? 0} icon={Users} color="from-blue-500 to-cyan-500" delay={0.1} />
          <StatCard title="Заполнили профиль" value={s?.onboardedUsers ?? 0} sub={`${s?.onboardingRate ?? 0}% от активных`} icon={UserCheck} color="from-green-500 to-teal-500" delay={0.15} />
          <StatCard title="Блогеров" value={s?.totalBloggers ?? 0} icon={Users} color="from-pink-500 to-rose-500" delay={0.2} />
          <StatCard title="Рекламодателей" value={s?.totalAdvertisers ?? 0} icon={Briefcase} color="from-orange-500 to-amber-500" delay={0.25} />
        </div>
      </div>

      {/* Активность */}
      <div>
        <h3 className="text-sm font-semibold text-telegram-textSecondary uppercase tracking-wider mb-3">💬 Реальная активность</h3>
        <div className="grid grid-cols-2 gap-3">
          <StatCard title="Откликов всего" value={s?.totalResponses ?? 0} sub={`+${s?.responsesWeek ?? 0} за 7 дней`} icon={Activity} color="from-blue-500 to-indigo-500" delay={0.1} />
          <StatCard title="Сообщений в чатах" value={s?.totalMessages ?? 0} sub={`+${s?.messagesWeek ?? 0} за 7 дней`} icon={MessageSquare} color="from-cyan-500 to-sky-500" delay={0.15} />
          <StatCard title="Прямых офферов" value={s?.totalOffers ?? 0} sub={`+${s?.offersWeek ?? 0} за 7 дней`} icon={Send} color="from-violet-500 to-purple-500" delay={0.2} />
          <StatCard title="Объявлений активных" value={s?.activeListings ?? 0} sub={`+${s?.newListingsWeek ?? 0} за 7 дней`} icon={FileText} color="from-orange-500 to-red-500" delay={0.25} />
        </div>
      </div>

      {/* Качество */}
      <div>
        <h3 className="text-sm font-semibold text-telegram-textSecondary uppercase tracking-wider mb-3">✅ Качество</h3>
        <div className="grid grid-cols-2 gap-3">
          <StatCard title="Верифицировано" value={s?.verifiedUsers ?? 0} sub={`${s?.verificationRate ?? 0}% от всех`} icon={Shield} color="from-yellow-500 to-amber-500" delay={0.1} />
          <StatCard title="Всего объявлений" value={s?.totalListings ?? 0} icon={FileText} color="from-slate-500 to-gray-500" delay={0.15} />
        </div>
      </div>
    </div>
  )
}
