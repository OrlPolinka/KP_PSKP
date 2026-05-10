const { describe, test, expect } = require('@jest/globals');

// Утилиты для работы с расписанием
const scheduleUtils = {
  // Проверка доступности времени
  isTimeSlotAvailable: (existingClasses, newClass) => {
    return !existingClasses.some(existing => {
      return existing.date === newClass.date &&
             existing.hallId === newClass.hallId &&
             scheduleUtils.isTimeOverlap(existing.time, existing.duration, newClass.time, newClass.duration);
    });
  },

  // Проверка пересечения времени
  isTimeOverlap: (time1, duration1, time2, duration2) => {
    const start1 = scheduleUtils.timeToMinutes(time1);
    const end1 = start1 + duration1;
    const start2 = scheduleUtils.timeToMinutes(time2);
    const end2 = start2 + duration2;

    return (start1 < end2) && (start2 < end1);
  },

  // Конвертация времени в минуты
  timeToMinutes: (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  },

  // Конвертация минут во время
  minutesToTime: (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  },

  // Расчет конца занятия
  getClassEndTime: (startTime, duration) => {
    const startMinutes = scheduleUtils.timeToMinutes(startTime);
    const endMinutes = startMinutes + duration;
    return scheduleUtils.minutesToTime(endMinutes);
  },

  // Проверка доступности мест
  isClassFull: (classItem) => {
    return classItem.bookedParticipants >= classItem.maxParticipants;
  },

  // Получение доступных мест
  getAvailableSlots: (classItem) => {
    return classItem.maxParticipants - classItem.bookedParticipants;
  },

  // Форматирование даты
  formatDate: (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('ru-RU');
  },

  // Проверка, что занятие в будущем
  isFutureClass: (classDate, classTime) => {
    const classDateTime = new Date(`${classDate}T${classTime}`);
    return classDateTime > new Date();
  },

  // Расчет цены со скидкой
  calculateDiscountPrice: (price, discount) => {
    return price * (1 - discount / 100);
  },

  // Валидация времени
  isValidTime: (time) => {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }
};

describe('Unit тесты утилит расписания', () => {
  describe('isTimeSlotAvailable', () => {
    test('Доступный временной слот', () => {
      const existingClasses = [
        { date: '2024-01-15', hallId: 1, time: '10:00', duration: 60 }
      ];
      
      const newClass = {
        date: '2024-01-15',
        hallId: 1,
        time: '12:00',
        duration: 60
      };

      expect(scheduleUtils.isTimeSlotAvailable(existingClasses, newClass)).toBe(true);
    });

    test('Недоступный временной слот (пересечение)', () => {
      const existingClasses = [
        { date: '2024-01-15', hallId: 1, time: '10:00', duration: 60 }
      ];
      
      const newClass = {
        date: '2024-01-15',
        hallId: 1,
        time: '10:30',
        duration: 60
      };

      expect(scheduleUtils.isTimeSlotAvailable(existingClasses, newClass)).toBe(false);
    });

    test('Разные залы - доступно', () => {
      const existingClasses = [
        { date: '2024-01-15', hallId: 1, time: '10:00', duration: 60 }
      ];
      
      const newClass = {
        date: '2024-01-15',
        hallId: 2,
        time: '10:00',
        duration: 60
      };

      expect(scheduleUtils.isTimeSlotAvailable(existingClasses, newClass)).toBe(true);
    });

    test('Разные даты - доступно', () => {
      const existingClasses = [
        { date: '2024-01-15', hallId: 1, time: '10:00', duration: 60 }
      ];
      
      const newClass = {
        date: '2024-01-16',
        hallId: 1,
        time: '10:00',
        duration: 60
      };

      expect(scheduleUtils.isTimeSlotAvailable(existingClasses, newClass)).toBe(true);
    });
  });

  describe('isTimeOverlap', () => {
    test('Полное пересечение', () => {
      expect(scheduleUtils.isTimeOverlap('10:00', 60, '10:30', 60)).toBe(true);
    });

    test('Частичное пересечение (начало)', () => {
      expect(scheduleUtils.isTimeOverlap('10:00', 60, '09:30', 60)).toBe(true);
    });

    test('Частичное пересечение (конец)', () => {
      expect(scheduleUtils.isTimeOverlap('10:00', 60, '10:30', 30)).toBe(true);
    });

    test('Без пересечения', () => {
      expect(scheduleUtils.isTimeOverlap('10:00', 60, '12:00', 60)).toBe(false);
    });

    test('Соседние занятия (граница)', () => {
      expect(scheduleUtils.isTimeOverlap('10:00', 60, '11:00', 60)).toBe(false);
    });
  });

  describe('timeToMinutes', () => {
    test('Конвертация времени в минуты', () => {
      expect(scheduleUtils.timeToMinutes('10:30')).toBe(630);
      expect(scheduleUtils.timeToMinutes('00:00')).toBe(0);
      expect(scheduleUtils.timeToMinutes('23:59')).toBe(1439);
    });
  });

  describe('minutesToTime', () => {
    test('Конвертация минут во время', () => {
      expect(scheduleUtils.minutesToTime(630)).toBe('10:30');
      expect(scheduleUtils.minutesToTime(0)).toBe('00:00');
      expect(scheduleUtils.minutesToTime(1439)).toBe('23:59');
    });
  });

  describe('getClassEndTime', () => {
    test('Расчет конца занятия', () => {
      expect(scheduleUtils.getClassEndTime('10:00', 60)).toBe('11:00');
      expect(scheduleUtils.getClassEndTime('09:30', 90)).toBe('11:00');
      expect(scheduleUtils.getClassEndTime('23:00', 30)).toBe('23:30');
    });
  });

  describe('isClassFull', () => {
    test('Занятие заполнено', () => {
      const classItem = {
        maxParticipants: 20,
        bookedParticipants: 20
      };
      expect(scheduleUtils.isClassFull(classItem)).toBe(true);
    });

    test('Занятие не заполнено', () => {
      const classItem = {
        maxParticipants: 20,
        bookedParticipants: 15
      };
      expect(scheduleUtils.isClassFull(classItem)).toBe(false);
    });

    test('Переполнено (некорректное состояние)', () => {
      const classItem = {
        maxParticipants: 20,
        bookedParticipants: 25
      };
      expect(scheduleUtils.isClassFull(classItem)).toBe(true);
    });
  });

  describe('getAvailableSlots', () => {
    test('Доступные места', () => {
      const classItem = {
        maxParticipants: 20,
        bookedParticipants: 15
      };
      expect(scheduleUtils.getAvailableSlots(classItem)).toBe(5);
    });

    test('Нет доступных мест', () => {
      const classItem = {
        maxParticipants: 20,
        bookedParticipants: 20
      };
      expect(scheduleUtils.getAvailableSlots(classItem)).toBe(0);
    });

    test('Все места свободны', () => {
      const classItem = {
        maxParticipants: 20,
        bookedParticipants: 0
      };
      expect(scheduleUtils.getAvailableSlots(classItem)).toBe(20);
    });
  });

  describe('isFutureClass', () => {
    test('Занятие в будущем', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const dateStr = futureDate.toISOString().split('T')[0];
      
      expect(scheduleUtils.isFutureClass(dateStr, '10:00')).toBe(true);
    });

    test('Занятие в прошлом', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const dateStr = pastDate.toISOString().split('T')[0];
      
      expect(scheduleUtils.isFutureClass(dateStr, '10:00')).toBe(false);
    });
  });

  describe('calculateDiscountPrice', () => {
    test('Расчет цены со скидкой', () => {
      expect(scheduleUtils.calculateDiscountPrice(1000, 10)).toBe(900);
      expect(scheduleUtils.calculateDiscountPrice(2000, 25)).toBe(1500);
      expect(scheduleUtils.calculateDiscountPrice(1500, 0)).toBe(1500);
    });

    test('Полная скидка', () => {
      expect(scheduleUtils.calculateDiscountPrice(1000, 100)).toBe(0);
    });
  });

  describe('isValidTime', () => {
    test('Валидное время', () => {
      expect(scheduleUtils.isValidTime('10:00')).toBe(true);
      expect(scheduleUtils.isValidTime('00:00')).toBe(true);
      expect(scheduleUtils.isValidTime('23:59')).toBe(true);
      expect(scheduleUtils.isValidTime('9:05')).toBe(true);
    });

    test('Невалидное время', () => {
      expect(scheduleUtils.isValidTime('24:00')).toBe(false);
      expect(scheduleUtils.isValidTime('23:60')).toBe(false);
      expect(scheduleUtils.isValidTime('25:00')).toBe(false);
      expect(scheduleUtils.isValidTime('10:61')).toBe(false);
      expect(scheduleUtils.isValidTime('10:5')).toBe(false);
      expect(scheduleUtils.isValidTime('1000')).toBe(false);
      expect(scheduleUtils.isValidTime('')).toBe(false);
    });
  });
});

// Тесты для бизнес-логики бронирования
const bookingUtils = {
  // Проверка возможности отмены бронирования
  canCancelBooking: (booking, classItem) => {
    const classDateTime = new Date(`${classItem.date}T${classItem.time}`);
    const now = new Date();
    const hoursDiff = (classDateTime - now) / (1000 * 60 * 60);
    
    return hoursDiff >= 2; // Можно отменить за 2 часа
  },

  // Расчет стоимости бронирования
  calculateBookingCost: (classItem, discount = 0) => {
    return scheduleUtils.calculateDiscountPrice(classItem.price, discount);
  },

  // Проверка статуса бронирования
  getBookingStatus: (booking) => {
    if (booking.cancelledAt) return 'cancelled';
    if (booking.completedAt) return 'completed';
    return 'active';
  },

  // Расчет возврата при отмене
  calculateRefund: (booking, classItem) => {
    const classDateTime = new Date(`${classItem.date}T${classItem.time}`);
    const now = new Date();
    const hoursDiff = (classDateTime - now) / (1000 * 60 * 60);
    
    if (hoursDiff >= 24) {
      return booking.cost; // Полный возврат
    } else if (hoursDiff >= 2) {
      return booking.cost * 0.5; // 50% возврат
    } else {
      return 0; // Без возврата
    }
  }
};

describe('Unit тесты утилит бронирования', () => {
  describe('canCancelBooking', () => {
    test('Можно отменить (более 2 часов)', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      
      const booking = { id: 1 };
      const classItem = {
        date: futureDate.toISOString().split('T')[0],
        time: '10:00'
      };
      
      expect(bookingUtils.canCancelBooking(booking, classItem)).toBe(true);
    });

    test('Нельзя отменить (менее 2 часов)', () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);
      
      const booking = { id: 1 };
      const classItem = {
        date: futureDate.toISOString().split('T')[0],
        time: futureDate.toTimeString().slice(0, 5)
      };
      
      expect(bookingUtils.canCancelBooking(booking, classItem)).toBe(false);
    });
  });

  describe('calculateBookingCost', () => {
    test('Расчет стоимости без скидки', () => {
      const classItem = { price: 1500 };
      expect(bookingUtils.calculateBookingCost(classItem)).toBe(1500);
    });

    test('Расчет стоимости со скидкой', () => {
      const classItem = { price: 1500 };
      expect(bookingUtils.calculateBookingCost(classItem, 20)).toBe(1200);
    });
  });

  describe('getBookingStatus', () => {
    test('Активное бронирование', () => {
      const booking = { id: 1 };
      expect(bookingUtils.getBookingStatus(booking)).toBe('active');
    });

    test('Отмененное бронирование', () => {
      const booking = { id: 1, cancelledAt: new Date() };
      expect(bookingUtils.getBookingStatus(booking)).toBe('cancelled');
    });

    test('Завершенное бронирование', () => {
      const booking = { id: 1, completedAt: new Date() };
      expect(bookingUtils.getBookingStatus(booking)).toBe('completed');
    });
  });

  describe('calculateRefund', () => {
    test('Полный возврат (более 24 часов)', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);
      
      const booking = { cost: 1500 };
      const classItem = {
        date: futureDate.toISOString().split('T')[0],
        time: '10:00'
      };
      
      expect(bookingUtils.calculateRefund(booking, classItem)).toBe(1500);
    });

    test('Частичный возврат (2-24 часа)', () => {
      const booking = { cost: 1500 };
      
      // Создаем дату на 12 часов вперед для гарантированного частичного возврата
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 12);
      
      const classItem = {
        date: futureDate.toISOString().split('T')[0],
        time: futureDate.toTimeString().slice(0, 5)
      };
      
      const refund = bookingUtils.calculateRefund(booking, classItem);
      expect(refund).toBe(750); // 50% от 1500
    });

    test('Без возврата (менее 2 часов)', () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);
      
      const booking = { cost: 1500 };
      const classItem = {
        date: futureDate.toISOString().split('T')[0],
        time: futureDate.toTimeString().slice(0, 5)
      };
      
      expect(bookingUtils.calculateRefund(booking, classItem)).toBe(0);
    });
  });
});
