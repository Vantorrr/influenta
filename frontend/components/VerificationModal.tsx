'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Link as LinkIcon, Plus, Trash2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { validateUrl } from '@/lib/utils'

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
  const [documentUrlError, setDocumentUrlError] = useState<string | null>(null)
  const [socialProofs, setSocialProofs] = useState<SocialProof[]>([])
  const [newProof, setNewProof] = useState<SocialProof>({ platform: 'Telegram', url: '', followers: undefined })
  const [newProofUrlError, setNewProofUrlError] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const normalizeUrl = (url: string) => {
    const trimmed = url.trim()
    if (!trimmed) return ''
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  }

  const handleAddDocument = () => {
    const candidate = normalizeUrl(documentUrl)
    if (!candidate || !validateUrl(candidate)) {
      setDocumentUrlError('Введите корректный URL (http/https)')
      return
    }
    setDocuments([...documents, candidate])
    setDocumentUrl('')
    setDocumentUrlError(null)
  }

  const handleUploadFile = async (file: File) => {
    if (!file) return
    try {
      setIsUploading(true)
      const form = new FormData()
      form.append('file', file)
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/uploads/verification`, {
        method: 'POST',
        body: form,
      })
      if (!resp.ok) throw new Error('upload failed')
      const data = await resp.json()
      if (data?.url) setDocuments(prev => [...prev, data.url])
    } catch (e) {
      alert('Не удалось загрузить файл. Попробуйте еще раз.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleAddSocialProof = () => {
    const candidate = normalizeUrl(newProof.url)
    if (!candidate || !validateUrl(candidate)) {
      setNewProofUrlError('Введите корректный URL (http/https)')
      return
    }
    setSocialProofs([...socialProofs, { ...newProof, url: candidate }])
    setNewProof({ platform: 'Telegram', url: '', followers: undefined })
    setNewProofUrlError(null)
  }

  const handleSubmit = async () => {
    if (documents.length === 0 && socialProofs.length === 0) {
      alert('Добавьте хотя бы один документ или ссылку на социальную сеть')
      return
    }
    const allDocsValid = documents.every((d) => validateUrl(d))
    const allProofsValid = socialProofs.every((p) => validateUrl(p.url))
    if (!allDocsValid || !allProofsValid) {
      alert('Обнаружены некорректные ссылки. Проверьте URL.')
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

              <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)] pb-[env(safe-area-inset-bottom)]">
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
                      onChange={(e) => { setDocumentUrl(e.target.value); setDocumentUrlError(null) }}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddDocument()}
                    />
                    {documentUrlError && (
                      <div className="text-xs text-telegram-danger">{documentUrlError}</div>
                    )}
                    <Button onClick={handleAddDocument} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                    <label className="inline-flex items-center px-3 py-2 bg-telegram-bg rounded-lg border border-telegram-border cursor-pointer text-sm">
                      <Upload className="w-4 h-4 mr-2" /> {isUploading ? 'Загрузка...' : 'Загрузить файл'}
                      <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => e.target.files && handleUploadFile(e.target.files[0])} disabled={isUploading} />
                    </label>
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
                      onChange={(e) => { setNewProof({ ...newProof, url: e.target.value }); setNewProofUrlError(null) }}
                    />
                    {newProofUrlError && (
                      <div className="text-xs text-telegram-danger">{newProofUrlError}</div>
                    )}
                    
                    <Input
                      type="number"
                      placeholder="Количество подписчиков (необязательно)"
                      value={newProof.followers || ''}
                      onChange={(e) => setNewProof({ ...newProof, followers: e.target.value ? parseInt(e.target.value) : undefined })}
                    />
                    
                    <Button onClick={handleAddSocialProof} fullWidth variant="secondary" disabled={!newProof.url.trim()}>
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

              <div className="p-6 border-t border-telegram-border flex gap-3 sticky bottom-0 bg-telegram-bg">
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
