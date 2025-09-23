'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  User,
  Users,
  Mail,
  Phone,
  Globe,
  Instagram,
  MessageCircle,
  Edit,
  Save,
  X,
  Camera,
  Shield,
  Star,
  TrendingUp,
  DollarSign,
  Calendar
} from 'lucide-react'
import { Layout } from '@/components/layout/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/useAuth'
import { formatPrice, formatNumber, formatDate, getCategoryLabel } from '@/lib/utils'
import { BloggerCategory } from '@/types'

export default function ProfilePage() {
  const { user, isLoading } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<'blogger' | 'advertiser'>('blogger')
  
  // Реальные данные профиля - пустые для нового пользователя
  const [bloggerProfile, setBloggerProfile] = useState({
    bio: '',
    categories: [],
    subscribersCount: 0,
    averageViews: 0,
    engagementRate: 0,
    pricePerPost: 0,
    pricePerStory: 0,
    contacts: {
      telegram: user?.username ? `@${user.username}` : '',
      instagram: '',
      email: user?.email || '',
      phone: '',
    },
    isVerified: user?.isVerified || false,
    rating: 0,
    completedCampaigns: 0,
    totalEarnings: 0,
  })

  const [advertiserProfile, setAdvertiserProfile] = useState({
    companyName: '',
    description: '',
    website: '',
    contacts: {
      telegram: user?.username ? `@${user.username}` : '',
      email: user?.email || '',
      phone: '',
    },
    isVerified: user?.isVerified || false,
    rating: 0,
    completedCampaigns: 0,
    totalSpent: 0,
  })

  // Загружаем и обновляем профили когда меняется user
  useEffect(() => {
    if (user) {
      // Загружаем сохраненный профиль блогера
      const savedBloggerProfile = localStorage.getItem(`influenta_blogger_profile_${user.id}`)
      if (savedBloggerProfile) {
        setBloggerProfile(JSON.parse(savedBloggerProfile))
      } else {
        setBloggerProfile(prev => ({
          ...prev,
          contacts: {
            ...prev.contacts,
            telegram: user.username ? `@${user.username}` : '',
            email: user.email || '',
          },
          isVerified: user.isVerified,
        }))
      }
      
      // Загружаем сохраненный профиль рекламодателя
      const savedAdvertiserProfile = localStorage.getItem(`influenta_advertiser_profile_${user.id}`)
      if (savedAdvertiserProfile) {
        setAdvertiserProfile(JSON.parse(savedAdvertiserProfile))
      } else {
        setAdvertiserProfile(prev => ({
          ...prev,
          contacts: {
            ...prev.contacts,
            telegram: user.username ? `@${user.username}` : '',
            email: user.email || '',
          },
          isVerified: user.isVerified,
        }))
      }
    }
  }, [user])

  const stats = activeTab === 'blogger' ? [
    {
      label: 'Подписчиков',
      value: formatNumber(bloggerProfile.subscribersCount),
      icon: Users,
      color: 'text-blue-500',
    },
    {
      label: 'Ср. просмотры',
      value: formatNumber(bloggerProfile.averageViews),
      icon: TrendingUp,
      color: 'text-green-500',
    },
    {
      label: 'Engagement',
      value: `${bloggerProfile.engagementRate}%`,
      icon: Star,
      color: 'text-yellow-500',
    },
    {
      label: 'Заработано',
      value: formatPrice(bloggerProfile.totalEarnings),
      icon: DollarSign,
      color: 'text-purple-500',
    },
  ] : [
    {
      label: 'Кампаний',
      value: advertiserProfile.completedCampaigns,
      icon: Calendar,
      color: 'text-blue-500',
    },
    {
      label: 'Потрачено',
      value: formatPrice(advertiserProfile.totalSpent),
      icon: DollarSign,
      color: 'text-green-500',
    },
    {
      label: 'Рейтинг',
      value: advertiserProfile.rating,
      icon: Star,
      color: 'text-yellow-500',
    },
    {
      label: 'Статус',
      value: 'Активен',
      icon: Shield,
      color: 'text-purple-500',
    },
  ]

  const handleSave = async () => {
    try {
      const payload = {
        firstName: user?.firstName,
        lastName: user?.lastName,
        username: user?.username,
        photoUrl: user?.photoUrl || undefined,
        email: user?.email || undefined,
      }
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('influenta_token')}`,
        },
        body: JSON.stringify(payload),
      })
      setIsEditing(false)
    } catch (e) {
      console.error(e)
      setIsEditing(false)
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-telegram-primary mx-auto mb-4"></div>
        <p className="text-telegram-textSecondary">Загрузка профиля...</p>
      </div>
    </div>
  }

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-telegram-textSecondary">Необходимо войти в приложение</p>
      </div>
    </div>
  }

  return (
    <Layout>
      <div className="container py-6 max-w-4xl">
        {/* Профиль Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar
                    src={user?.photoUrl}
                    firstName={user?.firstName || 'Имя'}
                    lastName={user?.lastName || 'Фамилия'}
                    size="xl"
                  />
                  {isEditing && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="absolute bottom-0 right-0 p-2 bg-telegram-primary rounded-full text-white"
                    >
                      <Camera className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
                
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-2">
                    {user?.firstName} {user?.lastName}
                    {(activeTab === 'blogger' ? bloggerProfile.isVerified : advertiserProfile.isVerified) && (
                      <Shield className="w-5 h-5 text-telegram-primary" />
                    )}
                  </h1>
                  <p className="text-telegram-textSecondary">
                    @{user?.username || 'username'}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="primary">
                      {activeTab === 'blogger' ? 'Блогер' : 'Рекламодатель'}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium">
                        {activeTab === 'blogger' ? bloggerProfile.rating : advertiserProfile.rating}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSave}
                    >
                      <Save className="w-4 h-4 mr-1" />
                      Сохранить
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsEditing(false)}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Отмена
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Редактировать
                  </Button>
                )}
              </div>
            </div>
            
            {/* Статистика */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <stat.icon className={`w-8 h-8 mx-auto mb-2 ${stat.color}`} />
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-telegram-textSecondary">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Табы */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'blogger' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('blogger')}
          >
            Профиль блогера
          </Button>
          <Button
            variant={activeTab === 'advertiser' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('advertiser')}
          >
            Профиль рекламодателя
          </Button>
        </div>

        {/* Контент в зависимости от таба */}
        {activeTab === 'blogger' ? (
          <>
            {/* О блогере */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>О блогере</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <textarea
                    value={bloggerProfile.bio}
                    onChange={(e) => setBloggerProfile(prev => ({ ...prev, bio: e.target.value }))}
                    className="input min-h-[100px] resize-none"
                  />
                ) : (
                  <p>{bloggerProfile.bio}</p>
                )}
              </CardContent>
            </Card>

            {/* Категории */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Категории</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {bloggerProfile.categories.map((category) => (
                    <Badge key={category} variant="default">
                      {getCategoryLabel(category)}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Цены */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Стоимость размещения</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Цена за пост</label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={bloggerProfile.pricePerPost}
                        onChange={(e) => setBloggerProfile(prev => ({ 
                          ...prev, 
                          pricePerPost: parseInt(e.target.value) 
                        }))}
                      />
                    ) : (
                      <p className="text-xl font-semibold">
                        {formatPrice(bloggerProfile.pricePerPost)}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="label">Цена за сторис</label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={bloggerProfile.pricePerStory}
                        onChange={(e) => setBloggerProfile(prev => ({ 
                          ...prev, 
                          pricePerStory: parseInt(e.target.value) 
                        }))}
                      />
                    ) : (
                      <p className="text-xl font-semibold">
                        {formatPrice(bloggerProfile.pricePerStory)}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* О компании */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>О компании</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="label">Название компании</label>
                  {isEditing ? (
                    <Input
                      value={advertiserProfile.companyName}
                      onChange={(e) => setAdvertiserProfile(prev => ({ 
                        ...prev, 
                        companyName: e.target.value 
                      }))}
                    />
                  ) : (
                    <p className="text-lg">{advertiserProfile.companyName}</p>
                  )}
                </div>
                
                <div>
                  <label className="label">Описание</label>
                  {isEditing ? (
                    <textarea
                      value={advertiserProfile.description}
                      onChange={(e) => setAdvertiserProfile(prev => ({ 
                        ...prev, 
                        description: e.target.value 
                      }))}
                      className="input min-h-[100px] resize-none"
                    />
                  ) : (
                    <p>{advertiserProfile.description}</p>
                  )}
                </div>
                
                <div>
                  <label className="label">Сайт</label>
                  {isEditing ? (
                    <Input
                      value={advertiserProfile.website}
                      onChange={(e) => setAdvertiserProfile(prev => ({ 
                        ...prev, 
                        website: e.target.value 
                      }))}
                    />
                  ) : (
                    <a 
                      href={advertiserProfile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-telegram-primary hover:underline flex items-center gap-1"
                    >
                      <Globe className="w-4 h-4" />
                      {advertiserProfile.website}
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Контакты */}
        <Card>
          <CardHeader>
            <CardTitle>Контактная информация</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-telegram-textSecondary" />
                <div>
                  <p className="text-sm text-telegram-textSecondary">Telegram</p>
                  <p>{activeTab === 'blogger' ? bloggerProfile.contacts.telegram : advertiserProfile.contacts.telegram}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-telegram-textSecondary" />
                <div>
                  <p className="text-sm text-telegram-textSecondary">Email</p>
                  <p>{activeTab === 'blogger' ? bloggerProfile.contacts.email : advertiserProfile.contacts.email}</p>
                </div>
              </div>
              
              {activeTab === 'blogger' && bloggerProfile.contacts.instagram && (
                <div className="flex items-center gap-3">
                  <Instagram className="w-5 h-5 text-telegram-textSecondary" />
                  <div>
                    <p className="text-sm text-telegram-textSecondary">Instagram</p>
                    <p>{bloggerProfile.contacts.instagram}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-telegram-textSecondary" />
                <div>
                  <p className="text-sm text-telegram-textSecondary">Телефон</p>
                  <p>{activeTab === 'blogger' ? bloggerProfile.contacts.phone : advertiserProfile.contacts.phone}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}

