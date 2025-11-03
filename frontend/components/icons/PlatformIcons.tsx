import React from 'react'

interface IconProps {
  className?: string
  size?: number
}

export const TelegramIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path fill="currentColor" d="M21.94 2.34a1.2 1.2 0 0 0-1.27-.17L2.72 10.45c-1.16.56-1.14 2.24.03 2.76l4.7 2.1c.5.22 1.08.17 1.54-.14l8.37-5.82c.15-.11.32.1.2.24l-6.2 6.87c-.38.42-.33 1.08.1 1.44l3.5 2.98c.53.45 1.35.22 1.6-.44l6.23-16.64c.22-.6-.05-1.27-.58-1.5Z"/>
  </svg>
)

export const InstagramIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" strokeWidth="2"/>
    <circle cx="17.5" cy="6.5" r="1.3" fill="currentColor"/>
  </svg>
)

export const YouTubeIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path fill="currentColor" d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8ZM9.5 15.5v-7l6.5 3.5-6.5 3.5Z"/>
  </svg>
)

export const TikTokIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path fill="currentColor" d="M19.6 6.8a5 5 0 0 1-5-5h-3.7v13.5a3.1 3.1 0 1 1-2.2-3v-3.8a6.9 6.9 0 1 0 4 6.3V7.7a8.8 8.8 0 0 0 5 1.5V5.5a5 5 0 0 1-1.9-1.3Z"/>
  </svg>
)

export const VKIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path fill="currentColor" d="M21.5 7c.2-.7 0-1.2-.9-1.2h-3c-.8 0-1.1.4-1.3.9 0 0-1.6 3.8-3.8 6.3-.7.7-1 1-1.4 1-.2 0-.5-.2-.5-1V7c0-.8-.2-1.2-1-1.2H6.1c-.5 0-.8.4-.8.7 0 .8 1.2.9 1.3 3.1v4.7c0 1-.2 1.2-.6 1.2-1.1 0-3.8-4.1-5.4-8.7C.3 6 0 5.8-.8 5.8h-3c-.9 0-1 .4-1 .9 0 .8.8 5 5.3 10.4 2.8 3.5 6.7 5.4 10.3 5.4 2.1 0 2.4-.5 2.4-1.3v-3c0-.9.2-1.1.9-1.1.5 0 1.3.2 3.3 2.2 2.3 2.3 2.6 3.3 3.9 3.3h3c.9 0 1.3-.5 1.1-1.4-.3-.9-1.3-2.2-2.6-3.7-.7-.9-1.8-1.8-2.1-2.3-.5-.6-.4-.9 0-1.4 0 0 4.1-5.8 4.5-7.8Z"/>
  </svg>
)

export const TwitterIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)

export const FacebookIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path fill="currentColor" d="M24 12c0-6.6-5.4-12-12-12S0 5.4 0 12c0 6 4.4 10.9 10.1 11.9v-8.4H7.1V12h3v-2.6c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.8V12h3.3l-.5 3.5h-2.8v8.4C19.6 22.9 24 18 24 12Z"/>
  </svg>
)

export const TwitchIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path fill="currentColor" d="M11.6 3.4h1.7v5.1h-1.7V3.4zm4.6 0H18v5.1h-1.7V3.4zM5.6 1 2 4.6v14.9h5.1V23l3.4-3.4h2.9L20.3 13V1H5.6zm13.1 11.1-2.9 2.9h-2.9l-2.6 2.6v-2.6H6.9V2.3h11.8v9.8z"/>
  </svg>
)

export const LinkedInIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path fill="currentColor" d="M20.5 2h-17A1.5 1.5 0 0 0 2 3.5v17A1.5 1.5 0 0 0 3.5 22h17a1.5 1.5 0 0 0 1.5-1.5v-17A1.5 1.5 0 0 0 20.5 2ZM8 19H5v-9h3v9ZM6.5 8.3A1.8 1.8 0 1 1 8.3 6.5 1.8 1.8 0 0 1 6.5 8.3ZM19 19h-3v-4.7c0-1.1-.4-1.9-1.4-1.9a1.5 1.5 0 0 0-1.4 1 1.7 1.7 0 0 0-.1.7V19h-3v-9h3v1.2a2.7 2.7 0 0 1 2.5-1.4c1.8 0 3.2 1.2 3.2 3.7V19Z"/>
  </svg>
)

export const OtherIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path fill="currentColor" d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2Zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8Zm-1-13h2v6h-2Zm0 8h2v2h-2Z"/>
  </svg>
)

export const getPlatformIcon = (platform: string, props?: IconProps) => {
  switch (platform) {
    case 'telegram': return <TelegramIcon {...props} />
    case 'instagram': return <InstagramIcon {...props} />
    case 'youtube': return <YouTubeIcon {...props} />
    case 'tiktok': return <TikTokIcon {...props} />
    case 'vk': return <VKIcon {...props} />
    case 'twitter': return <TwitterIcon {...props} />
    case 'facebook': return <FacebookIcon {...props} />
    case 'twitch': return <TwitchIcon {...props} />
    case 'linkedin': return <LinkedInIcon {...props} />
    default: return <OtherIcon {...props} />
  }
}

export const platformLabels: Record<string, string> = {
  telegram: 'Telegram',
  instagram: 'Instagram',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  vk: 'VKontakte',
  twitter: 'Twitter/X',
  facebook: 'Facebook',
  twitch: 'Twitch',
  linkedin: 'LinkedIn',
  other: 'Другое',
}


