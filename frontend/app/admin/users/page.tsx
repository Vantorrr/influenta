'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Ban, CheckCircle } from 'lucide-react'

type AnyUser = {
  id?: string
  telegramId?: string
  firstName?: string
  lastName?: string
  username?: string
  role?: 'blogger' | 'advertiser' | 'admin'
  isVerified?: boolean
  isActive?: boolean
  isBanned?: boolean
  banReason?: string
  createdAt?: string
}

const API = process.env.NEXT_PUBLIC_API_URL

function authHeaders() {
  return {
    Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('influenta_token') : ''}`,
    'Content-Type': 'application/json',
  }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AnyUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<'all' | 'blogger' | 'advertiser' | 'admin'>('all')
  const [filterBanned, setFilterBanned] = useState<'all' | 'banned' | 'ok'>('all')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const resp = await fetch(`${API}/bloggers/debug/all-users`, {
        headers: authHeaders(),
        cache: 'no-store',
      })
      if (!resp.ok) throw new Error('Не удалось загрузить пользователей')
      const data = await resp.json()
      const arr = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
      setUsers(arr)
    } catch (e: any) {
      setError(e?.message || 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    const sorted = [...users].sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return db - da
    })
    return sorted.filter((u) => {
      if (role !== 'all' && (u.role || '').toLowerCase() !== role) return false
      if (filterBanned === 'banned' && !u.isBanned) return false
      if (filterBanned === 'ok' && u.isBanned) return false
      if (!s) return true
      const hay = `${u.firstName || ''} ${u.lastName || ''} ${u.username || ''} ${u.telegramId || ''}`.toLowerCase()
      return hay.includes(s)
    })
  }, [users, role, search, filterBanned])

  const banUser = async (u: AnyUser) => {
    if (!u.id) return
    const reason =
      typeof window !== 'undefined'
        ? window.prompt('Причина бана (увидит пользователь):', 'Нарушение правил / скам') || ''
        : ''
    if (!reason.trim()) return
    setBusyId(u.id)
    try {
      const res = await fetch(`${API}/admin/users/${u.id}/ban`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ reason: reason.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || 'Не удалось забанить')
      await load()
    } catch (e: any) {
      setError(e?.message || 'Ошибка бана')
    } finally {
      setBusyId(null)
    }
  }

  const unbanUser = async (u: AnyUser) => {
    if (!u.id) return
    if (typeof window !== 'undefined' && !window.confirm(`Разбанить ${u.username || u.firstName}?`)) return
    setBusyId(u.id)
    try {
      const res = await fetch(`${API}/admin/users/${u.id}/unban`, {
        method: 'POST',
        headers: authHeaders(),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || 'Не удалось разбанить')
      await load()
    } catch (e: any) {
      setError(e?.message || 'Ошибка')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-telegram-textSecondary flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Загрузка пользователей…
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Управление пользователями</h1>
        <p className="text-telegram-textSecondary">
          Всего: {users.length} · Забанено: {users.filter((u) => u.isBanned).length}
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 text-red-400 px-4 py-3 text-sm">{error}</div>
      )}

      <div className="space-y-4">
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
          <select
            className="input"
            value={filterBanned}
            onChange={(e) => setFilterBanned(e.target.value as any)}
          >
            <option value="all">Все статусы</option>
            <option value="banned">Только бан</option>
            <option value="ok">Без бана</option>
          </select>
          <Badge variant="default">Показано: {filtered.length}</Badge>
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
                  <th className="text-left px-4 py-3">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, idx) => (
                  <tr key={u.id || idx} className="border-t border-gray-700/50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {`${u.firstName || ''} ${u.lastName || ''}`.trim() || '—'}
                    </td>
                    <td className="px-4 py-3">{u.username ? `@${u.username}` : '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant="default">{u.role || '—'}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {u.isBanned ? (
                          <Badge variant="danger" title={u.banReason || ''}>
                            Бан
                          </Badge>
                        ) : u.isActive ? (
                          <Badge variant="success">Активен</Badge>
                        ) : (
                          <Badge variant="default">Неактивен</Badge>
                        )}
                        {u.isVerified ? <Badge variant="default">Вериф.</Badge> : null}
                      </div>
                      {u.isBanned && u.banReason && (
                        <div className="text-xs text-red-400/80 mt-1 max-w-[200px] truncate" title={u.banReason}>
                          {u.banReason}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">{u.telegramId || '—'}</td>
                    <td className="px-4 py-3">
                      {u.createdAt ? new Date(u.createdAt).toLocaleString('ru-RU') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {u.role === 'admin' ? (
                        <span className="text-white/30 text-xs">—</span>
                      ) : u.isBanned ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={busyId === u.id}
                          onClick={() => unbanUser(u)}
                        >
                          {busyId === u.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="w-3.5 h-3.5 mr-1" /> Разбан
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300"
                          disabled={busyId === u.id}
                          onClick={() => banUser(u)}
                        >
                          {busyId === u.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <Ban className="w-3.5 h-3.5 mr-1" /> Бан
                            </>
                          )}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-telegram-textSecondary" colSpan={7}>
                      Ничего не найдено
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
