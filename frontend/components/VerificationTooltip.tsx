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
              className="fixed inset-x-4 bottom-20 z-50 max-w-sm mx-auto max-h-[60vh] overflow-y-auto"
            >
              <div className="bg-telegram-bg rounded-2xl shadow-2xl">
                <div className="bg-green-500 p-3 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <h3 className="font-semibold">Верификация</h3>
                  </div>
                  <button
                    onClick={() => setShowTooltip(false)}
                    className="p-1 hover:bg-white/10 rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 space-y-3">
                  <p className="text-sm text-telegram-textSecondary">
                    Верифицированный блогер - проверенная личность с подтвержденными данными.
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <UserCheck className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">Подтвержденная личность</p>
                    </div>

                    <div className="flex items-start gap-2">
                      <Shield className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">Достоверная статистика</p>
                    </div>

                    <div className="flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">Приоритет в поиске</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowTooltip(false)
                      window.location.href = '/profile'
                    }}
                    className="w-full bg-green-500 text-white py-3 rounded-xl font-medium hover:bg-green-600 transition-colors mt-4"
                  >
                    Хочу верификацию
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}







