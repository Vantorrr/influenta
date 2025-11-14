#!/bin/bash
# Скрипт для создания бэкапа базы данных PostgreSQL на Railway

# Получаем DATABASE_URL из Railway
# Замени на свой DATABASE_URL из Railway Environment Variables
DATABASE_URL="postgresql://postgres:password@host:port/railway"

# Создаём директорию для бэкапов
mkdir -p backups

# Имя файла с датой
BACKUP_FILE="backups/influenta_backup_$(date +%Y%m%d_%H%M%S).sql"

# Создаём дамп базы данных
echo "Creating backup..."
pg_dump "$DATABASE_URL" > "$BACKUP_FILE"

# Сжимаем для экономии места
gzip "$BACKUP_FILE"

echo "✅ Backup created: ${BACKUP_FILE}.gz"
echo "📦 Size: $(du -h ${BACKUP_FILE}.gz | cut -f1)"


