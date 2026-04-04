import React, { useState, useEffect } from 'react';
import { scheduleService } from '../../services/scheduleService';
import { bookingService } from '../../services/bookingService';
import { formatDate, isToday } from '../../utils/dateHelpers';

const ClassAttendance = () => {
  const [schedule, setSchedule] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      const data = await scheduleService.getSchedule();
      const todayClasses = data.filter(item => 
        item.status === 'scheduled' && 
        (isToday(item.date) || new Date(item.date) > new Date())
      );
      setSchedule(todayClasses);
    } catch (error) {
      console.error('Ошибка загрузки расписания:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async (scheduleId) => {
    try {
      const data = await bookingService.getBookingsBySchedule(scheduleId);
      setBookings(data.bookings);
      setSelectedSchedule(data.schedule);
    } catch (error) {
      console.error('Ошибка загрузки записей:', error);
    }
  };

  const handleMarkAttendance = async (bookingId, attended) => {
    try {
      await bookingService.markAttendance(bookingId, attended);
      fetchBookings(selectedSchedule.id);
      alert(attended ? 'Посещение отмечено' : 'Клиент отмечен как не пришедший');
    } catch (error) {
      alert('Ошибка при отметке');
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="container">
      <h2>Отметка посещений</h2>
      
      {!selectedSchedule ? (
        <>
          <h3>Выберите занятие:</h3>
          {schedule.length === 0 ? (
            <p>Нет предстоящих занятий</p>
          ) : (
            schedule.map((item) => (
              <div key={item.id} className="card" style={{ cursor: 'pointer' }} onClick={() => fetchBookings(item.id)}>
                <h3>{item.danceStyle.name}</h3>
                <p><strong>Дата:</strong> {formatDate(item.date)}</p>
                <p><strong>Время:</strong> {item.startTime} - {item.endTime}</p>
                <p><strong>Записано:</strong> {item.currentBookings} / {item.maxCapacity}</p>
              </div>
            ))
          )}
        </>
      ) : (
        <>
          <button className="btn" onClick={() => setSelectedSchedule(null)}>← Назад</button>
          
          <div className="card" style={{ marginTop: '20px' }}>
            <h3>{selectedSchedule.danceStyle.name}</h3>
            <p><strong>Дата:</strong> {formatDate(selectedSchedule.date)}</p>
            <p><strong>Время:</strong> {selectedSchedule.startTime} - {selectedSchedule.endTime}</p>
            <p><strong>Зал:</strong> {selectedSchedule.hall.name}</p>
          </div>

          <h3>Список записавшихся:</h3>
          {bookings.length === 0 ? (
            <p>Нет записей</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #ddd' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Клиент</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Телефон</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Статус</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>{booking.client.fullName}</td>
                    <td style={{ padding: '12px' }}>{booking.client.phone || '—'}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        color: booking.status === 'attended' ? '#28a745' : 
                               booking.status === 'no_show' ? '#dc3545' : '#007bff',
                      }}>
                        {booking.status === 'attended' ? '✅ Посетил' :
                         booking.status === 'no_show' ? '❌ Не пришел' : '📝 Записан'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {booking.status === 'booked' && (
                        <>
                          <button
                            className="btn btn-success"
                            style={{ marginRight: '10px' }}
                            onClick={() => handleMarkAttendance(booking.id, true)}
                          >
                            Отметить посещение
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleMarkAttendance(booking.id, false)}
                          >
                            Отметить неявку
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
};

export default ClassAttendance;