const { describe, test, expect } = require('@jest/globals');

// Мокаем утилиты для тестирования
const authUtils = {
  validateEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  validatePassword: (password) => {
    if (!password || typeof password !== 'string') return false;
    return password.length >= 6;
  },

  validatePhone: (phone) => {
    if (!phone || typeof phone !== 'string') return false;
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
    // Дополнительная проверка на минимальную длину номера телефона
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 7;
  },

  hashPassword: async (password) => {
    // Мокаем хеширование
    return `hashed_${password}`;
  },

  comparePassword: async (password, hashedPassword) => {
    return hashedPassword === `hashed_${password}`;
  },

  generateToken: (user) => {
    return `token_${user.id}_${Date.now()}`;
  },

  verifyToken: (token) => {
    // Мокаем верификацию токена
    if (token && token.startsWith('token_')) {
      const parts = token.split('_');
      return { userId: parseInt(parts[1]), valid: true };
    }
    return { valid: false };
  }
};

describe('Unit тесты утилит авторизации', () => {
  describe('validateEmail', () => {
    test('Валидный email', () => {
      expect(authUtils.validateEmail('test@example.com')).toBe(true);
      expect(authUtils.validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(authUtils.validateEmail('user+tag@example.org')).toBe(true);
    });

    test('Невалидный email', () => {
      expect(authUtils.validateEmail('invalid-email')).toBe(false);
      expect(authUtils.validateEmail('')).toBe(false);
      expect(authUtils.validateEmail('@example.com')).toBe(false);
      expect(authUtils.validateEmail('test@')).toBe(false);
      expect(authUtils.validateEmail('test@.com')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    test('Валидный пароль', () => {
      expect(authUtils.validatePassword('password123')).toBe(true);
      expect(authUtils.validatePassword('123456')).toBe(true);
      expect(authUtils.validatePassword('abcdef')).toBe(true);
    });

    test('Невалидный пароль', () => {
      expect(authUtils.validatePassword('')).toBe(false);
      expect(authUtils.validatePassword('123')).toBe(false);
      expect(authUtils.validatePassword('abc')).toBe(false);
      expect(authUtils.validatePassword(null)).toBe(false);
      expect(authUtils.validatePassword(undefined)).toBe(false);
    });
  });

  describe('validatePhone', () => {
    test('Валидный телефон', () => {
      expect(authUtils.validatePhone('+79991234567')).toBe(true);
      expect(authUtils.validatePhone('89991234567')).toBe(true);
      expect(authUtils.validatePhone('+1234567890')).toBe(true);
      expect(authUtils.validatePhone('123-456-7890')).toBe(true);
    });

    test('Невалидный телефон', () => {
      expect(authUtils.validatePhone('')).toBe(false);
      expect(authUtils.validatePhone('123')).toBe(false);
      expect(authUtils.validatePhone('abc')).toBe(false);
      expect(authUtils.validatePhone('+')).toBe(false);
    });
  });

  describe('hashPassword', () => {
    test('Хеширование пароля', async () => {
      const password = 'testpassword';
      const hashed = await authUtils.hashPassword(password);
      
      expect(hashed).toBe('hashed_testpassword');
      expect(hashed).not.toBe(password);
    });
  });

  describe('comparePassword', () => {
    test('Сравнение верного пароля', async () => {
      const password = 'testpassword';
      const hashedPassword = 'hashed_testpassword';
      
      const isMatch = await authUtils.comparePassword(password, hashedPassword);
      expect(isMatch).toBe(true);
    });

    test('Сравнение неверного пароля', async () => {
      const password = 'wrongpassword';
      const hashedPassword = 'hashed_testpassword';
      
      const isMatch = await authUtils.comparePassword(password, hashedPassword);
      expect(isMatch).toBe(false);
    });
  });

  describe('generateToken', () => {
    test('Генерация токена', () => {
      const user = { id: 123, email: 'test@example.com' };
      const token = authUtils.generateToken(user);
      
      expect(token).toContain('token_123');
      expect(typeof token).toBe('string');
    });
  });

  describe('verifyToken', () => {
    test('Верификация валидного токена', () => {
      const token = 'token_123_1640995200000';
      const result = authUtils.verifyToken(token);
      
      expect(result.valid).toBe(true);
      expect(result.userId).toBe(123);
    });

    test('Верификация невалидного токена', () => {
      const result = authUtils.verifyToken('invalid_token');
      
      expect(result.valid).toBe(false);
    });

    test('Верификация пустого токена', () => {
      const result = authUtils.verifyToken('');
      
      expect(result.valid).toBe(false);
    });
  });
});

// Тесты для бизнес-логики пользователя
const userUtils = {
  calculateAge: (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  },

  isAdult: (birthDate) => {
    return userUtils.calculateAge(birthDate) >= 18;
  },

  formatFullName: (firstName, lastName, patronymic) => {
    const parts = [lastName, firstName, patronymic].filter(Boolean);
    return parts.join(' ');
  },

  getUserInitials: (firstName, lastName, patronymic) => {
    const initials = [];
    if (lastName) initials.push(lastName[0].toUpperCase());
    if (firstName) initials.push(firstName[0].toUpperCase());
    if (patronymic) initials.push(patronymic[0].toUpperCase());
    return initials.join('.');
  }
};

describe('Unit тесты утилит пользователя', () => {
  describe('calculateAge', () => {
    test('Расчет возраста', () => {
      const today = new Date();
      const birthDate = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());
      
      expect(userUtils.calculateAge(birthDate)).toBe(25);
    });

    test('Возраст для дня рождения сегодня', () => {
      const today = new Date();
      const birthDate = new Date(today.getFullYear() - 30, today.getMonth(), today.getDate());
      
      expect(userUtils.calculateAge(birthDate)).toBe(30);
    });

    test('Возраст для дня рождения завтра', () => {
      const today = new Date();
      const birthDate = new Date(today.getFullYear() - 30, today.getMonth(), today.getDate() + 1);
      
      expect(userUtils.calculateAge(birthDate)).toBe(29);
    });
  });

  describe('isAdult', () => {
    test('Совершеннолетний пользователь', () => {
      const today = new Date();
      const birthDate = new Date(today.getFullYear() - 20, today.getMonth(), today.getDate());
      
      expect(userUtils.isAdult(birthDate)).toBe(true);
    });

    test('Несовершеннолетний пользователь', () => {
      const today = new Date();
      const birthDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
      
      expect(userUtils.isAdult(birthDate)).toBe(false);
    });

    test('Ровно 18 лет', () => {
      const today = new Date();
      const birthDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
      
      expect(userUtils.isAdult(birthDate)).toBe(true);
    });
  });

  describe('formatFullName', () => {
    test('Полное имя с отчеством', () => {
      const fullName = userUtils.formatFullName('Иван', 'Иванов', 'Иванович');
      expect(fullName).toBe('Иванов Иван Иванович');
    });

    test('Полное имя без отчества', () => {
      const fullName = userUtils.formatFullName('Иван', 'Иванов');
      expect(fullName).toBe('Иванов Иван');
    });

    test('Только фамилия', () => {
      const fullName = userUtils.formatFullName(null, 'Иванов');
      expect(fullName).toBe('Иванов');
    });

    test('Пустые параметры', () => {
      const fullName = userUtils.formatFullName(null, null, null);
      expect(fullName).toBe('');
    });
  });

  describe('getUserInitials', () => {
    test('Инициалы с отчеством', () => {
      const initials = userUtils.getUserInitials('Иван', 'Иванов', 'Иванович');
      expect(initials).toBe('И.И.И');
    });

    test('Инициалы без отчества', () => {
      const initials = userUtils.getUserInitials('Иван', 'Иванов');
      expect(initials).toBe('И.И');
    });

    test('Только фамилия', () => {
      const initials = userUtils.getUserInitials(null, 'Иванов');
      expect(initials).toBe('И');
    });
  });
});
