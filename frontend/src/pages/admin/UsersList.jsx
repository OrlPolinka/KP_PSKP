import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import UserProfileModal from '../../components/common/UserProfileModal';

const roleConfig = {
  admin: { label: 'Администратор', badge: 'badge-warning', icon: '👑' },
  trainer: { label: 'Тренер', badge: 'badge-purple', icon: '🏋️' },
  client: { label: 'Клиент', badge: 'badge-info', icon: '🎓' },
};

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [message, setMessage] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [profileModal, setProfileModal] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setError(null);
      const data = await userService.getUsers();
      setUsers(data || []);
    } catch (error) {
      setError(error.response?.data?.error || 'Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleBlock = async (id, currentStatus) => {
    const action = currentStatus ? 'заблокировать' : 'разблокировать';
    if (!window.confirm(`Вы уверены, что хотите ${action} пользователя?`)) return;
    try {
      await userService.blockUser(id, !currentStatus);
      fetchUsers();
      showMsg('success', currentStatus ? 'Пользователь заблокирован' : 'Пользователь разблокирован');
    } catch (error) {
      showMsg('error', error.response?.data?.error || 'Ошибка при изменении статуса');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить пользователя? Это действие необратимо.')) return;
    try {
      await userService.deleteUser(id);
      fetchUsers();
      showMsg('success', 'Пользователь удалён');
    } catch (error) {
      showMsg('error', error.response?.data?.error || 'Ошибка при удалении пользователя');
    }
  };

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search);
    const matchRole = filterRole === 'all' || u.role === filterRole;
    const matchStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && u.isActive) ||
      (filterStatus === 'blocked' && !u.isActive);
    return matchSearch && matchRole && matchStatus;
  });

  const stats = {
    total: users.length,
    clients: users.filter(u => u.role === 'client').length,
    trainers: users.filter(u => u.role === 'trainer').length,
    blocked: users.filter(u => !u.isActive).length,
  };

  if (loading) return (
    <div className="loading">
      <div className="spinner" />
      <span>Загрузка пользователей...</span>
    </div>
  );

  if (error) return (
    <div className="container">
      <div className="alert alert-error">⚠️ {error}</div>
    </div>
  );

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Пользователи</h1>
          <p className="page-subtitle">Управление всеми пользователями системы</p>
        </div>
      </div>

      {message && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '20px' }}>
          {message.type === 'success' ? '✅' : '⚠️'} {message.text}
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Всего</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {stats.clients}
          </div>
          <div className="stat-label">Клиентов</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ background: 'linear-gradient(135deg, #A78BFA, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {stats.trainers}
          </div>
          <div className="stat-label">Тренеров</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {stats.blocked}
          </div>
          <div className="stat-label">Заблокировано</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar" style={{ flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '12px', width: '100%', flexWrap: 'wrap' }}>
          <div className="search-input" style={{ flex: 1, minWidth: '200px' }}>
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Поиск по имени, email, телефону..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: '👥 Все роли' },
            { key: 'client', label: '🎓 Клиенты' },
            { key: 'trainer', label: '🏋️ Тренеры' },
            { key: 'admin', label: '👑 Администраторы' },
          ].map(f => (
            <button key={f.key} className={`filter-btn ${filterRole === f.key ? 'active' : ''}`}
              onClick={() => setFilterRole(f.key)}>{f.label}</button>
          ))}
          <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
          {[
            { key: 'all', label: '🗂️ Все статусы' },
            { key: 'active', label: '✅ Активные' },
            { key: 'blocked', label: '🚫 Заблокированные' },
          ].map(f => (
            <button key={f.key} className={`filter-btn ${filterStatus === f.key ? 'active' : ''}`}
              onClick={() => setFilterStatus(f.key)}>{f.label}</button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '12px', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
        Показано: {filtered.length} из {users.length}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Пользователь</th>
                <th>Телефон</th>
                <th>Роль</th>
                <th>Статус</th>
                <th>Дата регистрации</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>
                    Пользователи не найдены
                  </td>
                </tr>
              ) : filtered.map(user => {
                const role = roleConfig[user.role] || roleConfig.client;
                return (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {(() => {
                          const localAvatar = localStorage.getItem(`avatar_${user.id}`);
                          return (
                            <div
                              onClick={() => setProfileModal(user.id)}
                              style={{
                                width: '38px', height: '38px', borderRadius: '50%',
                                background: localAvatar ? 'transparent' : (
                                  user.role === 'admin' ? 'linear-gradient(135deg, #F59E0B, #D97706)' :
                                  user.role === 'trainer' ? 'linear-gradient(135deg, #8B5CF6, #7C3AED)' :
                                  'linear-gradient(135deg, #3B82F6, #2563EB)'
                                ),
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '13px', fontWeight: '700', color: 'white', flexShrink: 0,
                                cursor: 'pointer', overflow: 'hidden',
                                border: '2px solid rgba(255,255,255,0.1)',
                              }}
                            >
                              {localAvatar
                                ? <img src={localAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : (user.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?')
                              }
                            </div>
                          );
                        })()}
                        <div>
                          <div
                            style={{ fontWeight: '600', color: 'white', cursor: 'pointer' }}
                            onClick={() => setProfileModal(user.id)}
                          >
                            {user.fullName}
                          </div>
                          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{user.phone || '—'}</td>
                    <td>
                      <span className={`badge ${role.badge}`}>
                        {role.icon} {role.label}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {user.isActive ? '🟢 Активен' : '🔴 Заблокирован'}
                      </span>
                    </td>
                    <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU') : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          className={`btn btn-sm ${user.isActive ? 'btn-warning' : 'btn-success'}`}
                          onClick={() => handleBlock(user.id, user.isActive)}
                        >
                          {user.isActive ? '🚫 Блок' : '✅ Разблок'}
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(user.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* User detail modal */}
      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Информация о пользователе</h2>
              <button className="modal-close" onClick={() => setSelectedUser(null)}>×</button>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setSelectedUser(null)}>Закрыть</button>
            </div>
          </div>
        </div>
      )}
      {profileModal && <UserProfileModal userId={profileModal} onClose={() => setProfileModal(null)} />}
    </div>
  );
};

export default UsersList;
