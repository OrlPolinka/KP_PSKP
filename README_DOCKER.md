# DanceStudio — Запуск через Docker

## Что исправлено

✅ `docker-compose.yml` — версия 3.7 (совместима с Docker Toolbox 1.24)  
✅ Nginx конфиг встроен в образ (без монтирования файлов)  
✅ Backend ждёт готовности PostgreSQL перед запуском  
✅ `.gitignore` обновлён — секреты не попадут в Git  
✅ Сжатие фото перед сохранением (решена проблема localStorage quota)  
✅ Фото сохраняется в БД (поле `photoUrl` типа `Text`)  

## Быстрый старт

### 1. Подготовка (один раз)

**Создай `.env` в корне проекта:**
```bash
POSTGRES_PASSWORD=твой_пароль
JWT_SECRET=this_is_dance_studio_database_2005
GOOGLE_CLIENT_ID=865546662175-...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_CALLBACK_URL=http://192.168.99.100/api/auth/google/callback
```

**Обнови Google Cloud Console:**
- Authorized redirect URIs: `http://192.168.99.100/api/auth/google/callback`
- Authorized JavaScript origins: `http://192.168.99.100`

### 2. Запуск

**В Docker Quickstart Terminal:**
```bash
cd /d/user/dance-studio

# Первый запуск (долго — 10-15 минут)
docker-compose up --build --force-recreate

# Если сборка зависла — останови (Ctrl+C) и запусти снова
docker-compose up --build
```

### 3. Инициализация БД (в отдельном терминале)

```bash
cd /d/user/dance-studio

# Применить схему
docker-compose exec backend npx prisma db push

# Заполнить данными
docker-compose exec backend node prisma/seed.js
```

### 4. Открой приложение

```
http://192.168.99.100
```

**Тестовые аккаунты** (пароль: `123456`):
- Админ: `admin@dancestudio.ru`
- Тренер: `anna.zubareva@dancestudio.ru`
- Клиент: `maria.ivanova@mail.ru`

## Команды

```bash
# Запустить (после первой сборки)
docker-compose up

# В фоне
docker-compose up -d

# Остановить
docker-compose down

# Логи
docker-compose logs -f backend
docker-compose logs -f frontend

# Перезапустить один сервис
docker-compose restart backend

# Зайти в контейнер
docker-compose exec backend sh
docker-compose exec postgres psql -U postgres -d dance_studio
```

## Проблемы

### Nginx не запускается (Created, но не Up)

Это баг Docker Toolbox с монтированием файлов. Решение — nginx конфиг встроен в образ через Dockerfile.

Если проблема осталась:
```bash
# Полная очистка
docker-compose down -v
docker rm -f $(docker ps -aq)
docker rmi dance-studio_nginx
docker-compose up --build --force-recreate
```

### Frontend build зависает

Docker Toolbox медленный. Подожди 10-15 минут или собери локально:
```bash
cd frontend
npm run build
```
Затем пересобери только frontend:
```bash
docker-compose build frontend
docker-compose up
```

### Backend не подключается к БД

```bash
# Проверь что postgres запустился
docker ps | grep postgres

# Посмотри логи
docker-compose logs postgres

# Проверь что wait-for-postgres.sh работает
docker-compose logs backend | grep "PostgreSQL"
```

## Что НЕ коммитить в Git

❌ `.env` (корневой и в backend/)  
❌ `nginx/certs/*.pem`  
❌ `node_modules/`  
❌ `nginx/nginx.exe`, `nginx/logs/`, `nginx/temp/`  

✅ Можно коммитить: `.env.example`, `docker-compose.yml`, `Dockerfile`, `docker/nginx.conf`

## SSL (опционально)

### Самоподписанный сертификат
```bash
mkdir -p docker/certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout docker/certs/privkey.pem \
  -out docker/certs/fullchain.pem \
  -subj "/CN=192.168.99.100"
```

Обнови `docker/nginx.conf` — добавь блок `listen 443 ssl;` и пути к сертификатам.

Обнови `docker-compose.yml`:
```yaml
nginx:
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./docker/certs:/etc/nginx/certs:ro
```

## Разработка (hot-reload)

Для разработки с автоперезагрузкой при изменении кода:

**docker-compose.override.yml:**
```yaml
version: '3.7'
services:
  backend:
    build:
      target: development
    volumes:
      - ./backend:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
```

Тогда изменения в `backend/src/` будут применяться без пересборки (через nodemon).
