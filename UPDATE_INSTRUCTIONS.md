# Инструкция по обновлению проекта

## Выполнение миграции базы данных

### Способ 1: Через Prisma (рекомендуется)

```bash
cd backend

# Генерируем новый клиент Prisma
npx prisma generate

# Применяем изменения к базе данных
npx prisma db push

# Или создаём миграцию
npx prisma migrate dev --name add_new_features
```

### Способ 2: Через SQL

Если вы используете Docker Toolbox, подключитесь к базе данных:

```bash
# Подключение к PostgreSQL в Docker
docker exec -it <postgres_container_name> psql -U postgres -d dancedb

# Выполните SQL из файла
\i /path/to/migrations.sql
```

Или выполните миграцию через pgAdmin/DBeaver.

---

## Установка новых зависимостей

```bash
cd backend
npm install qrcode --save

cd ../frontend
npm install
```

---

## Перезапуск проекта

```bash
# В корневой папке проекта
docker-compose down
docker-compose up --build
```

---

## Новые маршруты API

### Тренеры (публичные)
- `GET /api/public/trainers` — список всех тренеров
- `GET /api/public/trainers/:id` — профиль тренера
- `PUT /api/trainer/profile/:id` — обновить профиль (для тренера)

### Стили танцев
- `GET /api/dance-styles-detailed` — стили с подробной информацией
- `GET /api/dance-styles-detailed/:id` — конкретный стиль
- `PUT /api/dance-styles-detailed/:id` — обновить стиль (админ)

### Информация о подготовке
- `GET /api/training-info` — список информации
- `POST /api/training-info` — создать (админ)
- `PUT /api/training-info/:id` — обновить (админ)
- `DELETE /api/training-info/:id` — удалить (админ)

### QR-коды
- `GET /api/bookings/:bookingId/qrcode` — получить QR-код
- `POST /api/bookings/verify-qrcode` — проверить QR-код (тренер)

### Уведомления
- `GET /api/notifications` — список уведомлений
- `PUT /api/notifications/:id/read` — прочитать
- `PUT /api/notifications/read-all` — прочитать все

### Отмена занятия тренером
- `PUT /api/schedule/:id/cancel-by-trainer` — отменить занятие с уведомлениями

### Платежи
- `POST /api/payments` — создать платёж
- `POST /api/payments/webhook` — webhook от платёжной системы
- `GET /api/payments/history` — история платежей

---

## Новые страницы фронтенда

### Для клиента:
- `/trainers` — список тренеров
- `/trainers/:id` — профиль тренера
- `/dance-styles` — стили танцев
- `/training-info` — подготовка к тренировкам
- `/my-qr-codes` — QR-коды для записей

### Для тренера:
- `/trainer/profile` — редактирование профиля

### Для админа:
- `/admin/dance-styles` — управление стилями
- `/admin/training-info` — управление информацией

---

## Изменения в UI

- **Боковое меню** заменяет верхнее горизонтальное для освобождения места
- Меню адаптивно — на мобильных устройствах автоматически сворачивается
- Новые иконки и разделы для всех ролей

---

## Проверка работоспособности

1. Откройте приложение в браузере
2. Войдите как клиент
3. Проверьте новые разделы:
   - Тренеры
   - Стили танцев
   - Подготовка к тренировкам
   - QR-коды (в разделе "Мои записи")

4. Войдите как тренер
5. Проверьте редактирование профиля

6. Войдите как админ
7. Проверьте управление стилями и информацией
