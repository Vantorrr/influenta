import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}

export function formatDate(date: Date | string | undefined | null): string {
  if (!date) return '—'
  const d = new Date(date as any)
  if (isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
}

export function formatDateTime(date: Date | string | undefined | null): string {
  if (!date) return '—'
  const d = new Date(date as any)
  if (isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(d)
}

export function getRelativeTime(date: Date | string | undefined | null): string {
  if (!date) return '—'
  const d = new Date(date as any)
  if (isNaN(d.getTime())) return '—'
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 7) {
    return formatDate(d)
  }
  if (days > 0) {
    return `${days} ${pluralize(days, 'день', 'дня', 'дней')} назад`
  }
  if (hours > 0) {
    return `${hours} ${pluralize(hours, 'час', 'часа', 'часов')} назад`
  }
  if (minutes > 0) {
    return `${minutes} ${pluralize(minutes, 'минуту', 'минуты', 'минут')} назад`
  }
  return 'только что'
}

export function pluralize(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10
  const mod100 = count % 100
  
  if (mod10 === 1 && mod100 !== 11) {
    return one
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return few
  }
  return many
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    lifestyle: 'Лайфстайл',
    tech: 'Технологии',
    beauty: 'Красота',
    fashion: 'Мода',
    food: 'Еда',
    travel: 'Путешествия',
    fitness: 'Фитнес',
    gaming: 'Игры',
    education: 'Образование',
    business: 'Бизнес',
    entertainment: 'Развлечения',
    other: 'Другое',
  }
  return labels[category.toLowerCase()] || category
}

export function getPostFormatLabel(format: string): string {
  const labels: Record<string, string> = {
    post: 'Пост',
    story: 'Сторис',
    reels: 'Reels',
    live: 'Эфир',
  }
  return labels[format.toLowerCase()] || format
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    // Listing statuses
    active: 'Активно',
    closed: 'Закрыто',
    paused: 'На паузе',
    completed: 'Завершено',
    // Response statuses
    pending: 'На рассмотрении',
    accepted: 'Принято',
    rejected: 'Отклонено',
    withdrawn: 'Отозвано',
  }
  return labels[status.toLowerCase()] || status
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    // Listing statuses
    active: 'text-green-500',
    closed: 'text-red-500',
    paused: 'text-yellow-500',
    completed: 'text-blue-500',
    // Response statuses
    pending: 'text-yellow-500',
    accepted: 'text-green-500',
    rejected: 'text-red-500',
    withdrawn: 'text-gray-500',
  }
  return colors[status.toLowerCase()] || 'text-gray-500'
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return `${str.slice(0, length)}...`
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      func(...args)
    }, delay)
  }
}

export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function generateInitials(firstName: string, lastName?: string): string {
  const first = firstName.charAt(0).toUpperCase()
  const last = lastName?.charAt(0).toUpperCase() || ''
  return first + last
}


