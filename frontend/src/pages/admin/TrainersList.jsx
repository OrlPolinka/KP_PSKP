import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import UserProfileModal from '../../components/common/UserProfileModal';

const TrainersList = () => {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    email: '', password: '', fullName: '', phone: '', specialization: '', bio: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [profileModal, setProfileModal] = useState(null);

  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    try {
      const data = await userService.getTrainers();
      setTrainers(data);
    } catch (error) {
      console.error('Ошибка загрузки тренеров:', error);
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await userService.createTrainer(formData);
      setShowModal(false);
      setFormData({ email: '', password: '', fullName: '', phone: '', specialization: '', bio: '' });
      fetchTrainers();
      showMsg('success', 'Тренер успешно создан');
    } catch (error) {
      showMsg('error', error.response?.data?.error || 'Ошибка при создании тренера');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await userService.updateTrainer(editModal.id, editModal.data);
      setEditModal(null);
      fetchTrainers();
      showMsg('success', 'Данные тренера обновлены');
    } catch (error) {
      showMsg('error', error.response?.data?.error || 'Ошибка при обновлении');
    } finally {
      setSaving(false);
    }
  };

  const handleBlock = async (id, currentStatus) => {
    const action = currentStatus ? 'заблокировать' : 'разблокировать';
    if (!window.confirm(`Вы уверены, что хотите ${action} тренера?`)) return;
    try {
      await userService.blockUser(id, !currentStatus);
      fetchTrainers();
      showMsg('success', currentStatus ? 'Тренер заблокирован' : 'Тренер разблокирован');
    } catch (error) {
      showMsg('error', error.response?.data?.error || 'Ошибка при изменении статуса');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить тренера? Это действие необратимо.')) return;
    try {
      await userService.deleteTrainer(id);
      fetchTrainers();
      showMsg('success', 'Тренер удалён');
    } catch (error) {
      showMsg('error', error.response?.data?.error || 'Ошибка при удалении тренера');
    }
  };

  const openEdit = (trainer) => {
    setEditModal({
      id: trainer.id,
      data: {
        fullName: trainer.fullName || '',
        phone: trainer.phone || '',
        specialization: trainer.trainerInfo?.specialization || '',
        bio: trainer.trainerInfo?.bio || '',
      },
    });
  };

  const filtered = trainers.filter(t => {
    const matchSearch = !search ||
      t.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      t.email?.toLowerCase().includes(search.toLowerCase()) ||
      t.trainerInfo?.specialization?.toLowerCase().includes(search.toLowerCase());
    if (filterStatus === 'active') return matchSearch && t.isActive;
    if (filterStatus === 'blocked') return matchSearch && !t.isActive;
    return matchSearch;
  });

  const stats = {
    total: trainers.length,
    active: trainers.filter(t => t.isActive).length,
    blocked: trainers.filter(t => !t.isActive).length,
  };

  if (loading) return (
    <div className="loading">
      <div className="spinner" />
      <span>Загрузка тренеров...</span>
    </div>
  );

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Тренеры</h1>
          <p className="page-subtitle">Управление тренерским составом</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Добавить тренера
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
          <div className="stat-label">Всего тренеров</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ background: 'linear-gradient(135deg, #10B981, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {stats.active}
          </div>
          <div className="stat-label">Активных</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {stats.blocked}
          </div>
          <div className="stat-label">Заблокировано</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-input">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Поиск по имени, email, специализации..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {[
          { key: 'all', label: '👥 Все' },
          { key: 'active', label: '✅ Активные' },
          { key: 'blocked', label: '🚫 Заблокированные' },
        ].map(f => (
          <button
            key={f.key}
            className={`filter-btn ${filterStatus === f.key ? 'active' : ''}`}
            onClick={() => setFilterStatus(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Тренер</th>
                <th>Контакты</th>
                <th>Специализация</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>
                    Тренеры не найдены
                  </td>
                </tr>
              ) : filtered.map(trainer => (
                <tr key={trainer.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {(() => {
                        const localAvatar = localStorage.getItem(`avatar_${trainer.id}`);
                        return (
                          <div
                            onClick={() => setProfileModal(trainer.id)}
                            style={{
                              width: '40px', height: '40px', borderRadius: '50%',
                              background: localAvatar ? 'transparent' : 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '14px', fontWeight: '700', color: 'white', flexShrink: 0,
                              cursor: 'pointer', overflow: 'hidden',
                              border: '2px solid rgba(255,255,255,0.1)',
                            }}
                          >
                            {localAvatar
                              ? <img src={localAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : trainer.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                            }
                          </div>
                        );
                      })()}
                      <div>
                        <div
                          style={{ fontWeight: '600', color: 'white', cursor: 'pointer' }}
                          onClick={() => setProfileModal(trainer.id)}
                        >
                          {trainer.fullName}
                        </div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{trainer.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{trainer.phone || '—'}</td>
                  <td>
                    {trainer.trainerInfo?.specialization ? (
                      <span className="badge badge-purple">{trainer.trainerInfo.specialization}</span>
                    ) : '—'}
                  </td>
                  <td>
                    <span className={`badge ${trainer.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {trainer.isActive ? '🟢 Активен' : '🔴 Заблокирован'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => openEdit(trainer)}
                      >
                        ✏️ Изменить
                      </button>
                      <button
                        className={`btn btn-sm ${trainer.isActive ? 'btn-warning' : 'btn-success'}`}
                        onClick={() => handleBlock(trainer.id, trainer.isActive)}
                      >
                        {trainer.isActive ? '🚫 Блок' : '✅ Разблок'}
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(trainer.id)}
                      >
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

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Добавить тренера</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>ФИО *</label>
                  <input type="text" required value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Иванова Анна Сергеевна" />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" required value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="trainer@studio.ru" />
                </div>
                <div className="form-group">
                  <label>Пароль *</label>
                  <input type="password" required value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Минимум 6 символов" />
                </div>
                <div className="form-group">
                  <label>Телефон</label>
                  <input type="tel" value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+7 (999) 123-45-67" />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Специализация</label>
                  <input type="text" value={formData.specialization}
                    onChange={e => setFormData({ ...formData, specialization: e.target.value })}
                    placeholder="Сальса, Бачата, Хип-хоп..." />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Биография</label>
                  <textarea rows="3" value={formData.bio}
                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Расскажите о тренере..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Отмена</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? '⏳ Создание...' : '+ Создать тренера'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Редактировать тренера</h2>
              <button className="modal-close" onClick={() => setEditModal(null)}>×</button>
            </div>
            <form onSubmit={handleUpdate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>ФИО</label>
                  <input type="text" value={editModal.data.fullName}
                    onChange={e => setEditModal({ ...editModal, data: { ...editModal.data, fullName: e.target.value } })} />
                </div>
                <div className="form-group">
                  <label>Телефон</label>
                  <input type="tel" value={editModal.data.phone}
                    onChange={e => setEditModal({ ...editModal, data: { ...editModal.data, phone: e.target.value } })} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Специализация</label>
                  <input type="text" value={editModal.data.specialization}
                    onChange={e => setEditModal({ ...editModal, data: { ...editModal.data, specialization: e.target.value } })} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Биография</label>
                  <textarea rows="3" value={editModal.data.bio}
                    onChange={e => setEditModal({ ...editModal, data: { ...editModal.data, bio: e.target.value } })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setEditModal(null)}>Отмена</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? '⏳ Сохранение...' : '💾 Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {profileModal && <UserProfileModal userId={profileModal} onClose={() => setProfileModal(null)} />}
    </div>
  );
};

export default TrainersList;
