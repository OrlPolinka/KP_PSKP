import React, { useState, useEffect } from 'react';
import { membershipService } from '../../services/membershipService';

const MembershipTypesManager = () => {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    visitCount: '',
    durationDays: '',
    isActive: true,
  });

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    try {
      const data = await membershipService.getMembershipTypes();
      setTypes(data);
    } catch (error) {
      console.error('Ошибка загрузки типов:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        price: parseFloat(formData.price),
        visitCount: formData.visitCount ? parseInt(formData.visitCount) : null,
        durationDays: formData.durationDays ? parseInt(formData.durationDays) : null,
      };
      if (editingId) {
        await membershipService.updateMembershipType(editingId, data);
      } else {
        await membershipService.createMembershipType(data);
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({ name: '', description: '', price: '', visitCount: '', durationDays: '', isActive: true });
      fetchTypes();
      alert(editingId ? 'Тип обновлен' : 'Тип создан');
    } catch (error) {
      alert(error.response?.data?.error || 'Ошибка при сохранении');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить тип абонемента?')) {
      try {
        await membershipService.deleteMembershipType(id);
        fetchTypes();
      } catch (error) {
        alert('Ошибка при удалении');
      }
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price,
      visitCount: item.visitCount || '',
      durationDays: item.durationDays || '',
      isActive: item.isActive,
    });
    setShowModal(true);
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Типы абонементов</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Добавить тип
        </button>
      </div>

      <div className="card">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ddd', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>Название</th>
              <th style={{ padding: '12px' }}>Цена</th>
              <th style={{ padding: '12px' }}>Занятий</th>
              <th style={{ padding: '12px' }}>Срок (дней)</th>
              <th style={{ padding: '12px' }}>Статус</th>
              <th style={{ padding: '12px' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {types.map((type) => (
              <tr key={type.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px' }}>{type.name}</td>
                <td style={{ padding: '12px' }}>{type.price} ₽</td>
                <td style={{ padding: '12px' }}>{type.visitCount || 'Безлимит'}</td>
                <td style={{ padding: '12px' }}>{type.durationDays || '—'}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ color: type.isActive ? '#28a745' : '#dc3545' }}>
                    {type.isActive ? 'Активен' : 'Неактивен'}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <button
                    className="btn btn-primary"
                    style={{ marginRight: '10px' }}
                    onClick={() => handleEdit(type)}
                  >
                    Изменить
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(type.id)}
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}>
          <div className="card" style={{ maxWidth: '500px', width: '90%' }}>
            <h3>{editingId ? 'Редактировать тип' : 'Добавить тип'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Название</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Описание</label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Цена (₽)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Количество занятий (оставьте пустым для безлимита)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.visitCount}
                  onChange={(e) => setFormData({ ...formData, visitCount: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Срок действия (дней, оставьте пустым для бессрочного)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.durationDays}
                  onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  Активен для продажи
                </label>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                }}>Отмена</button>
                <button type="submit" className="btn btn-primary">Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembershipTypesManager;