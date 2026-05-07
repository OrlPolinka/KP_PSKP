# Исправление ошибок Docker

## Проблема 1: Docker daemon не запущен

Ошибка: `ERROR: Couldn't connect to Docker daemon`

### Решения для Windows:

#### Вариант 1: Перезапустить Docker Desktop
1. Откройте Docker Desktop
2. Нажмите на иконку Docker в системном трее
3. Выберите "Restart"
4. Дождитесь полного запуска

#### Вариант 2: Запустить службы Docker
1. Откройте PowerShell от имени администратора
2. Выполните команды:
```powershell
net start com.docker.service
net start docker
```

#### Вариант 3: Переустановить Docker Desktop
1. Скачайте последнюю версию Docker Desktop for Windows
2. Установите с правами администратора
3. Перезагрузите компьютер

#### Вариант 4: Проверить WSL 2
1. Откройте PowerShell от имени администратора
2. Выполните:
```powershell
wsl --install
wsl --set-default-version 2
```

## Проблема 2: Предупреждение о 'deploy' ключе

Ошибка: `WARNING: Some services (frontend) use 'deploy' key, which will be ignored`

### ✅ Исправлено:
Убрал секцию `deploy` из docker-compose.yml, так как она поддерживается только в Docker Swarm.

## Команды для запуска:

### 1. Создать .env файл (если нет):
```bash
cp .env.example .env
```

### 2. Запустить Docker:
```bash
# Убедиться что Docker запущен
docker --version

# Собрать и запустить контейнеры
docker-compose up --build -d

# Проверить статус
docker-compose ps

# Посмотреть логи если есть проблемы
docker-compose logs -f
```

### 3. Остановить если нужно:
```bash
docker-compose down
```

## Проверка работы:

После запуска проверьте:
- Frontend: http://localhost
- Backend API: http://localhost/api
- Database: localhost:5432

## Если проблемы продолжаются:

1. Проверьте свободное место на диске
2. Очистите Docker кэш:
```bash
docker system prune -a
```

3. Проверьте версии:
```bash
docker --version
docker-compose --version
```
