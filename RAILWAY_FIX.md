# 🔧 Исправление деплоя на Railway

## Проблема
Railway не может найти `/app/backend/dist/main` потому что:
1. Build не прошел правильно
2. Путь к файлу неверный

## Решение - Единое приложение

### Что я исправил:

1. **Удалил лишние конфиги** (railway.json, railway.toml)
2. **Создал nixpacks.toml** - правильная конфигурация сборки
3. **Обновил package.json** - автоматическая сборка при установке
4. **Исправил Procfile** - правильный путь к main.js

### Как это работает:

1. Railway запускает `npm install` в корне
2. `postinstall` автоматически:
   - Устанавливает зависимости backend
   - Собирает backend (`npm run build`)
3. Railway запускает `npm start`
4. Backend стартует на порту из переменной PORT

### Что делать сейчас:

1. **Закоммить и запушить изменения:**
```bash
git add .
git commit -m "Fix Railway deployment - single app configuration"
git push
```

2. **В Railway:**
   - Удали текущий сервис
   - Создай новый deployment
   - Railway автоматически определит nixpacks.toml

3. **Переменные окружения в Railway:**
```env
# Database (от Railway Postgres)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# App
NODE_ENV=production
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Telegram
TELEGRAM_BOT_TOKEN=7539463116:AAE97MAcGffyANYVGOWoGT1qKmNiPPTVWpg
TELEGRAM_BOT_NAME=InfluentaBot
ADMIN_TELEGRAM_IDS=741582706,8141463258

# Frontend (встроен в backend)
FRONTEND_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
```

### Frontend как статика

Сейчас backend обслуживает только API. Для полноценного приложения нужно либо:

**Вариант 1: Отдельный frontend сервис** (рекомендую)
- Создай второй сервис в Railway для frontend
- Укажи root directory: `frontend`

**Вариант 2: Backend раздает frontend** 
- Нужно добавить в backend обслуживание статики
- Более сложная настройка

### Если все еще ошибка:

Проверь в Railway logs:
1. Прошла ли установка пакетов
2. Прошла ли сборка (`npm run build`)
3. Есть ли папка `backend/dist`

Можешь также попробовать:
```toml
# nixpacks.toml - альтернативный вариант
[phases.build]
cmd = "cd backend && npm ci && npm run build"

[start]
cmd = "cd backend && npm run start:prod"
```

