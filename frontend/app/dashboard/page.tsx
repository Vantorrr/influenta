'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Users, 
  Briefcase, 
  MessageSquare,
  Star,
  Eye,
  DollarSign,
  Activity
} from 'lucide-react'
import { Layout } from '@/components/layout/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatNumber, formatPrice, getRelativeTime } from '@/lib/utils'
import { statsApi } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery('dashboard-stats', () => 
    statsApi.getDashboard()
  )

  const userRole = 'blogger' // TODO: Get from auth context

  const bloggerStats = [
    {
      title: 'Просмотры профиля',
      value: '2.4K',
      change: '+12%',
      icon: Eye,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Активные отклики',
      value: '5',
      change: '+2',
      icon: MessageSquare,
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Заработано',
      value: '₽125K',
      change: '+18%',
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
    },
    {
      title: 'Рейтинг',
      value: '4.8',
      change: '+0.2',
      icon: Star,
      color: 'from-orange-500 to-yellow-500',
    },
  ]

  const advertiserStats = [
    {
      title: 'Активные кампании',
      value: '3',
      change: '+1',
      icon: Briefcase,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Отклики',
      value: '24',
      change: '+8',
      icon: MessageSquare,
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Потрачено',
      value: '₽450K',
      change: '+25%',
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
    },
    {
      title: 'ROI',
      value: '3.2x',
      change: '+0.5x',
      icon: TrendingUp,
      color: 'from-orange-500 to-yellow-500',
    },
  ]

  const currentStats = userRole === 'blogger' ? bloggerStats : advertiserStats

  const recentActivity = [
    {
      id: 1,
      type: 'response',
      title: 'Новый отклик на "Реклама мобильного приложения"',
      time: new Date(Date.now() - 1000 * 60 * 30),
      status: 'new',
    },
    {
      id: 2,
      type: 'message',
      title: 'Сообщение от TechBrand',
      time: new Date(Date.now() - 1000 * 60 * 60 * 2),
      status: 'unread',
    },
    {
      id: 3,
      type: 'accepted',
      title: 'Ваш отклик принят: "Продвижение онлайн-курса"',
      time: new Date(Date.now() - 1000 * 60 * 60 * 24),
      status: 'success',
    },
  ]

  return (
    <Layout>
      <div className="container py-6 space-y-6">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-telegram-primary to-telegram-accent rounded-xl p-6 text-white"
        >
          <h2 className="text-2xl font-bold mb-2">
            Добро пожаловать! 👋
          </h2>
          <p className="opacity-90 mb-4">
            {userRole === 'blogger' 
              ? 'У вас 3 новых предложения от рекламодателей'
              : 'На ваши объявления откликнулись 8 блогеров'
            }
          </p>
          <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white">
            Посмотреть
          </Button>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {currentStats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                    <Badge variant={stat.change.startsWith('+') ? 'success' : 'danger'}>
                      {stat.change}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-telegram-textSecondary">{stat.title}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Быстрые действия</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {userRole === 'blogger' ? (
                <>
                  <Button variant="secondary" fullWidth>
                    <Search className="w-4 h-4 mr-2" />
                    Найти заказы
                  </Button>
                  <Button variant="secondary" fullWidth>
                    <User className="w-4 h-4 mr-2" />
                    Мой профиль
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="secondary" fullWidth>
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Создать объявление
                  </Button>
                  <Button variant="secondary" fullWidth>
                    <Users className="w-4 h-4 mr-2" />
                    Найти блогеров
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

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
                    <p className="text-xs text-telegram-textSecondary">
                      {getRelativeTime(activity.time)}
                    </p>
                  </div>
                  {activity.status === 'new' && (
                    <Badge variant="primary">Новое</Badge>
                  )}
                  {activity.status === 'unread' && (
                    <Badge variant="warning">Непрочитано</Badge>
                  )}
                  {activity.status === 'success' && (
                    <Badge variant="success">Принято</Badge>
                  )}
                </motion.div>
              ))}
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

// Missing imports fix
import { Search, User, PlusCircle } from 'lucide-react'


