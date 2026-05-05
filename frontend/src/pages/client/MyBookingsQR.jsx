import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatDate, formatTime } from '../../utils/dateHelpers';
import './MyBookingsQR.css';

const MyBookingsQR = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedQR, setSelectedQR] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/bookings', {
        params: { status: 'booked' }
      });
      
      // Фильтруем только будущие занятия
      const now = new Date();
      const upcomingBookings = (response.data.bookings || []).filter(booking => {
        const scheduleDate = new Date(booking.schedule?.date);
        return scheduleDate >= now.setHours(0, 0, 0, 0);
      });
      
      setBookings(upcomingBookings);
    } catch (err) {
      console.error('Ошибка при загрузке записей:', err);
      setError('Не удалось загрузить записи');
    } finally {
      setLoading(false);
    }
  };

  const showQRCode = async (bookingId) => {
    try {
      setQrLoading(true);
      const response = await api.get(`/bookings/${bookingId}/qrcode`);
      setSelectedQR({
        bookingId,
        qrImage: response.data.qrImage,
        booking: response.data.booking
      });
    } catch (err) {
      console.error('Ошибка при генерации QR-кода:', err);
      alert('Не удалось сгенерировать QR-код');
    } finally {
      setQrLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedQR(null);
  };

  if (loading) {
    return (
      <div className="my-bookings-qr-page">
        <div className="loading-spinner">Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-bookings-qr-page">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="my-bookings-qr-page">
      <div className="page-header">
        <h1>📱 QR-коды для посещения</h1>
        <p>Покажите QR-код тренеру на занятии для подтверждения записи</p>
      </div>

      {bookings.length === 0 ? (
        <div className="no-bookings">
          <p>У вас нет предстоящих записей</p>
          <a href="/schedule" className="schedule-link">Записаться на занятие</a>
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map(booking => (
            <div key={booking.id} className="booking-card">
              <div className="booking-info">
                <h3>{booking.schedule?.danceStyle?.name || 'Занятие'}</h3>
                <div className="booking-details">
                  <p>
                    <span className="detail-icon">📅</span>
                    {formatDate(booking.schedule?.date)}
                  </p>
                  <p>
                    <span className="detail-icon">🕐</span>
                    {formatTime(booking.schedule?.startTime)} - {formatTime(booking.schedule?.endTime)}
                  </p>
                  <p>
                    <span className="detail-icon">🧑‍🏫</span>
                    {booking.schedule?.trainer?.fullName || 'Тренер'}
                  </p>
                  <p>
                    <span className="detail-icon">📍</span>
                    {booking.schedule?.hall?.name || 'Зал'}
                  </p>
                </div>
              </div>
              <div className="booking-actions">
                <button 
                  className="qr-btn"
                  onClick={() => showQRCode(booking.id)}
                  disabled={qrLoading}
                >
                  📱 Показать QR-код
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модальное окно с QR-кодом */}
      {selectedQR && (
        <div className="qr-modal-overlay" onClick={closeModal}>
          <div className="qr-modal" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={closeModal}>✕</button>
            <h2>Ваш QR-код</h2>
            <div className="qr-code-container">
              <img src={selectedQR.qrImage} alt="QR Code" className="qr-image" />
            </div>
            <div className="qr-info">
              <p><strong>{selectedQR.booking?.danceStyle}</strong></p>
              <p>{selectedQR.booking?.date && formatDate(selectedQR.booking.date)}</p>
              <p>{selectedQR.booking?.trainer}</p>
            </div>
            <p className="qr-hint">
              Покажите этот QR-код тренеру для подтверждения посещения
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookingsQR;
