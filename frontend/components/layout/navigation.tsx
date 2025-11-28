'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Home, Search, PlusCircle, MessageSquare, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const userRole = user?.role || 'blogger'

  if (!user) return null

  const navItems = [
    {
      href: '/dashboard',
      icon: Home,
      label: 'Главная',
      active: pathname === '/dashboard',
    },
    {
      href: userRole === 'blogger' ? '/offers' : '/bloggers',
      icon: Search,
      label: 'Поиск',
      active: pathname === (userRole === 'blogger' ? '/offers' : '/bloggers'),
    },
    {
      href: userRole === 'blogger' ? '/offers' : '/listings/create',
      icon: PlusCircle,
      label: userRole === 'blogger' ? 'Заказы' : 'Создать',
      active: pathname === (userRole === 'blogger' ? '/offers' : '/listings/create'),
      isSpecial: true, // Центральная кнопка
    },
    {
      href: '/messages',
      icon: MessageSquare,
      label: 'Чаты',
      active: pathname === '/messages',
    },
    {
      href: '/profile',
      icon: User,
      label: 'Профиль',
      active: pathname === '/profile',
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-telegram-bgSecondary/95 backdrop-blur-lg border-t border-white/5 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center w-full h-full transition-colors duration-200',
              item.active
                ? 'text-telegram-primary'
                : 'text-telegram-textSecondary hover:text-telegram-text'
            )}
          >
            <item.icon
              className={cn(
                'w-6 h-6 mb-1 transition-transform duration-200',
                item.active && 'scale-110',
                item.isSpecial && !item.active && 'text-telegram-accent'
              )}
              strokeWidth={item.active ? 2.5 : 2}
            />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

