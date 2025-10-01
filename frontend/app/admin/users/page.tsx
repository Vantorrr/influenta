"use client"

import { useEffect, useMemo, useState } from 'react'
import { Layout } from '@/components/layout/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

type AnyUser = {
  id?: string
  telegramId?: string
  firstName?: string
  lastName?: string
  username?: string
  role?: 'blogger' | 'advertiser' | 'admin'
  isVerified?: boolean
  isActive?: boolean
  createdAt?: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AnyUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<'all' | 'blogger' | 'advertiser' | 'admin'>('all')

  useEffect(() => {
    ;(async () => {
      try {
        const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bloggers/debug/all-users`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('influenta_token')}` },
          cache: 'no-store',
        })
        if (!resp.ok) throw new Error('Не удалось загрузить пользователей')
        const data = await resp.json()
        const arr = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : [])
        setUsers(arr)
      } catch (e: any) {
        setError(e?.message || 'Ошибка загрузки')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    return users.filter(u => {
      if (role !== 'all' && (u.role || '').toLowerCase() !== role) return false
      if (!s) return true
      const hay = `${u.firstName || ''} ${u.lastName || ''} ${u.username || ''} ${u.telegramId || ''}`.toLowerCase()
      return hay.includes(s)
    })
  }, [users, role, search])

  if (loading) {
    return (
      <Layout>
        <div className="container py-6 text-telegram-textSecondary">Загрузка пользователей…</div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="container py-6">
          <Card>
            <CardContent className="p-6 text-telegram-danger">{error}</CardContent>
          </Card>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container py-6 space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <Input
            placeholder="Поиск по имени, @юзернейму или Telegram ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="input" value={role} onChange={(e) => setRole(e.target.value as any)}>
            <option value="all">Все роли</option>
            <option value="blogger">Блогеры</option>
            <option value="advertiser">Рекламодатели</option>
            <option value="admin">Админы</option>
          </select>
          <Badge variant="default">Всего: {users.length}</Badge>
          <Badge variant="default">Отфильтровано: {filtered.length}</Badge>
        </div>

        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-telegram-bgSecondary text-telegram-textSecondary">
                <tr>
                  <th className="text-left px-4 py-3">Имя</th>
                  <th className="text-left px-4 py-3">Юзернейм</th>
                  <th className="text-left px-4 py-3">Роль</th>
                  <th className="text-left px-4 py-3">Статусы</th>
                  <th className="text-left px-4 py-3">Telegram ID</th>
                  <th className="text-left px-4 py-3">Создан</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, idx) => (
                  <tr key={u.id || idx} className="border-t border-gray-700/50">
                    <td className="px-4 py-3 whitespace-nowrap">{`${u.firstName || ''} ${u.lastName || ''}`.trim() || '—'}</td>
                    <td className="px-4 py-3">{u.username ? `@${u.username}` : '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant="default">{u.role || '—'}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {u.isActive ? <Badge variant="default">Активен</Badge> : <Badge variant="default">Неактивен</Badge>}
                        {u.isVerified ? <Badge variant="default">Вериф.</Badge> : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">{u.telegramId || '—'}</td>
                    <td className="px-4 py-3">{u.createdAt ? new Date(u.createdAt).toLocaleString('ru-RU') : '—'}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-telegram-textSecondary" colSpan={6}>Ничего не найдено</td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}


