const axios = require('axios');
require('dotenv').config();

// Глобальная конфигурация для тестов
global.config = {
  baseURL: process.env.API_URL || 'http://localhost:5000',
  frontendURL: process.env.FRONTEND_URL || 'http://localhost:3000',
  timeout: 30000,
  testUsers: {
    admin: {
      email: 'admin@studio.com',
      password: 'admin123'
    },
    client: {
      email: 'client@test.com',
      password: 'password123'
    },
    newClient: {
      email: `test${Date.now()}@test.com`,
      password: 'test123456',
      fullName: 'Test User',
      phone: '+79991234567'
    }
  }
};

// Создаем экземпляр axios для API запросов
global.apiClient = axios.create({
  baseURL: global.config.baseURL,
  timeout: global.config.timeout,
  validateStatus: function (status) {
    return status < 500; // Разрешаем статусы меньше 500
  }
});

// Глобальные переменные для токенов
global.tokens = {
  admin: null,
  client: null
};

// Вспомогательные функции
global.helpers = {
  // Авторизация и получение токена
  async login(email, password) {
    try {
      const response = await global.apiClient.post('/api/auth/login', {
        email,
        password
      });
      
      if (response.data.token) {
        return response.data.token;
      }
      throw new Error('Токен не получен');
    } catch (error) {
      console.error('Ошибка авторизации:', error.response?.data || error.message);
      throw error;
    }
  },

  // Создание авторизованного клиента
  async createAuthenticatedClient(token) {
    return axios.create({
      baseURL: global.config.baseURL,
      timeout: global.config.timeout,
      headers: {
        'Authorization': `Bearer ${token}`
      },
      validateStatus: function (status) {
        return status < 500;
      }
    });
  },

  // Регистрация нового пользователя
  async register(userData) {
    try {
      const response = await global.apiClient.post('/api/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Ошибка регистрации:', error.response?.data || error.message);
      throw error;
    }
  },

  // Ожидание с промисами
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // Генерация случайных данных
  generateRandomEmail() {
    return `test${Date.now()}@test.com`;
  },

  generateRandomPhone() {
    return `+7${Math.floor(Math.random() * 9000000000) + 1000000000}`;
  }
};

// Хуки для Jest
beforeAll(async () => {
  console.log('🚀 Начало тестирования...');
  console.log(`📡 API URL: ${global.config.baseURL}`);
  console.log(`🌐 Frontend URL: ${global.config.frontendURL}`);
});

afterAll(async () => {
  console.log('🏁 Завершение тестирования...');
  await global.helpers.sleep(1000); // Даем время на завершение запросов
});

// Глобальные настройки для каждого теста
beforeEach(async () => {
  // Очистка или подготовка данных перед каждым тестом
});

afterEach(async () => {
  // Очистка после каждого теста
});
