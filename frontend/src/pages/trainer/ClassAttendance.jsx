import React, { useState, useEffect } from 'react';
import { scheduleService } from '../../services/scheduleService';
import { bookingService } from '../../services/bookingService';
import { formatDate, formatTime, isToday, isPastDate } from '../../utils/dateHelpers';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const ClassAttendance = () => {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [filter, setFilter] = useState('today');

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      try { await api.post('/schedule/complete-passed'); } catch {}
      const data = await scheduleService.getSchedule();
      setSchedule(data);
    } catch (error) {
      console.error('Ошибка загрузки расписания:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async (scheduleId) => {
    setBookingsLoading(true);
    try {
      const data = await bookingService.getBookingsBySchedule(scheduleId);
      setBookings(data.bookings || []);
      setSelectedSchedule(data.schedule);
    } catch (error) {
      console.error('Ошибка загрузки записей:', error);
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleMarkAttendance = async (bookingId, attended) => {
    try {
      await bookingService.markAttendance(bookingId, attended);
      setMessage({ type: 'success', text: attended ? '✅ Посещение отмечено' : '❌ Неявка отмечена' });
      setTimeout(() => setMessage(null), 3000);
      fetchBookings(selectedSchedule.id);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Ошибка при отметке' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const filteredSchedule = schedule.filter(item => {
    if (filter === 'today') return isToday(item.date);
    if (filter === 'past') return isPastDate(item.date) && !isToday(item.date);
    return !isPastDate(item.date) || isToday(item.date);
  }).sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.startTime || '00:00'}`);
    const dateB = new Date(`${b.date}T${b.startTime || '00:00'}`);
    return dateA - dateB;
  });

  const attendedCount = bookings.filter(b => b.status === 'attended').length;
  const noShowCount = bookings.filter(b => b.status === 'no_show').length;
  const bookedCount = bookings.filter(b => b.status === 'booked').length;

  if (loading) return (
    <div className="loading">
      <div className="spinner" />
      <span>Загрузка занятий...</span>
    </div>
  );

  return (
    <div className="container">
      {!selectedSchedule ? (
        <>
          <div className="page-header">
            <div>
              <h1 className="page-title">Посещаемость</h1>
              <p className="page-subtitle">Отметь присутствие студентов</p>
            </div>
          </div>

          {/* Filters */}
          <div className="filter-bar" style={{ marginBottom: '20px' }}>
            {[
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
              <div className="empty-state-title">
                {filter === 'today' ? 'Сегодня занятий нет' : 'Занятий не найдено'}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredSchedule.map(item => {
                const today = isToday(item.date);
                const past = isPastDate(item.date) && !today;
                return (
                  <div
                    key={item.id}
                    onClick={() => fetchBookings(item.id)}
                    style={{
                      background: today ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${today ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: '14px',
                      padding: '18px 22px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      opacity: past ? 0.75 : 1,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = today ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.08)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    {/* Time */}
                    <div style={{
                      minWidth: '72px', textAlign: 'center',
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '10px', padding: '8px',
                    }}>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: 'white' }}>
                        {formatTime(item.startTime)}
                      </div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>—</div>
                      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                        {formatTime(item.endTime)}
                      </div>
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '16px', fontWeight: '600', color: 'white' }}>
                          {item.danceStyle?.name}
                        </span>
                        {today && <span className="badge badge-warning" style={{ fontSize: '10px' }}>Сегодня</span>}
                        <span className={`badge ${item.status === 'completed' ? 'badge-success' : item.status === 'cancelled' ? 'badge-danger' : 'badge-purple'}`} style={{ fontSize: '10px' }}>
                          {item.status === 'completed' ? 'Завершено' : item.status === 'cancelled' ? 'Отменено' : 'Запланировано'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>
                          📅 {formatDate(item.date)}
                        </span>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>
                          🏛️ {item.hall?.name}
                        </span>
                      </div>
                    </div>

                    {/* Bookings count */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#A78BFA' }}>
                        {item.currentBookings}/{item.maxCapacity}
                      </div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>записей</div>
                    </div>

                    <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '18px' }}>›</div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="page-header">
            <div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => { setSelectedSchedule(null); setBookings([]); }}
                style={{ marginBottom: '8px' }}
              >
                ← Назад к списку
              </button>
              <h1 className="page-title">{selectedSchedule.danceStyle?.name}</h1>
              <p className="page-subtitle">
                📅 {formatDate(selectedSchedule.date)} &nbsp;·&nbsp;
                ⏰ {formatTime(selectedSchedule.startTime)} — {formatTime(selectedSchedule.endTime)} &nbsp;·&nbsp;
                🏛️ {selectedSchedule.hall?.name}
              </p>
            </div>
          </div>

          {message && (
            <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '16px' }}>
              {message.text}
            </div>
          )}

          {/* Stats */}
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>
            <div className="stat-card">
              <div className="stat-value">{bookings.length}</div>
              <div className="stat-label">Всего записей</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ background: 'linear-gradient(135deg, #10B981, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {attendedCount}
              </div>
              <div className="stat-label">Посетили</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {noShowCount}
              </div>
              <div className="stat-label">Не пришли</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ background: 'linear-gradient(135deg, #A78BFA, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {bookedCount}
              </div>
              <div className="stat-label">Ожидается</div>
            </div>
          </div>

          {bookingsLoading ? (
            <div className="loading" style={{ padding: '40px' }}>
              <div className="spinner" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <div className="empty-state-title">Нет записей на это занятие</div>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Студент</th>
                      <th>Телефон</th>
                      <th>Статус</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map(booking => (
                      <tr key={booking.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {(() => {
                              const localAvatar = localStorage.getItem(`avatar_${booking.client?.id}`);
                              return (
                                <div style={{
                                  width: '36px', height: '36px', borderRadius: '50%',
                                  background: localAvatar ? 'transparent' : 'linear-gradient(135deg, #3B82F6, #2563EB)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '12px', fontWeight: '700', color: 'white', flexShrink: 0,
                                  overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)',
                                }}>
                                  {localAvatar
                                    ? <img src={localAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : (booking.client?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?')
                                  }
                                </div>
                              );
                            })()}
                            <span style={{ fontWeight: '500', color: 'white' }}>
                              {booking.client?.fullName}
                            </span>
                          </div>
                        </td>
                        <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                          {booking.client?.phone || '—'}
                        </td>
                        <td>
                          {booking.status === 'attended' && (
                            <span className="badge badge-success">✅ Посетил</span>
                          )}
                          {booking.status === 'no_show' && (
                            <span className="badge badge-danger">❌ Не пришёл</span>
                          )}
                          {booking.status === 'booked' && (
                            <span className="badge badge-purple">📝 Записан</span>
                          )}
                          {booking.status === 'cancelled' && (
                            <span className="badge badge-warning">🚫 Отменил</span>
                          )}
                        </td>
                        <td>
                          {booking.status === 'booked' && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => handleMarkAttendance(booking.id, true)}
                              >
                                ✅ Пришёл
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleMarkAttendance(booking.id, false)}
                              >
                                ❌ Не пришёл
                              </button>
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => navigate(`/chat/${booking.client?.id}`)}
                                style={{ color: '#A78BFA' }}
                              >
                                💬
                              </button>
                            </div>
                          )}
                          {(booking.status === 'attended' || booking.status === 'no_show') && (
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => navigate(`/chat/${booking.client?.id}`)}
                              style={{ color: '#A78BFA' }}
                            >
                              💬 Написать
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ClassAttendance;
