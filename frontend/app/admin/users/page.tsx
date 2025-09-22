'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Search as SearchIcon, 
  Filter,
  MoreVertical,
  Shield,
  Ban,
  CheckCircle,
  XCircle,
  Mail,
  Calendar,
  User
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { formatDate, getRelativeTime } from '@/lib/utils'
import { ADMIN_CONFIG } from '@/lib/constants'

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<'all' | 'blogger' | 'advertiser'>('all')

  // Mock данные
  const users = [
    {
      id: '0',
      firstName: 'Супер',
      lastName: 'Админ',
      username: '@superadmin',
      email: 'admin@example.com',
      telegramId: '741582706',
      role: 'admin',
      isActive: true,
      isVerified: true,
      createdAt: new Date('2023-01-01'),
      lastLoginAt: new Date(Date.now() - 1000 * 60 * 5),
    },
    {
      id: '0-2',
      firstName: 'Админ',
      lastName: '#2',
      username: '@admin2',
      email: 'admin2@example.com',
      telegramId: '8141463258',
      role: 'admin',
      isActive: true,
      isVerified: true,
      createdAt: new Date('2023-01-01'),
      lastLoginAt: new Date(Date.now() - 1000 * 60 * 15),
    },
    {
      id: '1',
      firstName: 'Анна',
      lastName: 'Иванова',
      username: '@anna_lifestyle',
      email: 'anna@example.com',
      telegramId: '123456789',
      role: 'blogger',
      isActive: true,
      isVerified: true,
      createdAt: new Date('2024-01-15'),
      lastLoginAt: new Date(Date.now() - 1000 * 60 * 30),
    },
    {
      id: '2',
      firstName: 'Михаил',
      lastName: 'Петров',
      username: '@tech_mike',
      email: 'mike@example.com',
      telegramId: '987654321',
      role: 'blogger',
      isActive: true,
      isVerified: true,
      createdAt: new Date('2024-02-20'),
      lastLoginAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
    {
      id: '3',
      firstName: 'TechBrand',
      lastName: '',
      username: '@techbrand_official',
      email: 'contact@techbrand.com',
      telegramId: '555666777',
      role: 'advertiser',
      isActive: true,
      isVerified: false,
      createdAt: new Date('2024-03-10'),
      lastLoginAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
    {
      id: '4',
      firstName: 'Спам',
      lastName: 'Юзер',
      username: '@spam_user',
      email: 'spam@example.com',
      telegramId: '111222333',
      role: 'blogger',
      isActive: false,
      isVerified: false,
      createdAt: new Date('2024-04-01'),
      lastLoginAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    },
  ]

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(search.toLowerCase()) ||
      user.lastName.toLowerCase().includes(search.toLowerCase()) ||
      user.username.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
    
    const matchesRole = filterRole === 'all' || user.role === filterRole
    
    return matchesSearch && matchesRole
  })

  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    verified: users.filter(u => u.isVerified).length,
    bloggers: users.filter(u => u.role === 'blogger').length,
    advertisers: users.filter(u => u.role === 'advertiser').length,
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Управление пользователями</h1>
        <p className="text-telegram-textSecondary">
          Всего пользователей: {stats.total}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-sm text-telegram-textSecondary">Активных</p>
              </div>
              <CheckCircle className="w-8 h-8 text-telegram-success" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.verified}</p>
                <p className="text-sm text-telegram-textSecondary">Верифицированных</p>
              </div>
              <Shield className="w-8 h-8 text-telegram-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.bloggers}</p>
                <p className="text-sm text-telegram-textSecondary">Блогеров</p>
              </div>
              <User className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.advertisers}</p>
                <p className="text-sm text-telegram-textSecondary">Рекламодателей</p>
              </div>
              <User className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            type="search"
            placeholder="Поиск пользователей..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<SearchIcon className="w-4 h-4" />}
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={filterRole === 'all' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilterRole('all')}
          >
            Все
          </Button>
          <Button
            variant={filterRole === 'blogger' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilterRole('blogger')}
          >
            Блогеры
          </Button>
          <Button
            variant={filterRole === 'advertiser' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilterRole('advertiser')}
          >
            Рекламодатели
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-700/50">
                <tr className="text-left">
                  <th className="p-4 font-medium text-telegram-textSecondary">Пользователь</th>
                  <th className="p-4 font-medium text-telegram-textSecondary">Email</th>
                  <th className="p-4 font-medium text-telegram-textSecondary">Роль</th>
                  <th className="p-4 font-medium text-telegram-textSecondary">Статус</th>
                  <th className="p-4 font-medium text-telegram-textSecondary">Регистрация</th>
                  <th className="p-4 font-medium text-telegram-textSecondary">Последний вход</th>
                  <th className="p-4 font-medium text-telegram-textSecondary">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-700/50 hover:bg-telegram-bgSecondary/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          firstName={user.firstName}
                          lastName={user.lastName}
                          size="sm"
                        />
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            {user.firstName} {user.lastName}
                            {ADMIN_CONFIG.telegramIds.includes(parseInt(user.telegramId || '0')) && (
                              <Badge variant="primary" className="text-xs">
                                {parseInt(user.telegramId || '0') === ADMIN_CONFIG.telegramIds[0] ? 'Супер Админ' : 'Админ'}
                              </Badge>
                            )}
                          </p>
                          <p className="text-sm text-telegram-textSecondary">
                            {user.username}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm">{user.email}</td>
                    <td className="p-4">
                      <Badge variant={user.role === 'blogger' ? 'primary' : 'success'}>
                        {user.role === 'blogger' ? 'Блогер' : 'Рекламодатель'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {user.isActive ? (
                          <Badge variant="success">Активен</Badge>
                        ) : (
                          <Badge variant="danger">Заблокирован</Badge>
                        )}
                        {user.isVerified && (
                          <Shield className="w-4 h-4 text-telegram-primary" />
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-telegram-textSecondary">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="p-4 text-sm text-telegram-textSecondary">
                      {getRelativeTime(user.lastLoginAt)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-1.5 hover:bg-telegram-bg rounded transition-colors"
                          title="Подробнее"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </motion.button>
                        
                        {user.isActive ? (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-1.5 hover:bg-telegram-bg rounded transition-colors text-telegram-danger"
                            title="Заблокировать"
                          >
                            <Ban className="w-4 h-4" />
                          </motion.button>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-1.5 hover:bg-telegram-bg rounded transition-colors text-telegram-success"
                            title="Разблокировать"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </motion.button>
                        )}
                        
                        {!user.isVerified && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-1.5 hover:bg-telegram-bg rounded transition-colors text-telegram-primary"
                            title="Верифицировать"
                          >
                            <Shield className="w-4 h-4" />
                          </motion.button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
