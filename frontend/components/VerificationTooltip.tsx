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
        className={`bg-gradient-to-br from-blue-500 to-blue-600 rounded-full w-6 h-6 flex items-center justify-center cursor-help shadow-lg shadow-blue-500/40 ring-2 ring-telegram-bg ${className}`}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setShowTooltip(true)
        }}
        onMouseEnter={() => setShowTooltip(true)}
        title="Верифицирован"
      >
        <svg className="w-3.5 h-3.5 text-white drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
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
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-x-4 bottom-20 z-50 max-w-sm mx-auto"
            >
              <div className="bg-[#1C1E20] border border-white/10 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10">
                <div className="bg-gradient-to-r from-blue-600/20 to-blue-400/10 p-4 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-500 rounded-full p-1">
                      <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                    <h3 className="font-semibold text-white">Верификация</h3>
                  </div>
                  <button
                    onClick={() => setShowTooltip(false)}
                    className="p-1 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 space-y-4">
                  <p className="text-sm text-gray-300 leading-relaxed">
                    Верифицированный блогер - это проверенный автор с подтвержденной статистикой и личностью.
                  </p>

                  <div className="space-y-3 bg-black/20 rounded-xl p-3 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-500/10 p-1.5 rounded-lg">
                        <UserCheck className="w-4 h-4 text-blue-400" />
                      </div>
                      <p className="text-sm text-gray-200">Подтвержденная личность</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="bg-blue-500/10 p-1.5 rounded-lg">
                        <Shield className="w-4 h-4 text-blue-400" />
                      </div>
                      <p className="text-sm text-gray-200">Достоверная статистика</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="bg-blue-500/10 p-1.5 rounded-lg">
                         <TrendingUp className="w-4 h-4 text-blue-400" />
                      </div>
                      <p className="text-sm text-gray-200">Приоритет в поиске</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowTooltip(false)
                      window.location.href = '/profile'
                    }}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
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









