import api from './api';

export const membershipService = {
  // Получить все абонементы
  getMemberships: async (params = {}) => {
    const response = await api.get('/memberships', { params });
    return response.data.memberships;
  },

  // Получить абонемент по ID
  getMembershipById: async (id) => {
    const response = await api.get(`/memberships/${id}`);
    return response.data.membership;
  },

  // Купить абонемент
  buyMembership: async (membershipTypeId, clientId = null) => {
    const data = { membershipTypeId };
    if (clientId) data.clientId = clientId;
    const response = await api.post('/memberships', data);
    return response.data.membership;
  },

  // Приостановить/активировать абонемент (только админ)
  updateMembershipStatus: async (id, status) => {
    const response = await api.put(`/memberships/${id}/pause`, { status });
    return response.data.membership;
  },

  // Обновить абонемент (только админ)
  updateMembership: async (id, data) => {
    const response = await api.put(`/memberships/${id}`, data);
    return response.data.membership;
  },

  // Получить типы абонементов
  getMembershipTypes: async () => {
    const response = await api.get('/membership-types');
    return response.data.membershipTypes;
  },

  // Создать тип абонемента (только админ)
  createMembershipType: async (data) => {
    const response = await api.post('/membership-types', data);
    return response.data.membershipType;
  },

  // Обновить тип абонемента (только админ)
  updateMembershipType: async (id, data) => {
    const response = await api.put(`/membership-types/${id}`, data);
    return response.data.membershipType;
  },

  // Удалить тип абонемента (только админ)
  deleteMembershipType: async (id) => {
    const response = await api.delete(`/membership-types/${id}`);
    return response.data;
  },
};