# ⚡ Быстрый деплой Influenta (5 минут)

## 🎯 У тебя уже есть:

- ✅ Backend на Railway: `https://web-production-2bad2.up.railway.app`
- ✅ GitHub репозиторий: `Vantorrr/influenta`
- ✅ Telegram Bot: `@InfluentaBot`

## 🚀 Осталось задеплоить Frontend на Vercel:

### 1. Зайди на [vercel.com](https://vercel.com)

### 2. Создай новый проект:
- Нажми **"Add New Project"**
- Выбери **"Import Git Repository"**
- Выбери `Vantorrr/influenta`

### 3. Настрой проект:
- **Root Directory**: `frontend` ⚠️ ВАЖНО!
- **Framework Preset**: Next.js (определится автоматически)

### 4. Добавь переменные окружения:

Нажми **"Environment Variables"** и добавь:

```
NEXT_PUBLIC_API_URL = https://web-production-2bad2.up.railway.app
NEXT_PUBLIC_WS_URL = wss://web-production-2bad2.up.railway.app
NEXT_PUBLIC_TELEGRAM_BOT_NAME = InfluentaBot
```

### 5. Deploy!

Нажми **"Deploy"** и подожди 2-3 минуты.

### 6. Получи URL:

После деплоя получишь URL типа:
`https://influenta-frontend.vercel.app`

### 7. Обнови Telegram Bot:

1. Открой @BotFather
2. `/mybots` → `InfluentaBot`
3. `Bot Settings` → `Menu Button` → `Configure menu button`
4. Введи новый URL от Vercel

## ✅ Готово!

Твое приложение работает:
- Backend: `https://web-production-2bad2.up.railway.app`
- Frontend: `https://influenta-frontend.vercel.app`

## 🆘 Если проблемы:

- **CORS ошибка**: Добавь в Railway переменную `FRONTEND_URL=https://influenta-frontend.vercel.app`
- **API не работает**: Проверь что в Vercel правильный `NEXT_PUBLIC_API_URL`
- **WebSocket не подключается**: Убедись что используется `wss://` а не `ws://`

