'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, FileText, MessageCircle, User, Shield, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import { messagesApi } from '@/lib/api'

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Главная' },
  { href: '/bloggers', icon: Users, label: 'Блогеры' },
  { href: '/listings', icon: FileText, label: 'Объявления' },
  { href: '/messages', icon: MessageCircle, label: 'Сообщения' },
  { href: '/profile', icon: User, label: 'Профиль' },
]

const adminNavItems = [
  { href: '/admin/dashboard', icon: Shield, label: 'Админка' },
  { href: '/admin/verification', icon: CheckCircle, label: 'Верификация' },
  { href: '/dashboard', icon: Home, label: 'Назад' },
]

export function Navigation() {
  const pathname = usePathname()
  const { isAdmin } = useAuth()
  const [unread, setUnread] = useState<number>(0)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await messagesApi.getUnreadCount()
        const data = (res as any)?.data || res
        const count = typeof data?.count === 'number' ? data.count : (data?.count || 0)
        setUnread(count)
      } catch {
        setUnread(0)
      }
    })()
  }, [pathname])
  
  // Показываем админские ссылки только для админов и только на админских страницах
  const isAdminPage = pathname?.startsWith('/admin')
  const currentNavItems = isAdminPage && isAdmin ? adminNavItems : navItems

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-telegram-bg border-t border-telegram-border">
      <div className="flex justify-around items-center h-16">
        {currentNavItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full relative',
                'text-telegram-textSecondary transition-colors',
                isActive && 'text-telegram-primary'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-telegram-primary/10"
                  initial={false}
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 35,
                  }}
                />
              )}
              <div className="relative">
                <Icon className="w-5 h-5 mb-1 relative z-10" />
                {item.href === '/messages' && unread > 0 && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 bg-telegram-primary text-white text-[10px] rounded-full flex items-center justify-center z-10">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </div>
              <span className="text-xs relative z-10">{item.label}</span>
            </Link>
          )
        })}
        {/* Показываем кнопку админки только админам на обычных страницах */}
        {isAdmin && !isAdminPage && (
          <Link
            href="/admin/dashboard"
            className="flex flex-col items-center justify-center flex-1 h-full relative text-telegram-textSecondary"
          >
            <Shield className="w-5 h-5 mb-1 relative z-10" />
            <span className="text-xs relative z-10">Админ</span>
          </Link>
        )}
      </div>
    </nav>
  )
}

export function Header({ title }: { title: string }) {
  return (
    <header className="fixed top-0 left-0 right-0 bg-telegram-bg border-b border-telegram-border z-10">
      <div className="flex items-center justify-center h-14">
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
    </header>
  )
}

export { Layout } from './Layout'







