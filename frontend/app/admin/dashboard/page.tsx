'use client'

import { motion } from 'framer-motion'
import { 
  Users, 
  UserCheck, 
  Briefcase, 
  FileText,
  TrendingUp,
  DollarSign,
  Activity,
  Eye,
  ArrowUp,
  ArrowDown,
  Shield,
  Crown
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatNumber, formatPrice, getRelativeTime } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

export default function AdminDashboardPage() {
  const { user, isAdmin, isSuperAdmin } = useAuth()
  // Mock данные для демонстрации
  const stats = [
    {
      title: 'Всего пользователей',
      value: 15243,
      change: 12.5,
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Активных блогеров',
      value: 8921,
      change: 8.2,
      icon: UserCheck,
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Рекламодателей',
      value: 1834,
      change: 15.3,
      icon: Briefcase,
      color: 'from-green-500 to-emerald-500',
    },
    {
      title: 'Активных объявлений',
      value: 429,
      change: -3.2,
      icon: FileText,
      color: 'from-orange-500 to-red-500',
    },
  ]

  const revenueStats = {
    total: 12500000,
    commission: 1250000,
    growth: 23.5,
  }

  const recentActivity = [
    {
      id: 1,
      type: 'new_user',
      title: 'Новый блогер: @anna_lifestyle',
      time: new Date(Date.now() - 1000 * 60 * 15),
      status: 'blogger',
    },
    {
      id: 2,
      type: 'new_listing',
      title: 'Новое объявление: "Реклама косметики"',
      time: new Date(Date.now() - 1000 * 60 * 30),
      status: 'listing',
      amount: 150000,
    },
    {
      id: 3,
      type: 'verification',
      title: 'Запрос на верификацию: TechBrand',
      time: new Date(Date.now() - 1000 * 60 * 45),
      status: 'pending',
    },
    {
      id: 4,
      type: 'complaint',
      title: 'Жалоба на пользователя @spam_user',
      time: new Date(Date.now() - 1000 * 60 * 60),
      status: 'complaint',
    },
  ]

  const topBloggers = [
    {
      id: 1,
      name: 'Анна Иванова',
      username: '@anna_lifestyle',
      subscribers: 125000,
      earnings: 890000,
      campaigns: 24,
    },
    {
      id: 2,
      name: 'Михаил Петров',
      username: '@tech_mike',
      subscribers: 87000,
      earnings: 650000,
      campaigns: 18,
    },
    {
      id: 3,
      name: 'Елена Фитнес',
      username: '@fit_elena',
      subscribers: 56000,
      earnings: 420000,
      campaigns: 12,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Admin Welcome Card */}
      {user && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-telegram-primary to-telegram-accent rounded-xl p-6 text-white"
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
                Добро пожаловать, {user.firstName}!
                {isSuperAdmin ? (
                  <Crown className="w-7 h-7" />
                ) : (
                  <Shield className="w-7 h-7" />
                )}
              </h2>
              <p className="opacity-90 mb-1">
                {isSuperAdmin 
                  ? 'Вы имеете полный доступ ко всем функциям платформы'
                  : 'Вы вошли как администратор платформы'
                }
              </p>
              <p className="text-sm opacity-75">
                Telegram ID: {user.telegramId}
              </p>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              {isSuperAdmin ? 'Супер Админ #1' : 'Админ #2'}
            </Badge>
          </div>
        </motion.div>
      )}

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Дашборд</h1>
        <p className="text-telegram-textSecondary">
          Обзор ключевых метрик платформы
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${
                    stat.change > 0 ? 'text-telegram-success' : 'text-telegram-danger'
                  }`}>
                    {stat.change > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                    {Math.abs(stat.change)}%
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatNumber(stat.value)}</p>
                  <p className="text-sm text-telegram-textSecondary">{stat.title}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Revenue Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-gradient-to-r from-telegram-primary to-telegram-accent text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 mb-2">Общий оборот платформы</p>
                <p className="text-4xl font-bold mb-1">{formatPrice(revenueStats.total)}</p>
                <p className="text-white/80">
                  Комиссия: {formatPrice(revenueStats.commission)}
                </p>
              </div>
              <div className="text-right">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-2">
                  <DollarSign className="w-8 h-8" />
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <ArrowUp className="w-4 h-4" />
                  {revenueStats.growth}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Последняя активность</CardTitle>
            <Activity className="w-5 h-5 text-telegram-textSecondary" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ x: 5 }}
                  className="flex items-start gap-3 cursor-pointer"
                >
                  <div className="w-2 h-2 rounded-full bg-telegram-primary mt-2" />
                  <div className="flex-1">
                    <p className="text-sm">{activity.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-telegram-textSecondary">
                        {getRelativeTime(activity.time)}
                      </p>
                      {activity.amount && (
                        <Badge variant="default" className="text-xs">
                          {formatPrice(activity.amount)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {activity.status === 'pending' && (
                    <Badge variant="warning">Ожидает</Badge>
                  )}
                  {activity.status === 'complaint' && (
                    <Badge variant="danger">Жалоба</Badge>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Bloggers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Топ блогеры</CardTitle>
            <TrendingUp className="w-5 h-5 text-telegram-textSecondary" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topBloggers.map((blogger, index) => (
                <div key={blogger.id} className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-telegram-primary/20 text-telegram-primary font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{blogger.name}</p>
                    <p className="text-sm text-telegram-textSecondary">
                      {blogger.username} • {formatNumber(blogger.subscribers)} подписчиков
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatPrice(blogger.earnings)}</p>
                    <p className="text-xs text-telegram-textSecondary">
                      {blogger.campaigns} кампаний
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>График активности</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-telegram-bg rounded-lg flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-telegram-textSecondary mx-auto mb-3" />
              <p className="text-telegram-textSecondary">
                График будет доступен в следующей версии
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
