# 🚂 Деплой на Railway

## ✅ Почему Railway идеально подходит

- **Бесплатный план** для старта (500 часов/месяц)
- **Автоматический HTTPS** сертификат
- **PostgreSQL** включен в платформу
- **WebSocket** поддержка для чата
- **Простой деплой** из GitHub
- **Переменные окружения** через UI

## 🚀 Быстрый деплой (5 минут)

### 1. Создай аккаунт Railway
Перейди на [railway.app](https://railway.app/) и войди через GitHub

### 2. Создай новый проект
```bash
# Вариант 1: Через CLI
npm install -g @railway/cli
railway login
railway new

# Вариант 2: Через веб-интерфейс
# Нажми "New Project" → "Deploy from GitHub repo"
```

### 3. Выбери репозиторий
Выбери `Vantorrr/influenta` из списка твоих репозиториев

### 4. Настрой сервисы

#### PostgreSQL
1. Нажми `+ New` → `Database` → `PostgreSQL`
2. Railway автоматически создаст базу и добавит переменные:
   - `DATABASE_URL`
   - `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`

#### Backend Service
1. Нажми `+ New` → `GitHub Repo` → выбери свой репозиторий
2. В настройках сервиса:
   - **Root Directory**: `backend`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm run start:prod`
   - **Port**: `3001`

#### Frontend Service
1. Нажми `+ New` → `GitHub Repo` → выбери свой репозиторий
2. В настройках сервиса:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm run start`
   - **Port**: `3000`

### 5. Переменные окружения

#### Backend переменные:
```env
NODE_ENV=production
PORT=3001

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

# Database (автоматически от Railway PostgreSQL)
DATABASE_URL=${{Postgres.DATABASE_URL}}
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
DB_NAME=${{Postgres.PGDATABASE}}

# Frontend URL (после создания frontend сервиса)
FRONTEND_URL=https://your-frontend.up.railway.app

# Telegram Bot
TELEGRAM_BOT_TOKEN=7539463116:AAE97MAcGffyANYVGOWoGT1qKmNiPPTVWpg
TELEGRAM_BOT_NAME=InfluentaBot

# Admin IDs
ADMIN_TELEGRAM_IDS=741582706,8141463258
```

#### Frontend переменные:
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app
NEXT_PUBLIC_WS_URL=wss://your-backend.up.railway.app
NEXT_PUBLIC_TELEGRAM_BOT_NAME=InfluentaBot
```

### 6. Деплой!
1. Railway автоматически задеплоит при push в GitHub
2. Получишь URL типа:
   - Backend: `https://influenta-backend.up.railway.app`
   - Frontend: `https://influenta-frontend.up.railway.app`

### 7. Настрой Telegram Bot
1. Открой @BotFather
2. Выбери `InfluentaBot`
3. `/setmenubutton`
4. Введи URL frontend: `https://influenta-frontend.up.railway.app`

## 🔧 Альтернативный способ - Monorepo

Если хочешь деплоить как один сервис:

1. Создай один сервис в Railway
2. Используй root `package.json`:
```json
{
  "scripts": {
    "build": "cd backend && npm ci && npm run build && cd ../frontend && npm ci && npm run build",
    "start": "cd backend && npm run start:prod"
  }
}
```

3. Добавь Nixpacks конфигурацию:
```toml
# nixpacks.toml
[phases.setup]
nixPkgs = ["nodejs", "npm"]

[phases.build]
cmd = "npm run build"

[start]
cmd = "npm start"
```

## 📊 Мониторинг

Railway предоставляет:
- **Логи** в реальном времени
- **Метрики** CPU/Memory
- **Deployment history**
- **Crash reports**

## 💰 Стоимость

**Бесплатный план:**
- 500 часов выполнения/месяц
- $5 кредитов
- Идеально для MVP

**Hobby план ($5/месяц):**
- Безлимитные часы
- Custom domains
- Больше ресурсов

## 🚨 Troubleshooting

### Build failed
```bash
# Проверь логи
railway logs

# Убедись что все зависимости в package.json
# Проверь Node.js версию (>=18)
```

### WebSocket не работает
```env
# Убедись что в frontend:
NEXT_PUBLIC_WS_URL=wss://your-backend.up.railway.app
```

### База данных не подключается
```bash
# Проверь что DATABASE_URL правильный
railway variables
```

## 🎯 Готово!

Твое приложение теперь доступно по HTTPS с автоматическими деплоями при каждом push в GitHub!

**Проверь:**
- Frontend: `https://influenta-frontend.up.railway.app`
- Backend API: `https://influenta-backend.up.railway.app/api`
- Telegram Bot: @InfluentaBot

