"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDateTime, formatPrice, getPostFormatLabel } from '@/lib/utils'

type AdminListingDetail = {
  id: string
  title: string
  description?: string
  format?: string
  budget?: number
  status?: string
  createdAt?: string
  requirements?: any
  viewsCount?: number
  responsesCount?: number
  advertiser?: {
    id: string
    userId?: string
    companyName?: string
    user?: { id: string; telegramId?: string; username?: string; firstName?: string; lastName?: string } | undefined
  } | undefined
  responses: Array<{
    id: string
    message: string
    proposedPrice?: number
    status?: string
    createdAt?: string
    blogger?: {
      id: string
      userId?: string
      user?: { id: string; telegramId?: string; username?: string; firstName?: string; lastName?: string } | undefined
    } | undefined
  }>
}

export default function AdminListingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = String(params?.id || '')
  const [data, setData] = useState<AdminListingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    ;(async () => {
      try {
        setLoading(true)
        const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/listings/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('influenta_token')}` },
          cache: 'no-store',
        })
        if (!resp.ok) throw new Error('Не удалось загрузить объявление')
        const json = await resp.json()
        setData(json as any)
      } catch (e: any) {
        setError(e?.message || 'Ошибка загрузки')
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  if (!id) return <div className="text-telegram-danger">Неверный ID</div>
  if (loading) return <div className="text-telegram-textSecondary">Загрузка…</div>
  if (error) return <Card><CardContent className="p-6 text-telegram-danger">{error}</CardContent></Card>
  if (!data) return <div className="text-telegram-textSecondary">Нет данных</div>

  const adv = data.advertiser

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => router.back()} className="text-telegram-primary hover:underline">← Назад</button>
        <h1 className="text-2xl font-bold">{data.title}</h1>
        <Badge variant="default">{data.status}</Badge>
      </div>

      <Card>
        <CardContent className="p-6 space-y-2">
          <div className="text-telegram-textSecondary text-sm">ID: {data.id}</div>
          <div>{data.description || '—'}</div>
          <div className="flex flex-wrap gap-4 text-sm">
            <div><span className="text-telegram-textSecondary">Формат: </span>{getPostFormatLabel(data.format || '')}</div>
            <div><span className="text-telegram-textSecondary">Бюджет: </span>{typeof data.budget === 'number' ? formatPrice(data.budget) : '—'}</div>
            <div><span className="text-telegram-textSecondary">Создано: </span>{formatDateTime(data.createdAt as any)}</div>
            <div><span className="text-telegram-textSecondary">Просмотры: </span>{data.viewsCount ?? 0}</div>
            <div><span className="text-telegram-textSecondary">Отклики: </span>{data.responsesCount ?? 0}</div>
          </div>

          {adv && (
            <div className="mt-4">
              <div className="font-medium mb-1">Рекламодатель</div>
              <div className="text-sm">
                <div>{adv.companyName || adv.user?.username || adv.userId}</div>
                {!!adv.user?.telegramId && (
                  <div className="text-telegram-textSecondary">Telegram ID: {adv.user.telegramId}</div>
                )}
              </div>
            </div>
          )}

          {!!data.requirements && (
            <div className="mt-4">
              <div className="font-medium mb-1">Требования</div>
              <pre className="bg-telegram-bg rounded p-3 text-xs overflow-auto">{JSON.stringify(data.requirements, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-telegram-bgSecondary text-telegram-textSecondary">
              <tr>
                <th className="text-left px-4 py-3">Блогер</th>
                <th className="text-left px-4 py-3">Сообщение</th>
                <th className="text-left px-4 py-3">Цена</th>
                <th className="text-left px-4 py-3">Статус</th>
                <th className="text-left px-4 py-3">Создано</th>
                <th className="text-left px-4 py-3">Действия</th>
              </tr>
            </thead>
            <tbody>
              {(data.responses || []).map((r) => (
                <tr key={r.id} className="border-t border-gray-700/50">
                  <td className="px-4 py-3 whitespace-nowrap max-w-[220px] truncate">
                    {r.blogger?.user?.username ? `@${r.blogger.user.username}` : `${r.blogger?.user?.firstName || ''} ${r.blogger?.user?.lastName || ''}`.trim() || r.blogger?.userId || '—'}
                  </td>
                  <td className="px-4 py-3 max-w-[360px] truncate" title={r.message}>{r.message}</td>
                  <td className="px-4 py-3">{typeof r.proposedPrice === 'number' ? formatPrice(r.proposedPrice) : '—'}</td>
                  <td className="px-4 py-3"><Badge variant="default">{r.status || '—'}</Badge></td>
                  <td className="px-4 py-3">{formatDateTime(r.createdAt as any)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/messages?responseId=${r.id}`} className="text-telegram-primary hover:underline">Открыть чат</Link>
                  </td>
                </tr>
              ))}
              {(!data.responses || data.responses.length === 0) && (
                <tr>
                  <td className="px-4 py-6 text-telegram-textSecondary" colSpan={6}>Откликов пока нет</td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}





