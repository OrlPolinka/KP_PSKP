# 📚 Полная документация проекта Dance Studio

## 🏗️ Общая архитектура проекта

### Стек технологий:
- **Frontend:** React 18 + JavaScript + CSS
- **Backend:** Node.js + Express + Prisma ORM
- **База данных:** PostgreSQL
- **Контейнеризация:** Docker + Docker Compose
- **Аутентификация:** JWT токены
- **Реальное время:** Socket.IO (чат)
- **Платежи:** Stripe (интеграция)

### Принципы архитектуры:
- **Монолит** с разделением на frontend/backend
- **RESTful API** для взаимодействия
- **Ролевая модель:** Client, Trainer, Admin
- **QR-коды** для системы посещаемости

---

## 📂 Структура проекта

```
dance-studio/
├── frontend/                 # React приложение
│   ├── public/               # Статические файлы
│   ├── src/
│   │   ├── components/      # Переиспользуемые компоненты
│   │   ├── context/         # React Context (AuthContext)
│   │   ├── pages/           # Страницы приложения
│   │   ├── services/        # API сервисы
│   │   ├── utils/           # Утилиты
│   │   └── App.jsx          # Главный компонент
│   ├── package.json         # Зависимости
│   └── Dockerfile           # Docker конфигурация
├── backend/                  # Node.js приложение
│   ├── src/
│   │   ├── controler/       # Контроллеры
│   │   ├── middleware/      # Middleware
│   │   ├── route/           # Маршруты API
│   │   └── prisma/          # Схема БД
│   ├── package.json         # Зависимости
│   └── Dockerfile           # Docker конфигурация
├── docker/                   # Docker конфиги
│   └── nginx-prod.conf      # Nginx конфигурация
├── docker-compose.yml        # Оркестрация контейнеров
└── tests/                    # Тесты
```

---

## 🎨 Frontend (React)

### 📁 `/frontend/src/components/`

#### **`common/` - Общие компоненты**
- **`Pagination.jsx`** - Компонент пагинации для списков
- **`CreateTrainerModal.jsx`** - Модальное окно создания тренера
- **`ScheduleCard.jsx`** - Карточка занятия в расписании

#### **`Layout/` - Компоненты макета**
- **`Navbar.jsx`** - Верхняя навигационная панель
  - Рендерит разные меню в зависимости от роли пользователя
  - Интеграция с уведомлениями чата
- **`Sidebar.jsx`** - Боковая панель навигации
  - Основная навигация для всех ролей
  - Адаптивный дизайн

### 📁 `/frontend/src/context/`

#### **`AuthContext.jsx`**
- **Назначение:** Глобальное управление аутентификацией
- **Функциональность:**
  - Хранение JWT токена в localStorage
  - Предоставление данных пользователя (`user`)
  - Функции `login`, `logout`, `register`
  - Защита маршрутов через `useAuth()`

### 📁 `/frontend/src/pages/`

#### **`client/` - Страницы клиентов**
- **`Schedule.jsx`** - Расписание занятий
  - **Основная логика:** Загрузка расписания, фильтрация, запись на занятия
  - **Ключевые функции:**
    - `fetchData()` - загрузка расписания и записей клиента
    - `handleBook()` - запись на занятие с мгновенным обновлением UI
    - `filtered` - useMemo для фильтрации с учетом `bookedScheduleIds`
  - **Проблема:** Для старых клиентов с записями `cancelled` кнопки не скрываются
- **`MyBookings.jsx`** - Мои записи
- **`MyBookingsQR.jsx`** - QR-коды записей
- **`MyMemberships.jsx`** - Мои абонементы
- **`Trainers.jsx`** - Список тренеров
- **`DanceStyles.jsx`** - Стили танцев
- **`TrainingInfo.jsx`** - Информация о подготовке

#### **`trainer/` - Страницы тренеров**
- **`TrainerSchedule.jsx`** - Расписание тренера
- **`ClassAttendance.jsx`** - Посещаемость занятий
- **`TrainerProfileEdit.jsx`** - Редактирование профиля
- **`QRScannerPage.jsx`** - Сканирование QR-кодов

#### **`admin/` - Страницы администраторов**
- **`AdminDashboard.jsx`** - Панель администратора
- **`UsersList.jsx`** - Список пользователей
- **`ScheduleManager.jsx`** - Управление расписанием
- **`MembershipTypesManager.jsx`** - Управление типами абонементов
- **`MembershipsManager.jsx`** - Управление абонементами клиентов
- **`DanceStylesManager.jsx`** - Управление стилями танцев
- **`TrainingInfoManager.jsx`** - Управление информацией о подготовке
- **`Analytics.jsx`** - Аналитика (восстановлена)

#### **`auth/` - Аутентификация**
- **`Login.jsx`** - Вход в систему
- **`Register.jsx`** - Регистрация
- **`ForgotPassword.jsx`** - Восстановление пароля

#### **`common/` - Общие страницы**
- **`Chat.jsx`** - Чат система
- **`Profile.jsx`** - Профиль пользователя
- **`NotFound.jsx`** - Страница 404

### 📁 `/frontend/src/services/`

#### **`api.js`** - Базовая конфигурация API
```javascript
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor для добавления JWT токена
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

#### **Специализированные сервисы:**
- **`membershipService.js`** - Управление абонементами
  - `getMemberships()` - получение всех абонементов
  - `buyMembership()` - покупка абонемента
  - `updateMembershipStatus()` - обновление статуса
- **`bookingService.js`** - Управление записями
  - `getBookings()` - получение записей
  - `createBooking()` - создание записи
  - `cancelBooking()` - отмена записи
- **`authService.js`** - Аутентификация
- **`chatService.js`** - Чат
- **`scheduleService.js`** - Расписание
- **`trainerService.js`** - Тренеры
- **`paymentService.js`** - Платежи

### 📁 `/frontend/src/utils/`

#### **`dateHelpers.js`** - Утилиты для работы с датами
```javascript
export const formatDate = (date) => { /* форматирование даты */ };
export const formatTime = (time) => { /* форматирование времени */ };
export const isPastDateTime = (date, time) => { /* проверка прошлое ли время */ };
export const isToday = (date) => { /* проверка сегодня ли дата */ };
```

---

## 🖥️ Backend (Node.js + Express)

### 📁 `/backend/src/controler/`

#### **`controllers.js`** - Основные контроллеры
**Аутентификация:**
- `register()` - регистрация нового пользователя
- `login()` - вход в систему
- `forgotPassword()` - восстановление пароля

**Управление пользователями:**
- `getUsers()` - получение списка пользователей
- `updateUser()` - обновление пользователя
- `deleteUser()` - удаление пользователя с очисткой связанных данных

**Записи на занятия:**
- `createBooking()` - создание записи
  - **Валидация:** проверка свободных мест, времени, дубликатов
  - **Ошибка 409:** "Вы уже записаны" или "Нет свободных мест"
- `getBookings()` - получение записей с фильтрацией
- `cancelBooking()` - отмена записи
- `markAttendance()` - отметка посещаемости

**Абонементы:**
- `createMembership()` - создание абонемента
- `getMemberships()` - получение абонементов
- `updateMembershipStatus()` - обновление статуса

**Аналитика:**
- `getPopularClasses()` - популярные занятия
- `getTrainersStats()` - статистика тренеров
- `getFinancialStats()` - финансовая статистика

#### **`newControllers.js`** - Дополнительные контроллеры
- `markAttendanceByQRCode()` - отметка по QR-коду
- `getTodayQRCodes()` - QR-коды на сегодня
- `generateBookingQRCode()` - генерация QR-кода

### 📁 `/backend/src/middleware/`

#### **`auth.js`** - Middleware аутентификации
```javascript
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

#### **`role.js`** - Проверка ролей
```javascript
module.exports = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};
```

### 📁 `/backend/src/route/`

#### **`routes.js`** - Определение всех API маршрутов
**Структура маршрута:**
```javascript
{
  method: 'get|post|put|delete',
  path: '/api/endpoint',
  action: 'controllerMethod',
  roles: ['admin', 'trainer', 'client'], // опционально
  public: true // опционально для публичных маршрутов
}
```

**Основные группы маршрутов:**
- **Аутентификация:** `/auth/*`
- **Пользователи:** `/users/*`
- **Записи:** `/bookings/*`
- **Расписание:** `/schedule/*`
- **Абонементы:** `/memberships/*`
- **Тренеры:** `/trainers/*`
- **Аналитика:** `/analytics/*`
- **QR-коды:** `/bookings/*/qrcode`

### 📁 `/backend/src/prisma/`

#### **`schema.prisma`** - Схема базы данных

**Основные модели:**
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  fullName  String
  phone     String?
  password  String
  role      Role     @default(CLIENT)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  // Связи с другими моделями
  trainer   Trainer?
  client    Client?
  bookings  Booking[]
}

model Schedule {
  id            String   @id @default(cuid())
  date          DateTime
  startTime     String
  endTime       String
  status        String   @default("scheduled")
  maxCapacity   Int
  currentBookings Int    @default(0)
  // Связи
  trainerId     String
  trainer       Trainer @relation(fields: [trainerId], references: [id])
  danceStyleId  String
  danceStyle    DanceStyle @relation(fields: [danceStyleId], references: [id])
  hallId        String
  hall          Hall @relation(fields: [hallId], references: [id])
  bookings      Booking[]
}

model Booking {
  id           String   @id @default(cuid())
  status       String   @default("booked")
  bookingTime  DateTime @default(now())
  qrCode       String   @unique
  // Связи
  clientId     String
  client       Client @relation(fields: [clientId], references: [id])
  scheduleId   String
  schedule     Schedule @relation(fields: [scheduleId], references: [id])
  membershipId String?
  membership   Membership? @relation(fields: [membershipId], references: [id])
}
```

---

## 🔄 Взаимодействие компонентов

### 🔄 **Поток данных для записи на занятие:**

1. **Frontend:** `Schedule.jsx` → `handleBook(scheduleId)`
2. **API:** `POST /api/bookings` → `bookingService.createBooking()`
3. **Backend:** `controllers.js` → `createBooking()`
4. **Валидация:** Проверка мест, времени, дубликатов
5. **База данных:** Prisma → `booking.create()`
6. **Ответ:** Успех/ошибка → Обновление UI

### 🔄 **Поток аутентификации:**

1. **Login:** `Login.jsx` → `authService.login()`
2. **API:** `POST /api/auth/login` → `controllers.login()`
3. **Валидация:** Проверка email/пароля
4. **JWT:** Генерация токена
5. **Context:** `AuthContext` → Обновление `user`
6. **Защита:** `authMiddleware` → Проверка токена

### 🔄 **Система QR-кодов:**

1. **Генерация:** `newControllers.generateBookingQRCode()`
2. **Хранение:** `booking.qrCode` в БД
3. **Отображение:** `MyBookingsQR.jsx`
4. **Сканирование:** `QRScannerPage.jsx`
5. **Отметка:** `markAttendanceByQRCode()`

---

## 🚨 Проблемы и решения

### 🐛 **Проблема: Кнопки записи не скрываются для старых клиентов**

**Причина:**
- Старые записи имеют статус `cancelled`
- Фронтенд фильтрует `b.status !== 'cancelled'`
- `Final booked IDs: []` - пустой массив
- Но в БД есть старые записи → ошибка 409 при попытке записи

**Решение:**
```javascript
// Было:
.filter(b => b.status !== 'cancelled')

// Стало: 
.filter(b => ['booked', 'attended', 'no_show'].includes(b.status))
```

**Рекомендация:** Очистить БД от старых данных или исправить статусы записей.

### 🐛 **Проблема: Страница аналитики была удалена ошибочно**

**Причина:** Я неправильно предположил отсутствие API эндпоинтов

**Решение:** Восстановлена полная функциональность:
- Frontend: `Analytics.jsx` с графиками и статистикой
- Backend: `/analytics/*` эндпоинты работают
- Интеграция с реальными данными

---

## 🔧 Конфигурация

### 🐳 **Docker:**
- **Frontend:** Node.js Alpine
- **Backend:** Node.js Alpine  
- **Database:** PostgreSQL:15
- **Proxy:** Nginx

### 🌐 **Переменные окружения:**
```env
# Backend
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
STRIPE_SECRET_KEY=sk_test_...

# Frontend  
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 📊 Бизнес-логика

### 👤 **Роли пользователей:**
- **Client:** Запись на занятия, покупка абонементов, чат
- **Trainer:** Управление расписанием, отметка посещаемости, QR-сканер
- **Admin:** Полное управление системой, аналитика, пользователи

### 💰 **Монетизация:**
- **Абонементы:** Разные типы с разной ценой и количеством визитов
- **Платежи:** Stripe интеграция
- **Ограничения:** Проверка остаточных визитов перед записью

### 📅 **Расписание:**
- **Валидация:** Нельзя записаться на прошедшие занятия
- **Емкость:** Ограничение по количеству мест
- **Статусы:** scheduled, cancelled, completed

---

## 🔮 Будущие улучшения

1. **Исправление данных:** Очистка БД от некорректных статусов
2. **Оптимизация:** Кэширование запросов к API
3. **Тестирование:** Unit тесты для критических функций
4. **UI/UX:** Улучшение мобильной версии
5. **Безопасность:** Rate limiting, CSRF защита
6. **Мониторинг:** Логирование ошибок, метрики производительности

---

## 📞 Поддержка

**Основные точки входа:**
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000/api`
- Database: `localhost:5432`

**Ключевые файлы для отладки:**
- Проблемы записей: `frontend/src/pages/client/Schedule.jsx`
- Проблемы API: `backend/src/controler/controllers.js`
- Проблемы БД: `backend/src/prisma/schema.prisma`

---

*Документация создана: 2026-05-11*
*Версия проекта: Текущая*
