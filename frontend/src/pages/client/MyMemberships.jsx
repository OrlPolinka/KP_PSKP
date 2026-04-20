import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const statusConfig = {
  active: { label: 'Активен', badge: 'badge-success', icon: '✅' },
  paused: { label: 'Приостановлен', badge: 'badge-warning', icon: '⏸️' },
  expired: { label: 'Истёк', badge: 'badge-danger', icon: '⏰' },
  cancelled: { label: 'Отменён', badge: 'badge-danger', icon: '❌' },
};

const MembershipCard = ({ membership, onPause }) => {
  const status = statusConfig[membership.status] || statusConfig.active;
  const endDate = membership.endDate ? new Date(membership.endDate) : null;
  const daysLeft = endDate
    ? Math.max(0, Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24)))
    : null;
  const isExpiringSoon = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;

  return (
    <div style={{
      background: membership.status === 'active'
        ? 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(236,72,153,0.05))'
        : 'rgba(255,255,255,0.03)',
      border: `1px solid ${membership.status === 'active' ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: '16px',
      padding: '24px',
      transition: 'all 0.3s ease',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'white', marginBottom: '6px' }}>
            {membership.membershipType?.name}
          </h3>
          <span className={`badge ${status.badge}`}>
            {status.icon} {status.label}
          </span>
        </div>
        {isExpiringSoon && (
          <div style={{
            background: 'rgba(245,158,11,0.15)',
            border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '12px',
            color: '#FCD34D',
            fontWeight: '600',
          }}>
            ⚠️ Истекает через {daysLeft} дн.
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', marginBottom: '16px' }}>
        <InfoItem icon="🎫" label="Осталось занятий" value={
          membership.remainingVisits === null ? '∞ Безлимит' : membership.remainingVisits
        } highlight={membership.remainingVisits !== null && membership.remainingVisits <= 3} />
        <InfoItem icon="📅" label="Начало" value={
          membership.startDate ? new Date(membership.startDate).toLocaleDateString('ru-RU') : '—'
        } />
        <InfoItem icon="⏳" label="Действует до" value={
          endDate ? endDate.toLocaleDateString('ru-RU') : 'Бессрочно'
        } />
        <InfoItem icon="💰" label="Оплачено" value={`${membership.pricePaid} ₽`} />
      </div>

      {membership.status === 'paused' && membership.pausedUntil && (
        <div className="alert alert-warning" style={{ marginBottom: '12px' }}>
          ⏸️ Приостановлен до {new Date(membership.pausedUntil).toLocaleDateString('ru-RU')}
        </div>
      )}

      {membership.membershipType?.description && (
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px', lineHeight: '1.5' }}>
          {membership.membershipType.description}
        </p>
      )}

      {membership.status === 'active' && (
        <button
          className="btn btn-warning btn-sm"
          onClick={() => onPause(membership.id, membership.status)}
        >
          ⏸️ Приостановить
        </button>
      )}
      {membership.status === 'paused' && (
        <button
          className="btn btn-success btn-sm"
          onClick={() => onPause(membership.id, membership.status)}
        >
          ▶️ Возобновить
        </button>
      )}
    </div>
  );
};

const InfoItem = ({ icon, label, value, highlight }) => (
  <div style={{
    background: 'rgba(255,255,255,0.03)',
    border: `1px solid ${highlight ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.06)'}`,
    borderRadius: '10px',
    padding: '12px',
  }}>
    <div style={{ fontSize: '16px', marginBottom: '4px' }}>{icon}</div>
    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
      {label}
    </div>
    <div style={{
      fontSize: '15px', fontWeight: '600',
      color: highlight ? '#EF4444' : 'white',
    }}>
      {value}
    </div>
  </div>
);

const BuyModal = ({ type, onClose, onBuy }) => {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [buying, setBuying] = useState(false);

  const handleBuy = async () => {
    setBuying(true);
    try {
      await onBuy(type.id, startDate);
      onClose();
    } finally {
      setBuying(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Купить абонемент</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(236,72,153,0.05))',
          border: '1px solid rgba(139,92,246,0.2)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'white', marginBottom: '8px' }}>
            {type.name}
          </h3>
          {type.description && (
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '12px' }}>
              {type.description}
            </p>
          )}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '28px', fontWeight: '800', color: '#A78BFA' }}>
              {type.price} ₽
            </span>
            {type.visitCount && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
                🎫 {type.visitCount} занятий
              </div>
            )}
            {type.durationDays && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
                📅 {type.durationDays} дней
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label>Дата начала</label>
          <input
            type="date"
            value={startDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={e => setStartDate(e.target.value)}
          />
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Отмена</button>
          <button className="btn btn-primary" onClick={handleBuy} disabled={buying}>
            {buying ? '⏳ Оформление...' : `Купить за ${type.price} ₽`}
          </button>
        </div>
      </div>
    </div>
  );
};

const MyMemberships = () => {
  const [memberships, setMemberships] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [buyModal, setBuyModal] = useState(null);
  const [activeTab, setActiveTab] = useState('my'); // 'my' | 'buy'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [membershipsRes, typesRes] = await Promise.all([
        api.get('/memberships'),
        api.get('/membership-types'),
      ]);
      setMemberships(membershipsRes.data.memberships || []);
      setTypes(typesRes.data.membershipTypes || []);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (typeId, startDate) => {
    try {
      await api.post('/memberships', { membershipTypeId: typeId, startDate });
      fetchData();
      setActiveTab('my');
      alert('Абонемент успешно приобретён!');
    } catch (error) {
      alert(error.response?.data?.error || 'Ошибка при покупке');
      throw error;
    }
  };

  const handlePause = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    const action = currentStatus === 'active' ? 'приостановить' : 'возобновить';
    if (!window.confirm(`Вы уверены, что хотите ${action} абонемент?`)) return;
    try {
      await api.put(`/memberships/${id}/pause`, { status: newStatus });
      setFilterStatus('all'); // сбрасываем фильтр чтобы абонемент не исчез
      fetchData();
      alert(newStatus === 'paused' ? 'Абонемент приостановлен' : 'Абонемент возобновлён');
    } catch (error) {
      alert(error.response?.data?.error || 'Ошибка при изменении статуса');
    }
  };

  const filteredMemberships = memberships.filter(m => {
    if (filterStatus === 'all') return true;
    return m.status === filterStatus;
  });

  const stats = {
    active: memberships.filter(m => m.status === 'active').length,
    paused: memberships.filter(m => m.status === 'paused').length,
    total: memberships.length,
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
          <h1 className="page-title">Абонементы</h1>
          <p className="page-subtitle">Управляй своими абонементами</p>
        </div>
        <button className="btn btn-primary" onClick={() => setActiveTab('buy')}>
          + Купить абонемент
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '24px' }}>
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
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
        {[
          { key: 'my', label: '🎫 Мои абонементы' },
          { key: 'buy', label: '🛒 Купить' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              fontFamily: 'Inter, sans-serif',
              transition: 'all 0.2s ease',
              background: activeTab === tab.key
                ? 'linear-gradient(135deg, #8B5CF6, #7C3AED)'
                : 'transparent',
              color: activeTab === tab.key ? 'white' : 'rgba(255,255,255,0.5)',
              boxShadow: activeTab === tab.key ? '0 4px 12px rgba(139,92,246,0.4)' : 'none',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'my' && (
        <>
          {/* Filters */}
          <div className="filter-bar" style={{ marginBottom: '20px' }}>
            {[
              { key: 'all', label: '🗂️ Все' },
              { key: 'active', label: '✅ Активные' },
              { key: 'paused', label: '⏸️ Приостановленные' },
              { key: 'expired', label: '⏰ Истёкшие' },
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

          {filteredMemberships.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎫</div>
              <div className="empty-state-title">Абонементов нет</div>
              <p style={{ marginBottom: '20px' }}>Купи абонемент, чтобы начать заниматься</p>
              <button className="btn btn-primary" onClick={() => setActiveTab('buy')}>
                Купить абонемент
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredMemberships.map(m => (
                <MembershipCard key={m.id} membership={m} onPause={handlePause} />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'buy' && (
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '600', color: 'white', marginBottom: '20px' }}>
            Доступные абонементы
          </h2>
          {types.filter(t => t.isActive).length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🛒</div>
              <div className="empty-state-title">Нет доступных абонементов</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {types.filter(t => t.isActive).map(type => (
                <div key={type.id} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px',
                  padding: '24px',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(139,92,246,0.15)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.boxShadow = 'none';
                }}>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'white', marginBottom: '8px' }}>
                    {type.name}
                  </h3>
                  {type.description && (
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px', lineHeight: '1.6', flex: 1 }}>
                      {type.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    {type.visitCount && (
                      <span className="badge badge-purple">🎫 {type.visitCount} занятий</span>
                    )}
                    {type.durationDays && (
                      <span className="badge badge-info">📅 {type.durationDays} дней</span>
                    )}
                    {!type.visitCount && !type.durationDays && (
                      <span className="badge badge-success">∞ Безлимит</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '28px', fontWeight: '800',
                      background: 'linear-gradient(135deg, #A78BFA, #EC4899)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}>
                      {type.price} ₽
                    </span>
                    <button
                      className="btn btn-primary"
                      onClick={() => setBuyModal(type)}
                    >
                      Купить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {buyModal && (
        <BuyModal
          type={buyModal}
          onClose={() => setBuyModal(null)}
          onBuy={handleBuy}
        />
      )}
    </div>
  );
};

export default MyMemberships;
