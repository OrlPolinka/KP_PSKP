import React, { useState, useEffect } from 'react';
import { scheduleService } from '../../services/scheduleService';
import { formatDate, isPastDate } from '../../utils/dateHelpers';

const MyClasses = () => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      const data = await scheduleService.getSchedule();
      setSchedule(data);
    } catch (error) {
      console.error('Ошибка загрузки занятий:', error);
    } finally {
      setLoading(false);
    }
  };

  const pastClasses = schedule.filter(item => isPastDate(item.date));
  const upcomingClasses = schedule.filter(item => !isPastDate(item.date));

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="container">
      <h2>Мои занятия</h2>
      
      <h3>Предстоящие занятия</h3>
      {upcomingClasses.length === 0 ? (
        <p>Нет предстоящих занятий</p>
      ) : (
        upcomingClasses.map((item) => (
          <div key={item.id} className="card">
            <h3>{item.danceStyle.name}</h3>
            <p><strong>Дата:</strong> {formatDate(item.date)}</p>
            <p><strong>Время:</strong> {item.startTime} - {item.endTime}</p>
            <p><strong>Зал:</strong> {item.hall.name}</p>
            <p><strong>Записано:</strong> {item.currentBookings} / {item.maxCapacity}</p>
          </div>
        ))
      )}

      <h3>Прошедшие занятия</h3>
      {pastClasses.length === 0 ? (
        <p>Нет прошедших занятий</p>
      ) : (
        pastClasses.map((item) => (
          <div key={item.id} className="card">
            <h3>{item.danceStyle.name}</h3>
            <p><strong>Дата:</strong> {formatDate(item.date)}</p>
            <p><strong>Время:</strong> {item.startTime} - {item.endTime}</p>
            <p><strong>Зал:</strong> {item.hall.name}</p>
            <p><strong>Записано:</strong> {item.currentBookings} / {item.maxCapacity}</p>
          </div>
        ))
      )}
    </div>
  );
};

export default MyClasses;