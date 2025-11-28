'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

export function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Плавная и неравномерная анимация прогресса для реалистичности
    const steps = [10, 25, 45, 60, 80, 90, 100]
    let currentStep = 0

    const interval = setInterval(() => {
      if (currentStep >= steps.length) {
        clearInterval(interval)
        return
      }
      
      const target = steps[currentStep]
      setProgress(prev => {
        const diff = target - prev
        // Если мы близко к цели шага, переходим к следующему
        if (diff <= 1) {
          currentStep++
          return target
        }
        // Иначе плавно приближаемся
        return prev + Math.ceil(diff * 0.1)
      })
    }, 100)

    // Гарантированное время показа
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2500)

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
          exit={{ opacity: 0, filter: 'blur(10px)', scale: 1.1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0F1115] overflow-hidden"
        >
          {/* Фоновые эффекты (Aurora Borealis) */}
          <div className="absolute inset-0 w-full h-full opacity-40">
            <motion.div 
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.2, 1],
                x: [0, 50, 0],
                y: [0, 30, 0]
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -top-[20%] -left-[20%] w-[70%] h-[70%] rounded-full bg-blue-600/20 blur-[120px]" 
            />
            <motion.div 
              animate={{ 
                rotate: [0, -360],
                scale: [1, 1.3, 1],
                x: [0, -30, 0], 
                y: [0, 50, 0]
              }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute top-[20%] -right-[20%] w-[60%] h-[60%] rounded-full bg-purple-600/20 blur-[120px]" 
            />
            <motion.div 
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.1, 0.2, 0.1]
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-[10%] left-[20%] w-[50%] h-[50%] rounded-full bg-amber-500/10 blur-[100px]" 
            />
          </div>

          <div className="relative z-10 flex flex-col items-center">
            {/* Логотип с эффектом свечения и пульсации */}
            <div className="relative mb-8">
              {/* Внешнее кольцо */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="absolute inset-0 -m-4 rounded-full bg-gradient-to-tr from-blue-500/20 to-purple-500/20 blur-xl"
              />
              
              <motion.div
                initial={{ scale: 0.8, opacity: 0, rotateX: 90 }}
                animate={{ scale: 1, opacity: 1, rotateX: 0 }}
                transition={{ duration: 1.2, type: "spring", bounce: 0.4 }}
                className="relative"
              >
                <div className="relative w-28 h-28 rounded-3xl overflow-hidden shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)] border border-white/10">
                  <Image
                    src="/logo.jpg"
                    alt="Influenta"
                    fill
                    className="object-cover"
                    priority
                  />
                  {/* Блик на логотипе */}
                  <motion.div
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
                    className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                  />
                </div>
              </motion.div>
            </div>

            {/* Типографика */}
            <div className="text-center space-y-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="relative"
              >
                <h1 className="text-5xl font-bold tracking-tight text-white mb-1">
                  Influenta
                </h1>
                {/* Градиентный текст поверх (маска) */}
                <motion.h1
                  className="absolute top-0 left-0 w-full text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-[length:200%_auto]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0], backgroundPosition: ['0%', '200%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  Influenta
                </motion.h1>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="flex items-center justify-center gap-2 text-sm font-medium text-gray-400 uppercase tracking-widest"
              >
                <span>Connect</span>
                <span className="w-1 h-1 rounded-full bg-blue-500" />
                <span>Create</span>
                <span className="w-1 h-1 rounded-full bg-purple-500" />
                <span>Grow</span>
              </motion.div>
            </div>

            {/* Прогресс бар High-Tech */}
            <motion.div 
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 200 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="mt-12 relative h-1 bg-white/5 rounded-full overflow-hidden"
            >
              <motion.div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500"
                style={{ width: `${progress}%` }}
                transition={{ type: "spring", stiffness: 50 }}
              />
              {/* Светящаяся точка в конце полосы */}
              <motion.div
                className="absolute top-1/2 -mt-1.5 h-3 w-3 bg-white rounded-full shadow-[0_0_10px_white]"
                style={{ left: `${progress}%` }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 text-[10px] text-gray-600 font-mono"
            >
              LOADING_MODULES... {progress}%
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
