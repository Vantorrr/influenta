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
  ArrowRight,
  ExternalLink
} from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatNumber } from '@/lib/utils'
import { statsApi, analyticsApi } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

// Compact Role Icons
const BloggerIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="8" r="4" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const AdvertiserIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M12 10v4M8 10v4M16 10v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

export default function DashboardPage() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  const { data: stats } = useQuery({
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

  // Colors for chart
  const colorBySeries: Record<string, { dot: string }> = {
    'Просмотры': { dot: 'bg-blue-500' },
    'Отклики': { dot: 'bg-purple-500' },
  }
  
  useEffect(() => {
    const pendingDeepLink = localStorage.getItem('pendingDeepLink')
    if (pendingDeepLink) {
      localStorage.removeItem('pendingDeepLink')
      router.push(`/${pendingDeepLink}`)
    }
  }, [router])

  useEffect(() => {
    if (user?.id) analyticsApi.track('dashboard_view')
  }, [user?.id])

  const userRole = isAdmin ? 'admin' : (user?.role || 'blogger')

  const bloggerStats = [
    {
      title: 'Просмотры',
      value: stats?.profileViews ? formatNumber(stats.profileViews) : '0',
      change: stats?.profileViewsChange,
      icon: Eye,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'Отклики',
      value: stats?.activeResponses?.toString() || '0',
      change: stats?.activeResponsesChange,
      icon: MessageSquare,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      action: () => router.push('/messages')
    },
  ]

  const advertiserStats = [
    {
      title: 'Кампании',
      value: stats?.activeCampaigns?.toString() || '0',
      change: stats?.activeCampaignsChange,
      icon: Briefcase,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'Отклики',
      value: stats?.totalResponses?.toString() || '0',
      change: stats?.totalResponsesChange,
      icon: MessageSquare,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      action: () => router.push('/listings')
    },
  ]

  const currentStats = userRole === 'blogger' ? bloggerStats : advertiserStats

  return (
    <Layout>
      <div className="container py-4 space-y-4">
        {/* 1. Compact Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-white/10 shadow-xl bg-[#1C1E20]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-purple-500/5 opacity-50" />
          <div className="relative z-10 p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 shrink-0 text-white/80">
                {userRole === 'admin' ? <Shield className="w-5 h-5" /> : userRole === 'blogger' ? <BloggerIcon /> : <AdvertiserIcon />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white truncate">
                    {user?.firstName || 'Гость'}
                  </h2>
                  {isAdmin && <Badge variant="primary" className="text-[9px] h-4 px-1">ADMIN</Badge>}
                </div>
                <p className="text-xs text-white/50 truncate">
                  {userRole === 'admin' ? 'Система в норме' : 
                   userRole === 'blogger' ? 'Аккаунт активен' : 'Кабинет рекламодателя'}
                </p>
              </div>
            </div>
            {isAdmin && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push('/admin/dashboard')}
                className="h-8 text-xs px-3 bg-white/5 hover:bg-white/10 border-white/10"
              >
                Админка
              </Button>
            )}
          </div>
        </motion.div>

        {/* 2. Stats Grid (Compact & Sexy) */}
        <div className="grid grid-cols-2 gap-3">
          {currentStats.map((stat, i) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              onClick={stat.action}
              className={`relative overflow-hidden rounded-2xl bg-[#1C1E20] border border-white/5 p-4 flex flex-col justify-between h-28 ${stat.action ? 'cursor-pointer active:scale-95 transition-transform' : ''}`}
            >
              <div className="flex justify-between items-start">
                <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                  <stat.icon className="w-4 h-4" />
                </div>
                {stat.change && (
                  <span className={`text-xs font-medium ${Number(stat.change) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {Number(stat.change) > 0 ? '+' : ''}{stat.change}%
                  </span>
                )}
              </div>
              <div>
                <p className="text-2xl font-bold text-white tracking-tight">{stat.value}</p>
                <p className="text-xs text-white/50 font-medium">{stat.title}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 3. Quick Actions (Horizontal Grid) */}
        <div className="grid grid-cols-2 gap-3">
          {userRole === 'blogger' ? (
            <>
              <Button 
                variant="secondary" 
                onClick={() => router.push('/offers')}
                className="h-12 bg-[#1C1E20] hover:bg-white/5 border border-white/5 justify-start px-4 text-sm font-medium gap-3"
              >
                <Search className="w-4 h-4 text-blue-400" />
                Найти заказы
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => router.push('/profile')}
                className="h-12 bg-[#1C1E20] hover:bg-white/5 border border-white/5 justify-start px-4 text-sm font-medium gap-3"
              >
                <User className="w-4 h-4 text-purple-400" />
                Профиль
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="primary" 
                onClick={() => router.push('/listings/create')}
                className="h-12 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 border-0 justify-start px-4 text-sm font-bold gap-3 shadow-lg shadow-blue-500/20"
              >
                <PlusCircle className="w-4 h-4 text-white" />
                Создать
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => router.push('/bloggers')}
                className="h-12 bg-[#1C1E20] hover:bg-white/5 border border-white/5 justify-start px-4 text-sm font-medium gap-3"
              >
                <Users className="w-4 h-4 text-purple-400" />
                Найти блогеров
              </Button>
            </>
          )}
        </div>

        {/* 4. Chart (Minimalist) */}
        {series?.labels?.length ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-[#1C1E20] border border-white/5 p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-white/90">Активность</h3>
              <div className="flex gap-2">
                {series.series.map(s => {
                  const total = (s.data || []).reduce((a, b) => a + (b || 0), 0)
                  return (
                    <div key={s.name} className="flex items-center gap-1.5 text-[10px] bg-white/5 px-2 py-1 rounded-full">
                      <div className={`w-1.5 h-1.5 rounded-full ${colorBySeries[s.name]?.dot || 'bg-gray-500'}`} />
                      <span className="text-white/60">{s.name}</span>
                      <span className="text-white font-medium">{formatNumber(total)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            
            <div className="flex items-end gap-1 h-32">
              {(() => {
                const max = Math.max(...series.series.flatMap(s => s.data), 1)
                return series.labels.map((label, idx) => {
                  const sumAtIdx = series.series.reduce((acc, s) => acc + (s.data[idx] || 0), 0)
                  const h = Math.round((sumAtIdx / max) * 100)
                  const isSelected = activeIdx === idx
                  return (
                    <div 
                      key={label} 
                      className="flex-1 flex flex-col items-center gap-1 cursor-pointer group"
                      onClick={() => setActiveIdx(prev => prev === idx ? null : idx)}
                    >
                      <div className="relative w-full h-full flex items-end rounded-sm overflow-hidden bg-white/[0.02] group-hover:bg-white/[0.05] transition-colors">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(h, 5)}%` }}
                          className={`w-full ${isSelected ? 'bg-blue-500' : 'bg-white/20 group-hover:bg-white/30'} transition-colors rounded-t-sm`}
                        />
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
            {activeIdx !== null && (
               <div className="mt-3 pt-3 border-t border-white/5 flex justify-between text-xs text-white/60">
                 <span>{series.labels[activeIdx]}</span>
                 <span className="text-white font-medium">
                   {series.series.reduce((acc, s) => acc + (s.data[activeIdx] || 0), 0)} событий
                 </span>
               </div>
            )}
          </motion.div>
        ) : null}

        {/* 5. Minimal Support Link */}
        <div className="flex justify-center pt-2">
          <a
            href="https://t.me/polina_khristya"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            <Shield className="w-3 h-3" />
            <span>Поддержка и помощь</span>
            <ExternalLink className="w-3 h-3 opacity-50" />
          </a>
        </div>
      </div>
    </Layout>
  )
}
