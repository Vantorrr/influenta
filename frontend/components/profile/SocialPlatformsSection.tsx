'use client'

import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit2, Trash2, X, Upload, Eye, Star, Image as ImageIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatNumber, formatPrice } from '@/lib/utils'
import { socialPlatformsApi } from '@/lib/api'
import { SocialPlatform, PlatformType } from '@/types'
import { getPlatformIcon, platformLabels } from '@/components/icons/PlatformIcons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function SocialPlatformsSection() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingPlatform, setEditingPlatform] = useState<SocialPlatform | null>(null)
  const queryClient = useQueryClient()

  const { data: platforms = [], isLoading } = useQuery({
    queryKey: ['social-platforms'],
    queryFn: () => socialPlatformsApi.getMyPlatforms(),
  })

  const createMutation = useMutation({
    mutationFn: socialPlatformsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-platforms'] })
      setShowAddModal(false)
    },
    onError: (error: any) => {
      console.error('Create platform error:', error)
      const message = error?.response?.data?.message || error?.message || 'Неизвестная ошибка'
      alert(`Ошибка при создании платформы: ${message}`)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SocialPlatform> }) =>
      socialPlatformsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-platforms'] })
      setEditingPlatform(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: socialPlatformsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-platforms'] })
    },
  })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Социальные сети</CardTitle>
        <Button
          size="sm"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Добавить платформу
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-telegram-textSecondary">
            Загрузка...
          </div>
        ) : platforms.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-telegram-textSecondary mb-4">
              У вас пока нет добавленных социальных сетей
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              Добавить первую платформу
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {platforms.map((platform) => (
              <motion.div
                key={platform.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-telegram-border rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-telegram-bg flex items-center justify-center">
                      {getPlatformIcon(platform.platform, { size: 20 })}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">
                          {platformLabels[platform.platform]}
                        </h4>
                        {platform.isPrimary && (
                          <Badge variant="primary" className="text-xs">
                            Основная
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-telegram-textSecondary mb-2">
                        @{platform.username}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4 text-telegram-textSecondary" />
                          <span>{formatNumber(platform.subscribersCount)} подписчиков</span>
                        </div>
                        {platform.pricePerPost && (
                          <div>
                            <span className="text-telegram-textSecondary">Пост: </span>
                            <span className="font-medium">{platform.pricePerPost === -1 ? 'Договорная' : formatPrice(platform.pricePerPost)}</span>
                          </div>
                        )}
                        {platform.pricePerStory && (
                          <div>
                            <span className="text-telegram-textSecondary">Сторис: </span>
                            <span className="font-medium">{platform.pricePerStory === -1 ? 'Договорная' : formatPrice(platform.pricePerStory)}</span>
                          </div>
                        )}
                      </div>
                      {platform.statisticsScreenshots && platform.statisticsScreenshots.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {platform.statisticsScreenshots.slice(0, 3).map((url, i) => (
                            <img
                              key={i}
                              src={url}
                              alt={`Stats ${i + 1}`}
                              className="w-12 h-12 object-cover rounded border border-telegram-border"
                            />
                          ))}
                          {platform.statisticsScreenshots.length > 3 && (
                            <div className="w-12 h-12 rounded border border-telegram-border bg-telegram-bg flex items-center justify-center text-xs">
                              +{platform.statisticsScreenshots.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingPlatform(platform)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm('Удалить эту платформу?')) {
                          deleteMutation.mutate(platform.id)
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {(showAddModal || editingPlatform) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowAddModal(false)
              setEditingPlatform(null)
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-telegram-bgSecondary rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <PlatformForm
                platform={editingPlatform}
                onSubmit={async (data) => {
                  try {
                    console.log('Form submission data:', data)
                    if (editingPlatform) {
                      await updateMutation.mutateAsync({
                        id: editingPlatform.id,
                        data,
                      })
                    } else {
                      await createMutation.mutateAsync(data)
                    }
                  } catch (error) {
                    console.error('Form submission error:', error)
                  }
                }}
                onCancel={() => {
                  setShowAddModal(false)
                  setEditingPlatform(null)
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

interface PlatformFormProps {
  platform?: SocialPlatform | null
  onSubmit: (data: Partial<SocialPlatform>) => Promise<void>
  onCancel: () => void
}

function PlatformForm({ platform, onSubmit, onCancel }: PlatformFormProps) {
  const [formData, setFormData] = useState<Partial<SocialPlatform>>({
    platform: platform?.platform || PlatformType.INSTAGRAM,
    username: platform?.username || '',
    url: platform?.url || '',
    subscribersCount: platform?.subscribersCount || 0,
    pricePerPost: platform?.pricePerPost || undefined,
    pricePerStory: platform?.pricePerStory || undefined,
    pricePerReel: platform?.pricePerReel || undefined,
    isPrimary: platform?.isPrimary || false,
    statisticsScreenshots: platform?.statisticsScreenshots || [],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingScreenshot(true)
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/uploads/platform-stats`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('influenta_token')}`,
        },
        body: formData,
      })
      
      if (!response.ok) throw new Error('Upload failed')
      
      const data = await response.json()
      setFormData(prev => ({
        ...prev,
        statisticsScreenshots: [...(prev.statisticsScreenshots || []), data.url],
      }))
    } catch (error) {
      console.error('Error uploading screenshot:', error)
      alert('Ошибка при загрузке скриншота')
    } finally {
      setUploadingScreenshot(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeScreenshot = (index: number) => {
    setFormData(prev => ({
      ...prev,
      statisticsScreenshots: prev.statisticsScreenshots?.filter((_, i) => i !== index) || [],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      
      // Подготовка данных для отправки
      const dataToSubmit: Partial<SocialPlatform> = {
        ...formData,
        // Чистим username и url
        username: (formData.username || '').trim().replace(/^@+/, ''),
        url: formData.url && formData.url.trim().length > 0 ? formData.url.trim() : undefined,
        // Убедимся, что subscribersCount - число
        subscribersCount: typeof formData.subscribersCount === 'string'
          ? (parseInt(formData.subscribersCount as any) || 0)
          : (formData.subscribersCount || 0),
        // Обрабатываем цены: -1 для договорной, undefined для пустого
        pricePerPost: formData.pricePerPost === -1 
          ? -1 
          : (formData.pricePerPost && formData.pricePerPost !== ('' as any) ? Number(formData.pricePerPost) : undefined),
        pricePerStory: formData.pricePerStory === -1 
          ? -1 
          : (formData.pricePerStory && formData.pricePerStory !== ('' as any) ? Number(formData.pricePerStory) : undefined),
        pricePerReel: formData.pricePerReel === -1 
          ? -1 
          : (formData.pricePerReel && formData.pricePerReel !== ('' as any) ? Number(formData.pricePerReel) : undefined),
      }
      
      // Убедимся, что username заполнен
      if (!dataToSubmit.username || dataToSubmit.username.trim() === '') {
        alert('Пожалуйста, укажите username или название канала')
        setIsSubmitting(false)
        return
      }
      
      console.log('Submitting platform data:', dataToSubmit)
      await onSubmit(dataToSubmit)
      alert('Платформа сохранена!')
    } catch (error: any) {
      console.error('Error saving platform:', error)
      const errorMessage = error?.response?.data?.message || error?.message || 'Неизвестная ошибка'
      alert(`Ошибка при сохранении: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const availablePlatforms = Object.values(PlatformType)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">
          {platform ? 'Редактировать платформу' : 'Добавить платформу'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 hover:bg-telegram-bg rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {!platform && (
        <div>
          <label className="label">Платформа</label>
          <div className="grid grid-cols-2 gap-2">
            {availablePlatforms.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setFormData({ ...formData, platform: p })}
                className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                  formData.platform === p
                    ? 'border-telegram-primary bg-telegram-primary/20'
                    : 'border-telegram-border hover:border-telegram-primary/50'
                }`}
              >
                {getPlatformIcon(p, { size: 20 })}
                <span className="text-sm">{platformLabels[p]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="label">Username / Название канала</label>
        <Input
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          placeholder="@username"
          required
        />
      </div>

      <div>
        <label className="label">Количество подписчиков</label>
        <Input
          type="text"
          inputMode="numeric"
          value={formData.subscribersCount ? formData.subscribersCount.toLocaleString('ru-RU') : ''}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '')
            setFormData({ ...formData, subscribersCount: digits ? parseInt(digits) : 0 })
          }}
          placeholder="100.000"
          min="0"
        />
      </div>

      <div className="space-y-3">
        <h4 className="font-medium">Цены на рекламу</h4>
        
        <div>
          <label className="label text-sm">Цена за пост</label>
          <Input
            type="text"
            inputMode="numeric"
            value={formData.pricePerPost === -1 ? '' : (formData.pricePerPost ? formData.pricePerPost.toLocaleString('ru-RU') : '')}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '')
              setFormData({ ...formData, pricePerPost: digits ? parseFloat(digits) : undefined })
            }}
            placeholder={formData.pricePerPost === -1 ? "Договорная" : "5.000 или пусто"}
            min="0"
            disabled={formData.pricePerPost === -1}
          />
          <label className="flex items-center gap-2 mt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.pricePerPost === -1}
              onChange={(e) => setFormData({ ...formData, pricePerPost: e.target.checked ? -1 : undefined })}
              className="w-4 h-4"
            />
            <span className="text-sm">Договорная</span>
          </label>
        </div>

        <div>
          <label className="label text-sm">Цена за сторис</label>
          <Input
            type="text"
            inputMode="numeric"
            value={formData.pricePerStory === -1 ? '' : (formData.pricePerStory ? formData.pricePerStory.toLocaleString('ru-RU') : '')}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '')
              setFormData({ ...formData, pricePerStory: digits ? parseFloat(digits) : undefined })
            }}
            placeholder={formData.pricePerStory === -1 ? "Договорная" : "2.000 или пусто"}
            min="0"
            disabled={formData.pricePerStory === -1}
          />
          <label className="flex items-center gap-2 mt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.pricePerStory === -1}
              onChange={(e) => setFormData({ ...formData, pricePerStory: e.target.checked ? -1 : undefined })}
              className="w-4 h-4"
            />
            <span className="text-sm">Договорная</span>
          </label>
        </div>

        {['instagram', 'youtube', 'tiktok'].includes(formData.platform as string) && (
          <div>
            <label className="label text-sm">
              Цена за {formData.platform === 'youtube' ? 'Shorts' : 'Reels'}
            </label>
            <Input
              type="text"
              inputMode="numeric"
              value={formData.pricePerReel ? formData.pricePerReel.toLocaleString('ru-RU') : ''}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '')
                setFormData({ ...formData, pricePerReel: digits ? parseFloat(digits) : undefined })
              }}
              placeholder="3.000"
              min="0"
            />
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h4 className="font-medium">Скриншоты статистики</h4>
        
        {/* Uploaded screenshots */}
        {formData.statisticsScreenshots && formData.statisticsScreenshots.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            {formData.statisticsScreenshots.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt={`Screenshot ${index + 1}`}
                  className="w-full h-20 object-cover rounded-lg border border-telegram-border"
                />
                <button
                  type="button"
                  onClick={() => removeScreenshot(index)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Upload button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleScreenshotUpload}
          className="hidden"
        />
        <Button
          type="button"
          variant="secondary"
          fullWidth
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingScreenshot}
        >
          {uploadingScreenshot ? (
            'Загрузка...'
          ) : (
            <>
              <ImageIcon className="w-4 h-4 mr-2" />
              Добавить скриншот статистики
            </>
          )}
        </Button>
        <p className="text-xs text-telegram-textSecondary text-center">
          Загрузите скриншоты из аналитики платформы
        </p>
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={formData.isPrimary}
          onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
          className="w-4 h-4"
        />
        <span>Сделать основной платформой</span>
      </label>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          fullWidth
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Отмена
        </Button>
        <Button
          type="submit"
          variant="primary"
          fullWidth
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Сохранение...' : platform ? 'Сохранить' : 'Добавить'}
        </Button>
      </div>
    </form>
  )
}
