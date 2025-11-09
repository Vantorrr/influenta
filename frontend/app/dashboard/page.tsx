'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Users, 
  Briefcase, 
  MessageSquare,
  Eye,
  Activity,
  Search,
  User,
  PlusCircle,
  Shield,
  ArrowRight
} from 'lucide-react'
import { Layout } from '@/components/layout/navigation'
import { RubIcon } from '@/components/ui/ruble-icon'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatNumber, formatPrice, getRelativeTime } from '@/lib/utils'
import { statsApi, analyticsApi } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => statsApi.getDashboard(),
    enabled: !!user,
  })
  const { data: series } = useQuery({
    queryKey: ['dashboard-series'],
    queryFn: () => statsApi.getSeries(),
    enabled: !!user,
  })
  const [activeIdx, setActiveIdx] = useState<number | null>(null)

  // Цвета для разных метрик
  const colorBySeries: Record<string, { bar: string; dot: string }> = {
    'Просмотры': { bar: 'from-blue-500 to-cyan-500', dot: 'bg-blue-400' },
    'Отклики': { bar: 'from-purple-500 to-pink-500', dot: 'bg-purple-400' },
  }
  
  useEffect(() => {
    // Проверяем pendingDeepLink при загрузке дашборда
    const pendingDeepLink = localStorage.getItem('pendingDeepLink')
    if (pendingDeepLink) {
      console.log('🟢 Navigating to deep link from dashboard:', pendingDeepLink)
      localStorage.removeItem('pendingDeepLink')
      router.push(`/${pendingDeepLink}`)
    }
  }, [router])

  useEffect(() => {
    if (user?.id) {
      analyticsApi.track('dashboard_view')
    }
  }, [user?.id])

  const userRole = user?.role || 'blogger'

  const bloggerStats = [
    {
      title: 'Просмотры профиля',
      value: stats?.profileViews ? formatNumber(stats.profileViews) : '0',
      change: stats?.profileViewsChange ? `+${stats.profileViewsChange}%` : '0%',
      icon: Eye,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Активные отклики',
      value: stats?.activeResponses?.toString() || '0',
      change: stats?.activeResponsesChange ? `+${stats.activeResponsesChange}` : '0',
      icon: MessageSquare,
      color: 'from-purple-500 to-pink-500',
    },
  ]

  const advertiserStats = [
    {
      title: 'Активные кампании',
      value: stats?.activeCampaigns?.toString() || '0',
      change: stats?.activeCampaignsChange ? `+${stats.activeCampaignsChange}` : '0',
      icon: Briefcase,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Отклики',
      value: stats?.totalResponses?.toString() || '0',
      subtitle: 'На все объявления',
      change: stats?.totalResponsesChange ? `+${stats.totalResponsesChange}` : '0',
      icon: MessageSquare,
      color: 'from-purple-500 to-pink-500',
    },
  ]

  const currentStats = userRole === 'blogger' ? bloggerStats : advertiserStats

  const recentActivity = stats?.recentActivity || []

  return (
    <Layout>
      <div className="container py-6 space-y-6">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden bg-gradient-to-br from-telegram-primary via-blue-600 to-telegram-accent rounded-3xl p-6 text-white shadow-2xl"
        >
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-2xl" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <motion.div
                initial={{ rotate: -10, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="text-4xl"
              >
                {userRole === 'blogger' ? '🎨' : '📢'}
              </motion.div>
              <h2 className="text-2xl font-bold">
                Привет, {user?.firstName}!
              </h2>
            </div>
            
            <p className="text-white/90 mb-5 text-base leading-relaxed">
              {userRole === 'blogger' 
                ? stats?.activeResponses > 0
                  ? `У вас ${stats.activeResponses} ${stats.activeResponses === 1 ? 'новое предложение' : 'новых предложений'}`
                  : 'Новых предложений пока нет'
                : stats?.totalResponses > 0
                  ? `Получено откликов: ${stats.totalResponses}`
                  : 'Откликов пока нет'}
            </p>
            
            <Button
              variant="secondary"
              className="bg-white text-telegram-primary hover:bg-white/95 font-medium shadow-lg"
              onClick={() => router.push(userRole === 'blogger' ? '/offers' : '/listings')}
            >
              {userRole === 'blogger' ? 'Посмотреть предложения' : 'Мои объявления'}
            </Button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {currentStats.map((stat, index) => {
            const clickable = (userRole === 'blogger' && stat.title === 'Активные отклики') || (userRole === 'advertiser' && stat.title === 'Отклики')
            const handleClick = async () => { 
              if (!clickable) return
              if (userRole === 'blogger') {
                router.push('/messages')
              } else {
                // For advertiser: go to first listing with responses
                if (stats?.firstListingWithResponses) {
                  router.push(`/listings/${stats.firstListingWithResponses}`)
                } else {
                  router.push('/listings')
                }
              }
            }
            return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="h-full"
              onClick={handleClick}
            >
              <Card className={`h-full ${clickable ? 'cursor-pointer hover:bg-telegram-bgSecondary' : ''}`}>
                <CardContent className="p-4 h-full flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="space-y-1 mt-auto">
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-telegram-textSecondary">{stat.title}</p>
                    {(stat as any).subtitle && (
                      <p className="text-xs text-telegram-textSecondary/70">{(stat as any).subtitle}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )})}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Быстрые действия</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {userRole === 'blogger' ? (
                <>
                  <Button 
                    variant="secondary" 
                    onClick={() => router.push(userRole === 'blogger' ? '/offers' : '/listings')}
                    className="w-full h-14 text-base border-2 border-telegram-border hover:border-telegram-primary/50"
                  >
                    <Search className="w-5 h-5 mr-3" />
                    Найти заказы
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={() => router.push('/profile')}
                    className="w-full h-14 text-base border-2 border-telegram-border hover:border-telegram-primary/50"
                  >
                    <User className="w-5 h-5 mr-3" />
                    Мой профиль
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="primary" 
                    onClick={() => router.push('/listings/create')}
                    className="w-full h-14 text-base"
                  >
                    <PlusCircle className="w-5 h-5 mr-3" />
                    Создать объявление
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={() => router.push('/bloggers')}
                    className="w-full h-14 text-base border-2 border-telegram-border hover:border-telegram-primary/50"
                  >
                    <Users className="w-5 h-5 mr-3" />
                    Найти блогеров
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>
              {userRole === 'blogger' ? 'Динамика: просмотры и отклики (7 дней)' : 'Динамика откликов (7 дней)'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {series?.labels?.length ? (
              <div className="space-y-4">
                {/* Итоги за 7 дней */}
                <div className="flex flex-wrap gap-3 text-sm">
                  {series.series.map(s => {
                    const total = (s.data || []).reduce((a, b) => a + (b || 0), 0)
                    return (
                      <div key={s.name} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-telegram-bgSecondary border border-telegram-border">
                        <span className={`inline-block w-3 h-3 rounded-sm ${colorBySeries[s.name]?.dot || 'bg-telegram-primary'}`} />
                        <span className="text-telegram-textSecondary">{s.name}:</span>
                        <span className="font-semibold">{formatNumber(total)}</span>
                      </div>
                    )
                  })}
                </div>

                {/* Столбцы по дням */}
                <div className="grid grid-cols-7 gap-2 items-end h-44 select-none">
                  {(() => {
                    const max = Math.max(
                      ...series.series.flatMap(s => s.data),
                      1
                    )
                    return series.labels.map((label, idx) => {
                      const valuesBySeries = Object.fromEntries(
                        series.series.map(s => [s.name, (s.data[idx] || 0)])
                      ) as Record<string, number>
                      const sumAtIdx = Object.values(valuesBySeries).reduce((a, b) => a + b, 0)
                      const viewsVal = valuesBySeries['Просмотры'] || 0
                      const responsesVal = valuesBySeries['Отклики'] || 0
                      const viewsH = Math.round((viewsVal / max) * 100)
                      const responsesH = Math.round((responsesVal / max) * 100)
                      return (
                        <div 
                          key={label} 
                          className="flex flex-col items-center gap-2"
                          onMouseEnter={() => setActiveIdx(idx)}
                          onMouseLeave={() => setActiveIdx(null)}
                          onClick={() => setActiveIdx(prev => prev === idx ? null : idx)}
                          onTouchStart={() => setActiveIdx(idx)}
                          onTouchEnd={() => {/* keep tooltip visible after tap */}}
                        >
                          {/* значение над столбцом */}
                          <div className="h-5">
                            <span className="text-[10px] text-telegram-textSecondary/80">
                              {sumAtIdx > 0 ? formatNumber(sumAtIdx) : ''}
                            </span>
                          </div>
                          <div className={`w-full bg-telegram-bgSecondary rounded-md h-32 flex items-end justify-center gap-1 border border-telegram-border/40 ${activeIdx === idx ? 'ring-2 ring-telegram-primary/50' : ''}`}>
                            {/* Просмотры */}
                            <div className="w-3 flex items-end">
                              <div
                                className={`w-full rounded-sm ${colorBySeries['Просмотры'] ? '' : ''} bg-blue-500`}
                                style={{ height: `${Math.max(6, Math.min(viewsH, 100))}%`, minHeight: 8 }}
                              />
                            </div>
                            {/* Отклики */}
                            <div className="w-3 flex items-end">
                              <div
                                className={`w-full rounded-sm ${colorBySeries['Отклики'] ? '' : ''} bg-fuchsia-500`}
                                style={{ height: `${Math.max(6, Math.min(responsesH, 100))}%`, minHeight: 8 }}
                              />
                            </div>
                          </div>
                          <span className="text-[10px] text-telegram-textSecondary">{label.slice(5)}</span>
                        </div>
                      )
                    })
                  })()}
                </div>
                
                {/* Детализация по активному дню */}
                {typeof activeIdx === 'number' && activeIdx >= 0 && (
                  <div className="rounded-xl border border-telegram-border bg-telegram-bgSecondary p-3">
                    <div className="text-sm font-medium mb-2">Детали за {series.labels[activeIdx]}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      {series.series.map(s => (
                        <div key={s.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`inline-block w-3 h-3 rounded-sm ${colorBySeries[s.name]?.dot || 'bg-telegram-primary'}`} />
                            <span className="text-telegram-textSecondary">{s.name}</span>
                          </div>
                          <span className="font-semibold">{formatNumber(s.data[activeIdx] || 0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-48 bg-telegram-bg rounded-lg flex items-center justify-center">
                <p className="text-telegram-textSecondary">Недостаточно данных</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Support CTA (below chart) */}
        <div className="bg-gradient-to-br from-telegram-primary/15 via-telegram-accent/10 to-telegram-primary/15 border border-telegram-border rounded-3xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-telegram-primary to-telegram-accent flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-2">Нужна помощь?</h2>
              <p className="text-telegram-textSecondary mb-4">Напишите в Telegram — Полина поможет оперативно.</p>
              <a
                href="https://t.me/polina_khristya"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-telegram-primary text-white px-4 py-2 rounded-xl font-semibold hover:bg-telegram-primary/90 transition-colors"
              >
                Связаться с поддержкой
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}












