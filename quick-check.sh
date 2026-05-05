#!/bin/bash
echo "=== БЫСТРАЯ ПРОВЕРКА СИСТЕМЫ ==="
echo ""

echo "1. Проверка контейнеров..."
docker-compose ps

echo ""
echo "2. Проверка логов backend (последние 10 строк)..."
docker-compose logs backend --tail=10

echo ""
echo "3. Проверка логов frontend (последние 10 строк)..."
docker-compose logs frontend --tail=10

echo ""
echo "4. Проверка базы данных..."
docker-compose exec postgres psql -U postgres -d dance_studio -c "
SELECT 
  (SELECT COUNT(*) FROM \"User\") as users,
  (SELECT COUNT(*) FROM \"Trainer\") as trainers,
  (SELECT COUNT(*) FROM \"Schedule\") as schedule,
  (SELECT COUNT(*) FROM \"DanceStyle\") as dance_styles,
  (SELECT COUNT(*) FROM \"Membership\") as memberships;
"

echo ""
echo "5. Проверка API health..."
curl -s http://localhost/api/health || echo "API недоступен"

echo ""
echo "=== ПРОВЕРКА ЗАВЕРШЕНА ==="
echo ""
echo "Если все проверки пройдены:"
echo "1. Откройте http://localhost в браузере"
echo "2. Войдите как admin@dancestudio.ru / 123456"
echo "3. Проверьте все страницы"
echo ""
echo "Если есть проблемы:"
echo "1. Запустите ./rebuild-docker.sh для пересборки"
echo "2. Проверьте FINAL_INSTRUCTIONS.md для деталей"