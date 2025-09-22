'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion'
import { Search, Users, Briefcase, TrendingUp, Star, ArrowRight, Shield, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useScrollAnimation, useParallax } from '@/hooks/useScrollAnimation'

export default function HomePage() {
  const router = useRouter()
  const { user, isAdmin, isSuperAdmin } = useAuth()
  const [userRole, setUserRole] = useState<'blogger' | 'advertiser' | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Scroll animations
  const { scrollYProgress } = useScroll()
  const parallaxY = useParallax(0.5)
  const scaleProgress = useTransform(scrollYProgress, [0, 1], [0.8, 1])
  const opacityProgress = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  
  // Mouse animations
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const smoothMouseX = useSpring(mouseX, { stiffness: 300, damping: 30 })
  const smoothMouseY = useSpring(mouseY, { stiffness: 300, damping: 30 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e
      const { innerWidth, innerHeight } = window
      mouseX.set((clientX - innerWidth / 2) / 20)
      mouseY.set((clientY - innerHeight / 2) / 20)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  useEffect(() => {
    // Проверяем авторизацию через Telegram WebApp
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      const user = tg.initDataUnsafe?.user
      
      if (user) {
        // Автоматический переход если пользователь уже авторизован
        // router.push('/dashboard')
      }
    }
  }, [router])

  const features = [
    {
      icon: Search,
      title: 'Умный поиск',
      description: 'Находите блогеров по тематике, охватам и бюджету',
      color: 'from-blue-500 to-cyan-500',
      delay: 0,
    },
    {
      icon: Users,
      title: 'Проверенные блогеры',
      description: 'База из тысяч верифицированных инфлюенсеров',
      color: 'from-purple-500 to-pink-500',
      delay: 0.1,
    },
    {
      icon: Briefcase,
      title: 'Безопасные сделки',
      description: 'Встроенный чат и система откликов',
      color: 'from-green-500 to-emerald-500',
      delay: 0.2,
    },
    {
      icon: TrendingUp,
      title: 'Аналитика',
      description: 'Детальная статистика по каждой кампании',
      color: 'from-orange-500 to-red-500',
      delay: 0.3,
    },
  ]

  // Floating particles
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 20 + 20,
    delay: Math.random() * 5,
  }))

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
      },
    },
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-telegram-bg via-telegram-bgSecondary to-telegram-bg overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        {/* Gradient orbs */}
        <motion.div
          className="absolute top-20 left-20 w-96 h-96 bg-telegram-primary/20 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 bg-telegram-accent/20 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        
        {/* Floating particles */}
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-telegram-accent/30"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
            }}
            animate={{
              y: [-20, -200],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Admin Badge & Button */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed top-4 right-4 z-50 flex items-center gap-3"
        >
          <Badge variant="primary" className="flex items-center gap-2 px-3 py-1.5">
            <Shield className="w-4 h-4" />
            {isSuperAdmin ? 'Супер Админ' : 'Администратор'}
          </Badge>
          <Button
            variant="primary"
            size="sm"
            onClick={() => router.push('/admin/dashboard')}
            className="flex items-center gap-2"
          >
            <Shield className="w-4 h-4" />
            Админ панель
          </Button>
        </motion.div>
      )}

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center">
        <motion.div 
          className="container relative z-10"
          style={{
            transform: `translateY(${parallaxY}px)`,
          }}
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center"
          >
            {/* Animated logo */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 260, 
                damping: 20,
                duration: 1 
              }}
              className="mb-8 relative inline-block"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-telegram-primary to-telegram-accent blur-2xl opacity-50"
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                }}
              />
              <div className="relative w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-telegram-primary to-telegram-accent flex items-center justify-center transform rotate-3 hover:rotate-6 transition-transform">
                <span className="text-5xl font-bold text-white">I</span>
                <motion.div
                  className="absolute -top-1 -right-1"
                  animate={{
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                </motion.div>
              </div>
            </motion.div>

            <motion.h1 
              variants={itemVariants}
              className="text-5xl md:text-7xl font-bold mb-6"
              style={{
                transform: `translate(${smoothMouseX}px, ${smoothMouseY}px)`,
              }}
            >
              <motion.span
                className="inline-block bg-gradient-to-r from-telegram-primary via-telegram-accent to-telegram-primary bg-clip-text text-transparent"
                animate={{
                  backgroundPosition: ["0%", "100%", "0%"],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{
                  backgroundSize: "200% 100%",
                }}
              >
                Influencer
              </motion.span>{" "}
              <motion.span 
                className="inline-block"
                whileHover={{ 
                  scale: 1.05,
                  rotate: [-1, 1, -1],
                  transition: { duration: 0.3 }
                }}
              >
                Platform
              </motion.span>
            </motion.h1>

            <motion.p 
              variants={itemVariants}
              className="text-xl md:text-2xl text-telegram-textSecondary mb-8 max-w-2xl mx-auto"
            >
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Связываем блогеров и рекламодателей в Telegram.
              </motion.span>{" "}
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-telegram-text font-medium"
              >
                Быстро, удобно, безопасно.
              </motion.span>
            </motion.p>
            
            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            >
              <motion.button
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 20px 40px rgba(42, 171, 238, 0.3)",
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setUserRole('blogger')
                  router.push('/onboarding?role=blogger')
                }}
                className="group relative btn-primary text-lg px-8 py-4 flex items-center justify-center gap-3 overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-telegram-accent to-telegram-primary"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
                <Users className="w-5 h-5 relative z-10" />
                <span className="relative z-10">Я блогер</span>
                <motion.div
                  className="absolute right-4"
                  initial={{ x: -10, opacity: 0 }}
                  whileHover={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.div>
              </motion.button>
              
              <motion.button
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 20px 40px rgba(113, 170, 235, 0.3)",
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setUserRole('advertiser')
                  router.push('/onboarding?role=advertiser')
                }}
                className="group relative btn-secondary text-lg px-8 py-4 flex items-center justify-center gap-3 overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-telegram-bgSecondary to-telegram-bg opacity-50"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
                <Briefcase className="w-5 h-5 relative z-10" />
                <span className="relative z-10">Я рекламодатель</span>
                <motion.div
                  className="absolute right-4"
                  initial={{ x: -10, opacity: 0 }}
                  whileHover={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.div>
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Stats with counter animation */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="grid grid-cols-3 gap-8 max-w-3xl mx-auto"
          >
            {[
              { value: 10000, suffix: '+', label: 'Блогеров' },
              { value: 500, suffix: '+', label: 'Рекламодателей' },
              { value: 95, suffix: '%', label: 'Довольных клиентов' },
            ].map((stat, index) => (
              <motion.div 
                key={index} 
                className="text-center"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.div 
                  className="text-3xl md:text-5xl font-bold bg-gradient-to-br from-telegram-primary to-telegram-accent bg-clip-text text-transparent mb-2"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    delay: 0.8 + index * 0.1,
                    type: "spring",
                    stiffness: 100
                  }}
                >
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 1 + index * 0.2 }}
                  >
                    {stat.value.toLocaleString()}{stat.suffix}
                  </motion.span>
                </motion.div>
                <motion.div 
                  className="text-telegram-textSecondary"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 + index * 0.1 }}
                >
                  {stat.label}
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{
            y: [0, 10, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
        >
          <div className="w-6 h-10 border-2 border-telegram-primary/50 rounded-full flex justify-center">
            <motion.div
              className="w-1 h-3 bg-telegram-primary rounded-full mt-2"
              animate={{
                y: [0, 12, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
              }}
            />
          </div>
        </motion.div>
      </section>

      {/* Features Section with 3D cards */}
      <section className="py-32 relative z-10">
        <div className="container">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-bold mb-4"
            >
              Почему выбирают{" "}
              <span className="bg-gradient-to-r from-telegram-primary to-telegram-accent bg-clip-text text-transparent">
                нас
              </span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className="text-xl text-telegram-textSecondary"
            >
              Мы создали идеальную платформу для вашего успеха
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const { ref, isInView } = useScrollAnimation({ threshold: 0.3 })
              
              return (
                <motion.div
                  key={index}
                  ref={ref}
                  initial={{ opacity: 0, y: 50, rotateX: -15 }}
                  animate={isInView ? { 
                    opacity: 1, 
                    y: 0, 
                    rotateX: 0,
                  } : {}}
                  transition={{ 
                    duration: 0.8, 
                    delay: feature.delay,
                    type: "spring",
                    stiffness: 100
                  }}
                  whileHover={{ 
                    y: -10,
                    rotateY: 5,
                    boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
                  }}
                  className="group relative card border-telegram-border/50 backdrop-blur-sm hover:border-telegram-primary/50 transition-all duration-300"
                  style={{
                    transformStyle: "preserve-3d",
                    perspective: "1000px",
                  }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity rounded-xl"
                    style={{
                      background: `linear-gradient(135deg, ${feature.color.split(' ')[1]} 0%, ${feature.color.split(' ')[3]} 100%)`,
                    }}
                  />
                  
                  <motion.div 
                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <feature.icon className="w-7 h-7 text-white" />
                  </motion.div>
                  
                  <h3 className="text-xl font-semibold mb-3 group-hover:text-telegram-primary transition-colors">
                    {feature.title}
                  </h3>
                  
                  <p className="text-telegram-textSecondary">
                    {feature.description}
                  </p>
                  
                  <motion.div
                    className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                    initial={{ x: -10 }}
                    whileHover={{ x: 0 }}
                  >
                    <ArrowRight className="w-5 h-5 text-telegram-primary" />
                  </motion.div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it Works with timeline */}
      <section className="py-32 bg-gradient-to-b from-transparent via-telegram-bgSecondary/30 to-transparent relative z-10">
        <div className="container">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-center mb-16"
          >
            Как это{" "}
            <span className="bg-gradient-to-r from-telegram-primary to-telegram-accent bg-clip-text text-transparent">
              работает
            </span>
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-16 max-w-5xl mx-auto">
            {/* Для блогеров */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute left-8 top-16 bottom-0 w-0.5 bg-gradient-to-b from-telegram-primary to-transparent" />
              
              <motion.div
                className="flex items-center gap-4 mb-8"
                whileHover={{ x: 10 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-telegram-primary blur-xl opacity-50" />
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-telegram-primary to-telegram-secondary flex items-center justify-center">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold">Для блогеров</h3>
              </motion.div>
              
              {[
                'Создайте профиль и укажите тематику',
                'Установите цены на размещение',
                'Получайте заявки от рекламодателей',
                'Выбирайте интересные предложения',
                'Зарабатывайте на рекламе',
              ].map((step, index) => {
                const { ref, isInView } = useScrollAnimation({ threshold: 0.5 })
                
                return (
                  <motion.div
                    key={index}
                    ref={ref}
                    initial={{ opacity: 0, x: -30 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex items-center gap-4 mb-6 group cursor-pointer"
                    whileHover={{ x: 10 }}
                  >
                    <motion.div 
                      className="relative z-10 w-10 h-10 rounded-full bg-telegram-bg border-2 border-telegram-primary flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"
                      initial={{ scale: 0 }}
                      animate={isInView ? { scale: 1 } : {}}
                      transition={{ 
                        delay: index * 0.1 + 0.3,
                        type: "spring",
                        stiffness: 200
                      }}
                    >
                      <span className="text-sm font-bold text-telegram-primary">
                        {index + 1}
                      </span>
                    </motion.div>
                    <p className="text-lg text-telegram-textSecondary group-hover:text-telegram-text transition-colors">
                      {step}
                    </p>
                  </motion.div>
                )
              })}
            </motion.div>

            {/* Для рекламодателей */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute left-8 top-16 bottom-0 w-0.5 bg-gradient-to-b from-telegram-accent to-transparent" />
              
              <motion.div
                className="flex items-center gap-4 mb-8"
                whileHover={{ x: 10 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-telegram-accent blur-xl opacity-50" />
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-telegram-accent to-telegram-primary flex items-center justify-center">
                    <Briefcase className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold">Для рекламодателей</h3>
              </motion.div>
              
              {[
                'Опубликуйте рекламное предложение',
                'Укажите бюджет и требования',
                'Получайте отклики от блогеров',
                'Выбирайте подходящих исполнителей',
                'Отслеживайте результаты',
              ].map((step, index) => {
                const { ref, isInView } = useScrollAnimation({ threshold: 0.5 })
                
                return (
                  <motion.div
                    key={index}
                    ref={ref}
                    initial={{ opacity: 0, x: 30 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex items-center gap-4 mb-6 group cursor-pointer"
                    whileHover={{ x: 10 }}
                  >
                    <motion.div 
                      className="relative z-10 w-10 h-10 rounded-full bg-telegram-bg border-2 border-telegram-accent flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"
                      initial={{ scale: 0 }}
                      animate={isInView ? { scale: 1 } : {}}
                      transition={{ 
                        delay: index * 0.1 + 0.3,
                        type: "spring",
                        stiffness: 200
                      }}
                    >
                      <span className="text-sm font-bold text-telegram-accent">
                        {index + 1}
                      </span>
                    </motion.div>
                    <p className="text-lg text-telegram-textSecondary group-hover:text-telegram-text transition-colors">
                      {step}
                    </p>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section with morph animation */}
      <section className="py-32 relative z-10">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Animated background */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-telegram-primary to-telegram-accent rounded-3xl"
              animate={{
                borderRadius: ["30% 70% 70% 30% / 30% 30% 70% 70%", "70% 30% 30% 70% / 70% 70% 30% 30%", "30% 70% 70% 30% / 30% 30% 70% 70%"],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            
            <div className="relative bg-gradient-to-r from-telegram-primary to-telegram-accent rounded-3xl p-12 md:p-16 text-center overflow-hidden">
              {/* Floating elements */}
              <motion.div
                className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl"
                animate={{
                  x: [0, 50, 0],
                  y: [0, -30, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                }}
              />
              <motion.div
                className="absolute bottom-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-xl"
                animate={{
                  x: [0, -50, 0],
                  y: [0, 30, 0],
                }}
                transition={{
                  duration: 7,
                  repeat: Infinity,
                }}
              />
              
              <motion.h2 
                className="text-4xl md:text-6xl font-bold mb-6 text-white"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                viewport={{ once: true }}
              >
                Готовы начать?
              </motion.h2>
              
              <motion.p 
                className="text-xl md:text-2xl mb-10 text-white/90 max-w-2xl mx-auto"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                viewport={{ once: true }}
              >
                Присоединяйтесь к тысячам блогеров и рекламодателей
              </motion.p>
              
              <motion.button
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/onboarding')}
                className="group relative bg-white text-telegram-primary px-10 py-4 rounded-2xl font-bold text-lg inline-flex items-center gap-3 hover:bg-gray-50 transition-all overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                viewport={{ once: true }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-telegram-primary/20 to-telegram-accent/20"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
                <span className="relative z-10">Начать работу</span>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="relative z-10"
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.div>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}