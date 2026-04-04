import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await api.get('/bookings');
      setBookings(response.data.bookings);
    } catch (error) {
      console.error('Ошибка загрузки записей:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (window.confirm('Вы уверены, что хотите отменить запись?')) {
      try {
        await api.put(`/bookings/${bookingId}/cancel`);
        fetchBookings();
        alert('Запись отменена');
      } catch (error) {
        alert(error.response?.data?.error || 'Ошибка при отмене');
      }
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="container">
      <h2>Мои записи</h2>
      {bookings.length === 0 ? (
        <p>У вас нет активных записей</p>
      ) : (
        bookings.map((booking) => (
          <div key={booking.id} className="card">
            <h3>{booking.schedule.danceStyle.name}</h3>
            <p><strong>Тренер:</strong> {booking.schedule.trainer.fullName}</p>
            <p><strong>Дата:</strong> {booking.schedule.date}</p>
            <p><strong>Время:</strong> {booking.schedule.startTime} - {booking.schedule.endTime}</p>
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