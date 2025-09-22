'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertCircle,
  Shield,
  MessageSquare,
  FileText,
  User,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Ban,
  MoreVertical
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { formatDate, getRelativeTime } from '@/lib/utils'

type TabType = 'verification' | 'complaints' | 'content'

export default function AdminModerationPage() {
  const [activeTab, setActiveTab] = useState<TabType>('verification')
  const [selectedItem, setSelectedItem] = useState<any>(null)

  // Mock данные
  const verificationRequests = [
    {
      id: '1',
      type: 'blogger',
      user: {
        firstName: 'Алексей',
        lastName: 'Новиков',
        username: '@alex_travel',
        email: 'alex@example.com',
      },
      documents: [
        { type: 'passport', url: '#', uploaded: new Date('2024-11-20') },
        { type: 'channel_ownership', url: '#', uploaded: new Date('2024-11-20') },
      ],
      subscribersCount: 45000,
      requestedAt: new Date('2024-11-20'),
      status: 'pending',
    },
    {
      id: '2',
      type: 'advertiser',
      user: {
        companyName: 'BeautyBrand',
        email: 'contact@beautybrand.com',
      },
      documents: [
        { type: 'registration', url: '#', uploaded: new Date('2024-11-19') },
        { type: 'tax_id', url: '#', uploaded: new Date('2024-11-19') },
      ],
      website: 'https://beautybrand.com',
      requestedAt: new Date('2024-11-19'),
      status: 'pending',
    },
  ]

  const complaints = [
    {
      id: '1',
      type: 'spam',
      reportedUser: {
        firstName: 'Спам',
        lastName: 'Юзер',
        username: '@spam_user',
      },
      reportedBy: {
        firstName: 'Анна',
        lastName: 'Иванова',
        username: '@anna_lifestyle',
      },
      reason: 'Массовая рассылка спама в комментариях',
      evidence: ['screenshot1.jpg', 'screenshot2.jpg'],
      reportedAt: new Date('2024-11-21'),
      status: 'pending',
    },
    {
      id: '2',
      type: 'inappropriate_content',
      reportedListing: {
        title: 'Сомнительное предложение',
        advertiser: 'UnknownCompany',
      },
      reportedBy: {
        firstName: 'Михаил',
        lastName: 'Петров',
        username: '@tech_mike',
      },
      reason: 'Предложение содержит недостоверную информацию',
      reportedAt: new Date('2024-11-20'),
      status: 'pending',
    },
  ]

  const contentModeration = [
    {
      id: '1',
      type: 'listing',
      title: 'Реклама криптовалюты',
      advertiser: 'CryptoExchange',
      flaggedReason: 'Возможное нарушение правил рекламы финансовых услуг',
      createdAt: new Date('2024-11-21'),
      status: 'pending',
    },
    {
      id: '2',
      type: 'profile',
      user: {
        firstName: 'Подозрительный',
        lastName: 'Профиль',
        username: '@suspicious_profile',
      },
      flaggedReason: 'Использование чужих фотографий',
      createdAt: new Date('2024-11-20'),
      status: 'pending',
    },
  ]

  const tabs = [
    {
      id: 'verification',
      label: 'Верификация',
      icon: Shield,
      count: verificationRequests.length,
    },
    {
      id: 'complaints',
      label: 'Жалобы',
      icon: AlertCircle,
      count: complaints.length,
    },
    {
      id: 'content',
      label: 'Контент',
      icon: FileText,
      count: contentModeration.length,
    },
  ]

  const handleApprove = (id: string) => {
    console.log('Approve:', id)
    // Здесь будет API вызов
  }

  const handleReject = (id: string) => {
    console.log('Reject:', id)
    // Здесь будет API вызов
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Модерация</h1>
        <p className="text-telegram-textSecondary">
          Управление верификацией, жалобами и контентом
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700/50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-telegram-primary text-telegram-primary'
                : 'border-transparent text-telegram-textSecondary hover:text-telegram-text'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <Badge variant="danger" className="ml-2">
                {tab.count}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'verification' && (
          <motion.div
            key="verification"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {verificationRequests.map((request) => (
              <Card key={request.id} hover>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-telegram-primary/20 rounded-lg flex items-center justify-center">
                        <Shield className="w-6 h-6 text-telegram-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {request.type === 'blogger' 
                            ? `${request.user.firstName} ${request.user.lastName}`
                            : request.user.companyName
                          }
                        </h3>
                        <p className="text-telegram-textSecondary">
                          {request.type === 'blogger' ? 'Блогер' : 'Рекламодатель'} • 
                          Запрос от {formatDate(request.requestedAt)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="warning">Ожидает проверки</Badge>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-telegram-textSecondary mb-2">
                        Информация
                      </p>
                      {request.type === 'blogger' ? (
                        <div className="space-y-1 text-sm">
                          <p>Username: {request.user.username}</p>
                          <p>Email: {request.user.email}</p>
                          <p>Подписчики: {request.subscribersCount?.toLocaleString()}</p>
                        </div>
                      ) : (
                        <div className="space-y-1 text-sm">
                          <p>Email: {request.user.email}</p>
                          <p>Сайт: <a href={request.website} className="text-telegram-primary hover:underline">{request.website}</a></p>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-telegram-textSecondary mb-2">
                        Документы
                      </p>
                      <div className="space-y-1">
                        {request.documents.map((doc, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <FileText className="w-4 h-4 text-telegram-textSecondary" />
                            <span>{doc.type}</span>
                            <button className="text-telegram-primary hover:underline ml-auto">
                              Просмотр
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleApprove(request.id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Подтвердить
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleReject(request.id)}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Отклонить
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedItem(request)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Подробнее
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}

        {activeTab === 'complaints' && (
          <motion.div
            key="complaints"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {complaints.map((complaint) => (
              <Card key={complaint.id} hover>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-telegram-danger/20 rounded-lg flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-telegram-danger" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          Жалоба на {complaint.reportedUser ? 'пользователя' : 'объявление'}
                        </h3>
                        <p className="text-telegram-textSecondary">
                          От {complaint.reportedBy.firstName} {complaint.reportedBy.lastName} • 
                          {getRelativeTime(complaint.reportedAt)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="danger">
                      {complaint.type === 'spam' ? 'Спам' : 'Неподобающий контент'}
                    </Badge>
                  </div>

                  <div className="bg-telegram-bg rounded-lg p-4 mb-4">
                    <p className="text-sm font-medium text-telegram-textSecondary mb-2">
                      Причина жалобы:
                    </p>
                    <p className="text-sm">{complaint.reason}</p>
                    
                    {complaint.evidence && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-telegram-textSecondary mb-1">
                          Доказательства:
                        </p>
                        <div className="flex gap-2">
                          {complaint.evidence.map((file, index) => (
                            <button
                              key={index}
                              className="text-sm text-telegram-primary hover:underline"
                            >
                              {file}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="danger"
                      size="sm"
                    >
                      <Ban className="w-4 h-4 mr-1" />
                      Заблокировать
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Отклонить жалобу
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Предупреждение
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}

        {activeTab === 'content' && (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {contentModeration.map((item) => (
              <Card key={item.id} hover>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-telegram-warning/20 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-telegram-warning" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {item.type === 'listing' ? item.title : `Профиль ${item.user?.username}`}
                        </h3>
                        <p className="text-telegram-textSecondary">
                          {item.type === 'listing' ? `От ${item.advertiser}` : 'Пользовательский профиль'} • 
                          {getRelativeTime(item.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="warning">Требует проверки</Badge>
                  </div>

                  <div className="bg-telegram-bg rounded-lg p-4 mb-4">
                    <p className="text-sm font-medium text-telegram-textSecondary mb-2">
                      Причина проверки:
                    </p>
                    <p className="text-sm">{item.flaggedReason}</p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="primary"
                      size="sm"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Одобрить
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Удалить
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Просмотреть
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

