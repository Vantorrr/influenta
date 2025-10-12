'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Briefcase, 
  Camera, 
  Target, 
  DollarSign, 
  Building,
  Link as LinkIcon,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  UploadCloud,
  X
} from 'lucide-react'
import { CATEGORY_LABELS } from '@/lib/constants'
import { authApi, analyticsApi } from '@/lib/api'
import { UserRole } from '@/types'

// Branded minimal icons (no external deps)
const TelegramIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <path fill="currentColor" d="M21.94 2.34a1.2 1.2 0 0 0-1.27-.17L2.72 10.45c-1.16.56-1.14 2.24.03 2.76l4.7 2.1c.5.22 1.08.17 1.54-.14l8.37-5.82c.15-.11.32.1.2.24l-6.2 6.87c-.38.42-.33 1.08.1 1.44l3.5 2.98c.53.45 1.35.22 1.6-.44l6.23-16.64c.22-.6-.05-1.27-.58-1.5Z"/>
  </svg>
)
const InstagramIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <rect x="3" y="3" width="18" height="18" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" strokeWidth="2"/>
    <circle cx="17.5" cy="6.5" r="1.3" fill="currentColor"/>
  </svg>
)
const YouTubeIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <rect x="2.5" y="6" width="19" height="12" rx="3" fill="currentColor" opacity=".2"/>
    <path fill="currentColor" d="M10 9.5v5l5-2.5-5-2.5Z"/>
    <rect x="2.5" y="6" width="19" height="12" rx="3" fill="none" stroke="currentColor" strokeWidth="2"/>
  </svg>
)
const TikTokIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <path fill="currentColor" d="M14 3v7.2a4.8 4.8 0 1 1-3.7-1.77V11a2.2 2.2 0 1 0 2.2 2.2V3h1.5c.6 2 1.9 3.3 4.1 3.5V9c-1.8-.2-3.2-.8-4.1-1.7V21h-1.5v-3.1A4.7 4.7 0 1 1 14 8.7V3Z"/>
  </svg>
)
const VkIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <path fill="currentColor" d="M3 7c0-1.1.9-2 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Zm3.7 1.9h1.8c.1 2.4 1.2 3.7 3.2 3.9v-3.9h1.7c.1 1.3.7 2.2 2.2 2.4v1.6c-1.1.1-2-.3-2.5-1.1-.4.8-1.3 1.4-2.6 1.5v2.1H9.2v-2.1c-2.1-.3-3.4-1.8-3.5-4.3Z"/>
  </svg>
)

interface StepData {
  role?: 'blogger' | 'advertiser'
  // Blogger fields
  bio?: string
  categories?: string[]
  // Охваты
  subscribersCount?: string // отформатированное значение, например 15.000.000
  useRange?: boolean
  subscribersMin?: string
  subscribersMax?: string
  proofScreens?: File[]
  pricePerPost?: string
  pricePerStory?: string
  socialPlatforms?: Array<{
    id: string
    name: string
    pricePost: string
    priceStory: string
    priceReel: string
  }>
  // Advertiser fields
  companyName?: string
  description?: string
  website?: string
}

function OnboardingInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState<StepData>({
    role: searchParams.get('role') as 'blogger' | 'advertiser' || undefined,
  })

  // Хард-редирект: если онбординг уже пройден — сразу уходим из этой страницы
  useEffect(() => {
    const localCompleted = localStorage.getItem('onboarding_completed') === 'true'
    const savedUserRaw = localStorage.getItem('influenta_user')
    const savedUser = savedUserRaw ? JSON.parse(savedUserRaw) : null
    const serverCompleted = !!savedUser?.onboardingCompleted
    if (localCompleted || serverCompleted) {
      router.replace('/dashboard')
      return
    }
    
    // Проверяем наличие токена сразу при загрузке
    const token = localStorage.getItem('influenta_token')
    if (!token) {
      console.error('No token found on onboarding page load')
      // Даем время на авторизацию
      setTimeout(() => {
        const retryToken = localStorage.getItem('influenta_token')
        if (!retryToken) {
          alert('Ошибка авторизации. Пожалуйста, перезапустите приложение.')
          router.push('/')
        }
      }, 2000)
    }
  }, [])

  const categories = [
    'lifestyle', 'tech', 'beauty', 'fashion', 'food', 
    'travel', 'fitness', 'gaming', 'education', 'business',
    'entertainment', 'other'
  ]

  const bloggerSteps = [
    {
      title: 'О блоге',
      description: 'Расскажите о своём блоге',
      icon: Camera,
    },
    {
      title: 'Тематика',
      description: 'Выберите направления контента',
      icon: Target,
    },
    {
      title: 'Аудитория',
      description: 'Укажите количество подписчиков',
      icon: Users,
    },
    {
      title: 'Стоимость',
      description: 'Установите цены на рекламу',
      icon: DollarSign,
    },
  ]

  const advertiserSteps = [
    {
      title: 'О компании',
      description: 'Как называется ваша компания?',
      icon: Building,
    },
    {
      title: 'Описание',
      description: 'Расскажите, чем вы занимаетесь',
      icon: Target,
    },
    {
      title: 'Сайт',
      description: 'Укажите ссылку на ваш сайт',
      icon: LinkIcon,
    },
  ]

  const steps = data.role === 'blogger' ? bloggerSteps : advertiserSteps
  const totalSteps = steps.length

  const isStepValid = (): boolean => {
    if (!data.role) return false
    
    if (data.role === 'blogger') {
      switch (currentStep) {
        case 0: // О блоге
          return !!data.bio && data.bio.length >= 10
        case 1: // Тематика
          return !!data.categories && data.categories.length > 0
        case 2: // Аудитория
          if (data.useRange) {
            return !!data.subscribersMin && !!data.subscribersMax
          }
          return !!data.subscribersCount
        case 3: // Стоимость
          // Проверяем что выбрана хотя бы одна платформа и указана хотя бы одна цена
          if (!data.socialPlatforms || data.socialPlatforms.length === 0) {
            return false
          }
          // Проверяем что для каждой платформы указана хотя бы одна цена
          return data.socialPlatforms.every(platform => 
            platform.pricePost || platform.priceStory || platform.priceReel
          )
        default:
          return true
      }
    }
    
    if (data.role === 'advertiser') {
      switch (currentStep) {
        case 0: // Название компании
          return !!data.companyName && data.companyName.length >= 2
        case 1: // Описание
          return !!data.description && data.description.length >= 10
        case 2: // Сайт (необязательно)
          return true // Сайт необязателен
        default:
          return true
      }
    }
    
    return false
  }

  const handleNext = () => {
    if (!isStepValid()) {
      return // Не переходим дальше если шаг не валиден
    }
    
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    } else {
      router.push('/')
    }
  }

  const handleComplete = async () => {
    console.log('Onboarding complete:', data)
    
    try {
      // Подготавливаем данные для сохранения
      const profileData: any = {
        // Для блогера роль по умолчанию уже blogger на сервере, лишний раз не шлём
        // Для рекламодателя — явно выставляем роль
        ...(data.role === 'advertiser' ? { role: UserRole.ADVERTISER } : {}),
        onboardingCompleted: true,
      }

      // Добавляем данные для блогеров
      if (data.role === 'blogger') {
        profileData.bio = data.bio || ''
        if (data.categories && data.categories.length > 0) {
          profileData.categories = data.categories.join(',')
        }
        
        // Обрабатываем подписчиков (оставляем только цифры)
        if (data.subscribersCount) {
          const digits = data.subscribersCount.toString().replace(/[^0-9]/g, '')
          if (digits) profileData.subscribersCount = parseInt(digits, 10)
        }
        
        // Обрабатываем цены только если есть выбранные платформы
        if (data.socialPlatforms && data.socialPlatforms.length > 0) {
          const firstPlatform = data.socialPlatforms[0]
          if (firstPlatform.pricePost) {
            const digits = firstPlatform.pricePost.toString().replace(/[^0-9]/g, '')
            if (digits) profileData.pricePerPost = parseInt(digits, 10)
          }
          if (firstPlatform.priceStory) {
            const digits = firstPlatform.priceStory.toString().replace(/[^0-9]/g, '')
            if (digits) profileData.pricePerStory = parseInt(digits, 10)
          }
        }
      }

      // Добавляем данные для рекламодателей  
      if (data.role === 'advertiser') {
        profileData.companyName = data.companyName || ''
        profileData.description = data.description || ''
        if (data.website) {
          profileData.website = data.website
        }
      }

      // Удаляем undefined/NaN значения, чтобы не падать на валидации
      Object.keys(profileData).forEach((k) => {
        const v = (profileData as any)[k]
        if (v === undefined || (typeof v === 'number' && Number.isNaN(v))) {
          delete (profileData as any)[k]
        }
      })
      console.log('Saving profile data:', profileData)
      
      // Проверяем наличие токена
      const token = localStorage.getItem('influenta_token')
      const user = localStorage.getItem('influenta_user')
      console.log('Token check:', {
        hasToken: !!token,
        tokenLength: token?.length,
        hasUser: !!user,
        allKeys: Object.keys(localStorage),
        tokenValue: token?.substring(0, 20) + '...'
      })
      
      if (!token) {
        // Пытаемся получить токен из Telegram WebApp и переавторизоваться
        if (window.Telegram?.WebApp?.initData) {
          console.log('Attempting to re-authenticate...')
          try {
            const authResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/telegram`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'X-Telegram-Init-Data': window.Telegram.WebApp.initData
              },
              body: JSON.stringify({ 
                initData: window.Telegram.WebApp.initData,
                user: window.Telegram.WebApp.initDataUnsafe?.user 
              }),
            })
            
            if (authResponse.ok) {
              const authData = await authResponse.json()
              if (authData?.token) {
                localStorage.setItem('influenta_token', authData.token)
                localStorage.setItem('influenta_user', JSON.stringify(authData.user))
                console.log('Re-authenticated successfully')
              }
            }
          } catch (e) {
            console.error('Re-authentication failed:', e)
          }
        }
        
        // Проверяем еще раз
        const retryToken = localStorage.getItem('influenta_token')
        if (!retryToken) {
          throw new Error('Токен авторизации не найден. Пожалуйста, перезапустите приложение.')
        }
      }
      
      // Сохраняем через API
      const response = await authApi.updateProfile(profileData)
      console.log('Profile saved:', response)
      
      // Подтягиваем свежий профиль с сервера
      try {
        const me = await authApi.getCurrentUser()
        const userData = (me as any)?.user || me
        if (userData?.id) {
          localStorage.setItem('influenta_user', JSON.stringify(userData))
          localStorage.setItem('onboarding_completed', 'true')
        } else {
          // fallback: обновим частично
          const currentUser = JSON.parse(localStorage.getItem('influenta_user') || '{}')
          const updatedUser = { ...currentUser, ...profileData }
          localStorage.setItem('influenta_user', JSON.stringify(updatedUser))
          localStorage.setItem('onboarding_completed', 'true')
        }
      } catch (e) {
        console.warn('Failed to fetch /auth/me after onboarding, fallback to local merge')
        const currentUser = JSON.parse(localStorage.getItem('influenta_user') || '{}')
        const updatedUser = { ...currentUser, ...profileData }
        localStorage.setItem('influenta_user', JSON.stringify(updatedUser))
        localStorage.setItem('onboarding_completed', 'true')
      }
      
      // Переходим в профиль
      try { analyticsApi.track('onboarding_complete') } catch {}
      router.push('/profile')
      
    } catch (error: any) {
      console.error('Error saving profile:', error)
      const msg = error?.response?.data?.message || error?.message || 'Неизвестная ошибка'
      alert(`Ошибка сохранения профиля: ${msg}`)
      return
    }
  }

  const updateData = (field: keyof StepData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }))
  }

  const renderStepContent = () => {
    if (!data.role) {
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-center mb-8">
            Кто вы?
          </h2>
          
          <div className="grid gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setData({ role: 'blogger' })
                setCurrentStep(0)
              }}
              className="card p-6 border-2 hover:border-telegram-primary transition-colors"
            >
              <Users className="w-12 h-12 text-telegram-primary mb-4 mx-auto" />
              <h3 className="text-xl font-semibold mb-2">Я блогер</h3>
              <p className="text-telegram-textSecondary">
                Хочу находить рекламодателей и зарабатывать на рекламе
              </p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setData({ role: 'advertiser' })
                setCurrentStep(0)
              }}
              className="card p-6 border-2 hover:border-telegram-accent transition-colors"
            >
              <Briefcase className="w-12 h-12 text-telegram-accent mb-4 mx-auto" />
              <h3 className="text-xl font-semibold mb-2">Я рекламодатель</h3>
              <p className="text-telegram-textSecondary">
                Хочу размещать рекламу у блогеров
              </p>
            </motion.button>
          </div>
        </div>
      )
    }

    if (data.role === 'blogger') {
      switch (currentStep) {
        case 0:
          return (
            <div className="space-y-6">
              <label className="label">О вашем блоге</label>
              <textarea
                value={data.bio || ''}
                onChange={(e) => updateData('bio', e.target.value)}
                placeholder="Например: Рассказываю о путешествиях и делюсь лайфхаками..."
                className="input min-h-[120px] resize-none"
                maxLength={500}
              />
              <p className="text-sm text-telegram-textSecondary">
                {data.bio?.length || 0} / 500 символов
              </p>
            </div>
          )
        
        case 1:
          return (
            <div className="space-y-6">
              <div>
                <label className="label">Выберите тематики</label>
                <p className="text-sm text-telegram-textSecondary mt-1">
                  Максимум 2 тематики
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {categories.map((category) => {
                  const current = data.categories || []
                  const isSelected = current.includes(category)
                  const isDisabled = !isSelected && current.length >= 2
                  
                  return (
                    <motion.button
                      key={category}
                      whileHover={!isDisabled ? { scale: 1.05 } : {}}
                      whileTap={!isDisabled ? { scale: 0.95 } : {}}
                      onClick={() => {
                        if (isDisabled) return
                        
                        if (isSelected) {
                          updateData('categories', current.filter(c => c !== category))
                        } else if (current.length < 2) {
                          updateData('categories', [...current, category])
                        }
                      }}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-telegram-primary bg-telegram-primary/20'
                          : isDisabled
                          ? 'border-gray-700 bg-gray-800/50 opacity-50 cursor-not-allowed'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      {CATEGORY_LABELS[category] || category}
                    </motion.button>
                  )
                })}
              </div>
              {data.categories && data.categories.length > 0 && (
                <p className="text-sm text-telegram-primary text-center">
                  Выбрано: {data.categories.length} из 2
                </p>
              )}
            </div>
          )
        
        case 2:
          const formatWithDots = (value: string) => {
            // Удаляем всё кроме цифр
            const digits = value.replace(/\D/g, '')
            if (!digits) return ''
            
            // Добавляем точки каждые 3 цифры справа налево
            let result = ''
            for (let i = digits.length - 1, count = 0; i >= 0; i--, count++) {
              if (count === 3) {
                result = '.' + result
                count = 0
              }
              result = digits[i] + result
            }
            return result
          }
          
          return (
            <div className="space-y-6">
              <label className="label">Количество подписчиков</label>

              {/* Переключатель диапазона */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!data.useRange}
                  onChange={(e) => updateData('useRange', e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-telegram-text">Указать диапазон</span>
              </label>

              {!data.useRange ? (
                <input
                  type="text"
                  inputMode="numeric"
                  value={data.subscribersCount || ''}
                  onChange={(e) => {
                    const formatted = formatWithDots(e.target.value)
                    updateData('subscribersCount', formatted)
                  }}
                  placeholder="Например: 15.000.000"
                  className="input"
                />
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-telegram-textSecondary block mb-1">От</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={data.subscribersMin || ''}
                      onChange={(e) => {
                        const formatted = formatWithDots(e.target.value)
                        updateData('subscribersMin', formatted)
                      }}
                      placeholder="100.000"
                      className="input"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-telegram-textSecondary block mb-1">До</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={data.subscribersMax || ''}
                      onChange={(e) => {
                        const formatted = formatWithDots(e.target.value)
                        updateData('subscribersMax', formatted)
                      }}
                      placeholder="1.000.000"
                      className="input"
                    />
                  </div>
                </div>
              )}

              <p className="text-sm text-telegram-textSecondary">
                Укажите примерный охват. Форматируется автоматически: 15.000.000.
              </p>

              {/* Скриншоты‑доказательства */}
              <div className="space-y-3 mt-6">
                <label className="label">Скриншоты статистики (пруфы)</label>
                
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = e.target.files ? Array.from(e.target.files) : []
                      updateData('proofScreens', [...(data.proofScreens || []), ...files])
                    }}
                    className="hidden"
                    id="proof-upload"
                  />
                  <label
                    htmlFor="proof-upload"
                    className="border-2 border-dashed border-telegram-border rounded-xl p-6 block text-center cursor-pointer hover:border-telegram-primary transition-colors"
                  >
                    <UploadCloud className="w-10 h-10 text-telegram-textSecondary mx-auto mb-3" />
                    <p className="text-telegram-text font-medium mb-1">
                      Нажмите или перетащите файлы
                    </p>
                    <p className="text-sm text-telegram-textSecondary">
                      PNG, JPG до 10MB
                    </p>
                  </label>
                </div>

                {data.proofScreens && data.proofScreens.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {data.proofScreens.map((file, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`proof-${i}`}
                          className="w-full h-24 rounded-lg object-cover border border-telegram-border"
                        />
                        <button
                          onClick={() => {
                            const newFiles = data.proofScreens?.filter((_, index) => index !== i)
                            updateData('proofScreens', newFiles)
                          }}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <p className="text-sm text-telegram-textSecondary">
                  Прикрепите скриншоты из Telegram Analytics или других источников
                </p>
              </div>
            </div>
          )
        
        case 3:
          const socialPlatforms = [
            { id: 'telegram', name: 'Telegram', icon: <TelegramIcon className="w-5 h-5" /> },
            { id: 'instagram', name: 'Instagram', icon: <InstagramIcon className="w-5 h-5" /> },
            { id: 'youtube', name: 'YouTube', icon: <YouTubeIcon className="w-5 h-5" /> },
            { id: 'tiktok', name: 'TikTok', icon: <TikTokIcon className="w-5 h-5" /> },
            { id: 'vk', name: 'VKontakte', icon: <VkIcon className="w-5 h-5" /> },
          ]
          
          const selectedPlatforms = data.socialPlatforms || []
          
          return (
            <div className="space-y-6">
              <div>
                <label className="label mb-3">Выберите социальные сети</label>
                <div className="grid grid-cols-2 gap-3">
                  {socialPlatforms.map((platform) => {
                    const isSelected = selectedPlatforms.some(p => p.id === platform.id)
                    return (
                      <motion.button
                        key={platform.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          if (isSelected) {
                            updateData('socialPlatforms', selectedPlatforms.filter(p => p.id !== platform.id))
                          } else {
                            updateData('socialPlatforms', [...selectedPlatforms, {
                              id: platform.id,
                              name: platform.name,
                              pricePost: '',
                              priceStory: '',
                              priceReel: ''
                            }])
                          }
                        }}
                        className={`p-4 rounded-xl border-2 transition-all flex items-center gap-2 ${
                          isSelected
                            ? 'border-telegram-primary bg-telegram-primary/10'
                            : 'border-telegram-border hover:border-telegram-primary/50'
                        }`}
                      >
                        <div className="text-telegram-primary">{platform.icon}</div>
                        <div className="font-medium">{platform.name}</div>
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              {selectedPlatforms.length > 0 && (
                <div className="space-y-4">
                  <label className="label">Установите цены</label>
                  {selectedPlatforms.map((platform) => (
                    <div key={platform.id} className="card p-4 space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <span className="text-telegram-primary">
                          {socialPlatforms.find(p => p.id === platform.id)?.icon}
                        </span>
                        {platform.name}
                      </h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs text-telegram-textSecondary">Пост</label>
                          <input
                            type="number"
                            value={platform.pricePost}
                            onChange={(e) => {
                              const updated = selectedPlatforms.map(p => 
                                p.id === platform.id 
                                  ? { ...p, pricePost: e.target.value }
                                  : p
                              )
                              updateData('socialPlatforms', updated)
                            }}
                            placeholder="5000"
                            className="input mt-1"
                          />
                        </div>
                        
                        <div>
                          <label className="text-xs text-telegram-textSecondary">Сторис</label>
                          <input
                            type="number"
                            value={platform.priceStory}
                            onChange={(e) => {
                              const updated = selectedPlatforms.map(p => 
                                p.id === platform.id 
                                  ? { ...p, priceStory: e.target.value }
                                  : p
                              )
                              updateData('socialPlatforms', updated)
                            }}
                            placeholder="2000"
                            className="input mt-1"
                          />
                        </div>
                        
                        {(platform.id === 'instagram' || platform.id === 'tiktok' || platform.id === 'youtube') && (
                          <div>
                            <label className="text-xs text-telegram-textSecondary">
                              {platform.id === 'youtube' ? 'Shorts' : 'Reels'}
                            </label>
                            <input
                              type="number"
                              value={platform.priceReel}
                              onChange={(e) => {
                                const updated = selectedPlatforms.map(p => 
                                  p.id === platform.id 
                                    ? { ...p, priceReel: e.target.value }
                                    : p
                                )
                                updateData('socialPlatforms', updated)
                              }}
                              placeholder="3000"
                              className="input mt-1"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <p className="text-sm text-telegram-textSecondary text-center">
                Укажите цены в рублях. Вы сможете изменить их в любой момент.
              </p>
            </div>
          )
      }
    }

    if (data.role === 'advertiser') {
      switch (currentStep) {
        case 0:
          return (
            <div className="space-y-6">
              <label className="label">Название компании</label>
              <input
                type="text"
                value={data.companyName || ''}
                onChange={(e) => updateData('companyName', e.target.value)}
                placeholder="Например: ООО Ромашка"
                className="input"
              />
            </div>
          )
        
        case 1:
          return (
            <div className="space-y-6">
              <label className="label">Описание компании</label>
              <textarea
                value={data.description || ''}
                onChange={(e) => updateData('description', e.target.value)}
                placeholder="Расскажите, чем занимается ваша компания..."
                className="input min-h-[120px] resize-none"
                maxLength={500}
              />
              <p className="text-sm text-telegram-textSecondary">
                {data.description?.length || 0} / 500 символов
              </p>
            </div>
          )
        
        case 2:
          return (
            <div className="space-y-6">
              <label className="label">Сайт компании</label>
              <input
                type="url"
                value={data.website || ''}
                onChange={(e) => updateData('website', e.target.value)}
                placeholder="https://example.com"
                className="input"
              />
              <p className="text-sm text-telegram-textSecondary">
                Необязательное поле
              </p>
            </div>
          )
      }
    }
  }

  return (
    <div className="min-h-screen bg-telegram-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        {/* Progress bar */}
        {data.role && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm text-telegram-textSecondary">
                Шаг {currentStep + 1} из {totalSteps}
              </h3>
              <span className="text-sm text-telegram-textSecondary">
                {Math.round(((currentStep + 1) / totalSteps) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-telegram-bgSecondary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                transition={{ duration: 0.3 }}
                className="h-full bg-gradient-to-r from-telegram-primary to-telegram-accent"
              />
            </div>
          </div>
        )}

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="card p-6"
          >
            {data.role && steps[currentStep] && (
              <>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-telegram-primary to-telegram-accent flex items-center justify-center">
                    {React.createElement(steps[currentStep].icon, {
                      className: 'w-6 h-6 text-white',
                    })}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">
                      {steps[currentStep].title}
                    </h2>
                    <p className="text-sm text-telegram-textSecondary">
                      {steps[currentStep].description}
                    </p>
                  </div>
                </div>
              </>
            )}

            {renderStepContent()}

            {/* Navigation buttons */}
            <div className="flex gap-4 mt-8">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBack}
                className="btn-secondary flex-1 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Назад
              </motion.button>
              
              <motion.button
                whileHover={isStepValid() ? { scale: 1.05 } : {}}
                whileTap={isStepValid() ? { scale: 0.95 } : {}}
                onClick={handleNext}
                disabled={!isStepValid()}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentStep === totalSteps - 1 ? (
                  <>
                    Завершить
                    <CheckCircle className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Далее
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingInner />
    </Suspense>
  )
}


