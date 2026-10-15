'use client'

import { useCallback, useEffect, useState } from 'react'
import { Banknote, Loader2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'
import type { SafeDeal } from '@/lib/api'

const API = process.env.NEXT_PUBLIC_API_URL

function authHeaders() {
  return {
    Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('influenta_token') : ''}`,
    'Content-Type': 'application/json',
  }
}

export default function AdminPayoutsPage() {
  const [deals, setDeals] = useState<SafeDeal[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/safe-deals/payouts`, { headers: authHeaders() })
      if (!res.ok) throw new Error('Не удалось загрузить выплаты')
      const data = await res.json()
      setDeals(Array.isArray(data) ? data : [])
    } catch (e: any) {
      setError(e?.message || 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const retry = async (id: string) => {
    setBusyId(id)
    setError(null)
    try {
      const res = await fetch(`${API}/safe-deals/${id}/admin/retry-payout`, {
        method: 'POST',
        headers: authHeaders(),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || 'Не удалось повторить выплату')
      await load()
    } catch (e: any) {
      setError(e?.message || 'Ошибка')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Banknote className="w-6 h-6 text-telegram-primary" />
        <div>
          <h1 className="text-xl font-semibold text-white">Автовыплаты СБП</h1>
          <p className="text-sm text-white/50">
            После подтверждения сделки деньги уходят блогеру с выплатного терминала. Здесь — статусы и повтор.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 text-red-400 px-4 py-3 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-white/50">
          <Loader2 className="w-4 h-4 animate-spin" /> Загрузка…
        </div>
      ) : deals.length === 0 ? (
        <div className="text-white/40 text-sm">Пока нет сделок с автовыплатами.</div>
      ) : (
        <div className="space-y-3">
          {deals.map((d) => (
            <div
              key={d.id}
              className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-1 text-sm">
                <div className="font-medium text-white">
                  {formatPrice(d.payoutAmount)} · {d.payoutStatus || 'none'}
                </div>
                <div className="text-white/40 text-xs break-all">ID: {d.id}</div>
                {d.payoutBankStatus && (
                  <div className="text-white/40 text-xs">Банк: {d.payoutBankStatus}</div>
                )}
                {d.payoutError && (
                  <div className="text-red-400/90 text-xs">{d.payoutError}</div>
                )}
              </div>
              {(d.payoutStatus === 'failed' ||
                d.payoutStatus === 'skipped' ||
                d.payoutStatus === 'none' ||
                d.payoutStatus === 'pending') && (
                <Button
                  variant="secondary"
                  disabled={busyId === d.id}
                  onClick={() => retry(d.id)}
                  className="shrink-0"
                >
                  {busyId === d.id ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RotateCcw className="w-4 h-4 mr-2" />
                  )}
                  Повторить
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
