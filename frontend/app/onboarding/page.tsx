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
  ArrowRight
} from 'lucide-react'

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

  const categories = [
    'Lifestyle', 'Tech', 'Beauty', 'Fashion', 'Food', 
    'Travel', 'Fitness', 'Gaming', 'Education', 'Business',
    'Entertainment', 'Other'
  ]

  const bloggerSteps = [
    {
      title: 'Расскажите о себе',
      description: 'Напишите короткое описание вашего блога',
      icon: Camera,
    },
    {
      title: 'Выберите тематику',
      description: 'В каких нишах вы создаете контент?',
      icon: Target,
    },
    {
      title: 'Укажите охваты',
      description: 'Сколько у вас подписчиков?',
      icon: Users,
    },
    {
      title: 'Установите цены',
      description: 'Сколько стоит размещение у вас?',
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

  const handleNext = () => {
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
    // Здесь будет отправка данных на сервер
    const toRawNumber = (v?: string) => (v ? v.replace(/\./g, '') : undefined)

    const payload = {
      ...data,
      subscribersCount: data?.useRange ? undefined : toRawNumber(data?.subscribersCount),
      subscribersRange: data?.useRange
        ? {
            min: toRawNumber(data?.subscribersMin),
            max: toRawNumber(data?.subscribersMax),
          }
        : undefined,
      // proofScreens: data?.proofScreens // отправка файлов реализуется позже
    }

    console.log('Onboarding complete (sanitized):', payload)
    
    // Переход на главную страницу приложения
    router.push('/dashboard')
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
              <label className="label">Выберите тематики</label>
              <div className="grid grid-cols-2 gap-3">
                {categories.map((category) => (
                  <motion.button
                    key={category}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const current = data.categories || []
                      if (current.includes(category)) {
                        updateData('categories', current.filter(c => c !== category))
                      } else {
                        updateData('categories', [...current, category])
                      }
                    }}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      data.categories?.includes(category)
                        ? 'border-telegram-primary bg-telegram-primary/20'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    {category}
                  </motion.button>
                ))}
              </div>
            </div>
          )
        
        case 2:
          const formatWithDots = (value: string) => {
            const digits = value.replace(/\D/g, '')
            if (!digits) return ''
            return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
          }
          return (
            <div className="space-y-6">
              <label className="label">Количество подписчиков</label>

              {/* Переключатель диапазона */}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!data.useRange}
                  onChange={(e) => updateData('useRange', e.target.checked)}
                />
                Указать диапазон
              </label>

              {!data.useRange ? (
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9\.]*"
                  value={data.subscribersCount || ''}
                  onChange={(e) => updateData('subscribersCount', formatWithDots(e.target.value))}
                  placeholder="Например: 15.000.000"
                  className="input"
                />
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-telegram-textSecondary">От</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9\.]*"
                      value={data.subscribersMin || ''}
                      onChange={(e) => updateData('subscribersMin', formatWithDots(e.target.value))}
                      placeholder="Напр.: 100.000"
                      className="input"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-telegram-textSecondary">До</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9\.]*"
                      value={data.subscribersMax || ''}
                      onChange={(e) => updateData('subscribersMax', formatWithDots(e.target.value))}
                      placeholder="Напр.: 1.000.000"
                      className="input"
                    />
                  </div>
                </div>
              )}

              <p className="text-sm text-telegram-textSecondary">
                Укажите примерный охват. Форматируется автоматически: 15.000.000.
              </p>

              {/* Скриншоты‑доказательства */}
              <div className="space-y-2">
                <label className="label">Скриншоты (как пруф)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => updateData('proofScreens', e.target.files ? Array.from(e.target.files) : [])}
                  className="input file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-telegram-primary/10 file:text-telegram-primary"
                />
                {data.proofScreens && data.proofScreens.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {data.proofScreens.slice(0, 4).map((f, i) => (
                      <img
                        key={i}
                        src={URL.createObjectURL(f)}
                        alt={`proof-${i}`}
                        className="w-16 h-16 rounded-md object-cover border border-gray-700/50"
                      />
                    ))}
                    {data.proofScreens.length > 4 && (
                      <span className="text-xs text-telegram-textSecondary self-center">+{data.proofScreens.length - 4}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        
        case 3:
          return (
            <div className="space-y-6">
              <div>
                <label className="label">Цена за пост (₽)</label>
                <input
                  type="number"
                  value={data.pricePerPost || ''}
                  onChange={(e) => updateData('pricePerPost', e.target.value)}
                  placeholder="Например: 5000"
                  className="input"
                />
              </div>
              
              <div>
                <label className="label">Цена за сторис (₽)</label>
                <input
                  type="number"
                  value={data.pricePerStory || ''}
                  onChange={(e) => updateData('pricePerStory', e.target.value)}
                  placeholder="Например: 2000"
                  className="input"
                />
              </div>
              
              <p className="text-sm text-telegram-textSecondary">
                Вы сможете изменить цены в любой момент
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
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNext}
                disabled={!data.role}
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


