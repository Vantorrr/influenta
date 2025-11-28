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
                    <Card className="bg-[#1C1E20] border-white/5 p-5 hover:border-white/10 transition-colors shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-bold text-white leading-snug flex-1 pr-4">
                          {listing.title}
                        </h3>
                        <Badge variant="default" className="bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold hover:bg-blue-500/20 shrink-0">
                          {listing.budget > 0 ? formatPrice(listing.budget) : 'Договорная'}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-white/60 line-clamp-2 mb-4 leading-relaxed">
                        {listing.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-2">
                        {listing.targetCategories?.slice(0, 3).map(cat => (
                          <Badge key={cat} variant="default" className="bg-[#2A2A2A] text-white/70 border border-white/5 font-normal text-xs hover:bg-[#333]">
                            {getCategoryLabel(cat)}
                          </Badge>
                        ))}
                        
                        {listing.requirements?.minSubscribers && (
                           <Badge variant="default" className="bg-[#2A2A2A] text-white/70 border border-white/5 font-normal text-xs hover:bg-[#333]">
                             от {listing.requirements.minSubscribers / 1000}k подп.
                           </Badge>
                        )}

                        {listing.deadline && (
                          <span className="text-xs text-white/40 ml-auto flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(listing.deadline).toLocaleDateString('ru-RU')}
                          </span>
                        )}
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
