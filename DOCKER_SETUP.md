# Запуск проекта через Docker

## Подготовка (один раз)

### 1. Создай корневой `.env` файл
Скопируй `.env.example` в `.env` и заполни:
```bash
cp .env.example .env
```

Файл `.env` должен содержать:
```
POSTGRES_PASSWORD=твой_пароль
JWT_SECRET=this_is_dance_studio_database_2005
GOOGLE_CLIENT_ID=твой_client_id
GOOGLE_CLIENT_SECRET=твой_secret
GOOGLE_CALLBACK_URL=http://192.168.99.100/api/auth/google/callback
```

**ВАЖНО для Docker Toolbox:** используй `192.168.99.100` вместо `localhost`!

### 2. Обнови Google Cloud Console
Добавь в **Authorized redirect URIs**:
```
http://192.168.99.100/api/auth/google/callback
```

Добавь в **Authorized JavaScript origins**:
```
http://192.168.99.100
```

## Запуск

### Первый запуск (сборка + запуск)
```bash
# Открой Docker Quickstart Terminal
cd /d/user/dance-studio

# Собрать и запустить
docker-compose up --build
```

Это займёт 5-10 минут при первом запуске.

### Инициализация БД (после первого запуска)
Открой **второй** Docker Quickstart Terminal:
```bash
cd /d/user/dance-studio

# Применить схему БД
docker-compose exec backend npx prisma db push

# Заполнить тестовыми данными
docker-compose exec backend node prisma/seed.js
```

### Последующие запуски
```bash
# Запустить
docker-compose up

# Запустить в фоне
docker-compose up -d

# Остановить
docker-compose down

# Остановить и удалить данные БД
docker-compose down -v
```

## Доступ к приложению

После запуска открой в браузере:
```
http://192.168.99.100
```

**Тестовые аккаунты** (пароль для всех: `123456`):
- Администратор: `admin@dancestudio.ru`
- Тренер: `anna.zubareva@dancestudio.ru`
- Клиент: `maria.ivanova@mail.ru`

## Логи и отладка

```bash
# Посмотреть логи всех сервисов
docker-compose logs

# Логи конкретного сервиса
docker-compose logs backend
docker-compose logs frontend
docker-compose logs nginx

# Следить за логами в реальном времени
docker-compose logs -f backend

# Зайти внутрь контейнера
docker-compose exec backend sh
docker-compose exec postgres psql -U postgres -d dance_studio
```

## SSL/HTTPS (опционально)

### Самоподписанный сертификат (для тестирования)
```bash
# В Git Bash или WSL
mkdir -p nginx/certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/certs/privkey.pem \
  -out nginx/certs/fullchain.pem \
  -subj "/CN=192.168.99.100"
```

Затем:
1. Раскомментируй HTTPS блок в `nginx/nginx.conf`
2. Раскомментируй порт `443:443` в `docker-compose.yml`
3. Перезапусти: `docker-compose restart nginx`

Приложение будет доступно по `https://192.168.99.100` (браузер покажет предупреждение о самоподписанном сертификате — это нормально для локальной разработки).

## Проблемы и решения

### "Cannot connect to Docker daemon"
```bash
# Запусти Docker Quickstart Terminal — он сам запустит VM
```

### "Port already in use"
```bash
# Останови локальные сервисы
# Или измени порты в docker-compose.yml
```

### Backend не подключается к БД
```bash
# Проверь что postgres запустился
docker-compose ps

# Посмотри логи
docker-compose logs postgres
```

### Frontend показывает ошибки API
Проверь что `REACT_APP_API_URL=/api` в `.env` (относительный путь, не `http://localhost:5000/api`).

## Разработка с hot-reload

Для разработки используй `target: development` в `docker-compose.yml`:
```yaml
backend:
  build:
    target: development  # вместо production
  volumes:
    - ./backend:/app
    - /app/node_modules
```

Тогда изменения в коде будут применяться без пересборки (через nodemon).

## Перед отправкой в Git

```bash
# Проверь что секреты не попадут в репозиторий
git status

# Убедись что .env игнорируется
git check-ignore -v .env backend/.env

# Если .env показывается в git status — добавь в .gitignore
```

**НЕ коммитить:**
- `.env` файлы (содержат пароли и секреты)
- `nginx/certs/` (SSL сертификаты)
- `node_modules/`
- `backend/prisma/*.db`

**Коммитить:**
- `.env.example` (шаблон без реальных значений)
- `docker-compose.yml`
- `Dockerfile` файлы
- `nginx/nginx.conf`
- `.gitignore`
