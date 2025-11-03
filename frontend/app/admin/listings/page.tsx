"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { formatDateTime, formatPrice, getPostFormatLabel } from '@/lib/utils'

type AdminListing = {
  id: string
  title: string
  description?: string
  format?: string
  budget?: number
  status?: string
  createdAt?: string
  viewsCount?: number
  responsesCount?: number
  advertiser?: {
    id: string
    userId?: string
    companyName?: string
    user?: { id: string; telegramId?: string; username?: string } | undefined
  } | undefined
}

export default function AdminListingsPage() {
  const [items, setItems] = useState<AdminListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showClosed, setShowClosed] = useState(false)

  const handleDelete = async (listingId: string, title: string) => {
    const reason = prompt(`Причина удаления объявления "${title}":`) || 'Модерация администратора'
    if (!confirm(`Удалить объявление "${title}"?`)) return
    
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/listings/${listingId}/delete`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('influenta_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      })
      
      if (!resp.ok) {
        const text = await resp.text()
        alert(`Ошибка: ${resp.status} ${text}`)
        return
      }
      
      // Обновляем статус объявления на closed
      setItems(prev => prev.map(l => 
        l.id === listingId ? { ...l, status: 'closed' } : l
      ))
      alert('Объявление закрыто')
    } catch (e: any) {
      alert(`Ошибка: ${e?.message || e}`)
    }
  }

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/listings`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('influenta_token')}` },
          cache: 'no-store',
        })
        if (!resp.ok) throw new Error('Не удалось загрузить объявления')
        const data = await resp.json()
        const arr = Array.isArray(data) ? data : []
        setItems(arr as any)
      } catch (e: any) {
        setError(e?.message || 'Ошибка загрузки')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const filtered = useMemo(() => {
    let result = items
    
    // Фильтр по статусу (скрываем закрытые по умолчанию)
    if (!showClosed) {
      result = result.filter(l => l.status !== 'closed')
    }
    
    // Фильтр по поиску
    const s = search.trim().toLowerCase()
    if (s) {
      result = result.filter(l => {
        const hay = `${l.title || ''} ${l.description || ''} ${l.advertiser?.companyName || ''} ${l.advertiser?.user?.username || ''}`.toLowerCase()
        return hay.includes(s)
      })
    }
    
    return result
  }, [items, search, showClosed])

  if (loading) return <div className="text-telegram-textSecondary">Загрузка объявлений…</div>
  if (error) return (
    <Card><CardContent className="p-6 text-telegram-danger">{error}</CardContent></Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold">Объявления</h1>
        <Badge variant="default">Активных: {filtered.length}</Badge>
        {showClosed && <Badge variant="default">Всего: {items.length}</Badge>}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showClosed}
            onChange={(e) => setShowClosed(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm">Показать закрытые</span>
        </label>
        <div className="ml-auto w-full sm:w-72">
          <Input placeholder="Поиск по названию/рекламодателю" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-telegram-bgSecondary text-telegram-textSecondary">
              <tr>
                <th className="text-left px-4 py-3">Название</th>
                <th className="text-left px-4 py-3">Рекламодатель</th>
                <th className="text-left px-4 py-3">Формат</th>
                <th className="text-left px-4 py-3">Бюджет</th>
                <th className="text-left px-4 py-3">Просм.</th>
                <th className="text-left px-4 py-3">Отклики</th>
                <th className="text-left px-4 py-3">Статус</th>
                <th className="text-left px-4 py-3">Создано</th>
                <th className="text-left px-4 py-3">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="border-t border-gray-700/50">
                  <td className="px-4 py-3 whitespace-nowrap max-w-[280px] truncate">{l.title}</td>
                  <td className="px-4 py-3 whitespace-nowrap max-w-[220px] truncate">{l.advertiser?.companyName || l.advertiser?.user?.username || '—'}</td>
                  <td className="px-4 py-3">{getPostFormatLabel(l.format || '')}</td>
                  <td className="px-4 py-3">{typeof l.budget === 'number' ? formatPrice(l.budget) : '—'}</td>
                  <td className="px-4 py-3">{l.viewsCount ?? 0}</td>
                  <td className="px-4 py-3">{l.responsesCount ?? 0}</td>
                  <td className="px-4 py-3">
                    <Badge variant="default">{l.status || '—'}</Badge>
                  </td>
                  <td className="px-4 py-3">{formatDateTime(l.createdAt as any)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/listings/${l.id}`} className="text-telegram-primary hover:underline">Открыть</Link>
                      {l.status !== 'closed' && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(l.id, l.title)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-telegram-textSecondary" colSpan={9}>Ничего не найдено</td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}