'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Users, Briefcase, TrendingUp, Star, ArrowRight, Shield } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function HomePage() {
  const router = useRouter()
  const { user, isAdmin, isSuperAdmin } = useAuth()
  const [userRole, setUserRole] = useState<'blogger' | 'advertiser' | null>(null)

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
    },
    {
      icon: Users,
      title: 'Проверенные блогеры',
      description: 'База из тысяч верифицированных инфлюенсеров',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Briefcase,
      title: 'Безопасные сделки',
      description: 'Встроенный чат и система откликов',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: TrendingUp,
      title: 'Аналитика',
      description: 'Детальная статистика по каждой кампании',
      color: 'from-orange-500 to-red-500',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-telegram-bg via-telegram-bgSecondary to-telegram-bg">
      {/* Simple gradient background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-telegram-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-telegram-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Admin Badge & Button */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
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
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Logo */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="mb-8 relative inline-block"
            >
              <div className="relative w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-telegram-primary to-telegram-accent flex items-center justify-center">
                <span className="text-5xl font-bold text-white">I</span>
              </div>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-telegram-primary to-telegram-accent bg-clip-text text-transparent">
                Influencer Platform
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-telegram-textSecondary mb-8 max-w-2xl mx-auto">
              Связываем блогеров и рекламодателей в Telegram.
              <span className="text-telegram-text font-medium"> Быстро, удобно, безопасно.</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setUserRole('blogger')
                  router.push('/onboarding?role=blogger')
                }}
                className="btn-primary text-lg px-8 py-4 flex items-center justify-center gap-3"
              >
                <Users className="w-5 h-5" />
                Я блогер
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setUserRole('advertiser')
                  router.push('/onboarding?role=advertiser')
                }}
                className="btn-secondary text-lg px-8 py-4 flex items-center justify-center gap-3"
              >
                <Briefcase className="w-5 h-5" />
                Я рекламодатель
              </motion.button>
            </div>
          </motion.div>

        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 relative z-10">
        <div className="container">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-center mb-16"
          >
            Почему выбирают{" "}
            <span className="bg-gradient-to-r from-telegram-primary to-telegram-accent bg-clip-text text-transparent">
              нас
            </span>
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="card hover:border-telegram-primary/50 transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                
                <h3 className="text-xl font-semibold mb-3">
                  {feature.title}
                </h3>
                
                <p className="text-telegram-textSecondary">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-32 bg-telegram-bgSecondary/30 relative z-10">
        <div className="container">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
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
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-telegram-primary to-telegram-secondary flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold">Для блогеров</h3>
              </div>
              
              {[
                'Создайте профиль и укажите тематику',
                'Установите цены на размещение',
                'Получайте заявки от рекламодателей',
                'Выбирайте интересные предложения',
                'Зарабатывайте на рекламе',
              ].map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-4 mb-6"
                >
                  <div className="w-10 h-10 rounded-full bg-telegram-bg border-2 border-telegram-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-telegram-primary">
                      {index + 1}
                    </span>
                  </div>
                  <p className="text-lg text-telegram-textSecondary">
                    {step}
                  </p>
                </motion.div>
              ))}
            </motion.div>

            {/* Для рекламодателей */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-telegram-accent to-telegram-primary flex items-center justify-center">
                  <Briefcase className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold">Для рекламодателей</h3>
              </div>
              
              {[
                'Опубликуйте рекламное предложение',
                'Укажите бюджет и требования',
                'Получайте отклики от блогеров',
                'Выбирайте подходящих исполнителей',
                'Отслеживайте результаты',
                'Ищите блогеров по критериям',
              ].map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-4 mb-6"
                >
                  <div className="w-10 h-10 rounded-full bg-telegram-bg border-2 border-telegram-accent flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-telegram-accent">
                      {index + 1}
                    </span>
                  </div>
                  <p className="text-lg text-telegram-textSecondary">
                    {step}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative z-10">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-telegram-primary to-telegram-accent rounded-3xl p-12 md:p-16 text-center"
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white">
              Готовы начать?
            </h2>
            
            <p className="text-xl md:text-2xl mb-10 text-white/90 max-w-2xl mx-auto">
              Присоединяйтесь к тысячам блогеров и рекламодателей
            </p>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/onboarding')}
              className="bg-white text-telegram-primary px-10 py-4 rounded-2xl font-bold text-lg inline-flex items-center gap-3 hover:bg-gray-50 transition-all"
            >
              Начать работу
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
