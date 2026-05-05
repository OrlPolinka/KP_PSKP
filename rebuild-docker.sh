#!/bin/bash
echo "Остановка Docker контейнеров..."
docker-compose down

echo "Удаление старых образов..."
docker-compose rm -f

echo "Пересборка образов..."
docker-compose build --no-cache

echo "Запуск контейнеров..."
docker-compose up -d

echo "Ожидание запуска сервисов..."
sleep 10

echo "Проверка состояния контейнеров..."
docker-compose ps

echo "Проверка логов backend..."
docker-compose logs backend --tail=20

echo "Проверка логов frontend..."
docker-compose logs frontend --tail=20

echo "Проверка базы данных..."
docker-compose exec postgres psql -U postgres -d dance_studio -c "SELECT COUNT(*) as total_users FROM \"User\";"

echo "Готово! Приложение доступно по адресу: http://localhost"