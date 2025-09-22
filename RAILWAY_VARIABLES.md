# Railway Environment Variables

Скопируй и вставь эти переменные в Railway Dashboard → Variables

## Обязательные переменные:

```env
# Node Environment
NODE_ENV=production
PORT=${{PORT}}

# Database (Railway автоматически добавит DATABASE_URL)
# DATABASE_URL будет автоматически подставлен из Railway PostgreSQL

# JWT Secret (ВАЖНО: поменяй на свой!)
JWT_SECRET=your_super_secret_jwt_key_change_this_to_random_string

# Telegram Bot
TELEGRAM_BOT_TOKEN=7539463116:AAE97MAcGffyANYVGOWoGT1qKmNiPPTVWpg
TELEGRAM_BOT_NAME=InfluentaBot

# Admin Telegram IDs
SUPER_ADMIN_ID=741582706
ADMIN_IDS=741582706,8141463258

# Frontend URL (Vercel)
FRONTEND_URL=https://influenta-frontend.vercel.app

# API Settings
API_PREFIX=api
API_VERSION=v1
```

## Дополнительные переменные (опционально):

```env
# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,webp

# WebSocket
WS_PORT=${{PORT}}

# Logging
LOG_LEVEL=info
```

## Как добавить переменные в Railway:

1. Открой проект в Railway
2. Выбери сервис backend
3. Перейди во вкладку "Variables"
4. Нажми "RAW Editor"
5. Вставь переменные из списка выше
6. Нажми "Update Variables"
7. Railway автоматически перезапустит сервис

## Важные моменты:

- **JWT_SECRET** - обязательно поменяй на случайную строку!
- **DATABASE_URL** - Railway автоматически добавит при подключении PostgreSQL
- **PORT** - используй `${{PORT}}`, Railway сам подставит порт
- **FRONTEND_URL** - убедись что URL правильный (с https://)

## Проверка работы:

После добавления переменных проверь:
1. Логи в Railway (вкладка "Logs")
2. Endpoint здоровья: https://твой-app.up.railway.app/api/health
3. Swagger документация: https://твой-app.up.railway.app/api

