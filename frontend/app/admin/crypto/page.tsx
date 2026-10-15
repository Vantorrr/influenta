'use client'

import { useEffect, useState } from 'react'
import { Wallet, Plus, CheckCircle, Ban } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL

function authHeaders() {
  return {
    Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('influenta_token') : ''}`,
    'Content-Type': 'application/json',
  }
}

export default function AdminCryptoPage() {
  const [wallets, setWallets] = useState<any[]>([])
  const [deals, setDeals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    label: '',
    network: 'TRC20',
    currency: 'USDT',
    address: '',
    notes: '',
  })

  const load = async () => {
    setLoading(true)
    try {
      const [w, d] = await Promise.all([
        fetch(`${API}/safe-deals/crypto/wallets/all`, { headers: authHeaders() }).then((r) => r.json()),
        fetch(`${API}/safe-deals/crypto/deals`, { headers: authHeaders() }).then((r) => r.json()),
      ])
      setWallets(Array.isArray(w) ? w : [])
      setDeals(Array.isArray(d) ? d : [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const saveWallet = async () => {
    if (!form.label.trim() || !form.address.trim()) return
    await fetch(`${API}/safe-deals/crypto/wallets`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(form),
    })
    setForm({ label: '', network: 'TRC20', currency: 'USDT', address: '', notes: '' })
    await load()
  }

  const deactivate = async (id: string) => {
    await fetch(`${API}/safe-deals/crypto/wallets/${id}/deactivate`, {
      method: 'POST',
      headers: authHeaders(),
    })
    await load()
  }

  const confirmDeal = async (id: string) => {
    await fetch(`${API}/safe-deals/${id}/admin/confirm-crypto`, {
      method: 'POST',
      headers: authHeaders(),
    })
    await load()
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Wallet className="w-6 h-6" /> Крипто-счета
        </h1>
        <p className="text-white/50 text-sm mt-1">
          Ручное управление кошельками и подтверждение поступлений для безопасных сделок
        </p>
      </div>

      <div className="bg-[#1C1E20] border border-white/5 rounded-2xl p-5 space-y-3">
        <h2 className="font-semibold text-white">Добавить кошелёк</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <input
            className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm"
            placeholder="Название (USDT TRC20 основной)"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
          />
          <input
            className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm"
            placeholder="Адрес"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <select
            className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm"
            value={form.network}
            onChange={(e) => setForm({ ...form, network: e.target.value })}
          >
            {['TRC20', 'ERC20', 'BEP20', 'TON', 'BTC'].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <select
            className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm"
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
          >
            {['USDT', 'USDC', 'TON', 'BTC'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={saveWallet}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-telegram-primary text-white text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Сохранить
        </button>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-white">Кошельки</h2>
        {loading ? (
          <p className="text-white/40 text-sm">Загрузка…</p>
        ) : wallets.length === 0 ? (
          <p className="text-white/40 text-sm">Пока нет кошельков</p>
        ) : (
          wallets.map((w) => (
            <div key={w.id} className="bg-[#1C1E20] border border-white/5 rounded-xl p-4 flex justify-between gap-3">
              <div>
                <div className="font-medium text-white">
                  {w.label}{' '}
                  <span className={`text-xs ${w.isActive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {w.isActive ? 'active' : 'off'}
                  </span>
                </div>
                <div className="text-xs text-white/50 mt-1">
                  {w.currency} · {w.network}
                </div>
                <code className="text-xs text-white/70 break-all">{w.address}</code>
              </div>
              {w.isActive && (
                <button
                  type="button"
                  onClick={() => deactivate(w.id)}
                  className="shrink-0 h-9 px-3 rounded-lg bg-red-500/10 text-red-400 text-xs inline-flex items-center gap-1"
                >
                  <Ban className="w-3.5 h-3.5" /> Off
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-white">Крипто-сделки</h2>
        {deals.length === 0 ? (
          <p className="text-white/40 text-sm">Нет крипто-сделок</p>
        ) : (
          deals.map((d) => (
            <div key={d.id} className="bg-[#1C1E20] border border-white/5 rounded-xl p-4 space-y-2">
              <div className="flex justify-between gap-2">
                <div className="font-medium text-white">{d.title || d.id}</div>
                <span className="text-xs text-white/50">{d.status}</span>
              </div>
              <div className="text-sm text-white/60">
                {d.amount}₽ · {d.cryptoCurrency} {d.cryptoNetwork}
              </div>
              {d.cryptoTxHash && (
                <code className="block text-xs text-sky-300 break-all">TX: {d.cryptoTxHash}</code>
              )}
              {d.status === 'awaiting_payment' && (
                <button
                  type="button"
                  onClick={() => confirmDeal(d.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/15 text-emerald-400 text-sm"
                >
                  <CheckCircle className="w-4 h-4" /> Подтвердить поступление
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
