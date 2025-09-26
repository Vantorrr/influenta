'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Link as LinkIcon, Plus, Trash2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

interface SocialProof {
  platform: string
  url: string
  followers?: number
}

interface VerificationModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    documents: string[]
    socialProofs: SocialProof[]
    message: string
  }) => void
}

const SOCIAL_PLATFORMS = [
  'Telegram',
  'Instagram', 
  'YouTube',
  'TikTok',
  'VKontakte',
  'Twitter/X',
  'Facebook',
  'Другое'
]

export function VerificationModal({ isOpen, onClose, onSubmit }: VerificationModalProps) {
  const [documents, setDocuments] = useState<string[]>([])
  const [documentUrl, setDocumentUrl] = useState('')
  const [socialProofs, setSocialProofs] = useState<SocialProof[]>([])
  const [newProof, setNewProof] = useState<SocialProof>({ platform: 'Telegram', url: '', followers: undefined })
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddDocument = () => {
    if (documentUrl.trim()) {
      setDocuments([...documents, documentUrl.trim()])
      setDocumentUrl('')
    }
  }

  const handleAddSocialProof = () => {
    if (newProof.url.trim()) {
      setSocialProofs([...socialProofs, { ...newProof, url: newProof.url.trim() }])
      setNewProof({ platform: 'Telegram', url: '', followers: undefined })
    }
  }

  const handleSubmit = async () => {
    if (documents.length === 0 && socialProofs.length === 0) {
      alert('Добавьте хотя бы один документ или ссылку на социальную сеть')
      return
    }

    setIsSubmitting(true)
    await onSubmit({ documents, socialProofs, message })
    setIsSubmitting(false)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-telegram-border">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Заявка на верификацию</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <p className="text-sm text-telegram-textSecondary mt-2">
                  Предоставьте доказательства владения аккаунтами и каналами
                </p>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                {/* Документы/Скриншоты */}
                <div>
                  <h3 className="font-medium mb-3">
                    Документы и скриншоты
                  </h3>
                  <p className="text-sm text-telegram-textSecondary mb-3">
                    Загрузите скриншоты админ-панелей, статистики или другие доказательства
                  </p>
                  
                  <div className="flex gap-2 mb-3">
                    <Input
                      placeholder="Ссылка на скриншот (imgur, prnt.sc и т.д.)"
                      value={documentUrl}
                      onChange={(e) => setDocumentUrl(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddDocument()}
                    />
                    <Button onClick={handleAddDocument} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {documents.length > 0 && (
                    <div className="space-y-2">
                      {documents.map((doc, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-telegram-bgSecondary rounded">
                          <Upload className="w-4 h-4 text-telegram-textSecondary" />
                          <a href={doc} target="_blank" rel="noopener noreferrer" 
                             className="text-sm text-telegram-primary hover:underline truncate flex-1">
                            {doc}
                          </a>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDocuments(documents.filter((_, i) => i !== index))}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Социальные сети */}
                <div>
                  <h3 className="font-medium mb-3">
                    Социальные сети и каналы
                  </h3>
                  <p className="text-sm text-telegram-textSecondary mb-3">
                    Добавьте ссылки на ваши официальные аккаунты
                  </p>

                  <div className="space-y-3 mb-3">
                    <select
                      value={newProof.platform}
                      onChange={(e) => setNewProof({ ...newProof, platform: e.target.value })}
                      className="w-full px-3 py-2 border border-telegram-border rounded-lg bg-telegram-bg"
                    >
                      {SOCIAL_PLATFORMS.map(platform => (
                        <option key={platform} value={platform}>{platform}</option>
                      ))}
                    </select>
                    
                    <Input
                      placeholder="Ссылка на профиль/канал"
                      value={newProof.url}
                      onChange={(e) => setNewProof({ ...newProof, url: e.target.value })}
                    />
                    
                    <Input
                      type="number"
                      placeholder="Количество подписчиков (необязательно)"
                      value={newProof.followers || ''}
                      onChange={(e) => setNewProof({ ...newProof, followers: e.target.value ? parseInt(e.target.value) : undefined })}
                    />
                    
                    <Button onClick={handleAddSocialProof} fullWidth variant="secondary">
                      <Plus className="w-4 h-4 mr-2" />
                      Добавить
                    </Button>
                  </div>

                  {socialProofs.length > 0 && (
                    <div className="space-y-2">
                      {socialProofs.map((proof, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 bg-telegram-bgSecondary rounded">
                          <LinkIcon className="w-4 h-4 text-telegram-textSecondary" />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{proof.platform}</div>
                            <a href={proof.url} target="_blank" rel="noopener noreferrer"
                               className="text-xs text-telegram-primary hover:underline">
                              {proof.url}
                            </a>
                            {proof.followers && (
                              <div className="text-xs text-telegram-textSecondary">
                                {proof.followers.toLocaleString('ru-RU')} подписчиков
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSocialProofs(socialProofs.filter((_, i) => i !== index))}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Сообщение */}
                <div>
                  <h3 className="font-medium mb-3">
                    Дополнительная информация
                  </h3>
                  <textarea
                    placeholder="Расскажите о себе, вашем опыте, достижениях..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-telegram-border rounded-lg bg-telegram-bg resize-none"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-telegram-border flex gap-3">
                <Button
                  variant="secondary"
                  onClick={onClose}
                  disabled={isSubmitting}
                  fullWidth
                >
                  Отмена
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={isSubmitting || (documents.length === 0 && socialProofs.length === 0)}
                  fullWidth
                >
                  {isSubmitting ? 'Отправка...' : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Отправить заявку
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
