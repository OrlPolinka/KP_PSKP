#!/bin/bash

echo "🏗️  Build and Seed - Полная пересборка с заполнением БД"
echo "=================================================="

# Останавливаем и удаляем существующие контейнеры
echo "🛑 Остановка существующих контейнеров..."
docker-compose down

# Удаляем volume для полной очистки БД
echo "🗑️  Удаление данных БД..."
docker volume rm dance-studio_postgres_data 2>/dev/null || true
docker volume rm dance-studio_postgres_data_build 2>/dev/null || true

# Собираем и запускаем с заполнением БД
echo "🔨 Сборка и запуск с заполнением БД..."
docker-compose -f docker-compose.build.yml up --build -d

echo "✅ Готово! Приложение доступно по адресу http://localhost"
echo "📊 База данных очищена и заполнена актуальными данными"
echo ""
echo "🔐 Данные для входа:"
echo "   Админ: admin@dancestudio.ru / 123456"
echo "   Клиент: maria.ivanova@mail.ru / 123456"
echo "   Тренер: anna.zubareva@dancestudio.ru / 123456"
