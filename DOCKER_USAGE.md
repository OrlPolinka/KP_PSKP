# Docker Использование - Dance Studio

## 🚀 Два режима запуска

### 1. Полная пересборка с заполнением БД (Build & Seed)

Используется для:
- Первоначальной настройки
- Полной очистки и пересборки данных
- Тестирования с чистой базой

**Windows:**
```bash
build-and-seed.bat
```

**Linux/Mac:**
```bash
./build-and-seed.sh
```

**Или вручную:**
```bash
docker-compose down
docker volume rm dance-studio_postgres_data dance-studio_postgres_data_build
docker-compose -f docker-compose.build.yml up --build -d
```

### 2. Обычный запуск с сохранением данных (Normal Start)

Используется для:
- Ежедневного запуска
- Сохранения текущих данных
- Разработки

**Windows:**
```bash
start-normal.bat
```

**Linux/Mac:**
```bash
./start-normal.sh
```

**Или вручную:**
```bash
docker-compose up -d
```

## 📊 Данные в базе данных

### Актуальные данные после заполнения:
- **Админы:** 2 пользователя
- **Тренеры:** 10 профилей с детальной информацией
- **Клиенты:** 30 пользователей
- **Залы:** 5 помещений
- **Стили танцев:** 11 направлений
- **Расписание:** на 7 дней вперед от текущей даты
- **Абонементы:** для всех клиентов
- **Записи:** будущие занятия

### 🔐 Данные для входа:
- **Админ:** `admin@dancestudio.ru` / `123456`
- **Админ:** `admin2@dancestudio.ru` / `123456`
- **Клиент:** `maria.ivanova@mail.ru` / `123456`
- **Тренер:** `anna.zubareva@dancestudio.ru` / `123456`

## 🗂️ Структура файлов

- `docker-compose.yml` - Обычный запуск (сохранение данных)
- `docker-compose.build.yml` - Полная пересборка с заполнением
- `build-and-seed.bat/.sh` - Скрипты для полной пересборки
- `start-normal.bat/.sh` - Скрипты для обычного запуска
- `backend/prisma/seed.js` - Скрипт заполнения БД

## 🔄 Что происходит при запуске

### Build & Seed:
1. Остановка всех контейнеров
2. Удаление volume с данными БД
3. Создание новых контейнеров
4. Создание таблиц БД (`prisma db push`)
5. Заполнение БД актуальными данными (`prisma db seed`)
6. Запуск приложения

### Normal Start:
1. Запуск существующих контейнеров
2. Применение миграций (если есть)
3. Запуск приложения с сохранением данных

## 🌐 Доступ к приложению

После запуска приложение доступно по адресу:
- **Frontend:** http://localhost
- **Backend API:** http://localhost/api

## 🐛 Отладка

### Проверка статуса контейнеров:
```bash
docker ps
```

### Просмотр логов:
```bash
docker logs dance_studio_backend
docker logs dance_studio_frontend
docker logs dance_studio_nginx
```

### Перезапуск контейнеров:
```bash
docker-compose restart
```

### Полная очистка:
```bash
docker-compose down -v
docker volume rm dance-studio_postgres_data dance-studio_postgres_data_build
docker system prune -f
```

## 📝 Особенности

- **Даты:** Расписание создается на 7 дней вперед от текущей даты
- **Цены:** Адаптированы под белорусский рынок
- **Временные зоны:** Все даты в UTC+3 (Беларусь)
- **Seed:** Полностью очищает и заполняет БД актуальными данными
- **Миграции:** Используется `prisma db push` вместо `migrate deploy`

## ⚠️ Важные замечания

1. **Build & Seed** удалит все текущие данные
2. **Normal Start** сохраняет все изменения
3. При первом запуске используйте **Build & Seed**
4. Для разработки используйте **Normal Start**
5. Все пароли в seed: `123456`

## 🔄 Резервное копирование

Для сохранения данных перед полной пересборкой:
```bash
docker exec dance_studio_db pg_dump -U postgres dance_studio > backup.sql
```

Восстановление:
```bash
docker exec -i dance_studio_db psql -U postgres dance_studio < backup.sql
```
