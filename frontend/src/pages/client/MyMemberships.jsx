import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const MyMemberships = () => {
  const [memberships, setMemberships] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [membershipsRes, typesRes] = await Promise.all([
        api.get('/memberships'),
        api.get('/membership-types')
      ]);
      setMemberships(membershipsRes.data.memberships);
      setTypes(typesRes.data.membershipTypes);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (typeId) => {
    try {
      await api.post('/memberships', { membershipTypeId: typeId });
      fetchData();
      alert('Абонемент успешно приобретен!');
    } catch (error) {
      alert(error.response?.data?.error || 'Ошибка при покупке');
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="container">
      <h2>Мои абонементы</h2>
      {memberships.length === 0 ? (
        <p>У вас нет абонементов</p>
      ) : (
        memberships.map((membership) => (
          <div key={membership.id} className="card">
            <h3>{membership.membershipType.name}</h3>
            <p><strong>Осталось занятий:</strong> {
              membership.remainingVisits === null ? 'Безлимит' : membership.remainingVisits
            }</p>
            <p><strong>Статус:</strong> {
              membership.status === 'active' ? 'Активен' :
              membership.status === 'paused' ? 'Приостановлен' :
              membership.status === 'expired' ? 'Просрочен' : 'Отменен'
            }</p>
            <p><strong>Действует до:</strong> {membership.endDate ? new Date(membership.endDate).toLocaleDateString() : 'Бессрочно'}</p>
          </div>
        ))
      )}

      <h2 style={{ marginTop: '30px' }}>Доступные абонементы</h2>
      <div className="schedule-grid">
        {types.map((type) => (
          <div key={type.id} className="card">
            <h3>{type.name}</h3>
            <p>{type.description}</p>
            <p><strong>Цена:</strong> {type.price} ₽</p>
            <button className="btn btn-success" onClick={() => handleBuy(type.id)}>
              Купить
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyMemberships;