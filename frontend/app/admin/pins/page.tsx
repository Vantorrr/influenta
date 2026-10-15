'use client'

import { useEffect, useState } from 'react'
import { Pin } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL

function authHeaders() {
  return {
    Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('influenta_token') : ''}`,
    'Content-Type': 'application/json',
  }
}

export default function AdminPinsPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/admin/listings/pins`, { headers: authHeaders() })
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const activate = async (id: string, days = 7) => {
    await fetch(`${API}/admin/listings/${id}/pin`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ days }),
    })
    await load()
  }

  const deactivate = async (id: string) => {
    await fetch(`${API}/admin/listings/${id}/unpin`, {
      method: 'POST',
      headers: authHeaders(),
    })
    await load()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Pin className="w-6 h-6" /> Закрепы объявлений
        </h1>
        <p className="text-white/50 text-sm mt-1">
          Отдельная платная услуга. Активируйте после оплаты через поддержку.
        </p>
      </div>

      {loading ? (
        <p className="text-white/40">Загрузка…</p>
      ) : items.length === 0 ? (
        <p className="text-white/40">Нет заявок и активных закрепов</p>
      ) : (
        <div className="space-y-3">
          {items.map((l) => (
            <div key={l.id} className="bg-[#1C1E20] border border-white/5 rounded-xl p-4">
              <div className="flex justify-between gap-3">
                <div>
                  <div className="font-medium text-white">{l.title}</div>
                  <div className="text-xs text-white/50 mt-1">
                    {l.pinRequested && !l.isPinned && '⏳ Запрошен закреп'}
                    {l.isPinned && `📌 Активен до ${l.pinnedUntil ? new Date(l.pinnedUntil).toLocaleString('ru-RU') : '—'}`}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {!l.isPinned && (
                    <button
                      type="button"
                      onClick={() => activate(l.id, 7)}
                      className="px-3 py-2 rounded-lg bg-sky-500/15 text-sky-300 text-sm"
                    >
                      Активировать 7д
                    </button>
                  )}
                  {l.isPinned && (
                    <button
                      type="button"
                      onClick={() => deactivate(l.id)}
                      className="px-3 py-2 rounded-lg bg-white/5 text-white/60 text-sm"
                    >
                      Снять
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
