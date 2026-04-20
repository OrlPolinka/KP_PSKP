import React, { useState, useEffect } from 'react';
import { membershipService } from '../../services/membershipService';

const MembershipTypesManager = () => {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState(null);
  const [filterActive, setFilterActive] = useState('all');
  const [formData, setFormData] = useState({
    name: '', description: '', price: '',
    visitCount: '', durationDays: '', isActive: true,
  });

  useEffect(() => { fetchTypes(); }, []);

  const fetchTypes = async () => {
    try {
      const data = await membershipService.getMembershipTypes();
      setTypes(data || []);
    } catch (error) {
      console.error('Ошибка загрузки типов:', error);
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
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
        // Update in-place so it stays visible
        setTypes(prev => prev.map(t => t.id === editingId ? { ...t, ...data } : t));
        showMsg('success', 'Тип абонемента обновлён');
      } else {
        await membershipService.createMembershipType(data);
        fetchTypes();
        showMsg('success', 'Тип абонемента создан');
      }
      closeModal();
    } catch (error) {
      showMsg('error', error.response?.data?.error || 'Ошибка при сохранении');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить тип абонемента? Это возможно только если нет активных абонементов этого типа.')) return;
    try {
      await membershipService.deleteMembershipType(id);
      setTypes(prev => prev.filter(t => t.id !== id));
      showMsg('success', 'Тип абонемента удалён');
    } catch (error) {
      showMsg('error', error.response?.data?.error || 'Ошибка при удалении');
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
      isActive: item.isActive ?? true,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: '', description: '', price: '', visitCount: '', durationDays: '', isActive: true });
  };

  const filtered = types.filter(t => {
    if (filterActive === 'active') return t.isActive;
    if (filterActive === 'inactive') return !t.isActive;
    return true;
  });

  const stats = {
    total: types.length,
    active: types.filter(t => t.isActive).length,
    inactive: types.filter(t => !t.isActive).length,
  };

  if (loading) return (
    <div className="loading">
      <div className="spinner" />
      <span>Загрузка типов абонементов...</span>
    </div>
  );

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Типы абонементов</h1>
          <p className="page-subtitle">Управление тарифами студии</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Добавить тип
        </button>
      </div>

      {message && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '20px' }}>
          {message.type === 'success' ? '✅' : '⚠️'} {message.text}
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Всего типов</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ background: 'linear-gradient(135deg, #10B981, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {stats.active}
          </div>
          <div className="stat-label">Активных</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ background: 'linear-gradient(135deg, #6B7280, #4B5563)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {stats.inactive}
          </div>
          <div className="stat-label">Неактивных</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar" style={{ marginBottom: '20px' }}>
        {[
          { key: 'all', label: `🗂️ Все (${stats.total})` },
          { key: 'active', label: `✅ Активные (${stats.active})` },
          { key: 'inactive', label: `🚫 Неактивные (${stats.inactive})` },
        ].map(f => (
          <button
            key={f.key}
            className={`filter-btn ${filterActive === f.key ? 'active' : ''}`}
            onClick={() => setFilterActive(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Название</th>
                <th>Цена</th>
                <th>Занятий</th>
                <th>Срок (дней)</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>
                    Типы не найдены
                  </td>
                </tr>
              ) : filtered.map(type => (
                <tr key={type.id} style={{ opacity: type.isActive ? 1 : 0.6 }}>
                  <td>
                    <div style={{ fontWeight: '600', color: 'white' }}>{type.name}</div>
                    {type.description && (
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                        {type.description.slice(0, 60)}{type.description.length > 60 ? '...' : ''}
                      </div>
                    )}
                  </td>
                  <td>
                    <span style={{ fontWeight: '600', color: '#A78BFA' }}>{type.price} ₽</span>
                  </td>
                  <td>
                    {type.visitCount
                      ? <span className="badge badge-purple">{type.visitCount} занятий</span>
                      : <span className="badge badge-info">∞ Безлимит</span>
                    }
                  </td>
                  <td>
                    {type.durationDays
                      ? <span className="badge badge-info">{type.durationDays} дней</span>
                      : <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>
                    }
                  </td>
                  <td>
                    <span className={`badge ${type.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {type.isActive ? '✅ Активен' : '🚫 Неактивен'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(type)}>
                        ✏️ Изменить
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(type.id)}>
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingId ? 'Редактировать тип' : 'Добавить тип'}</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Название *</label>
                  <input type="text" required value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Абонемент на 8 занятий" />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Описание</label>
                  <textarea rows="2" value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Краткое описание..." />
                </div>
                <div className="form-group">
                  <label>Цена (₽) *</label>
                  <input type="number" required min="0" step="0.01" value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    placeholder="3600" />
                </div>
                <div className="form-group">
                  <label>Кол-во занятий</label>
                  <input type="number" min="1" value={formData.visitCount}
                    onChange={e => setFormData({ ...formData, visitCount: e.target.value })}
                    placeholder="Пусто = безлимит" />
                </div>
                <div className="form-group">
                  <label>Срок действия (дней)</label>
                  <input type="number" min="1" value={formData.durationDays}
                    onChange={e => setFormData({ ...formData, durationDays: e.target.value })}
                    placeholder="Пусто = бессрочно" />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '24px' }}>
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="isActive" style={{ cursor: 'pointer', textTransform: 'none', letterSpacing: 0, fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
                    Активен для продажи
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Отмена</button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? '💾 Сохранить' : '+ Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembershipTypesManager;
