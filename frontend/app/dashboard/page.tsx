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
  PlusCircle
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


        {/* Performance Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>
              {userRole === 'blogger' ? 'Статистика просмотров' : 'Эффективность кампаний'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 bg-telegram-bg rounded-lg flex items-center justify-center">
              <p className="text-telegram-textSecondary">График будет доступен позже</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}












