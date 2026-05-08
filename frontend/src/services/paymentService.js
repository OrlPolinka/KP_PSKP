import api from './api';

export const paymentService = {
  // Создание платежной сессии
  createPaymentSession: async (membershipTypeId, amount) => {
    const response = await api.post('/payments', {
      membershipTypeId,
      amount,
    });
    return response.data;
  },

  // Получение истории платежей
  getPaymentHistory: async (page = 1, limit = 10) => {
    const response = await api.get('/payments/history', {
      params: { page, limit }
    });
    return response.data;
  },

  // Получение статуса платежа
  getPaymentStatus: async (paymentId) => {
    const response = await api.get(`/payments/status/${paymentId}`);
    return response.data;
  },

  // Проверка тестовых карт
  getTestCards: () => [
    {
      number: '4242424242424242',
      brand: 'Visa',
      expMonth: '12',
      expYear: '2034',
      cvv: '123',
      isTest: true,
    },
    {
      number: '4000000000000002',
      brand: 'Visa',
      expMonth: '12',
      expYear: '2034',
      cvv: '123',
      isTest: true,
    },
  ],
};
