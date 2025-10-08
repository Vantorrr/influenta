'use client'

import { useState } from 'react'
import { CheckCircle, X, Shield, TrendingUp, UserCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface VerificationTooltipProps {
  className?: string
}

export function VerificationTooltip({ className = '' }: VerificationTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <>
      <div 
        className={`bg-green-500 rounded-full p-0.5 inline-flex cursor-help relative ${className}`}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setShowTooltip(true)
        }}
        title="Что это значит?"
      >
        <CheckCircle className="w-4 h-4 text-white" />
      </div>

      <AnimatePresence>
        {showTooltip && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowTooltip(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-sm mx-auto max-h-[85vh] overflow-y-auto"
            >
              <div className="bg-telegram-bg rounded-2xl shadow-2xl overflow-hidden pb-[env(safe-area-inset-bottom)]">
                <div className="bg-green-500 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 rounded-full p-2">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-semibold">Верификация</h3>
                    </div>
                    <button
                      onClick={() => setShowTooltip(false)}
                      className="p-1 hover:bg-white/10 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <p className="text-sm text-telegram-textSecondary">
                    Зеленая галочка означает, что блогер прошел проверку и подтвердил свою личность.
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <UserCheck className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Подтвержденная личность</p>
                        <p className="text-sm text-telegram-textSecondary">
                          Реальный человек, а не бот
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Достоверная статистика</p>
                        <p className="text-sm text-telegram-textSecondary">
                          Проверенные данные о подписчиках
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <TrendingUp className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Приоритет в поиске</p>
                        <p className="text-sm text-telegram-textSecondary">
                          Больше заказов от рекламодателей
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setShowTooltip(false)
                        // Можно добавить переход на страницу верификации
                        window.location.href = '/profile'
                      }}
                      className="w-full bg-green-500 text-white py-3 rounded-xl font-medium hover:bg-green-600 transition-colors"
                    >
                      Хочу верификацию
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}



