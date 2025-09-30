'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function AdminModerationPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/verification-requests`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('influenta_token')}` }
        })
        if (!resp.ok) throw new Error(`API ${resp.status}`)
        setRequests(await resp.json())
      } catch (e: any) {
        setError(e?.message || 'Ошибка загрузки заявок')
      } finally {
        setIsLoading(false)
      }
    })()
  }, [])

  if (isLoading) return (
    <div className="min-h-screen bg-telegram-bg flex items-center justify-center">
      <div className="text-telegram-textSecondary">Загрузка модерации...</div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-telegram-bg flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-500 mb-2">Ошибка</div>
        <p className="text-telegram-textSecondary">{error}</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Модерация</h1>
        <p className="text-telegram-textSecondary">Заявок: {requests.length}</p>
      </div>

      {requests.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-telegram-textSecondary">Нет заявок</CardContent></Card>
      ) : (
        requests.map((r, i) => (
          <Card key={r.id}>
            <CardHeader><CardTitle>{r.firstName} {r.lastName}</CardTitle></CardHeader>
            <CardContent className="flex gap-2">
              <Button size="sm" variant="primary" onClick={async () => { await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${r.id}/verify`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${localStorage.getItem('influenta_token')}` } }); setRequests(prev => prev.filter(x => x.id !== r.id)) }}>Верифицировать</Button>
              <Button size="sm" variant="danger" onClick={async () => { const reason = prompt('Причина отказа:') || 'недостаточно данных'; await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${r.id}/reject-verification`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${localStorage.getItem('influenta_token')}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ reason }) }); setRequests(prev => prev.filter(x => x.id !== r.id)) }}>Отклонить</Button>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}


