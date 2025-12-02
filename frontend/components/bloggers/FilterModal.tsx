'use client'

import { useState, useEffect } from 'react'
import { X, Check, RotateCcw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
// Button removed - using native buttons for better touch responsiveness
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { BloggerFilters, BLOGGER_CATEGORIES } from '@/types' // Assuming these exist, if not I'll define them locally or fix imports
import { cn, getCategoryLabel } from '@/lib/utils'

// Fallback if types are not exported
const PLATFORMS = [
  { id: 'telegram', name: 'Telegram', icon: 'TG' },
  { id: 'instagram', name: 'Instagram', icon: 'IG' },
  { id: 'youtube', name: 'YouTube', icon: 'YT' },
  { id: 'tiktok', name: 'TikTok', icon: 'TT' },
  { id: 'vk', name: 'VK', icon: 'VK' },
  { id: 'twitter', name: 'Twitter', icon: 'TW' },
  { id: 'facebook', name: 'Facebook', icon: 'FB' },
  { id: 'twitch', name: 'Twitch', icon: 'TV' },
  { id: 'linkedin', name: 'LinkedIn', icon: 'IN' },
  { id: 'other', name: 'Other', icon: 'OT' },
]

const MAIN_PLATFORMS = PLATFORMS.slice(0, 5)
const OTHER_PLATFORMS = PLATFORMS.slice(5)

interface FilterModalProps {
  isOpen: boolean
  onClose: () => void
  filters: BloggerFilters
  onApply: (filters: BloggerFilters) => void
}

export function FilterModal({ isOpen, onClose, filters, onApply }: FilterModalProps) {
  const [localFilters, setLocalFilters] = useState<BloggerFilters>(filters)
  const [showAllPlatforms, setShowAllPlatforms] = useState(false)

  // Sync when opening
  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters)
      // If selected platform is not in main, expand automatically
      const isOtherSelected = filters.platform && !MAIN_PLATFORMS.find(p => p.id === filters.platform)
      if (isOtherSelected) setShowAllPlatforms(true)
    }
  }, [isOpen, filters])

  const handleCategoryToggle = (cat: string) => {
    setLocalFilters(prev => {
      const current = prev.categories || []
      const exists = current.includes(cat)
      return {
        ...prev,
        categories: exists 
          ? current.filter(c => c !== cat)
          : [...current, cat]
      }
    })
  }

  const handlePlatformToggle = (platform: string) => {
     setLocalFilters(prev => ({
        ...prev,
        platform: prev.platform === platform ? undefined : platform
     }))
  }

  const handleReset = () => {
    setLocalFilters({})
    setShowAllPlatforms(false)
  }

  const handleApply = () => {
    onApply(localFilters)
    onClose()
  }

  // Категории синхронизированы с onboarding
  const categories = [
    'lifestyle', 'tech', 'beauty', 'fashion', 'food', 
    'travel', 'fitness', 'gaming', 'education', 'business',
    'entertainment', 'humor', 'other'
  ]

  if (!isOpen) return null

  const visiblePlatforms = showAllPlatforms ? PLATFORMS : MAIN_PLATFORMS

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[99999]"
          style={{ touchAction: 'manipulation' }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80"
            onClick={onClose}
            onTouchEnd={(e) => { e.preventDefault(); onClose(); }}
            style={{ touchAction: 'manipulation' }}
          />

          {/* Drawer/Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 bg-[#1C1E20] rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl border-t border-white/10"
            style={{ touchAction: 'manipulation' }}
          >
            {/* Handle bar for visual cue */}
            <div 
              className="w-full flex justify-center pt-3 pb-1" 
              onClick={onClose}
              onTouchEnd={(e) => { e.preventDefault(); onClose(); }}
              style={{ touchAction: 'manipulation' }}
            >
              <div className="w-12 h-1.5 bg-white/10 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-6 pb-4 flex items-center justify-between border-b border-white/5">
              <h2 className="text-xl font-bold text-white">Фильтры</h2>
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={handleReset}
                  onTouchEnd={(e) => { e.preventDefault(); handleReset(); }}
                  className="p-2 text-telegram-textSecondary active:text-white"
                  style={{ touchAction: 'manipulation' }}
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button 
                  type="button"
                  onClick={onClose}
                  onTouchEnd={(e) => { e.preventDefault(); onClose(); }}
                  className="rounded-full w-8 h-8 p-0 flex items-center justify-center text-white active:bg-white/10"
                  style={{ touchAction: 'manipulation' }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 overscroll-contain">
              
              {/* Platforms */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-telegram-textSecondary uppercase tracking-wider">
                  Платформа
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {visiblePlatforms.map(p => {
                    const isActive = localFilters.platform === p.id
                    return (
                      <button
                        key={p.id}
                        onClick={() => handlePlatformToggle(p.id)}
                        className={cn(
                          "py-3 px-2 rounded-xl border transition-all flex items-center justify-center gap-2",
                          isActive 
                            ? "bg-telegram-primary/10 border-telegram-primary text-telegram-primary" 
                            : "bg-telegram-bg border-white/5 text-telegram-textSecondary hover:bg-white/5"
                        )}
                      >
                        <span className="font-semibold text-sm truncate">{p.name}</span>
                        {isActive && <Check className="w-3 h-3 flex-shrink-0" />}
                      </button>
                    )
                  })}
                  {!showAllPlatforms && (
                    <button
                      onClick={() => setShowAllPlatforms(true)}
                      className="py-3 px-2 rounded-xl border border-white/5 bg-telegram-bg text-telegram-textSecondary hover:bg-white/5 transition-all flex items-center justify-center"
                    >
                      <span className="font-semibold text-sm">Другие...</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-telegram-textSecondary uppercase tracking-wider">
                  Цена за пост (₽)
                </label>
                <div className="flex gap-4 items-center">
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      placeholder="От"
                      value={localFilters.minPrice || ''}
                      onChange={e => setLocalFilters(p => ({ ...p, minPrice: e.target.value ? Number(e.target.value) : undefined }))}
                      className="bg-telegram-bg border-white/5 focus:border-telegram-primary"
                    />
                  </div>
                  <span className="text-white/20">—</span>
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      placeholder="До"
                      value={localFilters.maxPrice || ''}
                      onChange={e => setLocalFilters(p => ({ ...p, maxPrice: e.target.value ? Number(e.target.value) : undefined }))}
                      className="bg-telegram-bg border-white/5 focus:border-telegram-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Subscribers Range */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-telegram-textSecondary uppercase tracking-wider">
                  Подписчики
                </label>
                <div className="flex gap-4 items-center">
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      placeholder="От"
                      value={localFilters.minSubscribers || ''}
                      onChange={e => setLocalFilters(p => ({ ...p, minSubscribers: e.target.value ? Number(e.target.value) : undefined }))}
                      className="bg-telegram-bg border-white/5 focus:border-telegram-primary"
                    />
                  </div>
                  <span className="text-white/20">—</span>
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      placeholder="До"
                      value={localFilters.maxSubscribers || ''}
                      onChange={e => setLocalFilters(p => ({ ...p, maxSubscribers: e.target.value ? Number(e.target.value) : undefined }))}
                      className="bg-telegram-bg border-white/5 focus:border-telegram-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Views 30 days */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-telegram-textSecondary uppercase tracking-wider">
                  Просмотры за 30 дней
                </label>
                <div className="flex gap-4 items-center">
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      placeholder="От"
                      value={localFilters.minViews30days || ''}
                      onChange={e => setLocalFilters(p => ({ ...p, minViews30days: e.target.value ? Number(e.target.value) : undefined }))}
                      className="bg-telegram-bg border-white/5 focus:border-telegram-primary"
                    />
                  </div>
                  <span className="text-white/20">—</span>
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      placeholder="До"
                      value={localFilters.maxViews30days || ''}
                      onChange={e => setLocalFilters(p => ({ ...p, maxViews30days: e.target.value ? Number(e.target.value) : undefined }))}
                      className="bg-telegram-bg border-white/5 focus:border-telegram-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Unique Viewers 30 days */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-telegram-textSecondary uppercase tracking-wider">
                  Уникальные зрители за 30 дней
                </label>
                <div className="flex gap-4 items-center">
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      placeholder="От"
                      value={localFilters.minUniqueViewers30days || ''}
                      onChange={e => setLocalFilters(p => ({ ...p, minUniqueViewers30days: e.target.value ? Number(e.target.value) : undefined }))}
                      className="bg-telegram-bg border-white/5 focus:border-telegram-primary"
                    />
                  </div>
                  <span className="text-white/20">—</span>
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      placeholder="До"
                      value={localFilters.maxUniqueViewers30days || ''}
                      onChange={e => setLocalFilters(p => ({ ...p, maxUniqueViewers30days: e.target.value ? Number(e.target.value) : undefined }))}
                      className="bg-telegram-bg border-white/5 focus:border-telegram-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-telegram-textSecondary uppercase tracking-wider">
                  Категории
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => {
                    const isActive = (localFilters.categories || []).includes(cat)
                    return (
                      <button
                        key={cat}
                        onClick={() => handleCategoryToggle(cat)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-sm transition-all border",
                          isActive
                            ? "bg-telegram-primary text-white border-telegram-primary"
                            : "bg-telegram-bg text-telegram-textSecondary border-white/5 hover:border-white/20"
                        )}
                      >
                        {getCategoryLabel(cat)}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Verified Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-telegram-bg border border-white/5">
                <span className="font-medium text-white">Только верифицированные</span>
                <button
                  onClick={() => setLocalFilters(p => ({ ...p, verifiedOnly: !p.verifiedOnly }))}
                  className={cn(
                    "w-12 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out",
                    localFilters.verifiedOnly ? "bg-telegram-primary" : "bg-white/10"
                  )}
                >
                  <div 
                    className={cn(
                      "w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ease-in-out",
                      localFilters.verifiedOnly ? "translate-x-5" : "translate-x-0"
                    )} 
                  />
                </button>
              </div>
              
              {/* Spacer for safe area */}
              <div className="h-8" />
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-white/5 bg-[#1C1E20] pb-[calc(3rem+env(safe-area-inset-bottom))]">
              <button 
                type="button"
                onClick={handleApply}
                onTouchEnd={(e) => { e.preventDefault(); handleApply(); }}
                className="w-full py-4 text-lg font-semibold bg-telegram-primary active:bg-telegram-primary/80 text-white rounded-xl shadow-lg"
                style={{ touchAction: 'manipulation', minHeight: 56 }}
              >
                Показать результаты
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

