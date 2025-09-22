'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Минимальное время показа загрузочного экрана
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-telegram-bg"
        >
          <div className="text-center">
            {/* Логотип с анимацией */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-telegram-primary to-telegram-accent blur-xl opacity-50"
                />
                <div className="relative w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-telegram-primary to-telegram-accent flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">I</span>
                </div>
              </div>
            </motion.div>

            {/* Название */}
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold bg-gradient-to-r from-telegram-primary to-telegram-accent bg-clip-text text-transparent mb-2"
            >
              Influenta
            </motion.h1>

            {/* Подзаголовок */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-telegram-textSecondary mb-8"
            >
              Платформа для блогеров и рекламодателей
            </motion.p>

            {/* Индикатор загрузки */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.7 }}
              className="flex items-center justify-center gap-2"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                  className="w-3 h-3 rounded-full bg-telegram-primary"
                />
              ))}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
