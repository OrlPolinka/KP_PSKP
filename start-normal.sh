#!/bin/bash

echo "🚀 Normal Start - Обычный запуск с сохранением данных"
echo "===================================================="

# Запускаем обычные контейнеры без пересборки
echo "🔄 Запуск приложения с сохранением данных..."
docker-compose up -d

echo "✅ Готово! Приложение доступно по адресу http://localhost"
echo "💾 Данные базы данных сохранены"
echo ""
echo "🔐 Данные для входа:"
echo "   Админ: admin@dancestudio.ru / 123456"
echo "   Клиент: maria.ivanova@mail.ru / 123456"
echo "   Тренер: anna.zubareva@dancestudio.ru / 123456"
