'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, FileText, MessageCircle, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Главная' },
  { href: '/bloggers', icon: Users, label: 'Блогеры' },
  { href: '/listings', icon: FileText, label: 'Объявления' },
  { href: '/messages', icon: MessageCircle, label: 'Сообщения' },
  { href: '/profile', icon: User, label: 'Профиль' },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-telegram-bg border-t border-telegram-border">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
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
              <Icon className="w-5 h-5 mb-1 relative z-10" />
              <span className="text-xs relative z-10">{item.label}</span>
            </Link>
          )
        })}
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
