# Railway Environment Variables Setup

## Обязательные переменные для корректной работы загрузки файлов

1. **BACKEND_URL** - КРИТИЧНО для загрузки файлов!
   ```
   BACKEND_URL=https://YOUR-APP-NAME.up.railway.app
   ```
   Замените `YOUR-APP-NAME` на реальное имя вашего Railway деплоя.

2. **DATABASE_URL** - подключение к PostgreSQL
   ```
   DATABASE_URL=postgresql://user:password@host:port/database
   ```

3. **JWT_SECRET** - секретный ключ для JWT токенов
   ```
   JWT_SECRET=your-secret-key-here
   ```

4. **TELEGRAM_BOT_TOKEN** - токен вашего Telegram бота
   ```
   TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   ```

5. **ADMIN_TELEGRAM_IDS** - ID админов в формате JSON массива
   ```
   ADMIN_TELEGRAM_IDS=["123456789","987654321"]
   ```

## Как установить переменные в Railway:

1. Откройте ваш проект в Railway
2. Перейдите в Settings → Variables
3. Добавьте каждую переменную
4. Обязательно установите BACKEND_URL с полным URL вашего деплоя!
5. Передеплойте приложение

## Проверка:

После деплоя проверьте в логах Railway:
- `📸 File upload:` - должен показывать правильный baseUrl
- `📁 Uploads directory:` - путь к директории загрузок

Если файлы все еще возвращают 404, проверьте что BACKEND_URL указан правильно!



