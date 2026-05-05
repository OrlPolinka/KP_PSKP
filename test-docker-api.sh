#!/bin/bash
echo "Тестирование Docker API..."

echo "1. Проверка health endpoint..."
curl -s http://localhost/api/health | jq . || echo "Ошибка: API недоступен"

echo ""
echo "2. Проверка аутентификации..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dancestudio.ru","password":"123456"}')

echo $LOGIN_RESPONSE | jq . || echo "Ошибка аутентификации"

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token' 2>/dev/null)

if [ "$TOKEN" != "null" ] && [ ! -z "$TOKEN" ]; then
  echo ""
  echo "3. Проверка получения пользователей..."
  curl -s http://localhost/api/users \
    -H "Authorization: Bearer $TOKEN" | jq '.users | length' || echo "Ошибка получения пользователей"
  
  echo ""
  echo "4. Проверка получения тренеров..."
  curl -s http://localhost/api/trainers \
    -H "Authorization: Bearer $TOKEN" | jq '.trainers | length' || echo "Ошибка получения тренеров"
  
  echo ""
  echo "5. Проверка получения расписания..."
  curl -s http://localhost/api/schedule \
    -H "Authorization: Bearer $TOKEN" | jq '.schedule | length' || echo "Ошибка получения расписания"
  
  echo ""
  echo "6. Проверка получения стилей танцев..."
  curl -s http://localhost/api/dance-styles \
    -H "Authorization: Bearer $TOKEN" | jq '.danceStyles | length' || echo "Ошибка получения стилей"
else
  echo "Ошибка: Не удалось получить токен"
fi

echo ""
echo "Тестирование завершено!"