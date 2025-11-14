'use client'

import { useState, useEffect, useLayoutEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { getCategoryLabel } from '@/lib/utils'
import { VerificationTooltip } from '@/components/VerificationTooltip'
import { bloggersApi } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { Layout } from '@/components/layout/Layout'

function BloggersPageContent() {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    categories: [],
    verifiedOnly: false,
    platform: undefined as string | undefined
  })
  const router = useRouter()
  const { user } = useAuth()

  // Load bloggers using React Query
  const { data, isLoading } = useQuery({
    queryKey: ['bloggers', filters, search],
    queryFn: () => bloggersApi.search({ ...filters, search }, 1, 500),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!user,
  })

  const bloggers = data?.data || []

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


  return (
    <Layout>
      <div className="container py-4 space-y-4">
        {/* Search Bar */}
        <div className="flex gap-2">
          <Input
            type="search"
            placeholder="Поиск блогеров..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="w-4 h-4" />}
            className="flex-1"
          />
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-telegram-textSecondary">
            Найдено блогеров: {data?.total || bloggers.length}
          </p>
        </div>

        {/* Bloggers List */}
        <div className="space-y-3">
          {bloggers.map((blogger, index) => (
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
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <h3 className="font-semibold flex items-center gap-1">
                              {blogger.user?.firstName} {blogger.user?.lastName}
                              {blogger.user?.isVerified && <VerificationTooltip />}
                            </h3>
                            <p className="text-sm text-telegram-textSecondary">
                              {blogger.categories && blogger.categories.length > 0 
                                ? getCategoryLabel(blogger.categories[0])
                                : 'Блогер'}
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-telegram-textSecondary flex-shrink-0" />
                        </div>
                        
                        <p className="text-sm text-telegram-textSecondary mb-3 line-clamp-2">
                          {blogger.bio}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          {blogger.categories.slice(0, 3).map(category => (
                            <Badge key={category} variant="default">
                              {getCategoryLabel(category)}
                            </Badge>
                          ))}
                          {blogger.categories.length > 3 && (
                            <Badge variant="default">
                              +{blogger.categories.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Layout>
  )
}

export default function BloggersPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BloggersPageContent />
    </Suspense>
  )
}
