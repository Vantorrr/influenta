'use client'

import { useState, useEffect, useLayoutEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, Users, Star, MessageCircle, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import PlatformsList from '@/components/ui/PlatformsList'
import Loading from '@/app/(protected)/loading'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import PlatformFilters from '@/components/PlatformFilters'
import { cn, formatNumber } from '@/lib/utils'
import VerificationTooltip from '@/components/ui/VerificationTooltip'
import { Badge } from '@/components/ui/Badge'

interface Blogger {
  id: string
  user?: {
    id: string
    firstName?: string
    lastName?: string
    username: string
    photoUrl?: string
    isVerified?: boolean
    location?: string
    verificationDate?: string
  }
  averageER?: number
  totalFollowers: number
  categories: string[]
  platforms: {
    platform: string
    username: string
    profileUrl?: string
    followersCount?: number
    isActive: boolean
    postFormats?: string[]
    pricePerPost?: number | null
    pricePerStory?: number | null
    pricePerReel?: number | null
    audienceGender?: { male: number; female: number } | null
    audienceAge?: { [key: string]: number } | null
    audienceLocation?: { [key: string]: number } | null
    metrics?: {
      followersCount?: number
      totalPosts?: number
      averageLikes?: number
      averageComments?: number
      engagementRate?: number
    }
    lastUpdated?: string
    subscribersCount?: number
    postsCount?: number
  }[]
  bio?: string
  totalPosts?: number
}

function BloggersPageContent() {
  const [bloggers, setBloggers] = useState<Blogger[]>([])
  const [filteredBloggers, setFilteredBloggers] = useState<Blogger[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState<string>('')
  const router = useRouter()

  // Get unique categories from all bloggers
  const getCategories = () => {
    const categories = new Set<string>()
    bloggers.forEach(blogger => {
      blogger.categories?.forEach(cat => categories.add(cat))
    })
    return Array.from(categories)
  }

  // Initialize flags on mount
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return
    ;(window as any).__bloggersScrollRestored = false
  }, [])

  const searchParams = useSearchParams()

  // Save scroll position on navigation away
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const handleBeforeUnload = () => {
      const scrollPosition = window.scrollY || document.documentElement.scrollTop || 0
      console.log('🚪 Saving scroll position on unload:', scrollPosition)
      sessionStorage.setItem('bloggers-exact-scroll', scrollPosition.toString())
    }
    
    // Save on page unload
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    // Save on route change
    const originalPushState = window.history.pushState
    const originalReplaceState = window.history.replaceState
    
    window.history.pushState = function(...args) {
      handleBeforeUnload()
      return originalPushState.apply(window.history, args)
    }
    
    window.history.replaceState = function(...args) {
      handleBeforeUnload()
      return originalReplaceState.apply(window.history, args)
    }
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.history.pushState = originalPushState
      window.history.replaceState = originalReplaceState
    }
  }, [])

  // Simple scroll restoration - only restore exact position
  useEffect(() => {
    if (typeof window === 'undefined' || isLoading || bloggers.length === 0) return

    // Check if we already restored
    if ((window as any).__bloggersScrollRestored) return

    const exactScrollPos = sessionStorage.getItem('bloggers-exact-scroll')
    if (exactScrollPos) {
      const scrollPos = parseInt(exactScrollPos, 10)
      if (!isNaN(scrollPos) && scrollPos >= 0) {
        console.log('📜 Restoring exact scroll:', scrollPos, 'bloggers count:', bloggers.length)
        
        // Check if bloggers are actually rendered in DOM
        const checkAndRestore = () => {
          const bloggerCards = document.querySelectorAll('[id^="blogger-"]')
          console.log('🔍 Found blogger cards in DOM:', bloggerCards.length)
          
          // Only restore if we have blogger cards in DOM
          if (bloggerCards.length === 0) {
            console.log('⏳ No blogger cards yet, will try again...')
            return false
          }
          
          console.log('✅ Blogger cards found, restoring scroll to:', scrollPos)
          ;(window as any).__bloggersScrollRestored = true
          sessionStorage.removeItem('bloggers-exact-scroll')
          window.scrollTo({ top: scrollPos, behavior: 'auto' })
          
          return true
        }
        
        // Try immediately
        if (checkAndRestore()) return
        
        // Keep trying until elements are rendered (up to 3 seconds)
        let attempts = 0
        const maxAttempts = 30
        const interval = setInterval(() => {
          attempts++
          if (attempts >= maxAttempts) {
            console.log('⚠️ Max attempts reached, giving up')
            clearInterval(interval)
            return
          }
          
          if (checkAndRestore()) {
            clearInterval(interval)
          }
        }, 100)
      }
    }
  }, [isLoading, bloggers])

  useEffect(() => {
    async function fetchBloggers() {
      try {
        setIsLoading(true)
        const token = localStorage.getItem('token')
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bloggers/search`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (!response.ok) {
          throw new Error('Failed to fetch bloggers')
        }
        
        const data = await response.json()
        setBloggers(data)
        setFilteredBloggers(data)
      } catch (error) {
        console.error('Error fetching bloggers:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBloggers()
  }, [])

  useEffect(() => {
    let filtered = bloggers

    if (search) {
      filtered = filtered.filter(blogger => {
        const searchLower = search.toLowerCase()
        const name = `${blogger.user?.firstName || ''} ${blogger.user?.lastName || ''}`.toLowerCase()
        const username = blogger.user?.username?.toLowerCase() || ''
        const categories = blogger.categories?.join(' ').toLowerCase() || ''
        
        return name.includes(searchLower) || username.includes(searchLower) || categories.includes(searchLower)
      })
    }

    if (selectedPlatform) {
      filtered = filtered.filter(blogger => 
        blogger.platforms.some(p => 
          p.platform.toLowerCase() === selectedPlatform.toLowerCase() && p.isActive
        )
      )
    }

    setFilteredBloggers(filtered)
  }, [search, selectedPlatform, bloggers])

  const getCategoryLabel = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      'fashion': '👗 Мода',
      'beauty': '💄 Красота', 
      'travel': '✈️ Путешествия',
      'lifestyle': '🏡 Лайфстайл',
      'food': '🍴 Еда',
      'fitness': '💪 Фитнес',
      'tech': '💻 Технологии',
      'gaming': '🎮 Игры',
      'music': '🎵 Музыка',
      'art': '🎨 Искусство',
      'business': '💼 Бизнес',
      'education': '📚 Образование',
      'entertainment': '🎬 Развлечения',
      'sports': '⚽ Спорт',
      'health': '🏥 Здоровье',
      'parenting': '👶 Родительство',
      'finance': '💰 Финансы',
      'automotive': '🚗 Авто',
      'photography': '📸 Фото',
      'comedy': '😄 Юмор',
      'dance': '💃 Танцы',
      'pets': '🐾 Питомцы',
      'nature': '🌿 Природа',
      'science': '🔬 Наука',
      'news': '📰 Новости',
      'politics': '🏛️ Политика',
      'diy': '🔨 DIY',
      'books': '📖 Книги',
      'movies': '🎬 Кино',
      'anime': '🌸 Аниме',
      'gardening': '🌱 Садоводство',
      'astrology': '🔮 Астрология',
      'history': '📜 История',
      'languages': '🗣️ Языки',
      'meditation': '🧘 Медитация',
      'interior': '🏠 Интерьер',
      'wedding': '👰 Свадьбы',
      'marketing': '📈 Маркетинг',
      'writing': '✍️ Писательство',
      'philosophy': '🤔 Философия',
      'vegan': '🥬 Веганство',
      'mental_health': '🧠 Ментальное здоровье',
      'productivity': '📊 Продуктивность',
      'motivation': '🎯 Мотивация',
      'charity': '❤️ Благотворительность',
      'environment': '🌍 Экология',
      'handmade': '🎨 Хендмейд',
      'collectibles': '🏺 Коллекционирование',
      'architecture': '🏛️ Архитектура',
      'wine': '🍷 Вино',
      'real_estate': '🏘️ Недвижимость',
      'agriculture': '🌾 Сельское хозяйство'
    }
    
    return categoryMap[category] || category
  }

  if (isLoading) {
    return <Loading />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-7 h-7 text-blue-600" />
        <h1 className="text-2xl font-bold">Блогеры</h1>
        <span className="text-gray-500 text-sm">({filteredBloggers.length})</span>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="search"
                placeholder="Поиск по имени, никнейму или категории..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <PlatformFilters
                  selectedPlatform={selectedPlatform}
                  onPlatformChange={setSelectedPlatform}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {filteredBloggers.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Блогеры не найдены</p>
          </CardContent>
        </Card>
      )}

      {/* Bloggers List */}
      <div className="space-y-3">
        {filteredBloggers.map((blogger, index) => (
          <motion.div
            key={blogger.id}
            id={`blogger-${blogger.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div
              onClick={(e) => {
                e.preventDefault()
                
                // Save exact scroll position only
                const scrollPosition = window.scrollY || document.documentElement.scrollTop || 0
                console.log('💾 Saving scroll position:', scrollPosition)
                sessionStorage.setItem('bloggers-exact-scroll', scrollPosition.toString())
                
                // Navigate to blogger page
                router.push(`/bloggers/${blogger.id}`)
              }}
              className="cursor-pointer"
            >
              <Card hover className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar
                      src={blogger.user?.photoUrl}
                      firstName={blogger.user?.firstName || ''}
                      lastName={blogger.user?.lastName || ''}
                      size="lg"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">
                              {blogger.user?.firstName} {blogger.user?.lastName}
                            </h3>
                            {blogger.user?.isVerified && (
                              <VerificationTooltip date={blogger.user.verificationDate}>
                                <Badge variant="primary" size="sm" className="gap-1">
                                  ✓
                                </Badge>
                              </VerificationTooltip>
                            )}
                          </div>
                          {blogger.user?.username && (
                            <p className="text-sm text-gray-500">@{blogger.user.username}</p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {blogger.categories?.slice(0, 3).map((category) => (
                              <span
                                key={category}
                                className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full"
                              >
                                {getCategoryLabel(category)}
                              </span>
                            ))}
                            {blogger.categories?.length > 3 && (
                              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                                +{blogger.categories.length - 3}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            {formatNumber(blogger.totalFollowers)}
                          </div>
                          <p className="text-sm text-gray-500">подписчиков</p>
                          {blogger.averageER && blogger.averageER > 0 && (
                            <div className="mt-1">
                              <span className="text-sm font-medium text-green-600">
                                ER: {blogger.averageER.toFixed(1)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-3">
                        <PlatformsList
                          platforms={blogger.platforms}
                          size="sm"
                          showFollowers
                          showPrices
                        />
                      </div>

                      {blogger.bio && (
                        <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                          {blogger.bio}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default function BloggersPage() {
  return (
    <Suspense fallback={<Loading />}>
      <BloggersPageContent />
    </Suspense>
  )
}
