'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  Briefcase, 
  FileText, 
  Shield,
  Settings,
  LogOut,
  Menu,
  X,
  TrendingUp,
  AlertCircle,
  Crown
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { Badge } from '@/components/ui/badge'
import { ADMIN_CONFIG } from '@/lib/constants'

const navigation = [
  { name: 'Дашборд', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Пользователи', href: '/admin/users', icon: Users },
  { name: 'Блогеры', href: '/admin/bloggers', icon: UserCheck },
  { name: 'Рекламодатели', href: '/admin/advertisers', icon: Briefcase },
  { name: 'Объявления', href: '/admin/listings', icon: FileText },
  { name: 'Модерация', href: '/admin/moderation', icon: Shield },
  { name: 'Настройки', href: '/admin/settings', icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pendingVerifications, setPendingVerifications] = useState<number>(0)

  const fetchModerationCount = async () => {
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/verification-requests`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('influenta_token')}` },
        cache: 'no-store'
      })
      if (resp.ok) {
        const arr = await resp.json()
        setPendingVerifications(Array.isArray(arr) ? arr.length : 0)
      } else {
        setPendingVerifications(0)
      }
    } catch {
      setPendingVerifications(0)
    }
  }

  useEffect(() => {
    fetchModerationCount()
  }, [pathname])

  // Слушаем кастомное событие на обновление счетчика
  useEffect(() => {
    const handler = () => fetchModerationCount()
    window.addEventListener('refreshModerationCount', handler as any)
    return () => window.removeEventListener('refreshModerationCount', handler as any)
  }, [])

  const handleLogout = () => {
    // Очищаем все админские cookie
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    document.cookie = 'adminTelegramId=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-telegram-bg">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{
          x: sidebarOpen ? 0 : '-100%',
        }}
        className={cn(
          'fixed top-0 left-0 bottom-0 w-64 bg-telegram-bgSecondary border-r border-gray-700/50 z-50 lg:translate-x-0 lg:static lg:z-auto transition-transform'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-telegram-primary to-telegram-accent rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">Admin Panel</h2>
                  <p className="text-xs text-telegram-textSecondary">Influencer Platform</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 hover:bg-telegram-bg rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href)
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg transition-all',
                    isActive
                      ? 'bg-telegram-primary text-white'
                      : 'text-telegram-textSecondary hover:bg-telegram-bg hover:text-telegram-text'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                  {item.name === 'Модерация' && pendingVerifications > 0 && (
                    <span className="ml-auto bg-telegram-danger text-white text-xs px-2 py-0.5 rounded-full">
                      {pendingVerifications}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-gray-700/50">
            <AdminUserInfo />
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-telegram-textSecondary hover:text-telegram-danger transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              Выйти
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <header className="bg-telegram-bgSecondary border-b border-gray-700/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-telegram-bg rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <h1 className="text-xl font-semibold">
              {navigation.find(item => pathname.startsWith(item.href))?.name || 'Admin'}
            </h1>
            
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-2 hover:bg-telegram-bg rounded-lg transition-colors"
              >
                <AlertCircle className="w-5 h-5" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-telegram-danger rounded-full" />
              </motion.button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

// Admin User Info Component
function AdminUserInfo() {
  const { user, isAdmin, isSuperAdmin } = useAuth()
  
  if (!user) return null
  
  const adminIndex = ADMIN_CONFIG.telegramIds.indexOf(parseInt(user.telegramId))
  const adminTitle = isSuperAdmin ? 'Супер Админ' : 'Администратор'
  
  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <div className="w-10 h-10 bg-gradient-to-br from-telegram-primary to-telegram-accent rounded-full flex items-center justify-center">
            {isSuperAdmin ? (
              <Crown className="w-5 h-5 text-white" />
            ) : (
              <Shield className="w-5 h-5 text-white" />
            )}
          </div>
          {isAdmin && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-telegram-success rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {adminIndex + 1}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm flex items-center gap-2">
            {user.firstName} {user.lastName}
            <Badge variant="primary" className="text-xs">
              {adminTitle}
            </Badge>
          </p>
          <p className="text-xs text-telegram-textSecondary">
            ID: {user.telegramId}
          </p>
        </div>
      </div>
      
      {isSuperAdmin && (
        <div className="mb-4 p-3 bg-telegram-primary/10 rounded-lg">
          <p className="text-xs text-telegram-primary flex items-center gap-2">
            <Crown className="w-3 h-3" />
            Полный доступ ко всем функциям
          </p>
        </div>
      )}
    </>
  )
}

