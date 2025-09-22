'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Shield, Lock, Mail, AlertCircle, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { authApi } from '@/lib/api'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // TODO: Implement admin login API
      // const response = await authApi.adminLogin({ email, password })
      
      // Временная заглушка для демо
      // В продакшене здесь будет реальная проверка через API
      if (email === 'admin@example.com' && password === 'adminpass123') {
        // Сохраняем токен
        document.cookie = 'token=admin-token; path=/'
        document.cookie = 'adminTelegramId=741582706; path=/' // Супер админ
        router.push('/admin/dashboard')
      } else if (email === 'admin2@example.com' && password === 'adminpass123') {
        // Второй админ
        document.cookie = 'token=admin-token; path=/'
        document.cookie = 'adminTelegramId=8141463258; path=/' // Админ #2
        router.push('/admin/dashboard')
      } else {
        setError('Неверный email или пароль')
      }
    } catch (err) {
      setError('Ошибка входа. Попробуйте еще раз.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-telegram-bg via-telegram-bgSecondary to-telegram-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-telegram-primary/20">
          <CardHeader className="text-center pb-8">
            <motion.div
              initial={{ rotate: -180, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-20 h-20 bg-gradient-to-br from-telegram-primary to-telegram-accent rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Shield className="w-10 h-10 text-white" />
            </motion.div>
            <CardTitle className="text-2xl">Админ панель</CardTitle>
            <p className="text-telegram-textSecondary mt-2">
              Войдите для управления платформой
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-telegram-textSecondary mb-1 block">
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  icon={<Mail className="w-4 h-4" />}
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-telegram-textSecondary mb-1 block">
                  Пароль
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  icon={<Lock className="w-4 h-4" />}
                  required
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-telegram-danger text-sm"
                >
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
                className="mt-6"
              >
                Войти
              </Button>
            </form>

            <div className="mt-6 text-center space-y-3">
              <div className="text-sm text-telegram-textSecondary">
                <p className="font-medium mb-2">Тестовые аккаунты:</p>
                <div className="space-y-2">
                  <div className="bg-telegram-bg rounded-lg p-3">
                    <p className="font-mono text-xs flex items-center gap-2">
                      <Crown className="w-3 h-3 text-telegram-primary" />
                      <span className="text-telegram-primary">Супер Админ (ID: 741582706)</span>
                    </p>
                    <p className="font-mono text-xs mt-1">
                      admin@example.com / adminpass123
                    </p>
                  </div>
                  <div className="bg-telegram-bg rounded-lg p-3">
                    <p className="font-mono text-xs flex items-center gap-2">
                      <Shield className="w-3 h-3 text-telegram-accent" />
                      <span className="text-telegram-accent">Админ #2 (ID: 8141463258)</span>
                    </p>
                    <p className="font-mono text-xs mt-1">
                      admin2@example.com / adminpass123
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
