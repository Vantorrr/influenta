'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { 
  Edit, Save, X, User, Mail, AtSign, FileText, Phone, Globe, 
  Users2, Shield, CheckCircle, AlertCircle, Clock, Camera, Upload,
  ChevronRight, Star, Zap, LayoutGrid, BarChart3, Settings, Headphones
} from 'lucide-react'
import { getCountryName } from '@/lib/countries'
import { Layout } from '@/components/layout/Layout'
import { RubIcon } from '@/components/ui/ruble-icon'
import { Avatar } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/useAuth'
import { authApi, analyticsApi, safeDealApi } from '@/lib/api'
import api from '@/lib/api'
import { UserRole, BloggerCategory } from '@/types'
import { VerificationModal } from '@/components/VerificationModal'
import { SocialPlatformsSection } from '@/components/profile/SocialPlatformsSection'
import { getCategoryLabel, formatNumberInput, parseNumberInput } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { VerificationTooltip } from '@/components/VerificationTooltip'

export default function ProfilePage() {
  const { user, isLoading } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    bio: '',
    role: UserRole.BLOGGER,
    phone: '',
    payoutPhone: '',
    payoutSbpMemberId: '',
    payoutSbpBankName: '',
    website: '',
    photoUrl: '',
    categories: [] as string[]
  })
  const [sbpBanks, setSbpBanks] = useState<Array<{ memberId: string; memberName: string }>>([])

  const handleEdit = async () => {
    analyticsApi.track('quick_action_click', { targetType: 'profile', targetId: 'edit' })
    if (user) {
      const rawCats: any = (user as any).categories
      const normalizedCategories = Array.isArray(rawCats)
        ? rawCats
        : typeof rawCats === 'string'
          ? rawCats.split(',').map((c: string) => c.trim()).filter(Boolean)
          : []
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        bio: user.bio || '',
        role: user.role || UserRole.BLOGGER,
        phone: (user as any).phone || '',
        payoutPhone: (user as any).payoutPhone || (user as any).phone || '',
        payoutSbpMemberId: (user as any).payoutSbpMemberId || '',
        payoutSbpBankName: (user as any).payoutSbpBankName || '',
        website: (user as any).website || '',
        photoUrl: user.photoUrl || '',
        categories: normalizedCategories,
      })
      try {
        const banks = await safeDealApi.listSbpBanks()
        setSbpBanks(Array.isArray(banks) ? banks : [])
      } catch {
        setSbpBanks([])
      }
    }
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!user) return
    
    setIsSaving(true)
    try {
      const payload: any = {
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        email: formData.email || undefined,
        bio: formData.bio || undefined,
        role: formData.role || undefined,
        phone: formData.phone || undefined,
        payoutPhone: formData.payoutPhone || undefined,
        payoutSbpMemberId: formData.payoutSbpMemberId || undefined,
        payoutSbpBankName: formData.payoutSbpBankName || undefined,
        website: formData.website || undefined,
        photoUrl: formData.photoUrl || undefined,
      }

      if (formData.categories && formData.categories.length > 0) payload.categories = formData.categories.join(',')

      await authApi.updateProfile(payload)
      try { analyticsApi.track('profile_edit_save', { targetUserId: user.id }) } catch {}
      
      const profileResponse = await authApi.getCurrentUser()
      const userData = (profileResponse as any)?.user || profileResponse
      if (userData?.id) {
        localStorage.setItem('influenta_user', JSON.stringify(userData))
        window.location.reload()
      }
      
      setIsEditing(false)
    } catch (error) {
      console.error('Ошибка сохранения профиля:', error)
      alert('Ошибка сохранения профиля. Попробуйте еще раз.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/uploads/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('influenta_token')}`,
        },
        body: form,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Upload failed')

      if (isEditing) {
        setFormData(prev => ({ ...prev, photoUrl: data.url }))
      } else {
        await authApi.updateProfile({ photoUrl: data.url })
        const profileResponse = await authApi.getCurrentUser()
        const userData = (profileResponse as any)?.user || profileResponse
        if (userData?.id) {
          localStorage.setItem('influenta_user', JSON.stringify(userData))
          window.location.reload()
        }
      }
    } catch (err) {
      console.error('Avatar upload error:', err)
      alert('Не удалось загрузить аватарку')
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      bio: '',
      role: UserRole.BLOGGER,
      phone: '',
      payoutPhone: '',
      payoutSbpMemberId: '',
      payoutSbpBankName: '',
      website: '',
      photoUrl: '',
      categories: []
    })
  }

  const toggleCategory = (category: string) => {
    setFormData(prev => {
      const currentCategories = prev.categories || []
      const isSelected = currentCategories.includes(category)
      
      if (isSelected) {
        return {
          ...prev,
          categories: currentCategories.filter(c => c !== category)
        }
      } else {
        if (currentCategories.length >= 2) {
          alert('Можно выбрать максимум 2 категории')
          return prev
        }
        return {
          ...prev,
          categories: [...currentCategories, category]
        }
      }
    })
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'УДАЛИТЬ') return
    setIsDeleting(true)
    try {
      await api.delete('/auth/account')
      localStorage.removeItem('influenta_token')
      localStorage.removeItem('influenta_user')
      window.location.href = '/'
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Ошибка удаления аккаунта')
      setIsDeleting(false)
    }
  }

  const handleRequestVerification = () => {
    setShowVerificationModal(true)
  }

  const handleVerificationSubmit = async (data: {
    documents: string[]
    socialProofs: { platform: string; url: string; followers?: number }[]
    message: string
    verificationCode: string
  }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/request-verification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('influenta_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      
      const result = await response.json()
      
      if (response.ok) {
        alert(result.message)
        setShowVerificationModal(false)
        const profileResponse = await authApi.getCurrentUser()
        if ((profileResponse as any)?.user) {
          localStorage.setItem('influenta_user', JSON.stringify((profileResponse as any).user))
          window.location.reload()
        }
      } else {
        alert(result.message || 'Ошибка при отправке заявки')
      }
    } catch (error) {
      console.error('Error requesting verification:', error)
      alert('Ошибка при отправке заявки на верификацию')
    }
  }

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0f0f0f 0%, #1a1a2e 100%)'
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: '3px solid rgba(51, 144, 236, 0.2)',
          borderTopColor: '#3390ec',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!user) {
    return (
      <Layout>
        <div style={{ 
          padding: 24, 
          textAlign: 'center', 
          color: 'rgba(255,255,255,0.6)',
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: 'white', marginBottom: 8 }}>Вход не выполнен</h2>
          <p>Пожалуйста, войдите через Telegram</p>
        </div>
      </Layout>
    )
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

  const labelStyle = {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 8
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

  const buttonPrimaryStyle = {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #3390ec, #2b7cd3)',
    border: 'none',
    borderRadius: 14,
    color: 'white',
    fontWeight: 600,
    fontSize: 15,
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
    padding: '14px',
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    color: 'white',
    fontWeight: 600,
    fontSize: 15,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'background 0.2s'
  }

  return (
    <Layout>
      <div style={{ minHeight: '100vh', paddingBottom: 100 }}>
        {/* Header Background */}
        <div style={{ 
          height: 180, 
          background: 'linear-gradient(180deg, rgba(51, 144, 236, 0.15) 0%, rgba(0,0,0,0) 100%)',
          marginBottom: -60,
          position: 'relative',
          zIndex: 0
        }} />

        <div className="container max-w-4xl px-4 relative z-10">
          {/* Profile Card */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ position: 'relative', marginBottom: 16 }}>
                <div style={{ 
                  width: 100, 
                  height: 100, 
                  borderRadius: '50%', 
                  padding: 3,
                  background: 'linear-gradient(135deg, #3390ec, #a665ff)',
                  boxShadow: '0 8px 24px rgba(51, 144, 236, 0.3)'
                }}>
                  <div style={{ 
                    width: '100%', 
                    height: '100%', 
                    borderRadius: '50%', 
                    overflow: 'hidden', 
                    background: '#1a1a2e',
                    position: 'relative'
                  }}>
                    {user.photoUrl ? (
                      <img src={user.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 600, color: 'white' }}>
                        {user.firstName?.[0] || 'U'}
                      </div>
                    )}
                  </div>
                </div>
                {user.isVerified && (
                  <div style={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                  }}>
                    <VerificationTooltip />
                  </div>
                )}
              </div>

              <h1 style={{ fontSize: 24, fontWeight: 700, color: 'white', marginBottom: 4 }}>
                {user.firstName} {user.lastName}
              </h1>
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: 6,
                padding: '4px 12px',
                background: 'rgba(255,255,255,0.08)',
                borderRadius: 20,
                marginBottom: 16
              }}>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>@{user.username || 'username'}</span>
              </div>

              {user.bio && (
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15, lineHeight: 1.5, maxWidth: 400, margin: '0 auto 24px' }}>
                  {user.bio}
                </p>
              )}

              {!isEditing ? (
                <button onClick={handleEdit} style={buttonPrimaryStyle}>
                  <Edit size={18} />
                  Редактировать профиль
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                  <button onClick={handleCancel} style={{ ...buttonSecondaryStyle, flex: 1 }}>
                    <X size={18} />
                    Отмена
                  </button>
                  <button onClick={handleSave} disabled={isSaving} style={{ ...buttonPrimaryStyle, flex: 1 }}>
                    <Save size={18} />
                    {isSaving ? '...' : 'Сохранить'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Editing Form */}
          {isEditing && (
            <div style={cardStyle}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: 'white', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Settings size={20} className="text-telegram-primary" />
                Настройки профиля
              </h3>
              
              {/* Avatar Upload */}
              <div style={{ 
                padding: 16, 
                background: 'rgba(255,255,255,0.05)', 
                borderRadius: 16, 
                marginBottom: 24,
                display: 'flex', 
                alignItems: 'center', 
                gap: 16 
              }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', background: '#333' }}>
                  <img src={formData.photoUrl || user.photoUrl || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, color: 'white', marginBottom: 4 }}>Фото профиля</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>JPG, PNG до 5MB</div>
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    disabled={avatarUploading}
                    style={{ 
                      padding: '8px 16px', 
                      borderRadius: 10, 
                      background: 'rgba(51, 144, 236, 0.15)', 
                      color: '#3390ec', 
                      border: 'none', 
                      fontSize: 13, 
                      fontWeight: 600,
                      cursor: 'pointer' 
                    }}
                  >
                    {avatarUploading ? 'Загрузка...' : 'Загрузить новое фото'}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Имя</label>
                    <input 
                      style={inputStyle} 
                      value={formData.firstName} 
                      onChange={e => setFormData({...formData, firstName: e.target.value})} 
                      placeholder="Иван"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Фамилия</label>
                    <input 
                      style={inputStyle} 
                      value={formData.lastName} 
                      onChange={e => setFormData({...formData, lastName: e.target.value})} 
                      placeholder="Иванов"
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Роль</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[
                      { value: UserRole.BLOGGER, label: 'Блогер', icon: User },
                      { value: UserRole.ADVERTISER, label: 'Рекламодатель', icon: Star }
                    ].map(role => (
                      <button
                        key={role.value}
                        onClick={() => setFormData({...formData, role: role.value})}
                        style={{
                          flex: 1,
                          padding: '12px',
                          borderRadius: 12,
                          border: formData.role === role.value ? '1px solid #3390ec' : '1px solid rgba(255,255,255,0.1)',
                          background: formData.role === role.value ? 'rgba(51, 144, 236, 0.15)' : 'rgba(0,0,0,0.2)',
                          color: formData.role === role.value ? '#3390ec' : 'rgba(255,255,255,0.6)',
                          fontWeight: 500,
                          fontSize: 14,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8
                        }}
                      >
                        <role.icon size={16} />
                        {role.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>О себе</label>
                  <textarea 
                    style={{ ...inputStyle, minHeight: 100, resize: 'none' }} 
                    value={formData.bio} 
                    onChange={e => setFormData({...formData, bio: e.target.value})} 
                    placeholder="Расскажите о своем опыте и интересах..."
                  />
                </div>

                <div>
                  <label style={labelStyle}>Контакты</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ position: 'relative' }}>
                      <Phone size={16} style={{ position: 'absolute', left: 14, top: 14, color: 'rgba(255,255,255,0.4)' }} />
                      <input 
                        style={{ ...inputStyle, paddingLeft: 42 }} 
                        value={formData.phone} 
                        onChange={e => setFormData({...formData, phone: e.target.value})} 
                        placeholder="Телефон"
                      />
                    </div>
                    <div style={{ position: 'relative' }}>
                      <Globe size={16} style={{ position: 'absolute', left: 14, top: 14, color: 'rgba(255,255,255,0.4)' }} />
                      <input 
                        style={{ ...inputStyle, paddingLeft: 42 }} 
                        value={formData.website} 
                        onChange={e => setFormData({...formData, website: e.target.value})} 
                        placeholder="Сайт / Портфолио"
                      />
                    </div>
                    <div style={{ position: 'relative' }}>
                      <Mail size={16} style={{ position: 'absolute', left: 14, top: 14, color: 'rgba(255,255,255,0.4)' }} />
                      <input 
                        style={{ ...inputStyle, paddingLeft: 42 }} 
                        value={formData.email} 
                        onChange={e => setFormData({...formData, email: e.target.value})} 
                        placeholder="Email"
                      />
                    </div>
                  </div>
                </div>

                {(formData.role === UserRole.BLOGGER || user?.role === UserRole.BLOGGER) && (
                  <div>
                    <label style={labelStyle}>Вывод на СБП (автовыплата)</label>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 10 }}>
                      После подтверждения безопасной сделки деньги придут на этот номер через СБП.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ position: 'relative' }}>
                        <Phone size={16} style={{ position: 'absolute', left: 14, top: 14, color: 'rgba(255,255,255,0.4)' }} />
                        <input
                          style={{ ...inputStyle, paddingLeft: 42 }}
                          value={formData.payoutPhone}
                          onChange={e => setFormData({ ...formData, payoutPhone: e.target.value })}
                          placeholder="Телефон для СБП (+7…)"
                        />
                      </div>
                      <select
                        style={{ ...inputStyle, cursor: 'pointer' }}
                        value={formData.payoutSbpMemberId}
                        onChange={e => {
                          const id = e.target.value
                          const bank = sbpBanks.find(b => b.memberId === id)
                          setFormData({
                            ...formData,
                            payoutSbpMemberId: id,
                            payoutSbpBankName: bank?.memberName || '',
                          })
                        }}
                      >
                        <option value="">Банк получателя СБП</option>
                        {sbpBanks.map(b => (
                          <option key={b.memberId} value={b.memberId}>
                            {b.memberName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {formData.role === UserRole.BLOGGER && (
                  <div>
                    <label style={labelStyle}>Категории (макс. 2)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {Object.values(BloggerCategory).map((cat) => {
                        const isSelected = formData.categories?.includes(cat)
                        return (
                          <button
                            key={cat}
                            onClick={() => toggleCategory(cat)}
                            style={{
                              padding: '10px',
                              borderRadius: 10,
                              border: isSelected ? '1px solid #3390ec' : '1px solid rgba(255,255,255,0.1)',
                              background: isSelected ? 'rgba(51, 144, 236, 0.15)' : 'rgba(0,0,0,0.2)',
                              color: isSelected ? 'white' : 'rgba(255,255,255,0.6)',
                              fontSize: 13,
                              textAlign: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            {getCategoryLabel(cat)}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stats Grid for Bloggers - REMOVED per user request */}

          {/* Categories for Bloggers */}
          {user.role === UserRole.BLOGGER && !isEditing && (
            <div style={cardStyle}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: 'white', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <LayoutGrid size={20} className="text-telegram-primary" />
                Категории
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(() => {
                   const rawCats: any = (user as any).categories
                   const cats = Array.isArray(rawCats) 
                     ? rawCats 
                     : typeof rawCats === 'string' 
                       ? rawCats.split(',').map((c: string) => c.trim()).filter(Boolean) 
                       : []
                   
                   if (cats.length === 0) return <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Не выбраны</span>

                   return cats.map((cat: string) => (
                    <div key={cat} style={{
                      padding: '6px 12px',
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: 100,
                      fontSize: 13,
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                      {getCategoryLabel(cat)}
                    </div>
                   ))
                })()}
              </div>
            </div>
          )}

          {/* Socials for Bloggers */}
          {user.role === UserRole.BLOGGER && !isEditing && (
             <div style={{ marginBottom: 20 }}>
                <SocialPlatformsSection />
             </div>
          )}

          {/* Info Card */}
          {!isEditing && (
            <div style={cardStyle}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: 'white', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={20} className="text-telegram-primary" />
                Информация
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { label: 'Роль', value: user.role === UserRole.BLOGGER ? 'Блогер' : 'Рекламодатель', icon: Star },
                  { label: 'Страна', value: getCountryName((user as any).country), icon: Globe },
                  { label: 'Телефон', value: (user as any).phone || 'Не указан', icon: Phone },
                  ...(user.role === UserRole.BLOGGER
                    ? [
                        {
                          label: 'СБП телефон',
                          value: (user as any).payoutPhone || 'Не указан',
                          icon: Phone,
                        },
                        {
                          label: 'СБП банк',
                          value: (user as any).payoutSbpBankName || 'Не указан',
                          icon: Star,
                        },
                      ]
                    : []),
                  { label: 'Email', value: user.email || 'Не указан', icon: Mail },
                  { label: 'Сайт', value: (user as any).website || 'Не указан', icon: Globe, isLink: true },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
                      <item.icon size={16} />
                      {item.label}
                    </div>
                    <div style={{ color: item.isLink && item.value !== 'Не указан' ? '#3390ec' : 'white', fontSize: 14 }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Support */}
          {!isEditing && (
            <Link href="/support" style={{ textDecoration: 'none', display: 'block', marginBottom: 20 }}>
              <div style={{
                ...cardStyle,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: 'rgba(51, 144, 236, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Headphones size={20} color="#3390ec" />
                  </div>
                  <div>
                    <div style={{ color: 'white', fontWeight: 600, fontSize: 15 }}>Поддержка</div>
                    <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>Закрепы, крипта, споры, вопросы</div>
                  </div>
                </div>
                <ChevronRight size={18} color="rgba(255,255,255,0.4)" />
              </div>
            </Link>
          )}

          {/* Verification Card */}
          {!user.isVerified && !isEditing && (
            <div style={{
              ...cardStyle,
              background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.1), rgba(0,0,0,0))',
              border: '1px solid rgba(234, 179, 8, 0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'relative', zIndex: 2 }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'rgba(234, 179, 8, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#eab308'
                  }}>
                    <Shield size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 4 }}>
                      {(user as any).verificationRequested ? 'Заявка на проверке' : 'Пройдите верификацию'}
                    </h3>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 16, lineHeight: 1.5 }}>
                      {(user as any).verificationRequested 
                        ? 'Мы уже проверяем ваши данные. Обычно это занимает до 24 часов.' 
                        : 'Получите синюю галочку, чтобы повысить доверие рекламодателей и получать больше заказов.'}
                    </p>
                    
                    {!(user as any).verificationRequested && (
                      <button 
                        onClick={handleRequestVerification}
                        style={{
                          padding: '10px 20px',
                          background: '#eab308',
                          borderRadius: 12,
                          border: 'none',
                          color: 'black',
                          fontWeight: 600,
                          fontSize: 14,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8
                        }}
                      >
                        Подать заявку
                        <ChevronRight size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <VerificationModal
          isOpen={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          onSubmit={handleVerificationSubmit}
          userId={user?.id}
        />

        {/* Delete Account Button */}
        {!isEditing && (
          <div style={{ padding: '0 0 40px' }}>
            <button
              onClick={() => { setShowDeleteModal(true); setDeleteConfirmText('') }}
              style={{
                width: '100%',
                padding: '14px',
                background: 'transparent',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: 14,
                color: 'rgba(239, 68, 68, 0.7)',
                fontWeight: 500,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              🗑 Удалить аккаунт
            </button>
          </div>
        )}
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
        }}>
          <div style={{
            background: '#1a1a2e',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            borderLeft: '1px solid rgba(255,255,255,0.1)',
            borderRight: '1px solid rgba(255,255,255,0.1)',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: '24px 24px 48px',
            width: '100%',
            maxWidth: 600,
          }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 8 }}>
                Удалить аккаунт?
              </h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                Все ваши данные будут безвозвратно удалены: профиль, отклики, история чатов.
                Это действие нельзя отменить.
              </p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8, textAlign: 'center' }}>
                Введите <strong style={{ color: '#ef4444' }}>УДАЛИТЬ</strong> для подтверждения
              </p>
              <input
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(0,0,0,0.3)',
                  border: deleteConfirmText === 'УДАЛИТЬ' ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  color: 'white',
                  fontSize: 15,
                  outline: 'none',
                  textAlign: 'center',
                  fontWeight: 600,
                  letterSpacing: 2,
                  boxSizing: 'border-box',
                }}
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value.toUpperCase())}
                placeholder="УДАЛИТЬ"
              />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText('') }}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 14,
                  color: 'white',
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: 'pointer',
                }}
              >
                Отмена
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'УДАЛИТЬ' || isDeleting}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: deleteConfirmText === 'УДАЛИТЬ' ? '#ef4444' : 'rgba(239, 68, 68, 0.2)',
                  border: 'none',
                  borderRadius: 14,
                  color: deleteConfirmText === 'УДАЛИТЬ' ? 'white' : 'rgba(239, 68, 68, 0.5)',
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: deleteConfirmText === 'УДАЛИТЬ' ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                }}
              >
                {isDeleting ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
