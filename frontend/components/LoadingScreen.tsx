'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

export function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Анимация прогресса
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + 5
      })
    }, 50)

    // Минимальное время показа загрузочного экрана
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)

    return () => {
      clearTimeout(timer)
      clearInterval(progressInterval)
    }
  }, [])

  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    delay: Math.random() * 2,
  }))

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-telegram-bg overflow-hidden"
        >
          {/* Анимированные частицы на фоне */}
          <div className="absolute inset-0">
            {particles.map((particle) => (
              <motion.div
                key={particle.id}
                className="absolute rounded-full bg-telegram-accent opacity-20"
                style={{
                  left: `${particle.x}%`,
                  top: `${particle.y}%`,
                  width: particle.size,
                  height: particle.size,
                }}
                animate={{
                  y: [-20, -100],
                  opacity: [0.2, 0],
                }}
                transition={{
                  duration: 3,
                  delay: particle.delay,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>

          <div className="text-center relative">
            {/* Внешние кольца */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute w-40 h-40 rounded-full border border-telegram-primary/20"
              />
              <motion.div
                animate={{ rotate: -360, scale: [1, 1.2, 1] }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                className="absolute w-48 h-48 rounded-full border border-telegram-accent/10"
              />
            </div>

            {/* Логотип с анимацией */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, type: "spring", stiffness: 260, damping: 20 }}
              className="mb-8"
            >
              <div className="relative">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="relative mx-auto flex items-center justify-center"
                >
                  <Image
                    src="/logo.jpg"
                    alt="Influenta"
                    width={96}
                    height={96}
                    className="rounded-2xl"
                  />
                </motion.div>
              </div>
            </motion.div>

            {/* Название с эффектом печатания */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-2"
            >
              <motion.h1
                className="text-4xl font-bold bg-gradient-to-r from-telegram-primary via-telegram-accent to-telegram-primary bg-clip-text text-transparent"
                animate={{
                  backgroundPosition: ["0%", "100%", "0%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{
                  backgroundSize: "200% 100%",
                }}
              >
                Influenta
              </motion.h1>
            </motion.div>

            {/* Подзаголовок с анимацией появления по словам */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mb-12"
            >
              {["Платформа", "для", "блогеров", "и", "рекламодателей"].map((word, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 + index * 0.1 }}
                  className="text-telegram-textSecondary inline-block mr-1"
                >
                  {word}
                </motion.span>
              ))}
            </motion.div>

            {/* Прогресс-бар */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="w-64 mx-auto"
            >
              <div className="relative h-1 bg-telegram-bgSecondary rounded-full overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-telegram-primary to-telegram-accent rounded-full"
                  style={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
                <motion.div
                  className="absolute inset-y-0 bg-white/20 rounded-full"
                  animate={{
                    x: ["-100%", "200%"],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  style={{ width: "50%" }}
                />
              </div>
              
              {/* Процент загрузки */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8 }}
                className="text-xs text-telegram-textSecondary mt-2"
              >
                {progress}%
              </motion.p>
            </motion.div>

            {/* Индикатор загрузки с пульсацией */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 2 }}
              className="flex items-center justify-center gap-3 mt-8"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="relative"
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [1, 0.5, 1],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                    className="absolute inset-0 w-4 h-4 rounded-full bg-telegram-primary/30"
                  />
                  <motion.div
                    animate={{
                      y: [0, -12, 0],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                    className="relative w-4 h-4 rounded-full bg-gradient-to-br from-telegram-primary to-telegram-accent"
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}














