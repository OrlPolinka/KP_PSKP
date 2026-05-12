import React, { useState, useCallback, useEffect } from 'react';
import { bookingService } from '../../services/bookingService';
import { formatDate, formatTime, isPastDate, isToday } from '../../utils/dateHelpers';
import Pagination from '../../components/common/Pagination';

const statusConfig = {
  booked: { label: 'Забронировано', badge: 'badge-purple', icon: '📅' },
  attended: { label: 'Посещено', badge: 'badge-success', icon: '✅' },
  cancelled: { label: 'Отменено', badge: 'badge-danger', icon: '❌' },
  no_show: { label: 'Не пришёл', badge: 'badge-warning', icon: '⚠️' },
};

const BookingCard = ({ booking, onCancel }) => {
  const schedDate = booking.schedule?.date;
  const past = schedDate ? isPastDate(schedDate) : false;
  const today = schedDate ? isToday(schedDate) : false;
  const isFutureOrToday = schedDate ? (!isPastDate(schedDate) || isToday(schedDate)) : false;
  const displayStatus = (isFutureOrToday && (booking.status === 'attended' || booking.status === 'no_show'))
    ? 'booked'
    : booking.status;
  const status = statusConfig[displayStatus] || statusConfig.booked;
  const canCancel = displayStatus === 'booked' && !past;

  return (
    <div style={{
      background: past ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
      border: `1px solid ${today ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: '14px',
      padding: '20px',
      opacity: past && booking.status === 'cancelled' ? 0.6 : 1,
      transition: 'all 0.2s ease',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'white', marginBottom: '6px' }}>
            {booking.schedule?.danceStyle?.name || 'Занятие'}
          </h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span className={`badge ${status.badge}`}>{status.icon} {status.label}</span>
            {today && <span className="badge badge-warning">⭐ Сегодня</span>}
          </div>
        </div>
        {canCancel && (
          <button className="btn btn-danger btn-sm" onClick={() => onCancel(booking.id)}>
            Отменить
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
        {[
          { icon: '📅', label: 'Дата', value: formatDate(schedDate) },
          { icon: '⏰', label: 'Время', value: `${formatTime(booking.schedule?.startTime)} — ${formatTime(booking.schedule?.endTime)}` },
          { icon: '👤', label: 'Тренер', value: booking.schedule?.trainer?.fullName },
          { icon: '🏛️', label: 'Зал', value: booking.schedule?.hall?.name },
        ].map((item, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '8px', padding: '10px',
          }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {item.icon} {item.label}
            </div>
            <div style={{ fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.85)' }}>
              {item.value || '—'}
            </div>
          </div>
        ))}
      </div>

      {booking.membership?.membershipType?.name && (
        <div style={{ marginTop: '10px', fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
          🎫 Абонемент: {booking.membership.membershipType.name}
        </div>
      )}
    </div>
  );
};

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCounts, setTotalCounts] = useState({
    upcoming: 0,
    past: 0,
    cancelled: 0
  });

  const fetchTotalCounts = useCallback(async () => {
    try {
      const [upcomingRes, pastRes, cancelledRes] = await Promise.all([
        bookingService.getBookings({ page: 1, limit: 1, bookingType: 'upcoming' }),
        bookingService.getBookings({ page: 1, limit: 1, bookingType: 'past' }),
        bookingService.getBookings({ page: 1, limit: 1, bookingType: 'cancelled' })
      ]);
      
      setTotalCounts({
        upcoming: upcomingRes.pagination?.total || 0,
        past: pastRes.pagination?.total || 0,
        cancelled: cancelledRes.pagination?.total || 0
      });
    } catch (error) {
      console.error('Ошибка загрузки счетчиков:', error);
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    try {
      setError(null);
      const response = await bookingService.getBookings({ 
        page: currentPage, 
        limit: 9,
        bookingType: activeTab
      });
      setBookings(response.bookings || []);
      if (response.pagination) {
        setTotalPages(response.pagination.totalPages);
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Ошибка загрузки записей');
    } finally {
      setLoading(false);
    }
  }, [currentPage, activeTab]);

  useEffect(() => {
    setCurrentPage(1); // Сбрасываем страницу при смене таба
  }, [activeTab]);

  useEffect(() => {
    fetchBookings();
    fetchTotalCounts();
  }, [fetchBookings, fetchTotalCounts]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Вы уверены, что хотите отменить запись?')) return;
    try {
      await bookingService.cancelBooking(bookingId, 'Отменено клиентом');
      fetchBookings();
      fetchTotalCounts();
    } catch (error) {
      alert(error.response?.data?.error || 'Ошибка при отмене записи');
    }
  };

  const stats = {
    total: totalCounts.upcoming + totalCounts.past + totalCounts.cancelled,
    upcoming: totalCounts.upcoming,
    attended: totalCounts.past,
    cancelled: totalCounts.cancelled,
  };

  if (loading) return (
    <div className="loading">
      <div className="spinner" />
      <span>Загрузка записей...</span>
    </div>
  );

  if (error) return (
    <div className="container">
      <div className="alert alert-error">⚠️ {error}</div>
    </div>
  );

  const tabs = [
    { key: 'upcoming', label: '🔜 Предстоящие' },
    { key: 'past', label: '📚 Прошедшие' },
    { key: 'cancelled', label: '❌ Отменённые' },
  ];

  const currentList = bookings;

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Мои записи</h1>
          <p className="page-subtitle">Управляй своими записями на занятия</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Всего</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.upcoming}</div>
          <div className="stat-label">Предстоящих</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ background: 'linear-gradient(135deg, #10B981, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {stats.attended}
          </div>
          <div className="stat-label">Посещено</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {stats.cancelled}
          </div>
          <div className="stat-label">Отменено</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '4px', width: 'fit-content', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 18px', border: 'none', borderRadius: '10px',
              cursor: 'pointer', fontSize: '13px', fontWeight: '600',
              fontFamily: 'Inter, sans-serif', transition: 'all 0.2s ease',
              background: activeTab === tab.key ? 'linear-gradient(135deg, #8B5CF6, #7C3AED)' : 'transparent',
              color: activeTab === tab.key ? 'white' : 'rgba(255,255,255,0.5)',
              boxShadow: activeTab === tab.key ? '0 4px 12px rgba(139,92,246,0.4)' : 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {currentList.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            {activeTab === 'upcoming' ? '📭' : activeTab === 'past' ? '📚' : '✅'}
          </div>
          <div className="empty-state-title">
            {activeTab === 'upcoming' ? 'Нет предстоящих записей' :
             activeTab === 'past' ? 'Нет прошедших записей' : 'Нет отменённых записей'}
          </div>
          {activeTab === 'upcoming' && (
            <p>Запишись на занятие в разделе «Расписание»</p>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {currentList.map(booking => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onCancel={handleCancel}
            />
          ))}
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default MyBookings;
