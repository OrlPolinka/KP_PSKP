import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatTime, isPastDate, isToday } from '../../utils/dateHelpers';

const statusConfig = {
  scheduled: { label: 'Открыта запись', badge: 'badge-success', icon: '✅' },
  cancelled: { label: 'Отменено', badge: 'badge-danger', icon: '❌' },
  completed: { label: 'Завершено', badge: 'badge-info', icon: '🏁' },
};

const ScheduleDetailModal = ({ item, onClose, onBook, booking }) => {
  if (!item) return null;
  const status = statusConfig[item.status] || statusConfig.scheduled;
  const startTime = formatTime(item.startTime);
  const endTime = formatTime(item.endTime);
  const freeSlots = item.maxCapacity - item.currentBookings;
  const occupancy = item.maxCapacity > 0
    ? Math.round((item.currentBookings / item.maxCapacity) * 100)
    : 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '540px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{item.danceStyle?.name}</h2>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
              <span className={`badge ${status.badge}`}>{status.icon} {status.label}</span>
              {isToday(item.date) && <span className="badge badge-warning">⭐ Сегодня</span>}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          {[
            { icon: '📅', label: 'Дата', value: formatDate(item.date) },
            { icon: '⏰', label: 'Время', value: `${startTime} — ${endTime}` },
            { icon: '🏛️', label: 'Зал', value: item.hall?.name },
            { icon: '👤', label: 'Тренер', value: item.trainer?.fullName },
          ].map((b, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px', padding: '14px',
            }}>
              <div style={{ fontSize: '18px', marginBottom: '4px' }}>{b.icon}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{b.label}</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'white' }}>{b.value || '—'}</div>
            </div>
          ))}
        </div>

        {/* Occupancy */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
              Свободных мест: <strong style={{ color: freeSlots > 0 ? '#10B981' : '#EF4444' }}>{freeSlots}</strong> из {item.maxCapacity}
            </span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: occupancy > 80 ? '#EF4444' : '#10B981' }}>
              {occupancy}% занято
            </span>
          </div>
          <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${occupancy}%`,
              background: occupancy > 80 ? 'linear-gradient(90deg, #EF4444, #DC2626)' : 'linear-gradient(90deg, #10B981, #059669)',
              borderRadius: '4px',
            }} />
          </div>
        </div>

        {item.danceStyle?.description && (
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px', padding: '16px', marginBottom: '20px',
          }}>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              О направлении
            </p>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6' }}>
              {item.danceStyle.description}
            </p>
          </div>
        )}

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Закрыть</button>
          {item.status === 'scheduled' && freeSlots > 0 && !isPastDate(item.date) && (
            <button
              className="btn btn-primary"
              onClick={() => onBook(item.id)}
              disabled={booking}
            >
              {booking ? '⏳ Запись...' : '✨ Записаться'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const Schedule = () => {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('available');
  const [sortBy, setSortBy] = useState('date');
  const [selectedItem, setSelectedItem] = useState(null);
  const [booking, setBooking] = useState(false);
  const [danceStyles, setDanceStyles] = useState([]);
  const [selectedStyle, setSelectedStyle] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [schedRes, stylesRes] = await Promise.all([
        api.get('/schedule'),
        api.get('/dance-styles'),
      ]);
      setSchedule(schedRes.data.schedule || []);
      setDanceStyles(stylesRes.data.danceStyles || []);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (scheduleId) => {
    if (user?.role !== 'client') {
      alert('Только клиенты могут записываться на занятия');
      return;
    }
    setBooking(true);
    try {
      await api.post('/bookings', { scheduleId });
      alert('Вы успешно записаны на занятие!');
      setSelectedItem(null);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Ошибка при записи');
    } finally {
      setBooking(false);
    }
  };

  const filtered = schedule
    .filter(item => {
      const matchSearch = !search ||
        item.danceStyle?.name?.toLowerCase().includes(search.toLowerCase()) ||
        item.trainer?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        item.hall?.name?.toLowerCase().includes(search.toLowerCase());
      const matchStyle = !selectedStyle || item.danceStyle?.id === parseInt(selectedStyle);
      const freeSlots = item.maxCapacity - item.currentBookings;
      const past = isPastDate(item.date);
      if (filterStatus === 'available') return matchSearch && matchStyle && item.status === 'scheduled' && freeSlots > 0 && !past;
      if (filterStatus === 'today') return matchSearch && matchStyle && isToday(item.date);
      if (filterStatus === 'upcoming') return matchSearch && matchStyle && !past;
      return matchSearch && matchStyle;
    })
    .sort((a, b) => {
      if (sortBy === 'date') return new Date(a.date) - new Date(b.date);
      if (sortBy === 'date_desc') return new Date(b.date) - new Date(a.date);
      if (sortBy === 'style') return (a.danceStyle?.name || '').localeCompare(b.danceStyle?.name || '');
      if (sortBy === 'slots') return (b.maxCapacity - b.currentBookings) - (a.maxCapacity - a.currentBookings);
      return 0;
    });

  if (loading) return (
    <div className="loading">
      <div className="spinner" />
      <span>Загрузка расписания...</span>
    </div>
  );

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Расписание занятий</h1>
          <p className="page-subtitle">Найди подходящее занятие и запишись</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar" style={{ flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', width: '100%' }}>
          {/* Search */}
          <div className="search-input" style={{ flex: 1, minWidth: '200px' }}>
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Поиск по направлению, тренеру, залу..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Style filter */}
          <select
            value={selectedStyle}
            onChange={e => setSelectedStyle(e.target.value)}
            style={{
              padding: '10px 16px',
              background: 'var(--dark-2, #1A1A2E)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px',
              color: 'rgba(255,255,255,0.8)',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <option value="" style={{ background: '#1A1A2E', color: 'white' }}>Все направления</option>
            {danceStyles.map(s => (
              <option key={s.id} value={s.id} style={{ background: '#1A1A2E', color: 'white' }}>{s.name}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{
              padding: '10px 16px',
              background: 'var(--dark-2, #1A1A2E)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px',
              color: 'rgba(255,255,255,0.8)',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <option value="date" style={{ background: '#1A1A2E', color: 'white' }}>По дате (ближайшие)</option>
            <option value="date_desc" style={{ background: '#1A1A2E', color: 'white' }}>По дате (поздние)</option>
            <option value="style" style={{ background: '#1A1A2E', color: 'white' }}>По направлению</option>
            <option value="slots" style={{ background: '#1A1A2E', color: 'white' }}>По свободным местам</option>
          </select>
        </div>

        {/* Status filters */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { key: 'available', label: '✅ Доступные' },
            { key: 'today', label: '⭐ Сегодня' },
            { key: 'upcoming', label: '🔜 Предстоящие' },
            { key: 'all', label: '🗓️ Все' },
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
      </div>

      {/* Results count */}
      <div style={{ marginBottom: '16px', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
        Найдено: {filtered.length} занятий
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-title">Занятий не найдено</div>
          <p>Попробуй изменить фильтры или поисковый запрос</p>
        </div>
      ) : (
        <div className="schedule-grid">
          {filtered.map(item => (
            <ScheduleCard
              key={item.id}
              item={item}
              onClick={() => setSelectedItem(item)}
              onBook={user?.role === 'client' ? handleBook : null}
            />
          ))}
        </div>
      )}

      {selectedItem && (
        <ScheduleDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onBook={handleBook}
          booking={booking}
        />
      )}
    </div>
  );
};

const ScheduleCard = ({ item, onClick, onBook }) => {
  const status = statusConfig[item.status] || statusConfig.scheduled;
  const startTime = formatTime(item.startTime);
  const endTime = formatTime(item.endTime);
  const freeSlots = item.maxCapacity - item.currentBookings;
  const occupancy = item.maxCapacity > 0
    ? Math.round((item.currentBookings / item.maxCapacity) * 100)
    : 0;
  const past = isPastDate(item.date);
  const today = isToday(item.date);

  return (
    <div
      onClick={onClick}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${today ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: '16px',
        padding: '20px',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        opacity: past && item.status !== 'scheduled' ? 0.6 : 1,
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)';
        e.currentTarget.style.boxShadow = '0 12px 32px rgba(139,92,246,0.15)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = today ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.08)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {today && (
        <div style={{
          position: 'absolute', top: 0, right: 0,
          background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
          color: 'white', fontSize: '11px', fontWeight: '600',
          padding: '4px 12px', borderRadius: '0 16px 0 10px',
        }}>
          Сегодня
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'white' }}>
          {item.danceStyle?.name}
        </h3>
        <span className={`badge ${status.badge}`} style={{ fontSize: '11px', flexShrink: 0 }}>
          {status.icon}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
          <span>📅</span> {formatDate(item.date)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
          <span>⏰</span> {startTime} — {endTime}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
          <span>👤</span> {item.trainer?.fullName}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
          <span>🏛️</span> {item.hall?.name}
        </div>
      </div>

      {/* Slots */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Свободных мест</span>
          <span style={{
            fontSize: '13px', fontWeight: '600',
            color: freeSlots === 0 ? '#EF4444' : freeSlots <= 3 ? '#F59E0B' : '#10B981',
          }}>
            {freeSlots} / {item.maxCapacity}
          </span>
        </div>
        <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${occupancy}%`,
            background: occupancy > 80 ? '#EF4444' : occupancy > 50 ? '#F59E0B' : '#10B981',
            borderRadius: '2px',
          }} />
        </div>
      </div>

      {onBook && item.status === 'scheduled' && freeSlots > 0 && !past && (
        <button
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={e => { e.stopPropagation(); onBook(item.id); }}
        >
          Записаться
        </button>
      )}
      {freeSlots === 0 && item.status === 'scheduled' && (
        <div style={{
          textAlign: 'center', padding: '10px',
          background: 'rgba(239,68,68,0.1)', borderRadius: '8px',
          color: '#FCA5A5', fontSize: '13px', fontWeight: '500',
        }}>
          Мест нет
        </div>
      )}
    </div>
  );
};

export default Schedule;
