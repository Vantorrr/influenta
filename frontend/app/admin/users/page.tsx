'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search as SearchIcon, Shield, CheckCircle, User, MoreVertical, Ban } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { formatDate, getRelativeTime } from '@/lib/utils'
import { ADMIN_CONFIG } from '@/lib/constants'

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<'all' | 'blogger' | 'advertiser'>('all')
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bloggers/debug/all-users`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('influenta_token')}` }
        })
        const data = await resp.json()
        setUsers(Array.isArray(data) ? data : [])
      } catch (e: any) {
        setError(e?.message || 'Ошибка загрузки')
      } finally {
        setIsLoading(false)
      }
    })()
  }, [])

  const filteredUsers = (users || []).filter((user: any) => {
    if (!user) return false
    const q = search.toLowerCase()
    const matchesSearch = (user.firstName || '').toLowerCase().includes(q)
      || (user.lastName || '').toLowerCase().includes(q)
      || (user.username || '').toLowerCase().includes(q)
      || (user.email || '').toLowerCase().includes(q)
    const matchesRole = filterRole === 'all' || user.role === filterRole
    return matchesSearch && matchesRole
  })

  const stats = {
    total: users.length,
    active: users.filter((u: any) => !!u?.isActive).length,
    verified: users.filter((u: any) => !!u?.isVerified).length,
    bloggers: users.filter((u: any) => u?.role === 'blogger').length,
    advertisers: users.filter((u: any) => u?.role === 'advertiser').length,
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-telegram-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-telegram-primary mx-auto mb-4"></div>
          <p className="text-telegram-textSecondary">Загрузка пользователей...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-telegram-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-2">Ошибка</div>
          <p className="text-telegram-textSecondary">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Управление пользователями</h1>
        <p className="text-telegram-textSecondary">Всего пользователей: {stats.total}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-2xl font-bold">{stats.active}</p><p className="text-sm text-telegram-textSecondary">Активных</p></div><CheckCircle className="w-8 h-8 text-telegram-success" /></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-2xl font-bold">{stats.verified}</p><p className="text-sm text-telegram-textSecondary">Верифицированных</p></div><Shield className="w-8 h-8 text-telegram-primary" /></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-2xl font-bold">{stats.bloggers}</p><p className="text-sm text-telegram-textSecondary">Блогеров</p></div><User className="w-8 h-8 text-purple-500" /></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-2xl font-bold">{stats.advertisers}</p><p className="text-sm text-telegram-textSecondary">Рекламодателей</p></div><User className="w-8 h-8 text-green-500" /></div></CardContent></Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input type="search" placeholder="Поиск пользователей..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<SearchIcon className="w-4 h-4" />} />
        </div>
        <div className="flex gap-2">
          <Button variant={filterRole === 'all' ? 'primary' : 'secondary'} size="sm" onClick={() => setFilterRole('all')}>Все</Button>
          <Button variant={filterRole === 'blogger' ? 'primary' : 'secondary'} size="sm" onClick={() => setFilterRole('blogger')}>Блогеры</Button>
          <Button variant={filterRole === 'advertiser' ? 'primary' : 'secondary'} size="sm" onClick={() => setFilterRole('advertiser')}>Рекламодатели</Button>
        </div>
      </div>

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
                {filteredUsers.map((user: any, index: number) => (
                  <motion.tr key={user?.id || index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="border-b border-gray-700/50 hover:bg-telegram-bgSecondary/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar firstName={user?.firstName || ''} lastName={user?.lastName || ''} size="sm" />
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            {(user?.firstName || '')} {(user?.lastName || '')}
                            {ADMIN_CONFIG.telegramIds.includes(parseInt(user?.telegramId || '0')) && (
                              <Badge variant="primary" className="text-xs">{parseInt(user?.telegramId || '0') === ADMIN_CONFIG.telegramIds[0] ? 'Супер Админ' : 'Админ'}</Badge>
                            )}
                          </p>
                          <p className="text-sm text-telegram-textSecondary">{user?.username || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm">{user?.email || ''}</td>
                    <td className="p-4"><Badge variant={user?.role === 'blogger' ? 'primary' : (user?.role === 'advertiser' ? 'success' : 'secondary')}>{user?.role === 'blogger' ? 'Блогер' : user?.role === 'advertiser' ? 'Рекламодатель' : 'Пользователь'}</Badge></td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {user?.isActive ? <Badge variant="success">Активен</Badge> : <Badge variant="danger">Заблокирован</Badge>}
                        {user?.isVerified && <Shield className="w-4 h-4 text-telegram-primary" />}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-telegram-textSecondary">{formatDate(user?.createdAt)}</td>
                    <td className="p-4 text-sm text-telegram-textSecondary">{getRelativeTime(user?.lastLoginAt)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-1.5 hover:bg-telegram-bg rounded transition-colors" title="Подробнее"><MoreVertical className="w-4 h-4" /></motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-1.5 hover:bg-telegram-bg rounded transition-colors text-telegram-danger" title="Заблокировать"><Ban className="w-4 h-4" /></motion.button>
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

