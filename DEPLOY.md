# 🚀 Руководство по деплою Influencer Platform

## Быстрый старт (Production)

### 1. Подготовка сервера

```bash
# Установка Docker и Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo apt-get install docker-compose-plugin

# Клонирование репозитория
git clone https://github.com/your-repo/influencer-platform.git
cd influencer-platform
```

### 2. Настройка окружения

```bash
# Копируем production конфигурацию
cp env.production.example .env

# Редактируем переменные окружения
nano .env
```

### 3. SSL сертификаты

```bash
# Создаем папку для сертификатов
mkdir -p nginx/ssl

# Вариант 1: Let's Encrypt (рекомендуется)
sudo apt-get install certbot
certbot certonly --standalone -d your-domain.com

# Копируем сертификаты
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem

# Вариант 2: Самоподписанный (для тестирования)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem
```

### 4. Запуск приложения

```bash
# Production режим
docker-compose -f docker-compose.prod.yml up -d

# Проверка статуса
docker-compose -f docker-compose.prod.yml ps

# Просмотр логов
docker-compose -f docker-compose.prod.yml logs -f
```

## 📱 Настройка Telegram Bot

1. Создайте бота через @BotFather
2. Получите токен бота
3. Установите Web App URL:
   ```
   /setmenubutton
   Выберите вашего бота
   Введите текст кнопки: Открыть приложение
   Введите URL: https://your-domain.com
   ```

## 🔧 Администрирование

### Доступ к админ-панели

1. Откройте https://your-domain.com/admin/login
2. Используйте учетные данные из .env файла

### Мониторинг

```bash
# Статус контейнеров
docker-compose -f docker-compose.prod.yml ps

# Использование ресурсов
docker stats

# Логи приложения
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend

# База данных
docker-compose -f docker-compose.prod.yml exec postgres psql -U influencer_user -d influencer_platform
```

### Резервное копирование

```bash
# Backup базы данных
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U influencer_user influencer_platform > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановление из backup
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U influencer_user influencer_platform < backup.sql
```

## 🚨 Troubleshooting

### Проблема: База данных не запускается
```bash
# Проверить логи
docker-compose -f docker-compose.prod.yml logs postgres

# Пересоздать volume
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d
```

### Проблема: 502 Bad Gateway
```bash
# Проверить backend
docker-compose -f docker-compose.prod.yml logs backend

# Перезапустить сервисы
docker-compose -f docker-compose.prod.yml restart
```

### Проблема: WebSocket не работает
```bash
# Проверить nginx конфигурацию
docker-compose -f docker-compose.prod.yml exec nginx nginx -t

# Проверить логи
docker-compose -f docker-compose.prod.yml logs nginx
```

## 📈 Масштабирование

### Горизонтальное масштабирование

```yaml
# docker-compose.prod.yml
backend:
  deploy:
    replicas: 3
```

### Добавление Redis

```yaml
redis:
  image: redis:7-alpine
  volumes:
    - redis_data:/data
  command: redis-server --requirepass ${REDIS_PASSWORD}
```

### Добавление мониторинга

```yaml
prometheus:
  image: prom/prometheus
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml
    - prometheus_data:/prometheus

grafana:
  image: grafana/grafana
  ports:
    - "3001:3000"
  volumes:
    - grafana_data:/var/lib/grafana
```

## 🔄 Обновление

```bash
# Остановка приложения
docker-compose -f docker-compose.prod.yml down

# Получение обновлений
git pull

# Пересборка образов
docker-compose -f docker-compose.prod.yml build

# Запуск обновленной версии
docker-compose -f docker-compose.prod.yml up -d
```

## 🛡️ Безопасность

1. **Firewall**: Откройте только порты 80 и 443
2. **SSL**: Используйте только проверенные сертификаты
3. **Пароли**: Используйте сложные пароли для всех сервисов
4. **Обновления**: Регулярно обновляйте Docker образы
5. **Мониторинг**: Настройте алерты для критичных событий

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи всех сервисов
2. Убедитесь что все переменные окружения установлены
3. Проверьте доступность внешних сервисов (Telegram API)
4. Обратитесь в поддержку: support@influencer-platform.com

