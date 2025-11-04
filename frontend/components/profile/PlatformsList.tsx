import React from 'react'
import { Eye, RubIcon } from 'lucide-react'
import { RubIcon } from '@/components/ui/ruble-icon'
import { SocialPlatform } from '@/types'
import { getPlatformIcon, platformLabels } from '@/components/icons/PlatformIcons'
import { formatNumber, formatPrice } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface PlatformsListProps {
  platforms: SocialPlatform[]
  compact?: boolean
}

export function PlatformsList({ platforms, compact = false }: PlatformsListProps) {
  if (platforms.length === 0) return null

  const sortedPlatforms = [...platforms].sort((a, b) => {
    if (a.isPrimary) return -1
    if (b.isPrimary) return 1
    return b.subscribersCount - a.subscribersCount
  })

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {sortedPlatforms.map((platform) => (
          <div
            key={platform.id}
            className="flex items-center gap-2 px-3 py-1.5 bg-telegram-bg rounded-lg"
          >
            {getPlatformIcon(platform.platform, { size: 16 })}
            <span className="text-sm">{formatNumber(platform.subscribersCount)}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sortedPlatforms.map((platform) => (
        <div
          key={platform.id}
          className="flex items-start gap-3 p-3 bg-telegram-bg/50 rounded-lg"
        >
          <div className="w-10 h-10 rounded-lg bg-telegram-bgSecondary flex items-center justify-center flex-shrink-0">
            {getPlatformIcon(platform.platform, { size: 20 })}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium">
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
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-telegram-textSecondary" />
                <span>{formatNumber(platform.subscribersCount)} подписчиков</span>
              </div>
              {platform.pricePerPost && (
                <div className="flex items-center gap-1">
                  <RubIcon className="w-3.5 h-3.5 text-telegram-textSecondary" />
                  <span>Пост: {formatPrice(platform.pricePerPost)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}




