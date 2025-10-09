'use client'

import { useState } from 'react'
import { X, Send, DollarSign, Calendar, FileText, Camera, MessageSquare } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { motion, AnimatePresence } from 'framer-motion'
import { offersApi } from '@/lib/api'

interface OfferModalProps {
  bloggerId: string
  bloggerName: string
  onClose: () => void
  onSuccess: () => void
}

export function OfferModal({ bloggerId, bloggerName, onClose, onSuccess }: OfferModalProps) {
  const [projectTitle, setProjectTitle] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [message, setMessage] = useState('')
  const [proposedBudget, setProposedBudget] = useState('')
  const [format, setFormat] = useState('post')
  const [deadline, setDeadline] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!message.trim() || !proposedBudget) {
      setError('Заполните обязательные поля')
      return
    }

    if (parseInt(proposedBudget) < 100) {
      setError('Минимальный бюджет 100₽')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await offersApi.create({
        bloggerId,
        message: message.trim(),
        proposedBudget: parseInt(proposedBudget),
        projectTitle: projectTitle.trim() || undefined,
        projectDescription: projectDescription.trim() || undefined,
        format: format || undefined,
        deadline: deadline || undefined,
      })
      onSuccess()
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Не удалось отправить предложение'
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="w-full max-w-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="mx-4 mb-4 md:mb-0 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-telegram-border flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Предложить сотрудничество</h2>
                  <p className="text-sm text-telegram-textSecondary mt-1">
                    Блогеру: {bloggerName}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="p-6 pb-8 overflow-y-auto flex-1 min-h-0 overscroll-contain">
              <div className="space-y-5">
                {/* Название проекта */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-telegram-primary" />
                      Название проекта
                    </span>
                  </label>
                  <Input
                    placeholder="Например: Реклама нового продукта"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    className="w-full"
                  />
                  <p className="text-xs text-telegram-textSecondary mt-1">Необязательное поле</p>
                </div>

                {/* Бюджет */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <span className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-telegram-primary" />
                      Бюджет
                      <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="10000"
                      value={proposedBudget}
                      onChange={(e) => setProposedBudget(e.target.value)}
                      min="100"
                      className="w-full pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-telegram-textSecondary">₽</span>
                  </div>
                  <p className="text-xs text-telegram-textSecondary mt-1">Минимальная сумма: 100₽</p>
                </div>

                {/* Формат */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <span className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-telegram-primary" />
                      Формат контента
                    </span>
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-telegram-border rounded-lg bg-telegram-bg focus:outline-none focus:ring-2 focus:ring-telegram-primary appearance-none"
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                  >
                    <option value="post">Пост</option>
                    <option value="story">Сторис</option>
                    <option value="live">Эфир/Reels</option>
                    <option value="post_and_story">Пост + Сторис</option>
                    <option value="any">Любой формат</option>
                  </select>
                </div>

                {/* Дедлайн */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-telegram-primary" />
                      Дедлайн
                    </span>
                  </label>
                  <Input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full"
                  />
                  <p className="text-xs text-telegram-textSecondary mt-1">Когда должен быть опубликован контент</p>
                </div>

                {/* Описание проекта */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-telegram-primary" />
                      Описание проекта
                    </span>
                  </label>
                  <textarea
                    placeholder="Расскажите подробнее о проекте, продукте или услуге"
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-telegram-border rounded-lg bg-telegram-bg resize-none focus:outline-none focus:ring-2 focus:ring-telegram-primary"
                  />
                  <p className="text-xs text-telegram-textSecondary mt-1">Детали помогут блогеру лучше понять задачу</p>
                </div>

                {/* Сообщение */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <span className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-telegram-primary" />
                      Сообщение блогеру
                      <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <textarea
                    placeholder="Почему вы хотите сотрудничать именно с этим блогером?"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-telegram-border rounded-lg bg-telegram-bg resize-none focus:outline-none focus:ring-2 focus:ring-telegram-primary"
                  />
                  <p className="text-xs text-telegram-textSecondary mt-1">Персональное обращение повышает шансы на ответ</p>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 text-red-500 rounded-lg text-sm">
                    {error}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-telegram-border grid grid-cols-1 sm:grid-cols-2 gap-3 flex-shrink-0 bg-telegram-bg pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-full"
              >
                Отмена
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={isSubmitting || !message.trim() || !proposedBudget}
                className="w-full"
              >
                {isSubmitting ? 'Отправка...' : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Отправить
                  </>
                )}
              </Button>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

