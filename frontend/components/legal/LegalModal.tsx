'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText, Shield, ScrollText, Scale, ChevronRight } from 'lucide-react'

interface LegalModalProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: 'privacy' | 'offer' | 'rules'
}

const tabs = [
  { id: 'privacy', label: 'Политика конфиденциальности', icon: Shield },
  { id: 'offer', label: 'Публичная оферта', icon: FileText },
  { id: 'rules', label: 'Правила сервиса', icon: ScrollText },
] as const

export function LegalModal({ isOpen, onClose, initialTab = 'privacy' }: LegalModalProps) {
  const [activeTab, setActiveTab] = useState<'privacy' | 'offer' | 'rules'>(initialTab)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-10 lg:inset-20 z-50 flex flex-col bg-telegram-bg rounded-2xl overflow-hidden border border-telegram-border shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-telegram-border bg-gradient-to-r from-telegram-primary/5 to-telegram-accent/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-telegram-primary to-telegram-accent flex items-center justify-center">
                  <Scale className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-telegram-text">Правовая информация</h2>
                  <p className="text-sm text-telegram-textSecondary">Influenta Platform</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-telegram-bgSecondary transition-colors"
              >
                <X className="w-6 h-6 text-telegram-textSecondary" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-4 border-b border-telegram-border bg-telegram-bgSecondary/50 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all
                    ${activeTab === tab.id 
                      ? 'bg-gradient-to-r from-telegram-primary to-telegram-accent text-white shadow-lg' 
                      : 'text-telegram-textSecondary hover:bg-telegram-bgSecondary hover:text-telegram-text'
                    }
                  `}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="prose prose-invert max-w-none"
                >
                  {activeTab === 'privacy' && <PrivacyContent />}
                  {activeTab === 'offer' && <OfferContent />}
                  {activeTab === 'rules' && <RulesContent />}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-telegram-border bg-telegram-bgSecondary/30">
              <p className="text-center text-sm text-telegram-textSecondary">
                Последнее обновление: 24 декабря 2024 г. · Influenta Platform
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function PrivacyContent() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-6">
        <h3 className="text-xl font-bold text-telegram-text mb-2 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-400" />
          Политика конфиденциальности
        </h3>
        <p className="text-telegram-textSecondary">
          Настоящая Политика конфиденциальности описывает, как платформа Influenta собирает, использует и защищает вашу персональную информацию.
        </p>
      </div>

      <Section title="1. Какие данные мы собираем">
        <ul className="list-disc pl-5 space-y-2 text-telegram-textSecondary">
          <li><strong className="text-telegram-text">Данные из Telegram:</strong> ID пользователя, имя, фамилия, username, фото профиля</li>
          <li><strong className="text-telegram-text">Данные профиля:</strong> описание, социальные сети, статистика аккаунтов</li>
          <li><strong className="text-telegram-text">Данные сделок:</strong> история предложений, переписка, условия сотрудничества</li>
          <li><strong className="text-telegram-text">Технические данные:</strong> IP-адрес, тип устройства, версия браузера</li>
        </ul>
      </Section>

      <Section title="2. Как мы используем данные">
        <ul className="list-disc pl-5 space-y-2 text-telegram-textSecondary">
          <li>Предоставление и улучшение сервиса</li>
          <li>Связь между блогерами и рекламодателями</li>
          <li>Отправка уведомлений о предложениях и сообщениях</li>
          <li>Предотвращение мошенничества и злоупотреблений</li>
          <li>Аналитика и улучшение пользовательского опыта</li>
        </ul>
      </Section>

      <Section title="3. Защита данных">
        <p className="text-telegram-textSecondary">
          Мы применяем современные методы защиты: шифрование данных (HTTPS/TLS), безопасное хранение в облаке, 
          регулярные аудиты безопасности. Доступ к данным имеют только уполномоченные сотрудники.
        </p>
      </Section>

      <Section title="4. Передача данных третьим лицам">
        <p className="text-telegram-textSecondary">
          Мы не продаём ваши данные. Информация может быть передана только:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-telegram-textSecondary mt-2">
          <li>Контрагентам для исполнения сделки (ограниченный набор данных)</li>
          <li>По требованию государственных органов в соответствии с законодательством РФ</li>
          <li>Техническим провайдерам для работы сервиса (Telegram API, хостинг)</li>
        </ul>
      </Section>

      <Section title="5. Ваши права">
        <ul className="list-disc pl-5 space-y-2 text-telegram-textSecondary">
          <li>Доступ к своим персональным данным</li>
          <li>Исправление неточных данных</li>
          <li>Удаление аккаунта и связанных данных</li>
          <li>Отзыв согласия на обработку данных</li>
        </ul>
        <p className="text-telegram-textSecondary mt-3">
          Для реализации прав обратитесь в поддержку: @influenta_support_bot
        </p>
      </Section>

      <Section title="6. Cookies и аналитика">
        <p className="text-telegram-textSecondary">
          Мы используем технические cookies для работы приложения. Аналитические данные собираются 
          в обезличенном виде для улучшения сервиса.
        </p>
      </Section>
    </div>
  )
}

function OfferContent() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6">
        <h3 className="text-xl font-bold text-telegram-text mb-2 flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-400" />
          Публичная оферта
        </h3>
        <p className="text-telegram-textSecondary">
          Настоящий документ является официальным предложением (публичной офертой) о заключении договора на использование платформы Influenta.
        </p>
      </div>

      <Section title="1. Общие положения">
        <p className="text-telegram-textSecondary">
          <strong className="text-telegram-text">1.1.</strong> Исполнитель: Платформа Influenta
        </p>
        <p className="text-telegram-textSecondary mt-2">
          <strong className="text-telegram-text">1.2.</strong> Принятие (акцепт) оферты осуществляется путём регистрации на платформе через Telegram.
        </p>
        <p className="text-telegram-textSecondary mt-2">
          <strong className="text-telegram-text">1.3.</strong> Платформа предоставляет сервис для связи блогеров и рекламодателей.
        </p>
      </Section>

      <Section title="2. Предмет договора">
        <p className="text-telegram-textSecondary">
          Исполнитель предоставляет Заказчику доступ к функционалу платформы:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-telegram-textSecondary mt-2">
          <li>Создание профиля блогера или рекламодателя</li>
          <li>Поиск партнёров для сотрудничества</li>
          <li>Обмен сообщениями и предложениями</li>
          <li>Каталог блогеров с фильтрацией</li>
          <li>Публикация рекламных объявлений (листингов)</li>
        </ul>
      </Section>

      <Section title="3. Стоимость услуг">
        <p className="text-telegram-textSecondary">
          <strong className="text-telegram-text">3.1.</strong> Платформа полностью бесплатна для всех пользователей.
        </p>
        <p className="text-telegram-textSecondary mt-2">
          <strong className="text-telegram-text">3.2.</strong> Комиссия за сделки не взимается.
        </p>
        <p className="text-telegram-textSecondary mt-2">
          <strong className="text-telegram-text">3.3.</strong> Верификация блогеров проводится бесплатно.
        </p>
      </Section>

      <Section title="4. Права и обязанности сторон">
        <p className="text-telegram-textSecondary font-medium text-telegram-text">Исполнитель обязуется:</p>
        <ul className="list-disc pl-5 space-y-1 text-telegram-textSecondary mt-2">
          <li>Обеспечивать работоспособность платформы</li>
          <li>Защищать персональные данные пользователей</li>
          <li>Оказывать техническую поддержку</li>
        </ul>
        <p className="text-telegram-textSecondary font-medium text-telegram-text mt-4">Заказчик обязуется:</p>
        <ul className="list-disc pl-5 space-y-1 text-telegram-textSecondary mt-2">
          <li>Предоставлять достоверную информацию</li>
          <li>Не нарушать правила платформы</li>
          <li>Своевременно оплачивать услуги</li>
        </ul>
      </Section>

      <Section title="5. Ответственность">
        <p className="text-telegram-textSecondary">
          <strong className="text-telegram-text">5.1.</strong> Платформа не несёт ответственности за качество услуг, оказываемых блогерами рекламодателям.
        </p>
        <p className="text-telegram-textSecondary mt-2">
          <strong className="text-telegram-text">5.2.</strong> Споры между пользователями решаются путём переговоров. Платформа может выступить посредником.
        </p>
        <p className="text-telegram-textSecondary mt-2">
          <strong className="text-telegram-text">5.3.</strong> Максимальная ответственность платформы ограничена суммой уплаченных комиссий за последние 3 месяца.
        </p>
      </Section>

      <Section title="6. Верификация блогеров">
        <p className="text-telegram-textSecondary">
          <strong className="text-telegram-text">6.1.</strong> Верификация подтверждает личность блогера и повышает доверие рекламодателей.
        </p>
        <p className="text-telegram-textSecondary mt-2">
          <strong className="text-telegram-text">6.2.</strong> Требования для верификации:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-telegram-textSecondary mt-2">
          <li>Минимум 100 000 подписчиков в социальных сетях</li>
          <li>Фото паспорта РФ (для подтверждения личности)</li>
          <li>Размещение проверочного кода в описании профиля</li>
        </ul>
        <p className="text-telegram-textSecondary mt-2">
          <strong className="text-telegram-text">6.3.</strong> Верификация бесплатна. Данные паспорта хранятся в зашифрованном виде и не передаются третьим лицам.
        </p>
      </Section>

      <Section title="7. Срок действия и расторжение">
        <p className="text-telegram-textSecondary">
          Договор действует с момента регистрации. Любая сторона может расторгнуть договор, уведомив 
          другую сторону за 7 дней. При расторжении начатые сделки должны быть завершены.
        </p>
      </Section>
    </div>
  )
}

function RulesContent() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-6">
        <h3 className="text-xl font-bold text-telegram-text mb-2 flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-green-400" />
          Правила сервиса
        </h3>
        <p className="text-telegram-textSecondary">
          Правила использования платформы Influenta. Нарушение правил может привести к блокировке аккаунта.
        </p>
      </div>

      <Section title="1. Регистрация и аккаунт">
        <ul className="list-disc pl-5 space-y-2 text-telegram-textSecondary">
          <li>Один пользователь — один аккаунт</li>
          <li>Указывайте достоверную информацию о себе</li>
          <li>Не передавайте доступ к аккаунту третьим лицам</li>
          <li>Вы несёте ответственность за действия в вашем аккаунте</li>
        </ul>
      </Section>

      <Section title="2. Для блогеров">
        <ul className="list-disc pl-5 space-y-2 text-telegram-textSecondary">
          <li>Указывайте реальную статистику аккаунтов (без накруток)</li>
          <li>Выполняйте взятые обязательства в срок</li>
          <li>Не завышайте цены искусственно</li>
          <li>Отвечайте на предложения в течение 48 часов</li>
          <li>Для верификации требуется от 100 000 подписчиков и паспорт РФ</li>
        </ul>
      </Section>

      <Section title="3. Для рекламодателей">
        <ul className="list-disc pl-5 space-y-2 text-telegram-textSecondary">
          <li>Описывайте условия сотрудничества чётко и полно</li>
          <li>Не требуйте от блогеров незаконных действий</li>
          <li>Оплачивайте работу своевременно</li>
          <li>Уважайте творческую свободу блогеров</li>
        </ul>
      </Section>

      <Section title="4. Запрещённый контент">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <ul className="list-disc pl-5 space-y-2 text-red-300">
            <li>Порнография и откровенный сексуальный контент</li>
            <li>Насилие, экстремизм, терроризм</li>
            <li>Наркотики и психотропные вещества</li>
            <li>Оружие и взрывчатые вещества</li>
            <li>Азартные игры (без лицензии)</li>
            <li>Финансовые пирамиды и мошенничество</li>
            <li>Нарушение авторских прав</li>
            <li>Дискриминация и разжигание ненависти</li>
          </ul>
        </div>
      </Section>

      <Section title="5. Коммуникация">
        <ul className="list-disc pl-5 space-y-2 text-telegram-textSecondary">
          <li>Общайтесь уважительно и профессионально</li>
          <li>Не используйте оскорбления и ненормативную лексику</li>
          <li>Не спамьте одинаковыми сообщениями</li>
          <li>Ведите переговоры внутри платформы</li>
        </ul>
      </Section>

      <Section title="6. Санкции за нарушения">
        <div className="grid gap-3">
          <div className="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 font-bold">1</div>
            <div>
              <p className="font-medium text-telegram-text">Предупреждение</p>
              <p className="text-sm text-telegram-textSecondary">За первое незначительное нарушение</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold">2</div>
            <div>
              <p className="font-medium text-telegram-text">Временная блокировка</p>
              <p className="text-sm text-telegram-textSecondary">От 1 до 30 дней за повторные нарушения</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-bold">3</div>
            <div>
              <p className="font-medium text-telegram-text">Перманентная блокировка</p>
              <p className="text-sm text-telegram-textSecondary">За грубые нарушения без права восстановления</p>
            </div>
          </div>
        </div>
      </Section>

      <Section title="7. Обжалование">
        <p className="text-telegram-textSecondary">
          Если вы считаете, что ваш аккаунт заблокирован ошибочно, напишите в поддержку: 
          <a href="https://t.me/influenta_support_bot" className="text-telegram-primary hover:underline ml-1">
            @influenta_support_bot
          </a>
        </p>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-telegram-bgSecondary/50 rounded-xl p-5 border border-telegram-border/50">
      <h4 className="text-lg font-semibold text-telegram-text mb-3 flex items-center gap-2">
        <ChevronRight className="w-4 h-4 text-telegram-primary" />
        {title}
      </h4>
      {children}
    </div>
  )
}

