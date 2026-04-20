import React, { useState, useEffect } from 'react';
import { scheduleService } from '../../services/scheduleService';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatTime, isPastDate, isToday } from '../../utils/dateHelpers';
import api from '../../services/api';

const statusConfig = {
  scheduled: { label: 'Запланировано', badge: 'badge-purple', icon: '📅' },
  cancelled: { label: 'Отменено', badge: 'badge-danger', icon: '❌' },
  completed: { label: 'Завершено', badge: 'badge-success', icon: '✅' },
};

const ScheduleDetailModal = ({ item, onClose }) => {
  if (!item) return null;
  const status = statusConfig[item.status] || statusConfig.scheduled;
  const startTime = formatTime(item.startTime);
  const endTime = formatTime(item.endTime);
  const date = formatDate(item.date);
  const occupancy = item.maxCapacity > 0
    ? Math.round((item.currentBookings / item.maxCapacity) * 100)
    : 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{item.danceStyle?.name}</h2>
            <span className={`badge ${status.badge}`} style={{ marginTop: '6px' }}>
              {status.icon} {status.label}
            </span>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <InfoBlock icon="📅" label="Дата" value={date} />
          <InfoBlock icon="⏰" label="Время" value={`${startTime} — ${endTime}`} />
          <InfoBlock icon="🏛️" label="Зал" value={item.hall?.name} />
          <InfoBlock icon="👥" label="Записано" value={`${item.currentBookings} / ${item.maxCapacity}`} />
        </div>

        {/* Occupancy bar */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Заполненность</span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: occupancy > 80 ? '#EF4444' : occupancy > 50 ? '#F59E0B' : '#10B981' }}>
              {occupancy}%
            </span>
          </div>
          <div style={{
            height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${occupancy}%`,
              background: occupancy > 80 ? 'linear-gradient(90deg, #EF4444, #DC2626)'
                : occupancy > 50 ? 'linear-gradient(90deg, #F59E0B, #D97706)'
                : 'linear-gradient(90deg, #10B981, #059669)',
              borderRadius: '4px',
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>

        {item.cancellationReason && (
          <div className="alert alert-error">
            <strong>Причина отмены:</strong> {item.cancellationReason}
          </div>
        )}

        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
        }}>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Информация о занятии
          </p>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6' }}>
            {item.danceStyle?.description || 'Описание не указано'}
          </p>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Закрыть</button>
        </div>
      </div>
    </div>
  );
};

const InfoBlock = ({ icon, label, value }) => (
  <div style={{
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    padding: '14px',
  }}>
    <div style={{ fontSize: '20px', marginBottom: '6px' }}>{icon}</div>
    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
      {label}
    </div>
    <div style={{ fontSize: '15px', fontWeight: '600', color: 'white' }}>{value || '—'}</div>
  </div>
);

const TrainerSchedule = () => {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');
  const [selectedItem, setSelectedItem] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'week'

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      // Auto-complete passed schedules
      try { await api.post('/schedule/complete-passed'); } catch {}
      const data = await scheduleService.getSchedule();
      // Filter only this trainer's classes
      const mySchedule = data.filter(item => {
        const trainerId = item.trainer?.id || item.trainerId;
        const trainerUserId = item.trainer?.userId;
        return trainerId === user?.id || trainerUserId === user?.id;
      });
      setSchedule(mySchedule);
    } catch (error) {
      console.error('Ошибка загрузки расписания:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSchedule = schedule.filter(item => {
    const past = isPastDate(item.date);
    const today = isToday(item.date);
    if (filter === 'today') return today;
    if (filter === 'upcoming') return !past || today;
    if (filter === 'past') return past && !today;
    return true;
  }).sort((a, b) => new Date(a.date) - new Date(b.date));

  // Group by date for week view
  const groupedByDate = filteredSchedule.reduce((acc, item) => {
    const date = item.date?.split('T')[0] || item.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {});

  const stats = {
    total: schedule.length,
    upcoming: schedule.filter(i => !isPastDate(i.date)).length,
    today: schedule.filter(i => isToday(i.date)).length,
    completed: schedule.filter(i =>
      i.status === 'completed' ||
      (i.status === 'scheduled' && isPastDate(i.date) && !isToday(i.date))
    ).length,
  };

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
          <h1 className="page-title">Моё расписание</h1>
          <p className="page-subtitle">Управляй своими занятиями</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setViewMode('list')}
          >
            📋 Список
          </button>
          <button
            className={`btn ${viewMode === 'week' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setViewMode('week')}
          >
            📅 По датам
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Всего занятий</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ background: 'linear-gradient(135deg, #10B981, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {stats.today}
          </div>
          <div className="stat-label">Сегодня</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.upcoming}</div>
          <div className="stat-label">Предстоящих</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ background: 'linear-gradient(135deg, #10B981, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {stats.completed}
          </div>
          <div className="stat-label">Завершено</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        {[
          { key: 'all', label: '🗓️ Все' },
          { key: 'today', label: '⭐ Сегодня' },
          { key: 'upcoming', label: '🔜 Предстоящие' },
          { key: 'past', label: '📚 Прошедшие' },
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

      {filteredSchedule.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <div className="empty-state-title">Занятий не найдено</div>
          <p>В этом разделе пока нет занятий</p>
        </div>
      ) : viewMode === 'list' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredSchedule.map(item => (
            <ScheduleListItem
              key={item.id}
              item={item}
              onClick={() => setSelectedItem(item)}
            />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {Object.entries(groupedByDate).map(([date, items]) => (
            <div key={date}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                marginBottom: '12px',
              }}>
                <div style={{
                  background: isToday(date)
                    ? 'linear-gradient(135deg, #8B5CF6, #EC4899)'
                    : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${isToday(date) ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '10px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: isToday(date) ? 'white' : 'rgba(255,255,255,0.7)',
                }}>
                  {isToday(date) ? '⭐ Сегодня' : formatDate(date)}
                </div>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
                  {items.length} {items.length === 1 ? 'занятие' : 'занятий'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {items.map(item => (
                  <ScheduleListItem
                    key={item.id}
                    item={item}
                    onClick={() => setSelectedItem(item)}
                    compact
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedItem && (
        <ScheduleDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
};

const ScheduleListItem = ({ item, onClick, compact }) => {
  const effectiveStatus = (item.status === 'scheduled' && isPastDate(item.date) && !isToday(item.date))
    ? 'completed'
    : item.status;
  const status = statusConfig[effectiveStatus] || statusConfig.scheduled;
  const startTime = formatTime(item.startTime);
  const endTime = formatTime(item.endTime);
  const past = isPastDate(item.date);
  const today = isToday(item.date);
  const occupancy = item.maxCapacity > 0
    ? Math.round((item.currentBookings / item.maxCapacity) * 100)
    : 0;

  return (
    <div
      onClick={onClick}
      style={{
        background: today
          ? 'rgba(139,92,246,0.08)'
          : past ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${today ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: '14px',
        padding: compact ? '14px 18px' : '20px 24px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        opacity: past && item.status !== 'completed' && effectiveStatus !== 'completed' ? 0.7 : 1,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)';
        e.currentTarget.style.transform = 'translateX(4px)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(139,92,246,0.1)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = today ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.08)';
        e.currentTarget.style.transform = 'translateX(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Time block */}
      <div style={{
        minWidth: '80px',
        textAlign: 'center',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '10px',
        padding: '10px 8px',
      }}>
        <div style={{ fontSize: '16px', fontWeight: '700', color: 'white' }}>{startTime}</div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: '2px 0' }}>—</div>
        <div style={{ fontSize: '14px', fontWeight: '500', color: 'rgba(255,255,255,0.6)' }}>{endTime}</div>
      </div>

      {/* Main info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'white' }}>
            {item.danceStyle?.name}
          </h3>
          <span className={`badge ${status.badge}`} style={{ fontSize: '11px' }}>
            {status.icon} {status.label}
          </span>
          {today && <span className="badge badge-warning" style={{ fontSize: '11px' }}>Сегодня</span>}
        </div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
            🏛️ {item.hall?.name}
          </span>
          {!compact && (
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
              📅 {formatDate(item.date)}
            </span>
          )}
        </div>
      </div>

      {/* Occupancy */}
      <div style={{ textAlign: 'right', minWidth: '80px' }}>
        <div style={{
          fontSize: '18px', fontWeight: '700',
          color: occupancy > 80 ? '#EF4444' : occupancy > 50 ? '#F59E0B' : '#10B981',
        }}>
          {item.currentBookings}/{item.maxCapacity}
        </div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>записей</div>
        <div style={{
          height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px',
          marginTop: '6px', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: `${occupancy}%`,
            background: occupancy > 80 ? '#EF4444' : occupancy > 50 ? '#F59E0B' : '#10B981',
            borderRadius: '2px',
          }} />
        </div>
      </div>

      <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '18px' }}>›</div>
    </div>
  );
};

export default TrainerSchedule;
