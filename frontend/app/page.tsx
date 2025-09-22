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
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-telegram-primary/10 to-transparent" />
        
        <div className="container relative z-10 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="text-gradient">Influencer Platform</span>
            </h1>
            <p className="text-xl text-telegram-textSecondary mb-8 max-w-2xl mx-auto">
              Связываем блогеров и рекламодателей в Telegram. 
              Быстро, удобно, безопасно.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setUserRole('blogger')
                  router.push('/onboarding?role=blogger')
                }}
                className="btn-primary text-lg px-8 py-3 flex items-center justify-center gap-2"
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
                className="btn-secondary text-lg px-8 py-3 flex items-center justify-center gap-2"
              >
                <Briefcase className="w-5 h-5" />
                Я рекламодатель
              </motion.button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-3 gap-8 max-w-3xl mx-auto"
          >
            {[
              { value: '10K+', label: 'Блогеров' },
              { value: '500+', label: 'Рекламодателей' },
              { value: '95%', label: 'Довольных клиентов' },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-telegram-accent mb-2">
                  {stat.value}
                </div>
                <div className="text-telegram-textSecondary">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-center mb-12"
          >
            Почему выбирают нас
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="card hover:border-telegram-primary/50 transition-all"
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-telegram-textSecondary">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-telegram-bgSecondary/50">
        <div className="container">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-center mb-12"
          >
            Как это работает
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            {/* Для блогеров */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h3 className="text-2xl font-semibold flex items-center gap-2">
                <Users className="w-6 h-6 text-telegram-primary" />
                Для блогеров
              </h3>
              
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
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-4"
                >
                  <div className="w-8 h-8 rounded-full bg-telegram-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-telegram-primary">
                      {index + 1}
                    </span>
                  </div>
                  <p className="text-telegram-textSecondary">{step}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* Для рекламодателей */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h3 className="text-2xl font-semibold flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-telegram-accent" />
                Для рекламодателей
              </h3>
              
              {[
                'Опубликуйте рекламное предложение',
                'Укажите бюджет и требования',
                'Получайте отклики от блогеров',
                'Выбирайте подходящих исполнителей',
                'Отслеживайте результаты',
              ].map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-4"
                >
                  <div className="w-8 h-8 rounded-full bg-telegram-accent/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-telegram-accent">
                      {index + 1}
                    </span>
                  </div>
                  <p className="text-telegram-textSecondary">{step}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-telegram-primary to-telegram-accent rounded-2xl p-8 md:p-12 text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Готовы начать?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Присоединяйтесь к тысячам блогеров и рекламодателей
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/onboarding')}
              className="bg-white text-telegram-primary px-8 py-3 rounded-lg font-semibold text-lg inline-flex items-center gap-2 hover:bg-gray-100 transition-colors"
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