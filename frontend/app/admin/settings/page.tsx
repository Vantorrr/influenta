'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings as SettingsIcon,
  Globe,
  DollarSign,
  Shield,
  Bell,
  Database,
  Mail,
  Save,
  RefreshCw,
  CheckCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    // Общие настройки
    siteName: 'Influencer Platform',
    siteDescription: 'Платформа для взаимодействия блогеров и рекламодателей',
    supportEmail: 'support@influencer-platform.com',
    
    // Комиссии
    platformCommission: 10, // %
    minWithdrawal: 1000, // рублей
    
    // Лимиты
    maxListingsPerAdvertiser: 10,
    maxResponsesPerListing: 50,
    minBloggerSubscribers: 1000,
    
    // Модерация
    autoModeration: true,
    requireVerification: true,
    moderationKeywords: ['spam', 'scam', 'xxx'],
    
    // Уведомления
    emailNotifications: true,
    telegramNotifications: true,
    notificationEmail: 'admin@influencer-platform.com',
  })

  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    // Здесь будет сохранение настроек через API
    console.log('Saving settings:', settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Настройки платформы</h1>
        <p className="text-telegram-textSecondary">
          Управление основными параметрами системы
        </p>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Общие настройки
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-telegram-textSecondary mb-1 block">
              Название платформы
            </label>
            <Input
              value={settings.siteName}
              onChange={(e) => setSettings(prev => ({ ...prev, siteName: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-telegram-textSecondary mb-1 block">
              Описание платформы
            </label>
            <textarea
              value={settings.siteDescription}
              onChange={(e) => setSettings(prev => ({ ...prev, siteDescription: e.target.value }))}
              className="input min-h-[80px] resize-none"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-telegram-textSecondary mb-1 block">
              Email поддержки
            </label>
            <Input
              type="email"
              value={settings.supportEmail}
              onChange={(e) => setSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
              icon={<Mail className="w-4 h-4" />}
            />
          </div>
        </CardContent>
      </Card>

      {/* Commission Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Комиссии и платежи
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-telegram-textSecondary mb-1 block">
                Комиссия платформы (%)
              </label>
              <Input
                type="number"
                value={settings.platformCommission}
                onChange={(e) => setSettings(prev => ({ ...prev, platformCommission: parseInt(e.target.value) }))}
                min="0"
                max="50"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-telegram-textSecondary mb-1 block">
                Минимальная сумма вывода (₽)
              </label>
              <Input
                type="number"
                value={settings.minWithdrawal}
                onChange={(e) => setSettings(prev => ({ ...prev, minWithdrawal: parseInt(e.target.value) }))}
                min="100"
                step="100"
              />
            </div>
          </div>
          
          <div className="bg-telegram-bg rounded-lg p-4">
            <p className="text-sm text-telegram-textSecondary">
              <strong>Текущая комиссия:</strong> {settings.platformCommission}% от каждой сделки
            </p>
            <p className="text-sm text-telegram-textSecondary mt-1">
              <strong>Пример:</strong> При сделке на 10,000₽ платформа получит {10000 * settings.platformCommission / 100}₽
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Limits Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Лимиты и ограничения
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-telegram-textSecondary mb-1 block">
                Макс. объявлений на рекламодателя
              </label>
              <Input
                type="number"
                value={settings.maxListingsPerAdvertiser}
                onChange={(e) => setSettings(prev => ({ ...prev, maxListingsPerAdvertiser: parseInt(e.target.value) }))}
                min="1"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-telegram-textSecondary mb-1 block">
                Макс. откликов на объявление
              </label>
              <Input
                type="number"
                value={settings.maxResponsesPerListing}
                onChange={(e) => setSettings(prev => ({ ...prev, maxResponsesPerListing: parseInt(e.target.value) }))}
                min="1"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-telegram-textSecondary mb-1 block">
                Мин. подписчиков для блогера
              </label>
              <Input
                type="number"
                value={settings.minBloggerSubscribers}
                onChange={(e) => setSettings(prev => ({ ...prev, minBloggerSubscribers: parseInt(e.target.value) }))}
                min="0"
                step="100"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Moderation Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Модерация
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoModeration}
                onChange={(e) => setSettings(prev => ({ ...prev, autoModeration: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-600 text-telegram-primary focus:ring-telegram-primary"
              />
              <span>Автоматическая модерация контента</span>
            </label>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.requireVerification}
                onChange={(e) => setSettings(prev => ({ ...prev, requireVerification: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-600 text-telegram-primary focus:ring-telegram-primary"
              />
              <span>Требовать верификацию для публикации</span>
            </label>
          </div>
          
          <div>
            <label className="text-sm font-medium text-telegram-textSecondary mb-1 block">
              Запрещенные слова (через запятую)
            </label>
            <textarea
              value={settings.moderationKeywords.join(', ')}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                moderationKeywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              }))}
              className="input min-h-[60px] resize-none"
              placeholder="spam, scam, xxx"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Уведомления
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => setSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-600 text-telegram-primary focus:ring-telegram-primary"
              />
              <span>Email уведомления</span>
            </label>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.telegramNotifications}
                onChange={(e) => setSettings(prev => ({ ...prev, telegramNotifications: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-600 text-telegram-primary focus:ring-telegram-primary"
              />
              <span>Telegram уведомления</span>
            </label>
          </div>
          
          <div>
            <label className="text-sm font-medium text-telegram-textSecondary mb-1 block">
              Email для уведомлений администратора
            </label>
            <Input
              type="email"
              value={settings.notificationEmail}
              onChange={(e) => setSettings(prev => ({ ...prev, notificationEmail: e.target.value }))}
              icon={<Mail className="w-4 h-4" />}
            />
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Системная информация
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-telegram-textSecondary">Версия платформы</p>
              <p className="font-medium">1.0.0</p>
            </div>
            <div>
              <p className="text-telegram-textSecondary">Последнее обновление</p>
              <p className="font-medium">21 ноября 2024</p>
            </div>
            <div>
              <p className="text-telegram-textSecondary">Размер базы данных</p>
              <p className="font-medium">245 MB</p>
            </div>
            <div>
              <p className="text-telegram-textSecondary">Активных сессий</p>
              <p className="font-medium">1,234</p>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-700/50">
            <Button variant="secondary" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Очистить кеш
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="sticky bottom-4 flex justify-end">
        <motion.div
          initial={false}
          animate={{
            scale: saved ? [1, 1.1, 1] : 1,
          }}
        >
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={saved}
          >
            {saved ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Сохранено
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Сохранить изменения
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  )
}




