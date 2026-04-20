import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatDate, formatTime } from '../../utils/dateHelpers';

const History = () => {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await api.get('/history?limit=100');
      setHistory(response.data.history || []);
      setStats(response.data.stats || null);
    } catch (error) {
      console.error('Ошибка загрузки истории:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = history.filter(item => {
    const matchFilter = filter === 'all' || item.status === filter;
    const matchSearch = !search ||
      item.schedule?.danceStyle?.toLowerCase().includes(search.toLowerCase()) ||
      item.schedule?.trainer?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  // Group by month
  const grouped = filtered.reduce((acc, item) => {
    const date = new Date(item.schedule?.date || item.bookingTime);
    const key = date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  if (loading) return (
    <div className="loading">
      <div className="spinner" />
      <span>Загрузка истории...</span>
    </div>
  );

  const attendanceRate = stats?.attendanceRate || 0;

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">История посещений</h1>
          <p className="page-subtitle">Твой танцевальный путь</p>
        </div>
      </div>

      {/* Stats cards */}
      {stats && (
        <div style={{ marginBottom: '32px' }}>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '20px' }}>
            <div className="stat-card">
              <div className="stat-value">{stats.totalVisits}</div>
              <div className="stat-label">Всего занятий</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ background: 'linear-gradient(135deg, #10B981, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {stats.attended}
              </div>
              <div className="stat-label">Посещено</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {stats.noShow}
              </div>
              <div className="stat-label">Пропущено</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ background: 'linear-gradient(135deg, #A78BFA, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {attendanceRate}%
              </div>
              <div className="stat-label">Посещаемость</div>
            </div>
          </div>

          {/* Attendance progress bar */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: 'white' }}>Общая посещаемость</span>
              <span style={{
                fontSize: '20px', fontWeight: '800',
                color: attendanceRate >= 80 ? '#10B981' : attendanceRate >= 50 ? '#F59E0B' : '#EF4444',
              }}>
                {attendanceRate}%
              </span>
            </div>
            <div style={{ height: '12px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${attendanceRate}%`,
                background: attendanceRate >= 80
                  ? 'linear-gradient(90deg, #10B981, #059669)'
                  : attendanceRate >= 50
                  ? 'linear-gradient(90deg, #F59E0B, #D97706)'
                  : 'linear-gradient(90deg, #EF4444, #DC2626)',
                borderRadius: '6px',
                transition: 'width 1s ease',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
              <span>0%</span>
              <span style={{ color: attendanceRate >= 80 ? '#10B981' : 'rgba(255,255,255,0.35)' }}>
                {attendanceRate >= 80 ? '🏆 Отличная посещаемость!' : attendanceRate >= 50 ? '👍 Хорошо, продолжай!' : '💪 Есть куда расти'}
              </span>
              <span>100%</span>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filter-bar" style={{ marginBottom: '24px' }}>
        <div className="search-input" style={{ flex: 1, minWidth: '180px' }}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Поиск по направлению или тренеру..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {[
          { key: 'all', label: '🗂️ Все' },
          { key: 'attended', label: '✅ Посещённые' },
          { key: 'no_show', label: '⚠️ Пропущенные' },
        ].map(f => (
          <button
            key={f.key}
            className={`filter-btn ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <div className="empty-state-title">История пуста</div>
          <p>Запишись на занятие и начни свой танцевальный путь!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {Object.entries(grouped).map(([month, items]) => (
            <div key={month}>
              {/* Month header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  background: 'rgba(139,92,246,0.15)',
                  border: '1px solid rgba(139,92,246,0.25)',
                  borderRadius: '8px', padding: '6px 14px',
                  fontSize: '13px', fontWeight: '600', color: '#A78BFA',
                  textTransform: 'capitalize',
                }}>
                  📅 {month}
                </div>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
                  {items.length} занятий
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {items.map(item => (
                  <HistoryItem key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const HistoryItem = ({ item }) => {
  const attended = item.status === 'attended';
  const date = item.schedule?.date;
  const startTime = item.schedule?.startTime;
  const endTime = item.schedule?.endTime;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${attended ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`,
      borderRadius: '12px',
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      transition: 'all 0.2s ease',
    }}
    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
    >
      {/* Status icon */}
      <div style={{
        width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
        background: attended ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
        border: `2px solid ${attended ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '20px',
      }}>
        {attended ? '✅' : '❌'}
      </div>

      {/* Main info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '15px', fontWeight: '600', color: 'white' }}>
            {item.schedule?.danceStyle || 'Занятие'}
          </span>
          <span className={`badge ${attended ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '11px' }}>
            {attended ? 'Посещено' : 'Не пришёл'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {item.schedule?.trainer && (
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>
              👤 {item.schedule.trainer}
            </span>
          )}
          {item.schedule?.hall && (
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>
              🏛️ {item.schedule.hall}
            </span>
          )}
          {item.membership?.typeName && (
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>
              🎫 {item.membership.typeName}
            </span>
          )}
        </div>
      </div>

      {/* Date/time */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.7)' }}>
          {date ? formatDate(date) : '—'}
        </div>
        {startTime && (
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>
            {formatTime(startTime)}{endTime ? ` — ${formatTime(endTime)}` : ''}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
