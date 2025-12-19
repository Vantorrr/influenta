'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default function AdminModerationPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showUnverifyModal, setShowUnverifyModal] = useState(false)
  const [unverifyUserId, setUnverifyUserId] = useState<string | null>(null)
  const [unverifyReason, setUnverifyReason] = useState('')

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

  const openLink = (url: string) => {
    try {
      if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.openLink) {
        ;(window as any).Telegram.WebApp.openLink(url, { try_instant_view: false })
      } else {
        window.open(url, '_blank')
      }
    } catch {
      try { window.open(url, '_blank') } catch {}
    }
  }

  const openTelegram = (username?: string, telegramId?: string | number) => {
    const url = username
      ? `https://t.me/${username.replace(/^@/, '')}`
      : telegramId
        ? `tg://user?id=${telegramId}`
        : ''
    if (url) {
      try {
        if ((window as any).Telegram?.WebApp?.openTelegramLink) {
          (window as any).Telegram.WebApp.openTelegramLink(url)
        } else {
          window.open(url, '_blank')
        }
      } catch {
        try { window.open(url, '_blank') } catch {}
      }
    }
  }

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
        requests.map((r, i) => {
          const docs: string[] = Array.isArray(r?.verificationData?.documents) ? r.verificationData.documents : []
          const proofs: { platform: string; url: string; followers?: number }[] = Array.isArray(r?.verificationData?.socialProofs) ? r.verificationData.socialProofs : []
          const msg: string | undefined = r?.verificationData?.message
          const verificationCode: string | undefined = r?.verificationData?.verificationCode

          return (
            <Card key={r.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <span className="truncate">{r.firstName} {r.lastName}</span>
                  <div className="flex items-center gap-2">
                    {r.username && (
                      <Badge variant="primary">@{r.username}</Badge>
                    )}
                  <Button size="sm" variant="secondary" onClick={() => openTelegram(r.username, r.telegramId)}>
                      Написать в Telegram
                    </Button>
                    <Link href={`/bloggers/${r.id}`} className="hidden md:inline">
                      <Button size="sm" variant="secondary">Профиль</Button>
                    </Link>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Код верификации */}
                {verificationCode && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <p className="text-xs text-amber-500 font-medium mb-1">🔑 Код верификации</p>
                    <p className="font-mono text-lg select-all">{verificationCode}</p>
                    <p className="text-xs text-telegram-textSecondary mt-1">
                      Проверьте, что этот код есть в описании профиля соцсети
                    </p>
                  </div>
                )}

                {msg && (
                  <div>
                    <p className="text-xs text-telegram-textSecondary mb-1">Сообщение</p>
                    <p className="text-sm whitespace-pre-wrap">{msg}</p>
                  </div>
                )}

                {docs.length > 0 && (
                  <div>
                    <p className="text-xs text-telegram-textSecondary mb-2">📎 Документы (паспорт)</p>
                    <div className="flex flex-wrap gap-2">
                      {docs.map((url, idx) => (
                        <Button key={idx} size="sm" variant="secondary" onClick={() => openLink(url)}>
                          Открыть документ {idx + 1}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {proofs.length > 0 && (
                  <div>
                    <p className="text-xs text-telegram-textSecondary mb-2">📱 Соцсети</p>
                    <div className="space-y-2">
                      {proofs.map((proof, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-telegram-bgSecondary rounded-lg">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{typeof proof === 'string' ? 'Ссылка' : proof.platform}</div>
                            {typeof proof !== 'string' && proof.followers && (
                              <div className={`text-xs ${proof.followers >= 100000 ? 'text-green-500 font-medium' : 'text-telegram-textSecondary'}`}>
                                {proof.followers.toLocaleString('ru-RU')} подписчиков {proof.followers >= 100000 ? '✓' : '⚠️ менее 100к'}
                              </div>
                            )}
                          </div>
                          <Button size="sm" variant="secondary" onClick={() => openLink(typeof proof === 'string' ? proof : proof.url)}>
                            Открыть
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="primary" onClick={async () => { await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${r.id}/verify`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${localStorage.getItem('influenta_token')}` } }); setRequests(prev => prev.filter(x => x.id !== r.id)); try { window.dispatchEvent(new Event('refreshModerationCount')) } catch {} }}>Верифицировать</Button>
                  <Button size="sm" variant="danger" onClick={async () => { const reason = prompt('Причина отказа:') || 'недостаточно данных'; await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${r.id}/reject-verification`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${localStorage.getItem('influenta_token')}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ reason }) }); setRequests(prev => prev.filter(x => x.id !== r.id)); try { window.dispatchEvent(new Event('refreshModerationCount')) } catch {} }}>Отклонить</Button>
                  <Button size="sm" variant="secondary" onClick={() => { setUnverifyUserId(r.id); setUnverifyReason(''); setShowUnverifyModal(true) }}>Снять верификацию</Button>
                </div>
              </CardContent>
            </Card>
          )
        })
      )}

      {/* Modal: Указать причину снятия верификации */}
      {showUnverifyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowUnverifyModal(false)}>
          <div className="bg-telegram-bgSecondary rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-3">Снять верификацию</h3>
            <p className="text-sm text-telegram-textSecondary mb-3">Укажите причину снятия верификации. Это сообщение увидит пользователь.</p>
            <input
              value={unverifyReason}
              onChange={(e) => setUnverifyReason(e.target.value)}
              placeholder="Причина"
              className="w-full px-3 py-2 border border-telegram-border rounded-lg bg-telegram-bg text-telegram-text mb-4"
            />
            <div className="flex gap-2">
              <Button variant="secondary" fullWidth onClick={() => setShowUnverifyModal(false)}>Отмена</Button>
              <Button
                variant="primary"
                fullWidth
                onClick={async () => {
                  if (!unverifyUserId) return
                  const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${unverifyUserId}/unverify`, {
                    method: 'PATCH',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('influenta_token')}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason: unverifyReason || 'Без указания причины' })
                  })
                  if (!resp.ok) {
                    const text = await resp.text(); alert(`Ошибка: ${resp.status} ${text}`)
                  } else {
                    alert('Верификация снята')
                    setShowUnverifyModal(false)
                  }
                }}
              >Снять</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}






