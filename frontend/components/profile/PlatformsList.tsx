import React from 'react'
import { Eye } from 'lucide-react'
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
            {platform.url && (
              <a href={platform.url} target="_blank" rel="noopener noreferrer" className="text-sm text-telegram-primary underline mb-2 inline-block">
                Открыть профиль
              </a>
            )}
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-telegram-textSecondary" />
                <span>{formatNumber(platform.subscribersCount)} подписчиков</span>
              </div>
              {(platform.pricePerPost || platform.pricePerPost === -1) && (
                <div className="flex items-center gap-1">
                  <RubIcon className="w-3.5 h-3.5 text-telegram-textSecondary" />
                  <span onClick={() => alert(`DEBUG: pricePerPost = ${platform.pricePerPost}, type = ${typeof platform.pricePerPost}`)}>Пост: {(platform.pricePerPost === -1 || platform.pricePerPost === '-1' || Number(platform.pricePerPost) === -1 || platform.pricePerPost < 0) ? 'Договорная' : formatPrice(platform.pricePerPost)}</span>
                </div>
              )}
            </div>

            {Array.isArray(platform.statisticsScreenshots) && platform.statisticsScreenshots.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {platform.statisticsScreenshots.slice(0, 6).map((src, idx) => (
                  <button key={idx} onClick={() => window.open(src, "_blank")} className="relative group" aria-label="Открыть скриншот">
                    <img src={src} alt="Скриншот статистики" loading="lazy" className="w-full h-24 object-cover rounded-lg border border-telegram-border group-hover:opacity-90" onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden" }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}




