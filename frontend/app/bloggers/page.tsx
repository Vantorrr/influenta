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

  // Disable Next.js automatic scroll restoration
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return
    
    // Disable browser and Next.js scroll restoration
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
    
    // Reset flag on mount
    ;(window as any).__bloggersScrollRestored = false
  }, [])

  // Save scroll position before navigation
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const saveScroll = () => {
      const scrollPosition = window.scrollY || document.documentElement.scrollTop || 0
      if (scrollPosition > 0) {
        console.log('💾 Saving scroll position:', scrollPosition)
        sessionStorage.setItem('bloggers-exact-scroll', scrollPosition.toString())
      }
    }
    
    // Save on before unload
    window.addEventListener('beforeunload', saveScroll)
    
    return () => {
      window.removeEventListener('beforeunload', saveScroll)
    }
  }, [])

  // Restore scroll position - aggressive approach
  useLayoutEffect(() => {
    if (typeof window === 'undefined' || isLoading) return

    const exactScrollPos = sessionStorage.getItem('bloggers-exact-scroll')
    if (!exactScrollPos) return

    const scrollPos = parseInt(exactScrollPos, 10)
    if (isNaN(scrollPos) || scrollPos < 0) return

    // Check if already restored
    if ((window as any).__bloggersScrollRestored) return

    console.log('📜 Attempting to restore scroll:', scrollPos)

    const restoreScroll = () => {
      // Check if content is rendered
      const bloggerCards = document.querySelectorAll('[id^="blogger-"]')
      const hasContent = bloggerCards.length > 0 || bloggers.length > 0
      
      if (!hasContent) {
        console.log('⏳ Content not ready yet, bloggers:', bloggers.length, 'cards:', bloggerCards.length)
        return false
      }

      // Restore scroll position
      console.log('✅ Restoring scroll to:', scrollPos)
      ;(window as any).__bloggersScrollRestored = true
      
      // Use multiple methods to ensure scroll happens
      window.scrollTo(0, scrollPos)
      document.documentElement.scrollTop = scrollPos
      document.body.scrollTop = scrollPos
      
      // Also use requestAnimationFrame for next frame
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPos)
        document.documentElement.scrollTop = scrollPos
      })
      
      // Remove from storage after successful restore
      setTimeout(() => {
        sessionStorage.removeItem('bloggers-exact-scroll')
      }, 1000)
      
      return true
    }

    // Try immediately
    if (restoreScroll()) return

    // Retry with delays
    const timeouts: NodeJS.Timeout[] = []
    
    // Try after a short delay
    timeouts.push(setTimeout(() => {
      if (restoreScroll()) {
        timeouts.forEach(clearTimeout)
      }
    }, 50))

    // Try after content might be rendered
    timeouts.push(setTimeout(() => {
      if (restoreScroll()) {
        timeouts.forEach(clearTimeout)
      }
    }, 150))

    // Try after React Query finishes
    timeouts.push(setTimeout(() => {
      if (restoreScroll()) {
        timeouts.forEach(clearTimeout)
      }
    }, 300))

    // Final attempt
    timeouts.push(setTimeout(() => {
      restoreScroll()
      timeouts.forEach(clearTimeout)
    }, 500))

    return () => {
      timeouts.forEach(clearTimeout)
    }
  }, [isLoading, bloggers.length])

  // Also restore on popstate (back button)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handlePopState = () => {
      // Reset flag when navigating back
      ;(window as any).__bloggersScrollRestored = false
      
      // Small delay to let page render
      setTimeout(() => {
        const exactScrollPos = sessionStorage.getItem('bloggers-exact-scroll')
        if (exactScrollPos) {
          const scrollPos = parseInt(exactScrollPos, 10)
          if (!isNaN(scrollPos) && scrollPos >= 0) {
            console.log('🔙 Restoring scroll on back navigation:', scrollPos)
            requestAnimationFrame(() => {
              window.scrollTo(0, scrollPos)
              document.documentElement.scrollTop = scrollPos
            })
          }
        }
      }, 100)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])


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
                        
                        {blogger.categories && blogger.categories.length > 0 && (
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
