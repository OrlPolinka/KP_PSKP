import api from './api';

export const scheduleService = {
  // Получить расписание
  getSchedule: async (params = {}) => {
    const response = await api.get('/schedule', { params });
    // Бэкенд возвращает { schedule: [...] }
    return response.data.schedule || [];
  },

  // Получить занятие по ID
  getScheduleById: async (id) => {
    const response = await api.get(`/schedule/${id}`);
    return response.data.schedule;
  },

  // Создать занятие (только админ)
  createSchedule: async (data) => {
    const response = await api.post('/schedule', data);
    return response.data.schedule;
  },

  // Обновить занятие (только админ)
  updateSchedule: async (id, data) => {
    const response = await api.put(`/schedule/${id}`, data);
    return response.data.schedule;
  },

  // Удалить занятие (только админ)
  deleteSchedule: async (id) => {
    const response = await api.delete(`/schedule/${id}`);
    return response.data;
  },

  // Получить залы
  getHalls: async () => {
    const response = await api.get('/halls');
    return response.data.halls || [];
  },

  // Получить стили танцев
  getDanceStyles: async () => {
    const response = await api.get('/dance-styles');
    return response.data.danceStyles || [];
  },
};