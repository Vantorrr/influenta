'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

export function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Упрощенная логика прогресса для плавности
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        // Нелинейный прирост
        const increment = Math.max(1, Math.floor((100 - prev) / 10))
        return Math.min(100, prev + increment)
      })
    }, 150)

    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [])

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: 'blur(5px)' }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0F1115] overflow-hidden"
        >
          {/* Оптимизированный фон: статические градиенты вместо тяжелой анимации */}
          <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-[20%] -left-[20%] w-[80%] h-[80%] rounded-full bg-blue-900/20 blur-[100px]" />
            <div className="absolute -bottom-[20%] -right-[20%] w-[80%] h-[80%] rounded-full bg-purple-900/20 blur-[100px]" />
            <div className="absolute top-[40%] left-[20%] w-[40%] h-[40%] rounded-full bg-amber-500/5 blur-[80px]" />
          </div>

          <div className="relative z-10 flex flex-col items-center w-full max-w-xs px-4">
            {/* Логотип */}
            <div className="relative mb-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative"
              >
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-2xl shadow-blue-900/20 border border-white/10">
                  <Image
                    src="/logo.jpg"
                    alt="Influenta"
                    fill
                    className="object-cover"
                    priority
                  />
                  {/* Легкий блик без тяжелых вычислений */}
                  <motion.div
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
                    className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
                  />
                </div>
              </motion.div>
            </div>

            {/* Текст */}
            <div className="text-center space-y-3 w-full">
              <motion.h1
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl font-bold text-white tracking-tight"
              >
                Influenta
              </motion.h1>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-[0.2em]"
              >
                <span>Connect</span>
                <span className="w-0.5 h-0.5 rounded-full bg-blue-500" />
                <span>Create</span>
                <span className="w-0.5 h-0.5 rounded-full bg-purple-500" />
                <span>Grow</span>
              </motion.div>
            </div>

            {/* Прогресс бар */}
            <div className="mt-10 w-full max-w-[200px]">
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-blue-600 to-purple-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                />
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-gray-600 font-mono">
                <span>LOADING_MODULES</span>
                <span>{progress}%</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
