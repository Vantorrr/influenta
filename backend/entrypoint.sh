#!/bin/sh

echo "🚀 Starting Influencer Platform Backend..."
echo "📁 Current directory: $(pwd)"
echo "📦 Node version: $(node --version)"
echo "🔍 Checking environment..."

# Проверка переменных окружения
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  WARNING: DATABASE_URL is not set"
fi

if [ -z "$JWT_SECRET" ]; then
  echo "❌ ERROR: JWT_SECRET is required"
  exit 1
fi

# Проверка наличия dist директории
if [ ! -d "dist" ]; then
  echo "📦 dist directory not found, running build..."
  npm run build
fi

# Проверка наличия main.js
if [ ! -f "dist/main.js" ]; then
  echo "❌ ERROR: dist/main.js not found"
  echo "📁 Contents of dist directory:"
  ls -la dist/ || echo "dist directory does not exist"
  exit 1
fi

echo "✅ All checks passed, starting application..."
echo "🌐 Port: ${PORT:-3001}"
echo "🚀 Environment: ${NODE_ENV:-development}"

# Запуск приложения
exec node dist/main.js

