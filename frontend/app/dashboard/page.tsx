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
  ExternalLink,
  Scale,
  FileText,
  ScrollText
} from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatNumber } from '@/lib/utils'
import { statsApi, analyticsApi } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { LegalModal } from '@/components/legal/LegalModal'

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
  const [legalModalOpen, setLegalModalOpen] = useState(false)
  const [legalTab, setLegalTab] = useState<'privacy' | 'offer' | 'rules'>('privacy')

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

  // Stats Data with Colors
  const bloggerStats = [
    {
      title: 'Просмотры',
      value: stats?.profileViews ? formatNumber(stats.profileViews) : '0',
      change: stats?.profileViewsChange,
      icon: Eye,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20'
    },
    {
      title: 'Отклики',
      value: stats?.activeResponses?.toString() || '0',
      change: stats?.activeResponsesChange,
      icon: MessageSquare,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
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
      border: 'border-blue-500/20',
      action: () => router.push('/listings')
    },
    {
      title: 'Отклики',
      value: stats?.totalResponses?.toString() || '0',
      change: stats?.totalResponsesChange,
      icon: MessageSquare,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      action: () => router.push('/listings')
    },
  ]

  const currentStats = userRole === 'blogger' ? bloggerStats : advertiserStats

  // Mock data for empty chart to look pretty
  const chartData = (series?.labels?.length && series.series.some(s => s.data.some(v => v > 0))) 
    ? series 
    : {
        labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
        series: [{ name: 'Активность', data: [5, 8, 12, 15, 10, 18, 25] }] // Fake data for visuals
      }
  
  const isFakeData = !series?.labels?.length

  return (
    <Layout>
      {/* Ambient Background Glow */}
      <div className="fixed top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none z-0" />
      
      <div className="container py-4 space-y-4 relative z-10">
        {/* 1. Status Card with Glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md bg-[#1C1E20]/80"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-transparent to-purple-600/10 opacity-50" />
          {/* Top glow line */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
          
          <div className="relative z-10 p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/10 shrink-0 text-white shadow-inner">
                {userRole === 'admin' ? <Shield className="w-5 h-5 text-blue-400" /> : userRole === 'blogger' ? <BloggerIcon /> : <AdvertiserIcon />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white truncate tracking-tight">
                    {user?.firstName || 'Гость'}
                  </h2>
                  {isAdmin && <Badge variant="primary" className="text-[9px] h-4 px-1 bg-blue-500/20 text-blue-300 border border-blue-500/30">ADMIN</Badge>}
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
                className="h-8 text-xs px-3 bg-white/5 hover:bg-white/10 border-white/10 shadow-lg"
              >
                Админка
              </Button>
            )}
          </div>
        </motion.div>

        {/* 2. Stats Grid (Neon Style) */}
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
              {/* Subtle gradient background specific to stat */}
              <div className={`absolute inset-0 opacity-10 bg-gradient-to-br from-transparent to-${stat.color.split('-')[1]}-500/20`} />
              
              <div className="flex justify-between items-start relative z-10">
                <div className={`p-2 rounded-lg ${stat.bg} ${stat.color} border ${stat.border}`}>
                  <stat.icon className="w-4 h-4" />
                </div>
                {stat.change && (
                  <span className={`text-xs font-bold ${Number(stat.change) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {Number(stat.change) > 0 ? '+' : ''}{stat.change}%
                  </span>
                )}
              </div>
              <div className="relative z-10">
                <p className="text-2xl font-bold text-white tracking-tight">{stat.value}</p>
                <p className="text-xs text-white/50 font-medium">{stat.title}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 3. Quick Actions (Glowing Buttons) */}
        <div className="grid grid-cols-2 gap-3">
          {userRole === 'blogger' ? (
            <>
              <Button 
                variant="secondary" 
                onClick={() => router.push('/offers')}
                className="h-12 bg-[#1C1E20] hover:bg-white/5 border border-white/5 justify-start px-4 text-sm font-medium gap-3 shadow-lg"
              >
                <Search className="w-4 h-4 text-cyan-400" />
                <span className="text-white/90">Найти заказы</span>
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => router.push('/bloggers')}
                className="h-12 bg-[#1C1E20] hover:bg-white/5 border border-white/5 justify-start px-4 text-sm font-medium gap-3 shadow-lg"
              >
                <Users className="w-4 h-4 text-pink-400" />
                <span className="text-white/90">🤝 Коллаборации</span>
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="primary" 
                onClick={() => router.push('/listings/create')}
                className="h-12 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 border-0 justify-start px-4 text-sm font-bold gap-3 shadow-[0_0_20px_rgba(59,130,246,0.3)] relative overflow-hidden group"
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12" />
                <PlusCircle className="w-4 h-4 text-white" />
                <span className="text-white">Создать</span>
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => router.push('/bloggers')}
                className="h-12 bg-[#1C1E20] hover:bg-white/5 border border-white/5 justify-start px-4 text-sm font-medium gap-3 shadow-lg"
              >
                <Users className="w-4 h-4 text-purple-400" />
                <span className="text-white/90">Найти блогеров</span>
              </Button>
            </>
          )}
        </div>

        {/* 4. Chart (Returned to Original Style with Mock Data Support) */}
        <Card className="bg-[#1C1E20] border-white/5">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-white">
              {userRole === 'blogger' ? 'Динамика: просмотры и отклики (7 дней)' : 'Динамика откликов (7 дней)'}
            </CardTitle>
            {isFakeData && (
              <span className="text-[10px] text-white/30 px-2 py-0.5 rounded-full bg-white/5">Демо данные</span>
            )}
          </CardHeader>
          <CardContent>
            {chartData?.labels?.length ? (
              <div className="space-y-4">
                {/* Итоги за 7 дней */}
                <div className="flex flex-wrap gap-2 text-xs">
                  {chartData.series.map(s => {
                    const total = (s.data || []).reduce((a, b) => a + (b || 0), 0)
                    return (
                      <div key={s.name} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/5">
                        <span className={`inline-block w-2 h-2 rounded-full ${colorBySeries[s.name]?.dot || 'bg-blue-500'}`} />
                        <span className="text-white/60">{s.name}:</span>
                        <span className="font-semibold text-white">{formatNumber(total)}</span>
                      </div>
                    )
                  })}
                </div>

                {/* Столбцы по дням */}
                <div className="grid grid-cols-7 gap-2 items-end h-40">
                  {(() => {
                    const max = Math.max(
                      ...chartData.series.flatMap(s => s.data),
                      1
                    )
                    return chartData.labels.map((label, idx) => {
                      const sumAtIdx = chartData.series.reduce((acc, s) => acc + (s.data[idx] || 0), 0)
                      const h = Math.round((sumAtIdx / max) * 100)
                      return (
                        <div 
                          key={label} 
                          className="flex flex-col items-center gap-1 cursor-pointer group"
                          onMouseEnter={() => setActiveIdx(idx)}
                          onMouseLeave={() => setActiveIdx(null)}
                          onClick={() => !isFakeData && setActiveIdx(prev => prev === idx ? null : idx)}
                        >
                          <div className="text-[10px] font-semibold text-white/80 h-4 transition-opacity">
                            {sumAtIdx > 0 ? sumAtIdx : ''}
                          </div>
                          <div className="w-full bg-white/5 rounded-md overflow-hidden h-32 flex items-end border border-white/5 group-hover:border-white/10 transition-colors">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${Math.max(h, 5)}%` }}
                              className="w-full bg-gradient-to-t from-blue-600 to-cyan-500 rounded-sm opacity-80 group-hover:opacity-100 transition-opacity"
                            />
                          </div>
                          <span className="text-[9px] text-white/40 font-medium">{label.slice(5)}</span>
                        </div>
                      )
                    })
                  })()}
                </div>
                
                {/* Детализация по активному дню */}
                {typeof activeIdx === 'number' && activeIdx >= 0 && !isFakeData && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="text-xs font-medium mb-2 text-white/80">Детали за {chartData.labels[activeIdx]}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {chartData.series.map(s => (
                        <div key={s.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`inline-block w-2 h-2 rounded-full ${colorBySeries[s.name]?.dot || 'bg-blue-500'}`} />
                            <span className="text-white/60">{s.name}</span>
                          </div>
                          <span className="font-semibold text-white">{formatNumber(s.data[activeIdx] || 0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-white/30 gap-2">
                <Activity className="w-8 h-8 opacity-50" />
                <p className="text-sm">Нет данных за неделю</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 5. Support & Legal Section */}
        <div className="mt-6 pt-6 border-t border-white/5 flex flex-col items-center gap-3">
          {/* Support Link */}
          <a
            href="https://t.me/influenta_support_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white/50 hover:text-white/80 hover:bg-white/10 transition-all w-full justify-center max-w-xs"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Поддержка и помощь</span>
            <ExternalLink className="w-3 h-3 opacity-50 ml-auto" />
          </a>

          {/* Legal Button - Clean & Minimal */}
          <button
            onClick={() => { setLegalTab('privacy'); setLegalModalOpen(true); }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs text-white/30 hover:text-white/60 hover:bg-white/5 transition-all w-full justify-center max-w-xs"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Правовая информация</span>
          </button>
        </div>

        {/* Creator Signature */}
        <div className="flex justify-center pb-8">
          <span className="text-[11px] font-medium tracking-wide text-white/15">
            🪚 by <span className="text-white/25 font-semibold">YNCHQ</span>
          </span>
        </div>
      </div>

      {/* Legal Modal */}
      <LegalModal 
        isOpen={legalModalOpen} 
        onClose={() => setLegalModalOpen(false)}
        initialTab={legalTab}
      />
    </Layout>
  )
}
