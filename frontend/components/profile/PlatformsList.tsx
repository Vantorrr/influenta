'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Eye, ExternalLink, Send } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatNumber, formatPrice } from '@/lib/utils'
import { SocialPlatform } from '@/types'
import { getPlatformIcon, platformLabels } from '@/components/icons/PlatformIcons'

interface PlatformsListProps {
  platforms: SocialPlatform[]
  isAdmin?: boolean
  telegramUsername?: string
}

export function PlatformsList({ platforms, isAdmin, telegramUsername }: PlatformsListProps) {
  if (!platforms || platforms.length === 0) {
    return (
      <div className="text-center py-8 text-telegram-textSecondary">
        Нет добавленных социальных сетей
      </div>
    )
  }

  const handleOpenTelegram = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (telegramUsername) {
      const username = telegramUsername.replace('@', '')
      window.open(`https://t.me/${username}`, '_blank')
    }
  }

  return (
    <div className="space-y-3">
      {isAdmin && telegramUsername && (
        <Button
          variant="primary"
          fullWidth
          onClick={handleOpenTelegram}
          className="mb-3"
        >
          <Send className="w-4 h-4 mr-2" />
          Открыть Telegram профиль (@{telegramUsername.replace('@', '')})
        </Button>
      )}
      
      {platforms.map((platform, index) => (
        <motion.div
          key={platform.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="border border-telegram-border rounded-lg p-4 cursor-pointer hover:border-telegram-primary/50 hover:bg-telegram-bg/50 transition-all"
          onClick={() => {
            if (platform.url) {
              window.open(platform.url, '_blank')
            }
          }}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-telegram-bg flex items-center justify-center flex-shrink-0">
              {getPlatformIcon(platform.platform, { size: 20 })}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold">
                  {platformLabels[platform.platform]}
                </h4>
                {platform.isPrimary && (
                  <Badge variant="primary" className="text-xs">
                    Основная
                  </Badge>
                )}
                {platform.url && (
                  <ExternalLink className="w-4 h-4 text-telegram-textSecondary ml-auto" />
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
                {(platform.pricePerPost || platform.pricePerPost === -1) && (
                  <div>
                    <span className="text-telegram-textSecondary">Пост: </span>
                    <span className="font-medium">{formatPrice(platform.pricePerPost)}</span>
                  </div>
                )}
                {(platform.pricePerStory || platform.pricePerStory === -1) && (
                  <div>
                    <span className="text-telegram-textSecondary">Сторис: </span>
                    <span className="font-medium">{formatPrice(platform.pricePerStory)}</span>
                  </div>
                )}
                {(platform.pricePerReel || platform.pricePerReel === -1) && (
                  <div>
                    <span className="text-telegram-textSecondary">Reels: </span>
                    <span className="font-medium">{formatPrice(platform.pricePerReel)}</span>
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
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(url, '_blank')
                      }}
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
        </motion.div>
      ))}
    </div>
  )
}

