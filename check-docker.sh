#!/bin/bash

echo "🐳 Проверка Docker..."
echo "=========================="

# Проверяем запущен ли Docker
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker не запущен!"
    echo ""
    echo "🔧 Решения:"
    echo "1. Запустите Docker Desktop"
    echo "2. Или выполните в PowerShell (Admin):"
    echo "   net start com.docker.service"
    echo "   net start docker"
    echo ""
    echo "После запуска Docker выполните:"
    echo "docker-compose up --build -d"
    exit 1
fi

echo "✅ Docker запущен"
echo ""

# Показываем версию
echo "📋 Версии:"
docker --version
docker-compose --version
echo ""

# Проверяем .env файл
if [ ! -f .env ]; then
    echo "⚠️  .env файл не найден"
    echo "Создаю из .env.example..."
    cp .env.example .env
    echo "✅ .env файл создан"
    echo "📝 Отредактируйте .env файл с вашими данными"
else
    echo "✅ .env файл найден"
fi

echo ""
echo "🚀 Готово к запуску:"
echo "docker-compose up --build -d"
