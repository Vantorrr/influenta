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
import { Layout } from '@/components/layout/Layout'
import { RubIcon } from '@/components/ui/ruble-icon'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatNumber, formatPrice, getRelativeTime } from '@/lib/utils'
import { statsApi, analyticsApi } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

// Custom SVG Icons
const BloggerIcon = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="20" r="12" fill="white" opacity="0.9"/>
    <path d="M16 48c0-8.8 7.2-16 16-16s16 7.2 16 16" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.9"/>
    <path d="M20 28l4-4 4 4 8-8 4 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
    <circle cx="24" cy="16" r="2" fill="#FFD700"/>
    <circle cx="40" cy="16" r="2" fill="#FFD700"/>
  </svg>
)

const AdvertiserIcon = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="16" width="40" height="32" rx="4" fill="white" opacity="0.9"/>
    <path d="M20 24h24M20 32h16M20 40h20" stroke="#2AABEE" strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="32" cy="12" r="6" fill="white" opacity="0.9"/>
    <path d="M28 12l2 2 4-4" stroke="#2AABEE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const AdminIcon = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 8L40 20h12l-10 8 4 12-14-8-14 8 4-12L12 20h12L32 8z" fill="white" opacity="0.95"/>
    <circle cx="32" cy="48" r="8" fill="white" opacity="0.9"/>
    <path d="M20 56c0-6.6 5.4-12 12-12s12 5.4 12 12" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.9"/>
  </svg>
)

export default function DashboardPage() {
  const { user, isAdmin } = useAuth()
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
    'Просмотры': { bar: 'from-telegram-primary to-telegram-accent', dot: 'bg-telegram-primary' },
    'Отклики': { bar: 'from-telegram-accent to-telegram-primary', dot: 'bg-telegram-accent' },
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

  const userRole = isAdmin ? 'admin' : (user?.role || 'blogger')

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
        {/* Compact Welcome Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
        >
          {/* Background with subtle gradient */}
          <div className="absolute inset-0 bg-[#1C1E20]">
            <div className="absolute inset-0 bg-gradient-to-r from-telegram-primary/20 via-transparent to-telegram-accent/10 opacity-50" />
          </div>

          <div className="relative z-10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Role Icon */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-telegram-primary/20 to-telegram-accent/20 flex items-center justify-center border border-white/5 shrink-0">
                {userRole === 'admin' ? (
                  <Shield className="w-6 h-6 text-telegram-primary" />
                ) : userRole === 'blogger' ? (
                  <BloggerIcon />
                ) : (
                  <AdvertiserIcon />
                )}
              </div>
              
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  Привет, {user?.firstName || 'Гость'}! 👋
                  {isAdmin && <Badge variant="primary" className="text-[10px] h-5 px-1.5">ADMIN</Badge>}
                </h2>
                <p className="text-xs text-telegram-textSecondary mt-0.5">
                  {userRole === 'admin'
                    ? 'Система работает штатно'
                    : userRole === 'blogger'
                      ? (stats?.activeResponses || 0) > 0
                        ? `${stats?.activeResponses} новых предложений`
                        : 'Новых предложений пока нет'
                      : (stats?.totalResponses || 0) > 0
                        ? `Получено откликов: ${stats?.totalResponses}`
                        : 'Откликов пока нет'}
                </p>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push(
                userRole === 'admin' ? '/admin/dashboard' :
                userRole === 'blogger' ? '/offers' : '/listings'
              )}
              className="shrink-0 text-xs font-medium h-9 bg-white/5 hover:bg-white/10 border-white/10"
            >
              {userRole === 'admin' ? 'Админ-панель' :
               userRole === 'blogger' ? 'Мои заказы' : 'Мои объявления'}
              <ArrowRight className="w-3 h-3 ml-1.5" />
            </Button>
          </div>
        </motion.div>

        {/* Admin Quick Access */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Button
              variant="primary"
              onClick={() => router.push('/admin/dashboard')}
              className="w-full h-14 text-base bg-gradient-to-r from-telegram-primary to-telegram-accent shadow-lg"
            >
              <Shield className="w-5 h-5 mr-3" />
              Панель администратора
            </Button>
          </motion.div>
        )}

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
                <div className="grid grid-cols-7 gap-2 items-end h-40">
                  {(() => {
                    const max = Math.max(
                      ...series.series.flatMap(s => s.data),
                      1
                    )
                    return series.labels.map((label, idx) => {
                      const sumAtIdx = series.series.reduce((acc, s) => acc + (s.data[idx] || 0), 0)
                      const h = Math.round((sumAtIdx / max) * 100)
                      return (
                        <div 
                          key={label} 
                          className="flex flex-col items-center gap-2 cursor-pointer"
                          onMouseEnter={() => setActiveIdx(idx)}
                          onMouseLeave={() => setActiveIdx(null)}
                          onClick={() => setActiveIdx(prev => prev === idx ? null : idx)}
                        >
                          <div className="text-[10px] font-semibold text-telegram-text h-4">
                            {sumAtIdx > 0 ? sumAtIdx : ''}
                          </div>
                          <div className="w-full bg-telegram-bgSecondary rounded-md overflow-hidden h-32 flex items-end border border-telegram-border">
                            <div
                              className="w-full bg-gradient-to-t from-telegram-primary to-telegram-accent rounded-sm"
                              style={{ height: `${Math.max(h, 8)}%` }}
                            />
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


 
 
 
 
 
 
 
 