# 🚂 Railway Setup Guide

## 1. Создание проекта на Railway

### Если еще не создан:
```bash
# Установи Railway CLI (если еще нет)
npm install -g @railway/cli

# Логин в Railway
railway login

# Создай новый проект
railway init

# Выбери "Empty Project"
```

### Если проект уже создан:
```bash
railway link
# Выбери существующий проект
```

## 2. Добавление PostgreSQL

В Railway Dashboard:
1. Нажми "+ New"
2. Выбери "Database" → "Add PostgreSQL"
3. Railway автоматически создаст `DATABASE_URL`

## 3. Настройка переменных окружения

### Вариант 1: Через CLI
```bash
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=your_super_secret_key_$(openssl rand -hex 32)
railway variables set TELEGRAM_BOT_TOKEN=7539463116:AAE97MAcGffyANYVGOWoGT1qKmNiPPTVWpg
railway variables set TELEGRAM_BOT_NAME=InfluentaBot
railway variables set SUPER_ADMIN_ID=741582706
railway variables set ADMIN_IDS=741582706,8141463258
railway variables set FRONTEND_URL=https://influenta-frontend.vercel.app
railway variables set API_PREFIX=api
railway variables set LOG_LEVEL=info
```

### Вариант 2: Через Dashboard
Скопируй из файла `RAILWAY_VARIABLES.md`

## 4. Деплой

### Автоматический деплой (рекомендуется):
Railway автоматически деплоит при push в GitHub

### Ручной деплой:
```bash
railway up
```

## 5. Проверка работы

### Получи URL приложения:
```bash
railway open
```

### Проверь endpoints:
- Health Check: `https://твой-app.up.railway.app/api/health`
- Swagger Docs: `https://твой-app.up.railway.app/api`
- Main Page: `https://твой-app.up.railway.app/`

## 6. Просмотр логов

```bash
# В реальном времени
railway logs

# Последние 100 строк
railway logs -n 100
```

## 7. Команды для управления

```bash
# Статус сервиса
railway status

# Рестарт
railway restart

# Переменные окружения
railway variables

# Открыть dashboard
railway open
```

## 8. Troubleshooting

### Если ошибка с портом:
- Railway автоматически назначает PORT
- Используй `process.env.PORT || 3001`

### Если ошибка с базой данных:
- Проверь что PostgreSQL plugin добавлен
- Проверь DATABASE_URL в переменных

### Если CORS ошибки:
- Проверь FRONTEND_URL в переменных
- Убедись что URL с https://

## 9. Мониторинг

В Railway Dashboard можно видеть:
- CPU и Memory usage
- Логи в реальном времени
- Статус деплоев
- Историю изменений

## 10. Бэкапы базы данных

```bash
# Экспорт базы
railway run pg_dump > backup.sql

# Или через Dashboard
# Settings → Backups → Create Backup
```
