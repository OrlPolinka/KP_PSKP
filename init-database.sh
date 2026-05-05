#!/bin/bash
echo "=== ИНИЦИАЛИЗАЦИЯ БАЗЫ ДАННЫХ DOCKER ==="
echo ""

echo "1. Ожидание запуска PostgreSQL..."
sleep 5

echo "2. Выполнение миграций..."
docker-compose exec backend npx prisma migrate deploy

echo "3. Заполнение базы данных..."
docker-compose exec backend node prisma/seed.js

echo "4. Дополнительные фиксы..."
docker-compose exec backend node fixAllProblems.js
docker-compose exec backend node finalFixes.js

echo ""
echo "=== БАЗА ДАННЫХ ИНИЦИАЛИЗИРОВАНА ==="
echo ""
echo "Проверка пользователей:"
docker-compose exec postgres psql -U postgres -d dance_studio -c "SELECT email, role, '123456' as password FROM \"User\";"
echo ""
echo "Откройте http://localhost и войдите как:"
echo "- Админ: admin@dancestudio.ru / 123456"
echo "- Тренер: anna.zubareva@dancestudio.ru / 123456"
echo "- Клиент: maria.ivanova@mail.ru / 123456"