'use client'

import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit2, Trash2, X, Eye, Image as ImageIcon, BarChart2 } from 'lucide-react'
import { formatNumber, formatPrice } from '@/lib/utils'
import { socialPlatformsApi } from '@/lib/api'
import { SocialPlatform, PlatformType } from '@/types'
import { getPlatformIcon, platformLabels } from '@/components/icons/PlatformIcons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Стили кнопок и инпутов (копии из ProfilePage для консистентности)
const buttonPrimaryStyle = {
  width: '100%',
  padding: '12px',
  background: 'linear-gradient(135deg, #3390ec, #2b7cd3)',
  border: 'none',
  borderRadius: 12,
  color: 'white',
  fontWeight: 600 as const,
  fontSize: 14,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  boxShadow: '0 4px 12px rgba(51, 144, 236, 0.3)',
  transition: 'transform 0.1s'
}

const buttonSecondaryStyle = {
  width: '100%',
  padding: '12px',
  background: 'rgba(255, 255, 255, 0.08)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: 12,
  color: 'white',
  fontWeight: 600 as const,
  fontSize: 14,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  transition: 'background 0.2s'
}

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  background: 'rgba(0, 0, 0, 0.2)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: 12,
  color: 'white',
  fontSize: 15,
  outline: 'none',
  transition: 'border-color 0.2s',
}

const labelStyle = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500 as const,
  color: 'rgba(255, 255, 255, 0.5)',
  marginBottom: 8
}

const cardStyle = {
  background: 'rgba(30, 30, 46, 0.6)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 24,
  padding: 24,
  marginBottom: 20,
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
}

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
    onError: (error: any) => {
      console.error('Update error:', error)
      alert(`Ошибка обновления: ${error?.response?.data?.message || error?.message}`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: socialPlatformsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-platforms'] })
    },
  })

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart2 size={20} className="text-telegram-primary" />
          Социальные сети
        </h3>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '8px 12px',
            background: 'rgba(51, 144, 236, 0.15)',
            color: '#3390ec',
            border: 'none',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          <Plus size={16} />
          Добавить
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: 20 }}>
            Загрузка...
          </div>
        ) : platforms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, background: 'rgba(255,255,255,0.03)', borderRadius: 16 }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>
              У вас пока нет добавленных социальных сетей
            </p>
            <button 
              onClick={() => setShowAddModal(true)}
              style={{
                ...buttonPrimaryStyle,
                width: 'auto',
                display: 'inline-flex',
                padding: '10px 20px'
              }}
            >
              Добавить первую платформу
            </button>
          </div>
        ) : (
          platforms.map((platform) => (
            <motion.div
              key={platform.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'rgba(0, 0, 0, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 16,
                padding: 16,
                position: 'relative',
                cursor: 'pointer',
                transition: 'border-color 0.2s'
              }}
              onClick={() => setEditingPlatform(platform)}
              whileHover={{ scale: 1.01, borderColor: 'rgba(51, 144, 236, 0.3)' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ 
                  width: 44, 
                  height: 44, 
                  borderRadius: 12, 
                  background: 'rgba(255,255,255,0.05)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {getPlatformIcon(platform.platform, { size: 24 })}
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <h4 style={{ fontSize: 16, fontWeight: 600, color: 'white' }}>
                      {platformLabels[platform.platform]}
                    </h4>
                    {platform.isPrimary && (
                      <span style={{
                        fontSize: 10,
                        padding: '2px 6px',
                        background: '#3390ec',
                        color: 'white',
                        borderRadius: 6,
                        fontWeight: 600
                      }}>
                        Основная
                      </span>
                    )}
                  </div>
                  
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                    @{platform.username}
                  </p>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 13 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'white' }}>
                      <Eye size={14} style={{ color: 'rgba(255,255,255,0.5)' }} />
                      <span>{formatNumber(platform.subscribersCount)} подп.</span>
                    </div>
                    
                    {platform.additionalInfo?.views30days && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#3390ec' }}>
                        <BarChart2 size={14} />
                        <span>{formatNumber(platform.additionalInfo.views30days)} просм./30д</span>
                      </div>
                    )}
                    
                    {platform.additionalInfo?.uniqueViewers30days && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#a665ff' }}>
                        <Eye size={14} />
                        <span>{formatNumber(platform.additionalInfo.uniqueViewers30days)} уник./30д</span>
                      </div>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 13, marginTop: 8 }}>
                    {(platform.pricePerPost || platform.pricePerPost === -1) && (
                      <div style={{ color: 'rgba(255,255,255,0.7)' }}>
                        Пост: <span style={{ color: '#22c55e', fontWeight: 600 }}>
                          {platform.pricePerPost === -1 ? 'Договорная' : formatPrice(platform.pricePerPost)}
                        </span>
                      </div>
                    )}
                    
                    {(platform.pricePerStory || platform.pricePerStory === -1) && (
                      <div style={{ color: 'rgba(255,255,255,0.7)' }}>
                        Сторис: <span style={{ color: '#a665ff', fontWeight: 600 }}>
                          {platform.pricePerStory === -1 ? 'Договорная' : formatPrice(platform.pricePerStory)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Скриншоты */}
                  {platform.statisticsScreenshots && platform.statisticsScreenshots.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
                      {platform.statisticsScreenshots.slice(0, 3).map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt={`Stats ${i + 1}`}
                          style={{
                            width: 40,
                            height: 40,
                            objectFit: 'cover',
                            borderRadius: 8,
                            border: '1px solid rgba(255,255,255,0.1)',
                            cursor: 'zoom-in'
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(url, '_blank')
                          }}
                        />
                      ))}
                      {platform.statisticsScreenshots.length > 3 && (
                        <div style={{
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          background: 'rgba(255,255,255,0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          color: 'white',
                          fontWeight: 600
                        }}>
                          +{platform.statisticsScreenshots.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm('Удалить эту платформу?')) {
                      deleteMutation.mutate(platform.id)
                    }
                  }}
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    padding: 6,
                    background: 'transparent',
                    color: '#ef4444',
                    border: 'none',
                    cursor: 'pointer',
                    opacity: 0.6,
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {(showAddModal || editingPlatform) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.85)',
              backdropFilter: 'blur(10px)',
              zIndex: 10001,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16
            }}
            onClick={() => {
              setShowAddModal(false)
              setEditingPlatform(null)
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={{
                background: '#1C1E20',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 24,
                padding: 24,
                width: '100%',
                maxWidth: 480,
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <PlatformForm
                platform={editingPlatform}
                onSubmit={async (data) => {
                  try {
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
    </div>
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
    additionalInfo: platform?.additionalInfo || {},
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
      
      const dataToSubmit: Partial<SocialPlatform> = {
        ...formData,
        username: (formData.username || '').trim().replace(/^@+/, ''),
        url: formData.url && formData.url.trim().length > 0 ? formData.url.trim() : undefined,
        subscribersCount: typeof formData.subscribersCount === 'string'
          ? (parseInt(formData.subscribersCount as any) || 0)
          : (formData.subscribersCount || 0),
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
      
      if (!dataToSubmit.username || dataToSubmit.username.trim() === '') {
        alert('Пожалуйста, укажите username или название канала')
        setIsSubmitting(false)
        return
      }
      
      await onSubmit(dataToSubmit)
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
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h3 style={{ fontSize: 20, fontWeight: 600, color: 'white' }}>
          {platform ? 'Редактировать платформу' : 'Добавить платформу'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          style={{ padding: 8, background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>
      </div>

      {!platform && (
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Платформа</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {availablePlatforms.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setFormData({ ...formData, platform: p })}
                style={{
                  padding: 12,
                  borderRadius: 12,
                  border: formData.platform === p ? '1px solid #3390ec' : '1px solid rgba(255,255,255,0.1)',
                  background: formData.platform === p ? 'rgba(51, 144, 236, 0.15)' : 'rgba(0,0,0,0.2)',
                  color: formData.platform === p ? 'white' : 'rgba(255,255,255,0.6)',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s'
                }}
              >
                {getPlatformIcon(p, { size: 20 })}
                <span style={{ fontSize: 14 }}>{platformLabels[p]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Username / Название канала</label>
        <input
          style={inputStyle}
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          placeholder="@username"
          required
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Ссылка на профиль (опционально)</label>
        <input
          style={inputStyle}
          value={formData.url || ''}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          placeholder="https://..."
        />
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>Количество подписчиков</label>
        <input
          style={inputStyle}
          type="text"
          inputMode="numeric"
          value={formData.subscribersCount ? formData.subscribersCount.toLocaleString('ru-RU') : ''}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '')
            setFormData({ ...formData, subscribersCount: digits ? parseInt(digits) : 0 })
          }}
          placeholder="100.000"
        />
      </div>

      {/* Статистика за 30 дней */}
      <div style={{ marginBottom: 24, padding: 16, background: 'rgba(51, 144, 236, 0.08)', borderRadius: 16, border: '1px solid rgba(51, 144, 236, 0.2)' }}>
        <h4 style={{ fontSize: 15, fontWeight: 600, color: 'white', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart2 size={18} style={{ color: '#3390ec' }} />
          Статистика за 30 дней
        </h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Просмотры</label>
            <input
              style={inputStyle}
              type="text"
              inputMode="numeric"
              value={formData.additionalInfo?.views30days ? formData.additionalInfo.views30days.toLocaleString('ru-RU') : ''}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '')
                setFormData({ 
                  ...formData, 
                  additionalInfo: { 
                    ...formData.additionalInfo, 
                    views30days: digits ? parseInt(digits) : undefined 
                  } 
                })
              }}
              placeholder="500.000"
            />
          </div>
          <div>
            <label style={labelStyle}>Уникальные зрители</label>
            <input
              style={inputStyle}
              type="text"
              inputMode="numeric"
              value={formData.additionalInfo?.uniqueViewers30days ? formData.additionalInfo.uniqueViewers30days.toLocaleString('ru-RU') : ''}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '')
                setFormData({ 
                  ...formData, 
                  additionalInfo: { 
                    ...formData.additionalInfo, 
                    uniqueViewers30days: digits ? parseInt(digits) : undefined 
                  } 
                })
              }}
              placeholder="150.000"
            />
          </div>
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
          Эти данные помогут рекламодателям найти вас
        </p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h4 style={{ fontSize: 15, fontWeight: 600, color: 'white', marginBottom: 12 }}>Цены на рекламу</h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>За пост</label>
            <input
              style={inputStyle}
              type="text"
              inputMode="numeric"
              value={formData.pricePerPost === -1 ? '' : (formData.pricePerPost ? formData.pricePerPost.toLocaleString('ru-RU') : '')}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '')
                setFormData({ ...formData, pricePerPost: digits ? parseFloat(digits) : undefined })
              }}
              placeholder={formData.pricePerPost === -1 ? "Договорная" : "5.000"}
              disabled={formData.pricePerPost === -1}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.pricePerPost === -1}
                onChange={(e) => setFormData({ ...formData, pricePerPost: e.target.checked ? -1 : undefined })}
                style={{ width: 16, height: 16, accentColor: '#3390ec' }}
              />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Договорная</span>
            </label>
          </div>

          <div>
            <label style={labelStyle}>За сторис</label>
            <input
              style={inputStyle}
              type="text"
              inputMode="numeric"
              value={formData.pricePerStory === -1 ? '' : (formData.pricePerStory ? formData.pricePerStory.toLocaleString('ru-RU') : '')}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '')
                setFormData({ ...formData, pricePerStory: digits ? parseFloat(digits) : undefined })
              }}
              placeholder={formData.pricePerStory === -1 ? "Договорная" : "2.000"}
              disabled={formData.pricePerStory === -1}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.pricePerStory === -1}
                onChange={(e) => setFormData({ ...formData, pricePerStory: e.target.checked ? -1 : undefined })}
                style={{ width: 16, height: 16, accentColor: '#3390ec' }}
              />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Договорная</span>
            </label>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>Скриншоты статистики</label>
        
        {formData.statisticsScreenshots && formData.statisticsScreenshots.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, overflowX: 'auto', paddingBottom: 4 }}>
            {formData.statisticsScreenshots.map((url, index) => (
              <div key={index} style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
                <img
                  src={url}
                  alt={`Screenshot ${index + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <button
                  type="button"
                  onClick={() => removeScreenshot(index)}
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    width: 20,
                    height: 20,
                    background: '#ef4444',
                    borderRadius: '50%',
                    border: 'none',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleScreenshotUpload}
          style={{ display: 'none' }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingScreenshot}
          style={buttonSecondaryStyle}
        >
          {uploadingScreenshot ? 'Загрузка...' : (
            <>
              <ImageIcon size={16} />
              Добавить скриншот
            </>
          )}
        </button>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, cursor: 'pointer', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 12 }}>
        <input
          type="checkbox"
          checked={formData.isPrimary}
          onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
          style={{ width: 18, height: 18, accentColor: '#3390ec' }}
        />
        <span style={{ color: 'white', fontSize: 14 }}>Сделать основной платформой</span>
      </label>

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          type="button"
          onClick={onCancel}
          style={{ ...buttonSecondaryStyle, flex: 1 }}
          disabled={isSubmitting}
        >
          Отмена
        </button>
        <button
          type="submit"
          style={{ ...buttonPrimaryStyle, flex: 1 }}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Сохранение...' : platform ? 'Сохранить' : 'Добавить'}
        </button>
      </div>
    </form>
  )
}
