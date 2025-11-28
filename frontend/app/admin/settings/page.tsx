'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const DEFAULT_TEXT = `⚙️ Технические работы

В ближайшее время мы проводим обновления инфраструктуры.
⏳ Возможны кратковременные сбои в работе мини‑приложения.
Спасибо за понимание!`

export default function AdminSettingsPage() {
  const [text, setText] = useState(DEFAULT_TEXT)
  const [loading, setLoading] = useState(false)
  const [fixingEnums, setFixingEnums] = useState(false)

  const sendBroadcast = async () => {
    try {
      setLoading(true)
      const token = typeof window !== 'undefined' ? localStorage.getItem('influenta_token') : null
      if (!token) {
        alert('Нет прав администратора (JWT не найден). Перезайдите в админку.')
        return
      }
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/broadcast/maintenance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message: text }),
      })
      if (!resp.ok) {
        const err = await resp.text()
        alert(`Ошибка рассылки: ${resp.status} ${err}`)
        return
      }
      const data = await resp.json()
      alert(`Готово! Отправлено: ${data.success ? data.success : data.success === false ? 0 : data.success}\nВсего адресатов: ${data.total ?? '-'}\nУспешно: ${data.success ?? '-'}\nОшибок: ${data.failed ?? '-'}`)
    } catch (e: any) {
      alert(`Сбой: ${e?.message || 'неизвестная ошибка'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Настройки</h1>
        <p className="text-telegram-textSecondary">Администрирование платформы</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Рассылка о техработах</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-telegram-textSecondary">
            Отправит сообщение всем пользователям бота с указанным Telegram ID.
          </p>
          <textarea
            className="w-full px-3 py-2 border border-telegram-border rounded-lg bg-telegram-bg text-telegram-text min-h-[140px] resize-y"
            value={text}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
          />
          <div className="flex gap-2">
            <Button variant="primary" onClick={sendBroadcast} loading={loading}>
              Отправить рассылку
            </Button>
            <Button variant="secondary" onClick={() => setText(DEFAULT_TEXT)} disabled={loading}>
              Вернуть текст по умолчанию
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Синхронизация категорий объявлений</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-telegram-textSecondary">
            Если при создании объявления возникает ошибка enum (например, «hobby»), нажмите кнопку ниже — недостающие значения будут добавлены в БД.
          </p>
          <div className="flex gap-2">
            <Button
              variant="primary"
              onClick={async () => {
                try {
                  setFixingEnums(true)
                  const token = typeof window !== 'undefined' ? localStorage.getItem('influenta_token') : null
                  if (!token) {
                    alert('Нет прав администратора (JWT не найден). Перезайдите в админку.')
                    return
                  }
                  const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/fix-target-categories`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                    },
                  })
                  if (!resp.ok) {
                    const err = await resp.text()
                    alert(`Ошибка: ${resp.status} ${err}`)
                    return
                  }
                  alert('Готово! Категории синхронизированы.')
                } catch (e: any) {
                  alert(`Сбой: ${e?.message || 'неизвестная ошибка'}`)
                } finally {
                  setFixingEnums(false)
                }
              }}
              loading={fixingEnums}
            >
              Обновить enum категорий
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
 
 
 
 
 
 
 
 
 