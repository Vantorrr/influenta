 'use client'

import { useState } from 'react'
import { X, Send, Calendar, FileText, Camera, MessageSquare } from 'lucide-react'
import { RubIcon } from '@/components/ui/ruble-icon'
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
    if (!proposedBudget) {
      setError('Укажите бюджет')
      return
    }

    const trimmedMessage = message.trim()

    if (trimmedMessage && trimmedMessage.length < 10) {
      setError('Сообщение должно быть не короче 10 символов или оставьте поле пустым')
      return
    }

    if (parseInt(proposedBudget) < 100) {
      setError('Минимальный бюджет 100₽')
      return
    }

    if (deadline) {
      const selectedDate = new Date(`${deadline}T00:00:00`)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (selectedDate < today) {
        setError('Дедлайн не может быть в прошлом')
        return
      }
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await offersApi.create({
        bloggerId,
        message: trimmedMessage || undefined,
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
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="w-full h-[95vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="h-full flex flex-col rounded-t-3xl rounded-b-none border-t border-white/10">
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

            <div className="p-6 pb-[320px] overflow-y-auto flex-1 min-h-0 overscroll-contain">
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
                      <RubIcon className="w-4 h-4 text-telegram-primary" />
                      Бюджет
                      <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="10.000"
                      value={
                        proposedBudget
                          ? proposedBudget.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
                          : ''
                      }
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/\D/g, '')
                        setProposedBudget(cleaned)
                      }}
                      className="w-full pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-telegram-textSecondary">
                      ₽
                    </span>
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
                  <div className="relative">
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[#1C1E20] border border-white/10 text-left transition-colors pointer-events-none">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-blue-400" />
                        <span className={deadline ? 'text-white' : 'text-white/40'}>
                          {deadline 
                            ? new Date(deadline).toLocaleDateString('ru-RU', { 
                                day: 'numeric', 
                                month: 'long', 
                                year: 'numeric' 
                              })
                            : 'Выбрать дату'
                          }
                        </span>
                      </div>
                      {deadline && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setDeadline('')
                          }}
                          className="text-white/40 hover:text-white/60 text-sm pointer-events-auto z-20 relative"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-telegram-textSecondary mt-1">
                    Когда должен быть опубликован контент
                  </p>
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
                  <p className="text-xs text-telegram-textSecondary mt-1">
                    Детали помогут блогеру лучше понять задачу
                  </p>
                </div>

                {/* Сообщение */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <span className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-telegram-primary" />
                      Сообщение блогеру
                    </span>
                  </label>
                  <textarea
                    placeholder="Почему вы хотите сотрудничать именно с этим блогером?"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-telegram-border rounded-lg bg-telegram-bg resize-none focus:outline-none focus:ring-2 focus:ring-telegram-primary"
                  />
                  <p className="text-xs text-telegram-textSecondary mt-1">
                    Необязательное поле, но персональное обращение повышает шансы на ответ
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 text-red-500 rounded-lg text-sm">{error}</div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-telegram-border grid grid-cols-1 sm:grid-cols-2 gap-3 flex-shrink-0 bg-telegram-bg pb-8">
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
                disabled={isSubmitting || !proposedBudget}
                className="w-full"
              >
                {isSubmitting ? (
                  'Отправка...'
                ) : (
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