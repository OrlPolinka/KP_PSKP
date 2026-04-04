import React, { useState, useEffect } from 'react';
import { bookingService } from '../../services/bookingService';
import { formatDate, formatTime } from '../../utils/dateHelpers';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setError(null);
      const response = await bookingService.getBookings();
      console.log('Загружены записи:', response);
      setBookings(response.bookings || []);
    } catch (error) {
      console.error('Ошибка загрузки записей:', error);
      setError(error.response?.data?.error || 'Ошибка загрузки записей');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (window.confirm('Вы уверены, что хотите отменить запись?')) {
      try {
        await bookingService.cancelBooking(bookingId, 'Отменено клиентом');
        alert('Запись успешно отменена');
        fetchBookings(); // Обновляем список
      } catch (error) {
        console.error('Ошибка отмены:', error);
        alert(error.response?.data?.error || 'Ошибка при отмене записи');
      }
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="error" style={{ textAlign: 'center', padding: '50px' }}>{error}</div>;

  return (
    <div className="container">
      <h2>Мои записи</h2>
      {bookings.length === 0 ? (
        <p>У вас нет активных записей</p>
      ) : (
        bookings.map((booking) => (
          <div key={booking.id} className="card">
            <h3>{booking.schedule?.danceStyle?.name || 'Занятие'}</h3>
            <p><strong>Тренер:</strong> {booking.schedule?.trainer?.fullName || '—'}</p>
            <p><strong>Дата:</strong> {formatDate(booking.schedule?.date)}</p>
            <p><strong>Время:</strong> {booking.schedule?.startTime} - {booking.schedule?.endTime}</p>
            <p><strong>Статус:</strong> {
              booking.status === 'booked' ? 'Забронировано' :
              booking.status === 'attended' ? 'Посещено' :
              booking.status === 'cancelled' ? 'Отменено' : 'Не пришел'
            }</p>
            {booking.status === 'booked' && (
              <button className="btn btn-danger" onClick={() => handleCancel(booking.id)}>
                Отменить запись
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default MyBookings;