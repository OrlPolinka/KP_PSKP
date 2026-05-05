# Инструкция по подключению системы оплаты

## Обзор

В проект добавлена поддержка платёжных систем для оплаты абонементов онлайн. Рекомендуемая система — **ЮKassa** (Яндекс.Касса), как наиболее популярная и надёжная в России.

---

## 1. ЮKassa (Яндекс.Касса)

### Регистрация

1. Перейдите на https://yookassa.ru/
2. Нажмите "Подключиться"
3. Заполните заявку на подключение (ИП или Юр. лицо)
4. После проверки документов (1-3 дня) вы получите:
   - `shopId` — идентификатор магазина
   - `secretKey` — секретный ключ

### Установка SDK

```bash
cd backend
npm install yookassa
```

### Настройка переменных окружения

Добавьте в `.env`:

```env
YOOKASSA_SHOP_ID=ваш_shopId
YOOKASSA_SECRET_KEY=ваш_secretKey
```

### Пример кода для создания платежа

```javascript
// backend/src/controler/paymentController.js
const YooKassa = require('yookassa');

const yooKassa = new YooKassa({
    shopId: process.env.YOOKASSA_SHOP_ID,
    secretKey: process.env.YOOKASSA_SECRET_KEY
});

async function createPayment(req, res) {
    try {
        const { amount, membershipTypeId, description } = req.body;
        const userId = req.user.id;

        // Создаём платёж в нашей БД
        const payment = await prisma.payment.create({
            data: {
                userId,
                amount,
                currency: 'RUB',
                status: 'pending',
                provider: 'yookassa',
                description,
                metadata: JSON.stringify({ membershipTypeId })
            }
        });

        // Создаём платёж в ЮKassa
        const paymentData = {
            amount: {
                value: amount.toString(),
                currency: 'RUB'
            },
            confirmation: {
                type: 'redirect',
                return_url: `${process.env.FRONTEND_URL}/payment/success`
            },
            capture: true,
            description: description || 'Оплата абонемента',
            metadata: {
                paymentId: payment.id,
                userId
            }
        };

        const yooPayment = await yooKassa.createPayment(paymentData);

        // Сохраняем ID платежа из ЮKassa
        await prisma.payment.update({
            where: { id: payment.id },
            data: { providerPaymentId: yooPayment.id }
        });

        res.json({
            success: true,
            paymentId: payment.id,
            confirmationUrl: yooPayment.confirmation.confirmation_url
        });
    } catch (error) {
        console.error('Payment error:', error);
        res.status(500).json({ error: 'Ошибка при создании платежа' });
    }
}
```

### Обработка webhook от ЮKassa

```javascript
// backend/src/controler/paymentController.js
async function handleWebhook(req, res) {
    try {
        const event = req.body;
        
        // Проверяем подпись (важно для безопасности!)
        // ... код проверки подписи ...

        if (event.type === 'notification' && event.event === 'payment.succeeded') {
            const payment = await prisma.payment.findFirst({
                where: { providerPaymentId: event.object.id }
            });

            if (payment) {
                // Обновляем статус платежа
                await prisma.payment.update({
                    where: { id: payment.id },
                    data: { status: 'succeeded' }
                });

                // Создаём абонемент
                const metadata = JSON.parse(payment.metadata || '{}');
                if (metadata.membershipTypeId) {
                    // ... создаём абонемент ...
                }
            }
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(400).send('Error');
    }
}
```

---

## 2. Tinkoff Acquiring

Альтернатива ЮKassa с более простым подключением для ИП.

### Регистрация

1. Перейдите на https://www.tinkoff.ru/business/acquiring/
2. Оставьте заявку на подключение
3. После активации получите:
   - `TerminalKey`
   - `SecretKey`

### Установка

```bash
npm install tinkoff-acquiring
```

### Пример кода

```javascript
const TinkoffAcquiring = require('tinkoff-acquiring').default;

const tinkoff = new TinkoffAcquiring(
    process.env.TINKOFF_TERMINAL_KEY,
    process.env.TINKOFF_SECRET_KEY
);

async function createPayment(req, res) {
    const { amount, description } = req.body;
    
    const result = await tinkoff.init({
        Amount: amount * 100, // в копейках
        OrderId: orderId,
        Description: description
    });
    
    res.json({ paymentUrl: result.PaymentURL });
}
```

---

## 3. СБП (Система быстрых платежей)

Можно подключить через ЮKassa или Tinkoff — все они поддерживают СБП.

Преимущества:
- Мгновенные переводы
- Низкая комиссия (0.4-0.7%)
- Популярность у клиентов

---

## 4. Тестирование

### ЮKassa тестовый режим

Используйте тестовый магазин:
- `shopId: 123456`
- `secretKey: test_XXXXXXXX`

Тестовые карты:
- Успешная оплата: `5555 5555 5555 4477`
- Отклонение: `5555 5555 5555 4444`
- CVV: `123`
- Дата: любая будущая

### Tinkoff тестовый режим

В настройках терминала включите "Тестовый режим".

---

## 5. Безопасность

1. **Никогда не храните секретные ключи в коде**
2. **Всегда проверяйте подпись webhook-ов**
3. **Используйте HTTPS**
4. **Логируйте все платежные операции**
5. **Не показывайте ошибки платёжной системы клиенту**

---

## 6. Комиссии (приблизительные)

| Платёжная система | Комиссия |
|-------------------|----------|
| ЮKassa            | 2.8-3.5% |
| Tinkoff           | 1.5-2.5% |
| СБП               | 0.4-0.7% |

---

## 7. Фронтенд

На фронтенде нужно создать страницу оплаты:

```jsx
// frontend/src/pages/client/Payment.jsx
import React, { useState } from 'react';
import api from '../../services/api';

const Payment = ({ membershipType }) => {
    const handlePayment = async () => {
        const response = await api.post('/payments', {
            amount: membershipType.price,
            membershipTypeId: membershipType.id,
            description: `Оплата: ${membershipType.name}`
        });
        
        // Перенаправляем на страницу оплаты
        window.location.href = response.data.confirmationUrl;
    };
    
    return (
        <button onClick={handlePayment}>
            Оплатить {membershipType.price} ₽
        </button>
    );
};
```

---

## 8. Страница успеха

После успешной оплаты создайте страницу `/payment/success`:

```jsx
const PaymentSuccess = () => (
    <div className="payment-success">
        <h1>✅ Оплата прошла успешно!</h1>
        <p>Ваш абонемент активирован</p>
        <Link to="/my-memberships">Мои абонементы</Link>
    </div>
);
```

---

## Что уже реализовано в проекте

1. ✅ Таблица `payments` в базе данных
2. ✅ API endpoints:
   - `POST /api/payments` — создание платежа
   - `POST /api/payments/webhook` — обработка webhook
   - `GET /api/payments/history` — история платежей
3. ✅ Модель Payment в Prisma schema

### Что нужно добавить:

1. Установить SDK выбранной платёжной системы
2. Добавить реальные ключи в `.env`
3. Реализовать проверку подписи webhook
4. Создать UI для оплаты на фронтенде
