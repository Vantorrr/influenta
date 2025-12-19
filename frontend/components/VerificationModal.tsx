'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Link as LinkIcon, Plus, Trash2, Check, AlertCircle, Copy, CheckCircle2 } from 'lucide-react'
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
    verificationCode: string
  }) => void
  userId?: string
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

const MIN_FOLLOWERS = 100000

// Генерируем уникальный код верификации
function generateVerificationCode(userId?: string): string {
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase()
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4)
  return `INFLUENTA-${randomPart}${timestamp}`
}

export function VerificationModal({ isOpen, onClose, onSubmit, userId }: VerificationModalProps) {
  const [documents, setDocuments] = useState<string[]>([])
  const [documentUrl, setDocumentUrl] = useState('')
  const [documentUrlError, setDocumentUrlError] = useState<string | null>(null)
  const [socialProofs, setSocialProofs] = useState<SocialProof[]>([])
  const [newProof, setNewProof] = useState<SocialProof>({ platform: 'Telegram', url: '', followers: undefined })
  const [newProofUrlError, setNewProofUrlError] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [codeCopied, setCodeCopied] = useState(false)
  const [codeConfirmed, setCodeConfirmed] = useState(false)

  // Генерируем код при открытии модалки
  useEffect(() => {
    if (isOpen) {
      setVerificationCode(generateVerificationCode(userId))
      setCodeCopied(false)
      setCodeConfirmed(false)
    }
  }, [isOpen, userId])

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
    if (!newProof.followers || newProof.followers < MIN_FOLLOWERS) {
      setNewProofUrlError(`Минимум ${MIN_FOLLOWERS.toLocaleString('ru-RU')} подписчиков`)
      return
    }
    setSocialProofs([...socialProofs, { ...newProof, url: candidate }])
    setNewProof({ platform: 'Telegram', url: '', followers: undefined })
    setNewProofUrlError(null)
  }

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(verificationCode)
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 3000)
    } catch {
      // Fallback для старых браузеров
      const textArea = document.createElement('textarea')
      textArea.value = verificationCode
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 3000)
    }
  }

  // Проверяем есть ли хотя бы один аккаунт с 100к+
  const hasEnoughFollowers = socialProofs.some(p => p.followers && p.followers >= MIN_FOLLOWERS)

  const handleSubmit = async () => {
    // Проверка паспорта
    if (documents.length === 0) {
      alert('Загрузите документ (паспорт)')
      return
    }

    // Проверка соцсетей с 100к+
    if (!hasEnoughFollowers) {
      alert(`Добавьте хотя бы одну социальную сеть с ${MIN_FOLLOWERS.toLocaleString('ru-RU')}+ подписчиков`)
      return
    }

    // Проверка подтверждения кода
    if (!codeConfirmed) {
      alert('Подтвердите, что вы добавили код верификации в описание профиля')
      return
    }

    const allDocsValid = documents.every((d) => validateUrl(d))
    const allProofsValid = socialProofs.every((p) => validateUrl(p.url))
    if (!allDocsValid || !allProofsValid) {
      alert('Обнаружены некорректные ссылки. Проверьте URL.')
      return
    }

    setIsSubmitting(true)
    await onSubmit({ documents, socialProofs, message, verificationCode })
    setIsSubmitting(false)
  }

  const canSubmit = documents.length > 0 && hasEnoughFollowers && codeConfirmed && !isSubmitting

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
            <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-telegram-border flex-shrink-0">
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
                  Подтвердите владение аккаунтами для получения синей галочки
                </p>
              </div>

              <div className="p-6 pb-8 space-y-6 overflow-y-auto flex-1 min-h-0 overscroll-contain">
                {/* Важное уведомление */}
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-500">Требования для верификации</p>
                      <ul className="mt-2 text-sm text-telegram-textSecondary space-y-1">
                        <li>• Минимум <span className="font-semibold text-telegram-text">100 000 подписчиков</span> в любой социальной сети</li>
                        <li>• Документ, удостоверяющий личность (паспорт)</li>
                        <li>• Код верификации в описании вашего профиля</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Шаг 1: Код верификации */}
                <div className="p-4 rounded-xl bg-telegram-primary/10 border border-telegram-primary/30">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-telegram-primary text-white text-sm flex items-center justify-center">1</span>
                    Код верификации
                  </h3>
                  <p className="text-sm text-telegram-textSecondary mb-3">
                    Скопируйте этот код и добавьте его в описание (bio) вашего основного аккаунта. 
                    После проверки модератором вы сможете его удалить.
                  </p>
                  
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 font-mono text-lg bg-telegram-bgSecondary px-4 py-3 rounded-lg border border-telegram-border select-all">
                      {verificationCode}
                    </div>
                    <Button 
                      onClick={handleCopyCode} 
                      variant={codeCopied ? "primary" : "secondary"}
                      className="flex-shrink-0"
                    >
                      {codeCopied ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Скопировано
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Копировать
                        </>
                      )}
                    </Button>
                  </div>

                  <label className="flex items-center gap-2 mt-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={codeConfirmed}
                      onChange={(e) => setCodeConfirmed(e.target.checked)}
                      className="w-5 h-5 rounded border-telegram-border accent-telegram-primary"
                    />
                    <span className="text-sm">
                      Я добавил(а) код в описание профиля
                    </span>
                  </label>
                </div>

                {/* Шаг 2: Паспорт */}
                <div>
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-telegram-primary text-white text-sm flex items-center justify-center">2</span>
                    Документ, удостоверяющий личность
                  </h3>
                  <p className="text-sm text-telegram-textSecondary mb-3">
                    Загрузите селфи с паспортом (как при регистрации на бирже). Документ должен быть читаемым, а ваше лицо — хорошо видно.
                  </p>
                  
                  <div className="flex gap-2 mb-3">
                    <Input
                      placeholder="Ссылка на фото (imgur, prnt.sc и т.д.)"
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
                    <label className="inline-flex items-center px-3 py-2 bg-telegram-bg rounded-lg border border-telegram-border cursor-pointer text-sm hover:bg-telegram-bgSecondary transition-colors">
                      <Upload className="w-4 h-4 mr-2" /> {isUploading ? 'Загрузка...' : 'Файл'}
                      <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => e.target.files && handleUploadFile(e.target.files[0])} disabled={isUploading} />
                    </label>
                  </div>

                  {documents.length > 0 && (
                    <div className="space-y-2">
                      {documents.map((doc, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/30 rounded">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
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

                  {documents.length === 0 && (
                    <div className="text-sm text-telegram-danger flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Обязательно загрузите документ
                    </div>
                  )}
                </div>

                {/* Шаг 3: Социальные сети */}
                <div>
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-telegram-primary text-white text-sm flex items-center justify-center">3</span>
                    Социальные сети (от 100 000 подписчиков)
                  </h3>
                  <p className="text-sm text-telegram-textSecondary mb-3">
                    Добавьте ссылку на аккаунт, где вы разместили код верификации. 
                    <span className="text-telegram-danger font-medium"> Минимум 100 000 подписчиков.</span>
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
                    
                    <Input
                      type="number"
                      placeholder="Количество подписчиков (обязательно, от 100 000)"
                      value={newProof.followers || ''}
                      onChange={(e) => setNewProof({ ...newProof, followers: e.target.value ? parseInt(e.target.value) : undefined })}
                      min={MIN_FOLLOWERS}
                    />
                    
                    {newProofUrlError && (
                      <div className="text-xs text-telegram-danger flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {newProofUrlError}
                      </div>
                    )}
                    
                    <Button 
                      onClick={handleAddSocialProof} 
                      fullWidth 
                      variant="secondary" 
                      disabled={!newProof.url.trim() || !newProof.followers}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Добавить
                    </Button>
                  </div>

                  {socialProofs.length > 0 && (
                    <div className="space-y-2">
                      {socialProofs.map((proof, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded">
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{proof.platform}</div>
                            <a href={proof.url} target="_blank" rel="noopener noreferrer"
                               className="text-xs text-telegram-primary hover:underline truncate block">
                              {proof.url}
                            </a>
                            {proof.followers && (
                              <div className="text-xs text-green-600 font-medium">
                                {proof.followers.toLocaleString('ru-RU')} подписчиков ✓
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

                  {!hasEnoughFollowers && (
                    <div className="text-sm text-telegram-danger flex items-center gap-2 mt-2">
                      <AlertCircle className="w-4 h-4" />
                      Добавьте аккаунт с 100 000+ подписчиков
                    </div>
                  )}
                </div>

                {/* Дополнительная информация */}
                <div className="pb-4">
                  <h3 className="font-medium mb-3">
                    Дополнительная информация (опционально)
                  </h3>
                  <textarea
                    placeholder="Расскажите о себе, вашем опыте, достижениях..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-telegram-border rounded-lg bg-telegram-bg resize-y min-h-[80px] max-h-[150px]"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-telegram-border flex gap-3 flex-shrink-0 bg-telegram-bg pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
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
                  disabled={!canSubmit}
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
