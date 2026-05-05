# ИНСТРУКЦИИ ДЛЯ WINDOWS

## Для запуска на Windows:

### 1. Пересборка Docker:
```powershell
# Остановить контейнеры
docker-compose down

# Удалить старые образы
docker-compose rm -f

# Пересобрать с нуля
docker-compose build --no-cache

# Запустить
docker-compose up -d
```

### 2. Проверка:
```powershell
# Проверить контейнеры
docker-compose ps

# Проверить логи backend
docker-compose logs backend --tail=20

# Проверить базу данных
docker-compose exec postgres psql -U postgres -d dance_studio -c "SELECT COUNT(*) as total_users FROM `"User`";"
```

### 3. Открыть в браузере:
- Откройте: `http://localhost`
- Войдите как: `admin@dancestudio.ru` / `123456`

## Все исправления применены:

### ✅ Исправлено в Docker:
1. **База данных автоматически заполняется** при запуске
2. **API URL настроен правильно** через nginx
3. **Seed скрипт выполняется** при старте контейнера

### ✅ Исправлено в чате:
1. **Списки пользователей** загружаются автоматически:
   - Админ → все пользователи
   - Тренер → клиенты
   - Клиент → тренеры
2. **Быстрый доступ** с мини-аватарами
3. **Новые сообщения** появляются сразу

### ✅ Исправлены стили:
1. **Таблицы**: более контрастные заголовки
2. **Модальные окна**: градиентные заголовки, тени
3. **Формы**: лучше видимость полей ввода
4. **Текст**: не слишком темный, не белый на белом

## Если проблемы остались:

### 1. Данные не отображаются:
```powershell
# Проверить seed скрипт
docker-compose exec backend node prisma/seed.js

# Проверить фиксы
docker-compose exec backend node fixAllProblems.js
```

### 2. Стили не загружаются:
- В браузере нажмите **Ctrl+F5** (очистка кэша)
- Откройте **Консоль разработчика (F12)** → вкладка Console

### 3. API не работает:
```powershell
# Проверить health endpoint
curl http://localhost/api/health

# Должен вернуть: {"status":"OK","message":"Server is running"}
```

## Контакты для тестирования:

### Админы:
- `admin@dancestudio.ru` / `123456`
- `admin2@dancestudio.ru` / `123456`

### Тренеры:
- `anna.zubareva@dancestudio.ru` / `123456`
- `dmitry.smirnov@dancestudio.ru` / `123456`
- `ekaterina.ivanova@dancestudio.ru` / `123456`

### Клиенты:
- `maria.ivanova@mail.ru` / `123456`
- `alexey.petrov@mail.ru` / `123456`
- `olga.sidorova@mail.ru` / `123456`

## Что должно работать после пересборки:

1. **Все страницы админа** заполнены данными
2. **Чат** показывает списки пользователей
3. **Стили** читаемы и контрастны
4. **Новые сообщения** появляются в чате
5. **Все функциональности** работают как в локальной версии