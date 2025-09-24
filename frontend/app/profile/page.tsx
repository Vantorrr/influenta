'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Mail, Phone, Globe, Instagram, MessageCircle, Edit, Save, X, Camera, Shield, Star, TrendingUp, DollarSign, Calendar } from 'lucide-react'
import { Layout } from '@/components/layout/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/useAuth'
import { formatPrice, formatNumber, getCategoryLabel } from '@/lib/utils'

export default function ProfilePage() {
  const { user, isLoading } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<'blogger' | 'advertiser'>('blogger')
  
  const effectiveUser = user || {
    id: 'temp-user-1',
    telegramId: '123456',
    firstName: 'Тест',
    lastName: 'Пользователь',
    username: 'testuser',
    photoUrl: null,
    email: 'test@example.com',
    isVerified: false,
    role: 'blogger' as const,
  }
  
  const [bloggerProfile, setBloggerProfile] = useState({
    bio: '',
    categories: [] as string[],
    subscribersCount: 0,
    averageViews: 0,
    engagementRate: 0,
    pricePerPost: 0,
    pricePerStory: 0,
    contacts: {
      telegram: effectiveUser?.username ? `@${effectiveUser.username}` : '',
      instagram: '',
      email: effectiveUser?.email || '',
      phone: '',
    },
    isVerified: effectiveUser?.isVerified || false,
    rating: 0,
    completedCampaigns: 0,
    totalEarnings: 0,
  })

  const [advertiserProfile, setAdvertiserProfile] = useState({
    companyName: '',
    description: '',
    website: '',
    contacts: {
      telegram: effectiveUser?.username ? `@${effectiveUser.username}` : '',
      email: effectiveUser?.email || '',
      phone: '',
    },
    isVerified: effectiveUser?.isVerified || false,
    rating: 0,
    completedCampaigns: 0,
    totalSpent: 0,
  })

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-telegram-primary mx-auto mb-4"></div>
        <p className="text-telegram-textSecondary">Загрузка профиля...</p>
      </div>
    </div>
  }

  return (
    <Layout>
      <div className="container py-6 max-w-4xl">
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar
                  src={effectiveUser?.photoUrl}
                  firstName={effectiveUser?.firstName || 'Имя'}
                  lastName={effectiveUser?.lastName || 'Фамилия'}
                  size="xl"
                />
                <div>
                  <h1 className="text-2xl font-bold">
                    {effectiveUser?.firstName} {effectiveUser?.lastName}
                  </h1>
                  <p className="text-telegram-textSecondary">
                    @{effectiveUser?.username || 'username'}
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit className="w-4 h-4 mr-1" />
                Редактировать
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <h2 className="text-xl">Профиль работает!</h2>
          <p className="text-telegram-textSecondary mt-2">
            Авторизация через Telegram временно отключена для отладки
          </p>
        </div>
      </div>
    </Layout>
  )
}