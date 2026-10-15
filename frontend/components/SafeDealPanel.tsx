'use client'

import { useCallback, useEffect, useState } from 'react'
import { ShieldCheck, Loader2, CheckCircle, AlertTriangle, CreditCard, PackageCheck, RotateCcw, Copy } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'
import { safeDealApi, SafeDeal, SafeDealStatus } from '@/lib/api'

interface SafeDealPanelProps {
  /** Источник сделки: указывается ЛИБО offerId, ЛИБО responseId */
  offerId?: string
  responseId?: string
  isBlogger: boolean
  /** Предложение/отклик приняты — оплата доступна */
  accepted: boolean
  useSafeDeal: boolean
  budget: number
}

const STATUS_META: Record<SafeDealStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' }> = {
  created: { label: 'Создана', variant: 'default' },
  awaiting_payment: { label: 'Ожидает оплаты', variant: 'warning' },
  funded: { label: 'Оплачено · средства в гарантии', variant: 'success' },
  in_progress: { label: 'В работе', variant: 'success' },
  delivered: { label: 'Работа выполнена · ждёт подтверждения', variant: 'warning' },
  released: { label: 'Завершена · выплачено', variant: 'success' },
  disputed: { label: 'Спор на рассмотрении', variant: 'danger' },
  refunded: { label: 'Возврат средств', variant: 'danger' },
  cancelled: { label: 'Отменена', variant: 'default' },
}

function openPaymentLink(url: string) {
  const tg = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : undefined
  if (tg?.openLink) {
    tg.openLink(url)
  } else {
    window.location.href = url
  }
}

export function SafeDealPanel({ offerId, responseId, isBlogger, accepted, useSafeDeal, budget }: SafeDealPanelProps) {
  const [deal, setDeal] = useState<SafeDeal | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [payMethod, setPayMethod] = useState<'card' | 'crypto'>('card')
  const [txHash, setTxHash] = useState('')

  const load = useCallback(async () => {
    try {
      const d = responseId
        ? await safeDealApi.getByResponse(responseId)
        : offerId
        ? await safeDealApi.getByOffer(offerId)
        : null
      setDeal(d)
      if (d?.cryptoTxHash) setTxHash(d.cryptoTxHash)
    } catch {
      // нет доступа/сделки — оставляем null
    } finally {
      setLoading(false)
    }
  }, [offerId, responseId])

  useEffect(() => {
    load()
  }, [load])

  const errMessage = (e: any) =>
    e?.response?.data?.message || e?.message || 'Что-то пошло не так, попробуйте ещё раз'

  const handlePay = async () => {
    setBusy(true)
    setError(null)
    try {
      const opts = { paymentMethod: payMethod }
      const res = responseId
        ? await safeDealApi.createForResponse(responseId, opts)
        : await safeDealApi.createForOffer(offerId!, opts)
      setDeal(res.deal)
      if (res.paymentUrl) {
        openPaymentLink(res.paymentUrl)
      } else if (res.alreadyActive) {
        await load()
      }
    } catch (e: any) {
      const msg = errMessage(e)
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg))
    } finally {
      setBusy(false)
    }
  }

  const handleSubmitTx = async () => {
    if (!deal) return
    setBusy(true)
    setError(null)
    try {
      const updated = await safeDealApi.submitCryptoTx(deal.id, txHash)
      setDeal(updated)
    } catch (e: any) {
      const msg = errMessage(e)
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg))
    } finally {
      setBusy(false)
    }
  }

  const copyAddress = async () => {
    if (!deal?.cryptoAddress) return
    try {
      await navigator.clipboard.writeText(deal.cryptoAddress)
    } catch {
      /* ignore */
    }
  }

  const runAction = async (fn: () => Promise<SafeDeal>) => {
    setBusy(true)
    setError(null)
    try {
      const updated = await fn()
      setDeal(updated)
    } catch (e: any) {
      const msg = errMessage(e)
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg))
    } finally {
      setBusy(false)
    }
  }

  const handleDelivered = () =>
    runAction(() => safeDealApi.markDelivered(deal!.id, 'Работа выполнена'))
  const handleRelease = () => runAction(() => safeDealApi.release(deal!.id))
  const handleDispute = () => {
    const reason = typeof window !== 'undefined' ? window.prompt('Опишите причину спора:') : ''
    return runAction(() => safeDealApi.dispute(deal!.id, reason || undefined))
  }

  // Панель не показываем, если безопасная сделка не выбрана и её ещё нет
  if (!useSafeDeal && !deal) return null
  if (loading) return null

  const status = deal?.status
  const canPay = !isBlogger && accepted && (!deal || ['created', 'awaiting_payment', 'cancelled'].includes(status as string))
  const isFundedStage = deal && ['funded', 'in_progress'].includes(status as string)
  const isDelivered = status === 'delivered'
  const canDispute = deal && ['funded', 'in_progress', 'delivered'].includes(status as string)
  const isCrypto = deal?.paymentMethod === 'crypto' || payMethod === 'crypto'
  const awaitingCrypto =
    !isBlogger &&
    deal?.paymentMethod === 'crypto' &&
    status === 'awaiting_payment'

  return (
    <Card className="mb-4 border-telegram-primary/30">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-telegram-primary" />
            <span className="font-semibold">Безопасная сделка</span>
          </div>
          {status && (
            <Badge variant={STATUS_META[status].variant}>{STATUS_META[status].label}</Badge>
          )}
        </div>

        <p className="text-sm text-telegram-textSecondary mb-4">
          Оплата картой (T-Bank) или криптой. Крипто-поступления подтверждает поддержка вручную.
          Средства переводятся блогеру после подтверждения выполнения.
        </p>

        {deal && (
          <div className="grid grid-cols-3 gap-2 mb-4 text-center">
            <div className="rounded-lg bg-telegram-bgSecondary p-3">
              <div className="text-xs text-telegram-textSecondary">Сумма</div>
              <div className="font-semibold">{formatPrice(deal.amount)}</div>
            </div>
            <div className="rounded-lg bg-telegram-bgSecondary p-3">
              <div className="text-xs text-telegram-textSecondary">Комиссия</div>
              <div className="font-semibold">{formatPrice(deal.commissionAmount)}</div>
            </div>
            <div className="rounded-lg bg-telegram-bgSecondary p-3">
              <div className="text-xs text-telegram-textSecondary">К выплате</div>
              <div className="font-semibold text-telegram-primary">{formatPrice(deal.payoutAmount)}</div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-3 p-3 bg-red-500/10 text-red-500 rounded-lg text-sm">{error}</div>
        )}

        {!accepted && !deal && (
          <div className="text-sm text-telegram-textSecondary">
            Оплата станет доступна после принятия {responseId ? 'отклика' : 'предложения'}.
          </div>
        )}

        <div className="flex flex-col gap-2">
          {canPay && !deal && (
            <div className="flex gap-2 mb-1">
              <button
                type="button"
                onClick={() => setPayMethod('card')}
                className={`flex-1 py-2 rounded-xl text-sm border ${
                  payMethod === 'card'
                    ? 'border-telegram-primary bg-telegram-primary/10 text-telegram-primary'
                    : 'border-white/10 text-white/50'
                }`}
              >
                Карта
              </button>
              <button
                type="button"
                onClick={() => setPayMethod('crypto')}
                className={`flex-1 py-2 rounded-xl text-sm border ${
                  payMethod === 'crypto'
                    ? 'border-telegram-primary bg-telegram-primary/10 text-telegram-primary'
                    : 'border-white/10 text-white/50'
                }`}
              >
                Крипта
              </button>
            </div>
          )}

          {canPay && (
            <Button variant="primary" onClick={handlePay} disabled={busy} fullWidth>
              {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
              {deal
                ? isCrypto
                  ? 'Показать реквизиты снова'
                  : 'Оплатить картой'
                : isCrypto
                ? `Оплатить криптой · ${formatPrice(budget)}`
                : `Оплатить картой · ${formatPrice(budget)}`}
            </Button>
          )}

          {awaitingCrypto && deal?.cryptoAddress && (
            <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-3 space-y-2 text-sm">
              <div className="text-sky-300 font-medium">
                Переведите {deal.cryptoCurrency || 'USDT'} ({deal.cryptoNetwork || 'TRC20'})
              </div>
              <div className="flex items-start gap-2">
                <code className="flex-1 break-all text-xs text-white/80">{deal.cryptoAddress}</code>
                <button type="button" onClick={copyAddress} className="p-1.5 rounded bg-white/5">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <input
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder="Hash транзакции"
                className="w-full rounded-lg bg-telegram-bgSecondary border border-white/10 px-3 py-2 text-sm"
              />
              <Button variant="secondary" onClick={handleSubmitTx} disabled={busy || !txHash.trim()} fullWidth>
                Отправить hash в поддержку
              </Button>
              <p className="text-xs text-white/40">
                После перевода модератор подтвердит поступление вручную.
              </p>
            </div>
          )}

          {isBlogger && (!deal || ['created', 'awaiting_payment'].includes(status as string)) && accepted && (
            <div className="text-sm text-telegram-textSecondary">
              Ожидается оплата от рекламодателя. Как только средства поступят на гарантийный счёт, вы получите уведомление.
            </div>
          )}

          {isBlogger && isFundedStage && (
            <Button variant="primary" onClick={handleDelivered} disabled={busy} fullWidth>
              {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PackageCheck className="w-4 h-4 mr-2" />}
              Отметить работу выполненной
            </Button>
          )}

          {!isBlogger && isFundedStage && (
            <div className="text-sm text-telegram-textSecondary">
              Средства зарезервированы. Дождитесь, пока блогер отметит работу выполненной, затем подтвердите выплату.
            </div>
          )}

          {!isBlogger && (isDelivered || isFundedStage) && (
            <Button variant="primary" onClick={handleRelease} disabled={busy} fullWidth>
              {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Подтвердить выполнение и выплатить
            </Button>
          )}

          {isBlogger && isDelivered && (
            <div className="text-sm text-telegram-textSecondary">
              Вы отметили работу выполненной. Ожидается подтверждение рекламодателя.
            </div>
          )}

          {canDispute && (
            <Button variant="ghost" onClick={handleDispute} disabled={busy} fullWidth className="text-red-500">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Открыть спор
            </Button>
          )}

          {status === 'released' && (
            <div className="flex items-center gap-2 text-sm text-green-500">
              <CheckCircle className="w-4 h-4" />
              Сделка успешно завершена.
            </div>
          )}

          {status === 'refunded' && (
            <div className="flex items-center gap-2 text-sm text-telegram-textSecondary">
              <RotateCcw className="w-4 h-4" />
              Средства возвращены рекламодателю.
            </div>
          )}

          {status === 'disputed' && (
            <div className="text-sm text-telegram-textSecondary">
              Спор открыт. Модератор платформы свяжется со сторонами и примет решение.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
