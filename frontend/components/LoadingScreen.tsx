'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

export function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [loadingText, setLoadingText] = useState('Запуск платформы...')

  useEffect(() => {
    // Непрерывная мягкая вибрация во время загрузки
    // Быстрые soft импульсы создают ощущение сплошной вибрации
    const haptic = (window as any).Telegram?.WebApp?.HapticFeedback
    
    let vibrationInterval: NodeJS.Timeout | null = null
    
    if (haptic) {
      // Telegram: быстрые soft импульсы каждые 50мс = сплошная мягкая вибрация
      vibrationInterval = setInterval(() => {
        haptic.impactOccurred('soft')
      }, 50)
    } else {
      // Fallback: одна длинная вибрация на всю загрузку
      try { navigator.vibrate?.(2000) } catch {}
    }
    
    const vibrationTimers: NodeJS.Timeout[] = []

    // Имитация загрузки с меняющимся текстом
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100
        
        // Меняем текст в зависимости от прогресса
        if (prev === 20) setLoadingText('Подключаем базу блогеров...')
        if (prev === 50) setLoadingText('Загружаем статистику...')
        if (prev === 80) setLoadingText('Почти готово...')
        
        // Замедляемся к концу
        const add = Math.max(1, Math.floor((100 - prev) / 15))
        return prev + add
      })
    }, 50)

    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2200)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
      vibrationTimers.forEach(t => clearTimeout(t))
      if (vibrationInterval) clearInterval(vibrationInterval)
      try { navigator.vibrate?.(0) } catch {} // Останавливаем вибрацию
    }
  }, [])

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#080a0f] overflow-hidden"
        >
          {/* Статичный фон с градиентом */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#080a0f] to-[#080a0f]" />
          
          {/* Тонкая сетка для текстуры */}
          <div 
            className="absolute inset-0 opacity-[0.03]" 
            style={{ 
              backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', 
              backgroundSize: '40px 40px' 
            }} 
          />

          <div className="relative z-10 flex flex-col items-center w-full max-w-xs">
            {/* Логотип */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative mb-10"
            >
              <motion.div
                animate={{ 
                  boxShadow: [
                    "0 0 20px rgba(59,130,246,0.1)", 
                    "0 0 50px rgba(59,130,246,0.3)", 
                    "0 0 20px rgba(59,130,246,0.1)"
                  ] 
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="relative w-28 h-28 rounded-3xl overflow-hidden border border-white/10 bg-[#1C1E20]"
              >
                <Image
                  src="/logo.jpg"
                  alt="Influenta"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-50" />
              </motion.div>
            </motion.div>

            {/* Название и слоган */}
            <div className="text-center space-y-4 mb-12">
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
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
                className="flex items-center justify-center gap-3 text-[10px] font-medium text-blue-200/60 uppercase tracking-[0.2em]"
              >
                <span>Блогеры</span>
                <span className="w-0.5 h-0.5 rounded-full bg-blue-500" />
                <span>Реклама</span>
                <span className="w-0.5 h-0.5 rounded-full bg-blue-500" />
                <span>Результат</span>
              </motion.div>
            </div>

            {/* Полоса загрузки */}
            <div className="w-48 relative">
              <div className="absolute inset-0 h-0.5 bg-white/10 rounded-full" />
              
              <motion.div 
                className="absolute inset-y-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ type: "spring", stiffness: 50, damping: 20 }}
              />
              
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                style={{ left: `${progress}%` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              />
            </div>
            
            {/* Текст загрузки */}
            <motion.p 
              className="mt-4 text-[10px] font-medium text-white/40 h-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key={loadingText} // Анимация при смене текста
            >
              {loadingText}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
