import api from './api';

export const bookingService = {
  // Получить все записи
  getBookings: async (params = {}) => {
    const response = await api.get('/bookings', { params });
    return response.data;
  },

  // Получить записи на конкретное занятие
  getBookingsBySchedule: async (scheduleId) => {
    const response = await api.get(`/bookings/schedule/${scheduleId}`);
    return response.data;
  },

  // Записаться на занятие
  createBooking: async (scheduleId, membershipId = null) => {
    const data = { scheduleId };
    if (membershipId) data.membershipId = membershipId;
    const response = await api.post('/bookings', data);
    return response.data.booking;
  },

  // Отменить запись
  cancelBooking: async (id, reason = '') => {
    const response = await api.put(`/bookings/${id}/cancel`, { reason });
    return response.data.booking;
  },

  // Отметить посещение (тренер/админ)
  markAttendance: async (id, attended, notes = '') => {
    const response = await api.put(`/bookings/${id}/attend`, { attended, notes });
    return response.data;
  },

  // Получить историю посещений
  getHistory: async (params = {}) => {
    const response = await api.get('/history', { params });
    return response.data;
  },
};