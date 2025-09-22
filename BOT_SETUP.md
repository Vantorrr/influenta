# 🤖 Полная настройка Telegram Bot для Influenta

## Твой бот готов!

**Bot Username:** @InfluentaBot  
**Bot Token:** `7539463116:AAE97MAcGffyANYVGOWoGT1qKmNiPPTVWpg`

## 🚀 Быстрый старт (5 минут)

### 1. Скопируй настройки
```bash
cp env.local .env
```

### 2. Запусти приложение
```bash
# В одном терминале - база данных
docker-compose up postgres

# Во втором терминале - backend
cd backend
npm install
npm run start:dev

# В третьем терминале - frontend
cd frontend
npm install
npm run dev
```

### 3. Настрой ngrok для тестирования
```bash
# Установи ngrok если нет
brew install ngrok  # macOS
# или скачай с https://ngrok.com/download

# Запусти туннель
ngrok http 3000
```

Получишь URL типа: `https://abc123.ngrok.io`

### 4. Настрой бота в Telegram

1. Открой @BotFather
2. Отправь `/mybots`
3. Выбери `InfluentaBot`
4. Нажми `Bot Settings`
5. Нажми `Menu Button`
6. Нажми `Configure menu button`
7. Введи:
   - Button text: `🚀 Открыть Influenta`
   - URL: `https://abc123.ngrok.io` (твой ngrok URL)

### 5. Тестируй!

1. Найди своего бота @InfluentaBot
2. Нажми `/start`
3. Нажми кнопку меню `🚀 Открыть Influenta`
4. Приложение откроется прямо в Telegram!

## 📱 Команды бота (опционально)

Добавь команды через @BotFather → `/setcommands`:

```
start - Запустить приложение
help - Помощь
profile - Мой профиль
listings - Объявления
bloggers - Каталог блогеров
```

## 🔐 Админ-доступ

Твои Telegram ID уже настроены как админы:
- **741582706** - Супер Админ (полный доступ)
- **8141463258** - Админ #2

При входе через Telegram ты автоматически получишь админские права!

## 🐛 Troubleshooting

### Бот не отвечает
1. Проверь что backend запущен
2. Проверь токен в `.env`
3. Перезапусти ngrok

### Кнопка меню не появляется
1. Закрой и открой чат с ботом
2. Обнови Telegram
3. Попробуй на другом устройстве

### Ошибка авторизации
1. Проверь что `TELEGRAM_BOT_TOKEN` правильный
2. Убедись что ngrok URL актуальный
3. Проверь консоль браузера на ошибки

## 🚀 Production деплой

Когда будешь готов к production:

1. Размести приложение на сервере
2. Получи домен и SSL сертификат
3. Обнови URL в @BotFather на `https://your-domain.com`
4. Profit! 💰

## 💡 Полезные ссылки

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Telegram Web Apps](https://core.telegram.org/bots/webapps)
- [BotFather](https://t.me/botfather)
- [Твой бот](https://t.me/InfluentaBot)
