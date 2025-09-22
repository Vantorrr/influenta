# 🔧 Railway Module Not Found Fix

## Проблема
Railway не может найти `dist/main.js` после сборки.

## Решение 1: Использовать Dockerfile

В Railway Dashboard:
1. Settings → Build → Builder → Docker
2. Docker File Path: `backend/Dockerfile`

## Решение 2: Изменить Start Command

В Railway Dashboard → Settings → Deploy:
```bash
cd backend && npm run build && npm run start:prod
```

## Решение 3: Переменные окружения

Добавь эти переменные:
```env
NIXPACKS_NODE_VERSION=18
NIXPACKS_BUILD_CMD=cd backend && npm ci && npm run build && ls -la dist/
NIXPACKS_START_CMD=cd backend && node dist/main.js
```

## Решение 4: Railway CLI

```bash
# Проверь логи сборки
railway logs --service=backend

# Запусти команду в контейнере
railway run ls -la backend/dist/

# Пересобери вручную
railway run cd backend && npm run build
```

## Решение 5: Альтернативный запуск

Измени start команду в nixpacks.toml:
```toml
[start]
cmd = "cd backend && ls -la && npm run build && node dist/main.js"
```

## Проверка после фикса

1. Открой логи в Railway
2. Найди строку "Build completed"
3. Проверь что есть список файлов в dist/
4. Проверь health endpoint: https://твой-app.up.railway.app/api/health

## Если ничего не помогает

1. Удали сервис в Railway
2. Создай новый
3. Подключи репозиторий
4. Добавь переменные окружения
5. Deploy

## Debug команды

Добавь в Railway Variables:
```env
DEBUG=*
LOG_LEVEL=debug
```
