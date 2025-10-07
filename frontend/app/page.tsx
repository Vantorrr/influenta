'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Users, Briefcase, TrendingUp, Star, ArrowRight, Shield, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function HomePage() {
  const router = useRouter()
  const { user, isAdmin, isSuperAdmin } = useAuth()
  const [userRole, setUserRole] = useState<'blogger' | 'advertiser' | null>(null)
  const [showScrollArrow, setShowScrollArrow] = useState(true)

  useEffect(() => {
    // Если пользователь уже авторизован — редирект на дашборд
    if (user?.id) {
      router.push('/dashboard')
      return
    }

    // Скрываем стрелку при скролле
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setShowScrollArrow(false)
      } else {
        setShowScrollArrow(true)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [user, router])

  const features = [
    {
      icon: Shield,
      title: '100% прозрачность',
      description: 'Все условия сделки фиксируются в системе. Никаких скрытых комиссий и обмана — вы видите реальные цены и условия',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Users,
      title: 'Прямое взаимодействие',
      description: 'Общайтесь напрямую с блогерами без посредников и переплат',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: TrendingUp,
      title: 'Аналитика результатов',
      description: 'Отслеживайте эффективность рекламных кампаний в реальном времени',
      color: 'from-green-500 to-emerald-500',
    },
  ]

  const bloggerBenefits = [
    'Прямые заказы от рекламодателей',
    'Удобная система оплаты',
    'Защита от мошенников',
    'Гибкие условия сотрудничества',
  ]

  const advertiserBenefits = [
    'Тысячи проверенных блогеров',
    'Прозрачное ценообразование',
    'Детальная аналитика',
    'Быстрый запуск кампаний',
  ]

  const handleRoleSelect = (role: 'blogger' | 'advertiser') => {
    // В реальном приложении здесь была бы логика авторизации через Telegram
    router.push('/onboarding')
  }

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-x-hidden">
      {/* Анимированный фон */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-700 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-700 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-700 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex flex-col justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <Badge className="mb-4 px-4 py-2 text-sm font-semibold bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/50">
              🚀 Платформа №1 для блогеров и рекламодателей
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400">
              Influenta
            </h1>
            
            <p className="text-xl md:text-2xl mb-12 text-gray-300 max-w-3xl mx-auto">
              Соединяем бренды с блогерами для создания эффективных рекламных кампаний
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  onClick={() => handleRoleSelect('blogger')}
                  className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-6 text-lg rounded-xl shadow-xl"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Я блогер
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-20 transition-opacity" />
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handleRoleSelect('advertiser')}
                  className="group relative overflow-hidden border-2 border-gray-600 hover:border-gray-500 text-white px-8 py-6 text-lg rounded-xl"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    Я рекламодатель
                  </span>
                </Button>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  10K+
                </div>
                <p className="text-gray-400 mt-2">Активных блогеров</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-yellow-400">
                  500+
                </div>
                <p className="text-gray-400 mt-2">Брендов-партнеров</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-center"
              >
                <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-green-400">
                  98%
                </div>
                <p className="text-gray-400 mt-2">Довольных клиентов</p>
              </motion.div>
            </div>
          </motion.div>

          {/* Стрелка вниз */}
          <motion.div
            animate={{
              y: [0, 10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 cursor-pointer transition-opacity duration-300 ${
              showScrollArrow ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={scrollToFeatures}
          >
            <ChevronDown className="w-8 h-8 text-gray-400" />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
              Почему выбирают Influenta?
            </h2>
            <p className="text-xl text-gray-400">
              Мы создали платформу, которая решает реальные проблемы рынка
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl blur-xl"
                     style={{
                       backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))`,
                       '--tw-gradient-from': feature.color.split(' ')[1],
                       '--tw-gradient-to': feature.color.split(' ')[3],
                     } as any}
                />
                <div className="relative bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:transform hover:-translate-y-2 transition-all duration-300">
                  <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${feature.color} mb-4`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Для блогеров */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="text-center lg:text-left mb-8">
                <h3 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                  Для блогеров
                </h3>
                <p className="text-gray-400">
                  Монетизируйте свою аудиторию и работайте с лучшими брендами
                </p>
              </div>
              <div className="space-y-4">
                {bloggerBenefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-4 hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <Star className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-lg">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Для рекламодателей */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="text-center lg:text-left mb-8">
                <h3 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-yellow-400">
                  Для рекламодателей
                </h3>
                <p className="text-gray-400">
                  Находите идеальных блогеров для вашего бренда
                </p>
              </div>
              <div className="space-y-4">
                {advertiserBenefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-4 hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-yellow-500 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-lg">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-yellow-600/20 backdrop-blur-xl border border-gray-700 p-12 text-center"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-yellow-600/10 animate-pulse" />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Готовы начать?
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Присоединяйтесь к тысячам блогеров и рекламодателей, которые уже работают на нашей платформе
              </p>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  onClick={() => router.push('/onboarding')}
                  className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-6 text-lg rounded-xl shadow-xl"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Начать сейчас
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-20 transition-opacity" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto text-center text-gray-400">
          <p>&copy; 2024 Influenta. Все права защищены.</p>
        </div>
      </footer>
    </div>
  )
}