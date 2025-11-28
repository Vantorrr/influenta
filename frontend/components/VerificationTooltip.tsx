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
        className={`bg-gradient-to-br from-blue-400 to-blue-600 rounded-full w-5 h-5 flex items-center justify-center cursor-help relative shadow-lg shadow-blue-500/50 ring-2 ring-white/20 ${className}`}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setShowTooltip(true)
        }}
        title="Верифицирован"
      >
        <svg className="w-3 h-3 text-white drop-shadow-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
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
                <div className="bg-blue-500 p-3 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
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
                      <UserCheck className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">Подтвержденная личность</p>
                    </div>

                    <div className="flex items-start gap-2">
                      <Shield className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">Достоверная статистика</p>
                    </div>

                    <div className="flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">Приоритет в поиске</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowTooltip(false)
                      window.location.href = '/profile'
                    }}
                    className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600 transition-colors mt-4"
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










