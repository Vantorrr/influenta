'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft,
  Save,
  Calendar,
  FileText,
  Target,
  Users,
  AlertCircle
} from 'lucide-react'
import { RubIcon } from '@/components/ui/ruble-icon'
import Link from 'next/link'
import { Layout } from '@/components/layout/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BloggerCategory, 
  PostFormat,
  type Listing 
} from '@/types'
import { listingsApi } from '@/lib/api'
import { getCategoryLabel, getPostFormatLabel, formatNumberInput, parseNumberInput } from '@/lib/utils'

export default function CreateListingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetCategories: [] as BloggerCategory[],
    budget: '',
    negotiable: false,
    format: PostFormat.ANY,
    requirements: {
      minSubscribers: '',
      maxSubscribers: '',
      verifiedOnly: false,
    },
    deadline: '',
  })

  const categories = Object.values(BloggerCategory)
  const formats = Object.values(PostFormat)

  const toggleCategory = (category: BloggerCategory) => {
    setFormData(prev => ({
      ...prev,
      targetCategories: prev.targetCategories.includes(category)
        ? prev.targetCategories.filter(c => c !== category)
        : [...prev.targetCategories, category]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Валидация
    if (!formData.title.trim()) {
      setError('Введите заголовок объявления')
      return
    }
    
    if (!formData.description.trim()) {
      setError('Введите описание задания')
      return
    }
    
    if (!formData.negotiable) {
      if (!formData.budget || parseFloat(formData.budget) <= 0) {
        setError('Укажите бюджет или отметьте «Договорная»')
        return
      }
    }
    
    if (formData.targetCategories.length === 0) {
      setError('Выберите хотя бы одну категорию')
      return
    }

    // Валидация: минимум не может быть больше максимума
    const minSubs = formData.requirements.minSubscribers ? parseInt(formData.requirements.minSubscribers) : 0
    const maxSubs = formData.requirements.maxSubscribers ? parseInt(formData.requirements.maxSubscribers) : 0
    if (minSubs > 0 && maxSubs > 0 && minSubs > maxSubs) {
      setError('Минимальное количество подписчиков не может быть больше максимального')
      return
    }

    setLoading(true)

    try {
      // Нормализуем и ограничиваем бюджет
      const normalizedBudget = formData.negotiable ? -1 : Math.min(99999999, parseFloat(formData.budget))
      const req: Partial<Listing> = {
        title: formData.title,
        description: formData.description,
        targetCategories: formData.targetCategories,
        budget: normalizedBudget,
        format: formData.format,
        // DTO допускает только: minSubscribers, verifiedOnly
        requirements: {
          minSubscribers: formData.requirements.minSubscribers
            ? parseInt(formData.requirements.minSubscribers)
            : undefined,
          verifiedOnly: formData.requirements.verifiedOnly,
        },
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
      }

      // Удаляем пустые поля из requirements, чтобы не слал лишнее
      if (req.requirements) {
        const cleanReq: any = {}
        if (req.requirements.minSubscribers !== undefined) cleanReq.minSubscribers = req.requirements.minSubscribers
        if (req.requirements.verifiedOnly !== undefined) cleanReq.verifiedOnly = req.requirements.verifiedOnly
        req.requirements = cleanReq
      }

      await listingsApi.create(req)
      router.push('/listings')
    } catch (err: any) {
      const apiMsg = err?.response?.data?.message || err?.message
      setError(Array.isArray(apiMsg) ? apiMsg.join(', ') : (apiMsg || 'Ошибка при создании объявления. Попробуйте еще раз.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="container py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/listings">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 hover:bg-telegram-bgSecondary rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
          </Link>
          <h1 className="text-2xl font-bold">Создать объявление</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Основная информация */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Основная информация
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="label">Заголовок объявления *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Например: Реклама мобильного приложения"
                  maxLength={100}
                />
                <p className="text-xs text-telegram-textSecondary mt-1">
                  {formData.title.length}/100 символов
                </p>
              </div>
              
              <div>
                <label className="label">Описание задания *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Подробно опишите, что нужно сделать, какой результат ожидаете..."
                  className="input min-h-[120px] resize-none"
                  maxLength={1000}
                />
                <p className="text-xs text-telegram-textSecondary mt-1">
                  {formData.description.length}/1000 символов
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Целевая аудитория */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Целевая аудитория
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="label">Категории блогеров *</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {categories.map((category) => (
                    <motion.button
                      key={category}
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleCategory(category)}
                      className={`p-3 rounded-lg border-2 text-sm transition-all ${
                        formData.targetCategories.includes(category)
                          ? 'border-telegram-primary bg-telegram-primary/20'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      {getCategoryLabel(category)}
                    </motion.button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="label">Формат размещения</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {formats.map((format) => (
                    <motion.button
                      key={format}
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setFormData(prev => ({ ...prev, format }))}
                      className={`p-3 rounded-lg border-2 text-sm transition-all ${
                        formData.format === format
                          ? 'border-telegram-primary bg-telegram-primary/20'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      {getPostFormatLabel(format)}
                    </motion.button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Бюджет и сроки */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RubIcon className="w-5 h-5" />
                Бюджет и сроки
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="label">Бюджет (₽) *</label>
              <div className="flex flex-col items-start gap-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={formData.negotiable ? '' : formatNumberInput(formData.budget)}
                  onChange={(e) => setFormData(prev => ({ ...prev, budget: parseNumberInput(e.target.value).toString() }))}
                  placeholder={formData.negotiable ? 'Договорная' : '50.000'}
                  disabled={formData.negotiable}
                />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.negotiable}
                    onChange={(e) => setFormData(prev => ({ ...prev, negotiable: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-600 text-telegram-primary focus:ring-telegram-primary"
                  />
                  <span>Договорная</span>
                </label>
              </div>
                <p className="text-xs text-telegram-textSecondary mt-1">
                Укажите общий бюджет на кампанию или отметьте «Договорная»
                </p>
              </div>
              
              <div className="mt-2">
                <label className="label">Дедлайн</label>
                <Input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-telegram-textSecondary mt-1">
                  Необязательно. До какого числа нужно выполнить задание
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Требования */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Требования к блогерам
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="label">Мин. подписчиков</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={formatNumberInput(formData.requirements.minSubscribers)}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      requirements: { ...prev.requirements, minSubscribers: parseNumberInput(e.target.value).toString() }
                    }))}
                    placeholder="10.000"
                  />
                </div>
                
                <div>
                  <label className="label">Макс. подписчиков</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={formatNumberInput(formData.requirements.maxSubscribers)}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      requirements: { ...prev.requirements, maxSubscribers: parseNumberInput(e.target.value).toString() }
                    }))}
                    placeholder="500.000"
                  />
                </div>
              </div>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requirements.verifiedOnly}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    requirements: { ...prev.requirements, verifiedOnly: e.target.checked }
                  }))}
                  className="w-4 h-4 rounded border-gray-600 text-telegram-primary focus:ring-telegram-primary"
                />
                <span>Только верифицированные блогеры</span>
              </label>
            </CardContent>
          </Card>

          {/* Ошибка */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-telegram-danger/10 border border-telegram-danger/50 rounded-lg p-4"
            >
              <div className="flex items-center gap-2 text-telegram-danger">
                <AlertCircle className="w-5 h-5" />
                <p>{error}</p>
              </div>
            </motion.div>
          )}

          {/* Кнопки */}
          <div className="flex gap-4">
            <Link href="/listings" className="flex-1">
              <Button variant="secondary" fullWidth>
                Отмена
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              disabled={loading}
            >
              <Save className="w-4 h-4 mr-2" />
              Создать объявление
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  )
}


























