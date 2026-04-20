import React, { useState, useEffect } from 'react';
import { membershipService } from '../../services/membershipService';

const statusConfig = {
  active: { label: 'Активен', badge: 'badge-success' },
  paused: { label: 'Приостановлен', badge: 'badge-warning' },
  expired: { label: 'Истёк', badge: 'badge-danger' },
  cancelled: { label: 'Отменён', badge: 'badge-danger' },
};
const MembershipsManager = () => {
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchMemberships();
  }, []);

  const fetchMemberships = async () => {
    try {
      const data = await membershipService.getMemberships();
      setMemberships(data || []);
    } catch (error) {
      console.error('Ошибка загрузки абонементов:', error);
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      const updated = await membershipService.updateMembershipStatus(id, newStatus);
      // Update in-place so the row stays visible regardless of current filter
      setMemberships(prev =>
        prev.map(m => m.id === id ? { ...m, status: newStatus } : m)
      );
      showMsg('success', `Статус изменён на «${statusConfig[newStatus]?.label || newStatus}»`);
    } catch (error) {
      showMsg('error', error.response?.data?.error || 'Ошибка при изменении статуса');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = memberships.filter(m => {
    const matchStatus = filterStatus === 'all' || m.status === filterStatus;
    const clientName = m.client?.fullName || '';
    const typeName = m.membershipType?.name || '';
    const matchSearch = !search ||
      clientName.toLowerCase().includes(search.toLowerCase()) ||
      typeName.toLowerCase().includes(search.toLowerCase()) ||
      m.client?.email?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const stats = {
    total: memberships.length,
    active: memberships.filter(m => m.status === 'active').length,
    paused: memberships.filter(m => m.status === 'paused').length,
    expired: memberships.filter(m => m.status === 'expired').length,
  };

  if (loading) return (
    <div className="loading">
      <div className="spinner" />
      <span>Загрузка абонементов...</span>
    </div>
  );

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Абонементы клиентов</h1>
          <p className="page-subtitle">Управление абонементами всех клиентов</p>
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
          <div className="stat-value" style={{ background: 'linear-gradient(135deg, #10B981, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {stats.active}
          </div>
          <div className="stat-label">Активных</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {stats.paused}
          </div>
          <div className="stat-label">Приостановлено</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {stats.expired}
          </div>
          <div className="stat-label">Истекших</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar" style={{ marginBottom: '20px' }}>
        <div className="search-input" style={{ flex: 1, minWidth: '200px' }}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Поиск по имени клиента, email, типу абонемента..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {[
          { key: 'all', label: `🗂️ Все (${memberships.length})` },
          { key: 'active', label: `✅ Активные (${stats.active})` },
          { key: 'paused', label: `⏸️ Приостановленные (${stats.paused})` },
          { key: 'expired', label: `⌛ Истекшие (${stats.expired})` },
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

      <div style={{ marginBottom: '12px', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
        Показано: {filtered.length} из {memberships.length}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Клиент</th>
                <th>Тип абонемента</th>
                <th>Дата покупки</th>
                <th>Действует до</th>
                <th>Осталось занятий</th>
                <th>Статус</th>
                <th>Изменить статус</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>
                    Абонементы не найдены
                  </td>
                </tr>
              ) : filtered.map(m => {
                const statusInfo = statusConfig[m.status] || statusConfig.active;
                const isUpdating = updatingId === m.id;
                return (
                  <tr key={m.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {(() => {
                          const localAvatar = localStorage.getItem(`avatar_${m.client?.id}`);
                          return (
                            <div style={{
                              width: '36px', height: '36px', borderRadius: '50%',
                              background: localAvatar ? 'transparent' : 'linear-gradient(135deg, #3B82F6, #2563EB)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '12px', fontWeight: '700', color: 'white', flexShrink: 0,
                              overflow: 'hidden',
                              border: '2px solid rgba(255,255,255,0.1)',
                            }}>
                              {localAvatar
                                ? <img src={localAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : (m.client?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?')
                              }
                            </div>
                          );
                        })()}
                        <div>
                          <div style={{ fontWeight: '600', color: 'white' }}>{m.client?.fullName || '—'}</div>
                          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{m.client?.email || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '500', color: 'white' }}>{m.membershipType?.name || '—'}</div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                        {m.pricePaid != null ? `${m.pricePaid} ₽` : ''}
                      </div>
                    </td>
                    <td style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
                      {m.purchaseDate ? new Date(m.purchaseDate).toLocaleDateString('ru-RU') : '—'}
                    </td>
                    <td style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
                      {m.endDate ? new Date(m.endDate).toLocaleDateString('ru-RU') : '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {m.remainingVisits != null
                        ? <span style={{ fontWeight: '600', color: m.remainingVisits === 0 ? '#EF4444' : '#10B981' }}>{m.remainingVisits}</span>
                        : <span style={{ color: 'rgba(255,255,255,0.4)' }}>∞</span>
                      }
                    </td>
                    <td>
                      <span className={`badge ${statusInfo.badge}`} style={{ fontSize: '11px' }}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td>
                      <select
                        value={m.status}
                        disabled={isUpdating}
                        onChange={e => handleStatusChange(m.id, e.target.value)}
                        style={{
                          background: '#1A1A2E',
                          color: 'white',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          fontSize: '13px',
                          cursor: isUpdating ? 'not-allowed' : 'pointer',
                          opacity: isUpdating ? 0.6 : 1,
                        }}
                      >
                        <option value="active" style={{ background: '#1A1A2E' }}>Активен</option>
                        <option value="paused" style={{ background: '#1A1A2E' }}>Приостановлен</option>
                        <option value="expired" style={{ background: '#1A1A2E' }}>Истёк</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MembershipsManager;
