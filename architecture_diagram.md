# Архитектурная диаграмма Dance Studio

## Текущая архитектура проекта

```mermaid
graph TB
    subgraph "Client Machine"
        Browser[Браузер<br/>React 19.2.4]
    end
    
    subgraph "Ubuntu Server 24.04 LTS"
        subgraph "Docker Containers"
            NGINX[nginx<br/>dance_studio_nginx<br/>Reverse Proxy<br/>Ports: 80, 443]
            
            subgraph "Frontend"
                Frontend[frontend<br/>dance_studio_frontend<br/>React Bundle<br/>Port: 3000]
            end
            
            subgraph "Backend"
                Backend[backend<br/>dance_studio_backend<br/>Node.js 22.x<br/>Express 5.2.1<br/>Prisma 6.19.0<br/>Port: 5000]
            end
            
            subgraph "Database"
                PostgreSQL[postgres<br/>dance_studio_db<br/>PostgreSQL 16-alpine<br/>Port: 5432]
            end
        end
    end
    
    %% Внешние соединения
    Browser -->|HTTPS/HTTP| NGINX
    
    %% Внутренние соединения Docker
    NGINX -->|HTTP Proxy| Frontend
    NGINX -->|API Proxy| Backend
    Frontend -->|API Calls| Backend
    Backend -->|TCP/IP| PostgreSQL
    
    %% Зависимости
    Backend -.->|depends_on| PostgreSQL
    Frontend -.->|depends_on| Backend
    NGINX -.->|depends_on| Frontend
    NGINX -.->|depends_on| Backend
    
    %% Стили
    classDef client fill:#e1f5fe
    classDef proxy fill:#f3e5f5
    classDef frontend fill:#e8f5e8
    classDef backend fill:#fff3e0
    classDef database fill:#fce4ec
    
    class Browser client
    class NGINX proxy
    class Frontend frontend
    class Backend backend
    class PostgreSQL database
```

## Сравнение с исходной диаграммой

### Что изменилось:

1. **Названия контейнеров:**
   - `Database Server` → `postgres` (реальное имя из docker-compose.yml)
   - `Web API` → `backend` (реальное имя)
   - `NGINX Server` → `nginx` (реальное имя)

2. **Добавлен frontend контейнер:**
   - Отдельный контейнер `frontend` с React приложением
   - NGINX только проксирует, не содержит статические файлы

3. **Обновлены версии:**
   - PostgreSQL: 16-alpine (не 16.12)
   - Express: 5.2.1 (не 4.21.2)
   - Prisma: 6.19.0 (не 7.3.0)
   - React: 19.2.4 (верно)

4. **Архитектура связей:**
   - Browser → NGINX (HTTPS/HTTP)
   - NGINX → Frontend (HTTP проксирование)
   - NGINX → Backend (API проксирование)
   - Frontend → Backend (прямые API вызовы)
   - Backend → PostgreSQL (TCP/IP)

5. **Порты:**
   - NGINX: 80, 443 (внешние)
   - Frontend: 3000 (внутренний)
   - Backend: 5000 (внутренний)
   - PostgreSQL: 5432 (внутренний)

## Потоки данных

### 1. Пользователь заходит на сайт:
```
Browser → NGINX (порт 80/443) → Frontend контейнер
```

### 2. API запросы:
```
Browser → NGINX → Backend контейнер
```

### 3. Данные из БД:
```
Backend → PostgreSQL
```

### 4. WebSocket соединения (чат):
```
Browser → NGINX → Backend (Socket.IO)
```

## Преимущества текущей архитектуры

- **Изоляция:** Каждый компонент в отдельном контейнере
- **Масштабируемость:** Легко масштабировать frontend/backend отдельно
- **Безопасность:** NGINX как reverse proxy
- **Производительность:** Статический контент отдается отдельно
- **Надежность:** Автоматический перезапуск контейнеров
