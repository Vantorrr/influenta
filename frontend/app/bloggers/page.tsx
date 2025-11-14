'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
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
import { useScrollRestoration } from '@/hooks/useScrollRestoration'
import { Layout } from '@/components/layout/Layout'

function BloggersPageContent() {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    categories: [],
    verifiedOnly: false,
    platform: undefined as string | undefined
  })
  const { user } = useAuth()

  // Подключаем хук восстановления скролла
  useScrollRestoration()

  // Load bloggers using React Query
  const { data, isLoading } = useQuery({
    queryKey: ['bloggers', filters, search],
    queryFn: () => bloggersApi.search({ ...filters, search }, 1, 500),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!user,
  })

  const bloggers = data?.data || []


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
              <Link href={`/bloggers/${blogger.id}`} scroll={false}>
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
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </Layout>
  )
}

export default function BloggersPage() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="container py-4 flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-telegram-primary mx-auto mb-4"></div>
            <p className="text-telegram-textSecondary">Загрузка блогеров...</p>
          </div>
        </div>
      </Layout>
    }>
      <BloggersPageContent />
    </Suspense>
  )
}
