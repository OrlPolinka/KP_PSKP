const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class PaymentController {
  // Создание платежной сессии Stripe
  static async createPaymentSession(req, res) {
    try {
      const { membershipId, amount } = req.body;
      const { id: userId } = req.user;

      // Проверяем существование абонемента
      const membershipType = await prisma.membershipType.findUnique({
        where: { id: membershipId }
      });

      if (!membershipType) {
        return res.status(404).json({ error: 'Абонемент не найден' });
      }

      // Создаем платежную сессию Stripe
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [{
          price_data: {
            currency: 'rub',
            product_data: {
              name: membershipType.name,
              description: `Абонемент: ${membershipType.name}`,
            },
            unit_amount: Math.round(amount * 100), // Stripe работает в копейках
          },
          quantity: 1,
        }],
        success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
        metadata: {
          userId,
          membershipId,
        },
      });

      // Сохраняем информацию о платеже в базе
      const payment = await prisma.payment.create({
        data: {
          userId,
          amount,
          currency: 'RUB',
          status: 'pending',
          provider: 'stripe',
          providerPaymentId: session.id,
          description: `Покупка абонемента: ${membershipType.name}`,
          metadata: JSON.stringify({
            membershipId,
            sessionId: session.id
          }),
        },
      });

      res.json({
        success: true,
        sessionId: session.id,
        paymentId: payment.id,
        url: session.url,
      });
    } catch (error) {
      console.error('Create payment session error:', error);
      res.status(500).json({ error: 'Ошибка создания платежной сессии' });
    }
  }

  // Вебхук для подтверждения платежа
  static async confirmPayment(req, res) {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Обрабатываем событие успешного платежа
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      try {
        // Обновляем статус платежа
        await prisma.payment.update({
          where: { providerPaymentId: session.id },
          data: {
            status: 'succeeded',
            updatedAt: new Date(),
          },
        });

        // Создаем абонемент
        const metadata = JSON.parse(session.metadata);
        const membershipType = await prisma.membershipType.findUnique({
          where: { id: metadata.membershipId }
        });

        if (membershipType) {
          await prisma.membership.create({
            data: {
              clientId: metadata.userId,
              membershipTypeId: metadata.membershipId,
              startDate: new Date(),
              endDate: membershipType.durationDays 
                ? new Date(Date.now() + membershipType.durationDays * 24 * 60 * 60 * 1000)
                : null,
              status: 'active',
            },
          });
        }
      } catch (error) {
        console.error('Error processing successful payment:', error);
      }
    }

    // Обрабатываем отмену платежа
    if (event.type === 'checkout.session.expired') {
      const session = event.data.object;
      
      await prisma.payment.update({
        where: { providerPaymentId: session.id },
        data: {
          status: 'failed',
          updatedAt: new Date(),
        },
      });
    }

    res.json({ received: true });
  }

  // Получение истории платежей пользователя
  static async getPaymentHistory(req, res) {
    try {
      const { id: userId } = req.user;
      const { page = 1, limit = 10 } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
        prisma.payment.count({ where: { userId } }),
      ]);

      res.json({
        success: true,
        payments,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error('Get payment history error:', error);
      res.status(500).json({ error: 'Ошибка получения истории платежей' });
    }
  }

  // Получение статуса платежа
  static async getPaymentStatus(req, res) {
    try {
      const { paymentId } = req.params;
      const { id: userId } = req.user;

      const payment = await prisma.payment.findFirst({
        where: {
          id: paymentId,
          userId,
        },
      });

      if (!payment) {
        return res.status(404).json({ error: 'Платеж не найден' });
      }

      res.json({
        success: true,
        payment,
      });
    } catch (error) {
      console.error('Get payment status error:', error);
      res.status(500).json({ error: 'Ошибка получения статуса платежа' });
    }
  }
}

module.exports = PaymentController;
