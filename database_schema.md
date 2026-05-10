# Схема базы данных Dance Studio

## Визуальная схема (ER-диаграмма)

```mermaid
erDiagram
    User ||--o{ Trainer : "имеет"
    User ||--o{ Booking : "клиент"
    User ||--o{ Booking : "отменил"
    User ||--o{ Membership : "клиент"
    User ||--o{ Message : "отправил"
    User ||--o{ Message : "получил"
    User ||--o{ Notification : "получил"
    User ||--o{ Payment : "сделал"
    User ||--o{ Schedule : "создал"
    User ||--o{ AttendanceLog : "тренер"
    
    Trainer ||--o{ Schedule : "ведет"
    Trainer }o--|| User : "пользователь"
    
    DanceStyle ||--o{ Schedule : "стиль"
    
    Hall ||--o{ Schedule : "зал"
    
    MembershipType ||--o{ Membership : "тип"
    
    Membership ||--o{ Booking : "для"
    Membership }o--|| Payment : "оплачено"
    
    Schedule ||--o{ Booking : "занятие"
    Schedule }o--|| Trainer : "тренер"
    Schedule }o--|| DanceStyle : "стиль"
    Schedule }o--|| Hall : "зал"
    Schedule }o--|| User : "создал"
    
    Booking ||--o{ AttendanceLog : "посещение"
    Booking ||--o{ BookingHistory : "история"
    Booking }o--|| Membership : "абонемент"
    Booking }o--|| Schedule : "занятие"
    Booking }o--|| User : "клиент"
    Booking }o--|| User : "отменил"
    
    Payment ||--o{ Membership : "оплатил"
    Payment }o--|| User : "пользователь"
    
    User {
        uuid id PK
        string email UK
        string password
        string role
        string fullName
        string phone
        text photoUrl
        boolean isActive
        timestamp createdAt
    }
    
    Trainer {
        uuid id PK
        uuid userId FK
        string specialization
        text bio
        text photoUrl
        text videoUrl
        text gallery
        text achievements
        int experience
        date hireDate
        string customPageTitle
        text customPageContent
        text education
        text certificates
        text socialLinks
        boolean isPublished
    }
    
    DanceStyle {
        int id PK
        string name UK
        text description
        boolean isActive
        text longDescription
        text videoUrl
        text imageUrl
        text benefits
        string difficulty
        int duration
        int calories
    }
    
    Hall {
        int id PK
        string name
        int capacity
        text description
        boolean isActive
    }
    
    MembershipType {
        int id PK
        string name
        text description
        decimal price
        int visitCount
        int durationDays
        boolean isActive
    }
    
    Membership {
        uuid id PK
        uuid clientId FK
        int membershipTypeId FK
        timestamp purchaseDate
        date startDate
        date endDate
        int remainingVisits
        string status
        decimal pricePaid
        date pausedAt
        date pausedUntil
        uuid paymentId FK
    }
    
    Schedule {
        uuid id PK
        int danceStyleId FK
        uuid trainerId FK
        int hallId FK
        date date
        time startTime
        time endTime
        int maxCapacity
        int currentBookings
        string status
        text cancellationReason
        uuid cancelledBy FK
        timestamp cancelledAt
        uuid createdBy FK
        timestamp createdAt
    }
    
    Booking {
        uuid id PK
        uuid scheduleId FK
        uuid clientId FK
        uuid membershipId FK
        timestamp bookingTime
        string status
        timestamp cancelledAt
        uuid cancelledBy FK
        string qrCode
        timestamp qrCodeGenerated
        boolean qrCodeScanned
        timestamp qrCodeScannedAt
        boolean checkedIn
        timestamp checkedInAt
    }
    
    AttendanceLog {
        bigint id PK
        uuid bookingId FK
        uuid trainerId FK
        timestamp markedAt
    }
    
    BookingHistory {
        bigint id PK
        uuid bookingId FK
        string status
    }
    
    Message {
        bigint id PK
        uuid senderId FK
        uuid receiverId FK
        text content
        boolean isRead
        boolean edited
        timestamp createdAt
    }
    
    Notification {
        uuid id PK
        uuid userId FK
        string type
        string title
        text message
        text data
        boolean isRead
        timestamp createdAt
    }
    
    TrainingInfo {
        int id PK
        string title
        text content
        string category
        text videoUrl
        text imageUrl
        int order
        boolean isActive
        timestamp createdAt
        timestamp updatedAt
    }
    
    Payment {
        uuid id PK
        uuid userId FK
        decimal amount
        string currency
        string status
        string provider
        string providerPaymentId
        text description
        text metadata
        timestamp createdAt
        timestamp updatedAt
    }
```

## Основные таблицы и их назначение

### 🧑‍💼 **User** - Пользователи системы
- **Роли**: `admin`, `trainer`, `client`
- **Связи**: Все основные сущности связаны с пользователями

### 👨‍🏫 **Trainer** - Тренеры
- Расширяет User дополнительной информацией
- Специализация, опыт, достижения, медиа-контент
- Публичная страница с кастомизацией

### 💃 **DanceStyle** - Стили танцев
- Название, описание, сложность
- Медиа-контент (видео, изображения)
- Преимущества, калории, длительность

### 🏠 **Hall** - Залы
- Вместимость, описание
- Связаны с расписанием

### 🎫 **MembershipType** - Типы абонементов
- Цена, количество визитов, длительность
- Неограниченные/ограниченные абонементы

### 💳 **Membership** - Абонементы клиентов
- Привязка к клиенту и типу абонемента
- Статус, оставшиеся визиты, даты паузы

### 📅 **Schedule** - Расписание занятий
- Тренер, стиль, зал, время, вместимость
- Статусы, отмена, создание

### 📝 **Booking** - Записи на занятия
- Клиент, занятие, абонемент
- QR-коды, посещаемость, история

### 📊 **AttendanceLog** - Журнал посещаемости
- Кто и когда отметил посещение

### 📜 **BookingHistory** - История изменений статусов записей

### 💬 **Message** - Сообщения чата
- Отправитель, получатель, контент
- Статус прочтения, редактирование

### 🔔 **Notification** - Уведомления
- Типы: отмена, напоминания и т.д.
- JSON с дополнительными данными

### 📚 **TrainingInfo** - Информация о подготовке
- Категории: подготовка, что взять, правила
- Медиа-контент

### 💰 **Payment** - Платежи
- Интеграция с платежными системами
- Статусы, метаданные

## Как посмотреть схему в pgAdmin

### 1. Подключение к базе данных

**Для локальной БД:**
```
Host: localhost
Port: 5432
Database: dance_studio
Username: postgres
Password: (из .env файла)
```

**Для Docker БД:**
```
Host: localhost
Port: 5432 (тот же порт пробрасывается)
Database: dance_studio
Username: postgres
Password: (из .env файла)
```

### 2. В pgAdmin:

1. **Откройте pgAdmin**
2. **Подключитесь к серверу** с указанными выше данными
3. **Разверните базу данных** `dance_studio`
4. **Перейдите в Schemas → public → Tables**
5. **Правый клик на таблице** → **Properties** для просмотра структуры
6. **Для просмотра связей**: вкладка **Constraints**

### 3. ER-диаграмма в pgAdmin:

1. **Выберите базу данных**
2. **Tools → ERD Tool** (или нажмите Ctrl+E)
3. **Выберите таблицы** для визуализации
4. **Получите интерактивную ER-диаграмму**

## Сравнение локальной и Docker БД

**Схемы идентичны** потому что:
- Обе используют один и тот же `schema.prisma` файл
- Prisma миграции применяются одинаково
- Docker просто пробрасывает порт 5432

**Различия могут быть в данных:**
- Локальная БД может содержать тестовые данные
- Docker БД может быть пустой при первом запуске
- Для синхронизации используйте `prisma db seed`

## Полезные команды

```bash
# Сгенерировать Prisma клиент
npx prisma generate

# Применить миграции
npx prisma migrate dev

# Посмотреть текущую схему
npx prisma db pull

# Заполнить БД тестовыми данными
npx prisma db seed

# Сбросить и пересоздать БД
npx prisma migrate reset
```

## Индексы для производительности

В схеме уже определены важные индексы:
- `messages`: [senderId, receiverId], [createdAt]
- `notifications`: [userId, isRead], [createdAt]

Они обеспечивают быструю загрузку чатов и уведомлений.
