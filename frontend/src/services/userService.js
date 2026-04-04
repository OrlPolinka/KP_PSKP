import api from './api';

export const userService = {
  // Получить всех пользователей (только админ)
  getUsers: async () => {
    const response = await api.get('/users');
    // Бэкенд возвращает { users: [...] }
    return response.data.users || [];
  },

  // Получить пользователя по ID
  getUserById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data.user;
  },

  // Заблокировать/разблокировать пользователя
  blockUser: async (id, isActive) => {
    const response = await api.put(`/users/${id}/block`, { isActive });
    return response.data;
  },

  // Удалить пользователя
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  // Получить всех тренеров
  getTrainers: async () => {
    const response = await api.get('/trainers');
    // Бэкенд возвращает { trainers: [...] }
    return response.data.trainers || [];
  },

  // Создать тренера
  createTrainer: async (data) => {
    const response = await api.post('/trainers', data);
    return response.data;
  },

  // Обновить тренера
  updateTrainer: async (id, data) => {
    const response = await api.put(`/trainers/${id}`, data);
    return response.data;
  },

  // Удалить тренера
  deleteTrainer: async (id) => {
    const response = await api.delete(`/trainers/${id}`);
    return response.data;
  },
};