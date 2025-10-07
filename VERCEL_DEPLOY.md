# 🚀 Деплой Frontend на Vercel

## ✅ Почему Vercel идеально подходит

- **Бесплатный план** для Next.js
- **Автоматический CI/CD** из GitHub
- **Edge Functions** для оптимизации
- **Отличная производительность**
- **Простая настройка переменных**

## 📋 Пошаговая инструкция

### 1. Подготовка (1 минута)

```bash
cd frontend
git init
git add .
git commit -m "Frontend for Vercel"
```

### 2. Деплой через CLI (рекомендую)

```bash
# Установи Vercel CLI
npm i -g vercel

# В папке frontend
cd frontend
vercel

# Ответь на вопросы:
# Set up and deploy? Y
# Which scope? (выбери свой аккаунт)
# Link to existing project? N
# Project name? influenta-frontend
# In which directory? ./
# Override settings? N
```

### 3. Или через веб-интерфейс

1. Зайди на [vercel.com](https://vercel.com)
2. Нажми "Add New Project"
3. Импортируй из GitHub: `Vantorrr/influenta`
4. **ВАЖНО**: Укажи Root Directory: `frontend`
5. Framework Preset автоматически определится как Next.js

### 4. Переменные окружения

В Vercel Dashboard → Settings → Environment Variables добавь:

```env
NEXT_PUBLIC_API_URL=https://web-production-2bad2.up.railway.app
NEXT_PUBLIC_WS_URL=wss://web-production-2bad2.up.railway.app
NEXT_PUBLIC_TELEGRAM_BOT_NAME=InfluentaBot
```

### 5. Получишь URLs

- Production: `https://influenta-frontend.vercel.app`
- Preview: `https://influenta-frontend-git-main.vercel.app`

## 🔧 Важные настройки

### CORS в Backend

Убедись что в Railway backend переменные включают:

```env
FRONTEND_URL=https://influenta-frontend.vercel.app
# Или для разрешения всех Vercel превью:
FRONTEND_URL=https://*.vercel.app,https://influenta-frontend.vercel.app
```

### Обновление Telegram Bot

1. Открой @BotFather
2. `/mybots` → `InfluentaBot`
3. `Bot Settings` → `Menu Button`
4. Новый URL: `https://influenta-frontend.vercel.app`

## 📱 Тестирование

1. Открой бота @InfluentaBot
2. Нажми кнопку меню
3. Приложение откроется с Vercel URL!

## 🎯 Структура деплоя

```
├── Backend (Railway)
│   ├── API: https://influenta.up.railway.app
│   ├── WebSocket: wss://influenta.up.railway.app
│   └── PostgreSQL
│
└── Frontend (Vercel)
    └── UI: https://influenta-frontend.vercel.app
```

## ⚡ Оптимизация

Vercel автоматически:
- Кеширует статику на CDN
- Оптимизирует изображения
- Минифицирует код
- Server-side рендеринг

## 🔄 Автодеплой

При каждом push в GitHub:
- Vercel создаст Preview deployment
- После мержа в main - обновится Production

## 💰 Лимиты бесплатного плана

- 100GB bandwidth/месяц
- Unlimited deployments
- SSL сертификат включен
- Analytics базовая

Для MVP более чем достаточно!

## 🚨 Если проблемы

### API не работает
```javascript
// Проверь в консоли браузера
console.log(process.env.NEXT_PUBLIC_API_URL)
// Должно быть: https://web-production-2bad2.up.railway.app
```

### WebSocket не подключается
- Проверь что Railway поддерживает WSS
- Убедись что CORS настроен правильно

### Telegram не авторизует
- Проверь что домен в @BotFather обновлен
- Очисти кеш Telegram









