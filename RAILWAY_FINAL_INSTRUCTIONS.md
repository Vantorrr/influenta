# 🚂 RAILWAY ФИНАЛЬНАЯ НАСТРОЙКА

## ⚡ БЫСТРЫЙ ФИКС В RAILWAY DASHBOARD:

### 1. Settings → Deploy → Start Command:
```bash
cd backend && chmod +x railway-start.sh && ./railway-start.sh
```

### 2. Settings → Variables (добавь если нет):
```env
NODE_ENV=production
JWT_SECRET=твой_секретный_ключ_здесь
TELEGRAM_BOT_TOKEN=7539463116:AAE97MAcGffyANYVGOWoGT1qKmNiPPTVWpg
FRONTEND_URL=https://influenta-frontend.vercel.app
```

### 3. Settings → Build → Build Command:
```bash
cd backend && npm ci --production=false && npm run build
```

## 🔄 АЛЬТЕРНАТИВНЫЙ СПОСОБ:

### В Settings → Build → Builder выбери:
- **Docker**
- Docker File Path: `backend/railway.Dockerfile`

## 🚀 NUCLEAR OPTION (если ничего не работает):

1. **Удали текущий сервис**
2. **Создай новый**
3. **Подключи GitHub репозиторий**
4. **Root Directory**: `backend`
5. **Start Command**: `node dist/main.js`
6. **Build Command**: `npm run build`

## 📊 ПРОВЕРКА РАБОТЫ:

После деплоя:
- **Health**: https://твой-app.up.railway.app/api/health
- **Swagger**: https://твой-app.up.railway.app/api

## 🔧 TROUBLESHOOTING:

Если все еще ошибки:
1. Смотри логи в Railway
2. Ищи строку "✅ Build completed"
3. Ищи список файлов в dist/
4. Должен быть main.js

## 📱 TELEGRAM BOT НАСТРОЙКА:

После успешного деплоя:
1. Открой @BotFather
2. `/setdomain`
3. Выбери своего бота
4. Введи: https://твой-app.up.railway.app
