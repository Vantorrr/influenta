'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  Filter, 
  Briefcase, 
  Clock, 
  ChevronRight, 
  Plus,
  Layers,
  Target
} from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { listingsApi } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { formatPrice, getCategoryLabel, getPostFormatLabel } from '@/lib/utils'
import { Listing } from '@/types'

export default function ListingsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [listings, setListings] = useState<Listing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadListings()
  }, [activeTab])

  const loadListings = async () => {
    setIsLoading(true)
    try {
      let data
      if (activeTab === 'my') {
        data = await listingsApi.getMyListings(1, 50)
      } else {
        data = await listingsApi.search({ search: searchQuery }, 1, 50)
      }
      setListings(Array.isArray(data?.data) ? data.data : [])
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  // Дебаунс поиска
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'all') loadListings()
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const isAdvertiser = user?.role === 'advertiser'

  return (
    <Layout>
      <div className="container py-4 space-y-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Задания</h1>
          {isAdvertiser && (
            <Link href="/listings/create">
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 border-0 shadow-lg shadow-blue-500/20"
              >
                <Plus className="w-4 h-4 mr-1" />
                Создать
              </Button>
            </Link>
          )}
        </div>

        {/* Tabs & Search */}
        <div className="space-y-4">
          {isAdvertiser && (
            <div className="flex bg-[#1C1E20] p-1 rounded-xl border border-white/5">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  activeTab === 'all' 
                    ? 'bg-white/10 text-white shadow-sm' 
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                Все задания
              </button>
              <button
                onClick={() => setActiveTab('my')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  activeTab === 'my' 
                    ? 'bg-white/10 text-white shadow-sm' 
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                Мои объявления
              </button>
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input 
              placeholder="Поиск по названию..." 
              className="pl-9 bg-[#1C1E20] border-white/5 focus:border-blue-500/50 h-11"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Listings Grid */}
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : listings.length > 0 ? (
          <div className="grid gap-3">
            <AnimatePresence mode="popLayout">
              {listings.map((listing, i) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link href={`/listings/${listing.id}`} className="block touch-manipulation active:scale-[0.99] transition-transform">
                    <Card className="bg-[#1C1E20] border-white/5 p-4 relative overflow-hidden hover:border-white/10 transition-colors">
                      {/* Neon Glow line based on format or budget */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-500 opacity-50" />
                      
                      <div className="flex justify-between items-start gap-3 pl-3">
                        <div className="space-y-2 flex-1 min-w-0">
                          {/* Tags */}
                          <div className="flex flex-wrap gap-1.5">
                            {listing.targetCategories?.slice(0, 2).map(cat => (
                              <Badge key={cat} variant="default" className="bg-white/5 hover:bg-white/10 text-[10px] text-white/70 border-white/5 font-normal">
                                {getCategoryLabel(cat)}
                              </Badge>
                            ))}
                            {listing.format && (
                              <Badge variant="default" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px]">
                                {getPostFormatLabel(listing.format)}
                              </Badge>
                            )}
                          </div>

                          <h3 className="font-bold text-white text-lg leading-tight truncate pr-2">
                            {listing.title}
                          </h3>
                          
                          <p className="text-sm text-white/50 line-clamp-2 leading-snug">
                            {listing.description}
                          </p>

                          <div className="flex items-center gap-4 pt-1 text-xs text-white/40">
                            {listing.deadline && (
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                <span>до {new Date(listing.deadline).toLocaleDateString('ru-RU')}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <Target className="w-3.5 h-3.5" />
                              <span>
                                {listing.requirements?.minSubscribers 
                                  ? `от ${listing.requirements.minSubscribers / 1000}k подп.` 
                                  : 'Любая аудитория'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Price & Action */}
                        <div className="flex flex-col items-end justify-between self-stretch gap-2">
                          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg text-right">
                            <span className="block text-[10px] text-blue-300 uppercase tracking-wider font-bold">Бюджет</span>
                            <span className="text-sm font-bold text-white">
                              {listing.budget > 0 ? formatPrice(listing.budget) : 'Договорная'}
                            </span>
                          </div>
                          
                          <ChevronRight className="w-5 h-5 text-white/20" />
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-12 text-white/30">
            <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Заданий пока нет</p>
            {isAdvertiser && activeTab === 'my' && (
              <Button 
                variant="ghost" 
                onClick={() => router.push('/listings/create')}
                className="text-blue-400 mt-2 hover:text-blue-300"
              >
                Создать первое
              </Button>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
