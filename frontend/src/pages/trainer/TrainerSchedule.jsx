import React, { useState, useEffect } from 'react';
import { scheduleService } from '../../services/scheduleService';
import { formatDate, formatTime, isPastDate } from '../../utils/dateHelpers';

const TrainerSchedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      const data = await scheduleService.getSchedule();
      setSchedule(data);
    } catch (error) {
      console.error('Ошибка загрузки расписания:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSchedule = schedule.filter(item => {
    if (filter === 'past') return isPastDate(item.date);
    if (filter === 'future') return !isPastDate(item.date);
    return true;
  });

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="container">
      <h2>Мое расписание</h2>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          className={`btn ${filter === 'all' ? 'btn-primary' : ''}`}
          onClick={() => setFilter('all')}
        >
          Все
        </button>
        <button
          className={`btn ${filter === 'future' ? 'btn-primary' : ''}`}
          onClick={() => setFilter('future')}
        >
          Предстоящие
        </button>
        <button
          className={`btn ${filter === 'past' ? 'btn-primary' : ''}`}
          onClick={() => setFilter('past')}
        >
          Прошедшие
        </button>
      </div>

      {filteredSchedule.length === 0 ? (
        <p>Нет занятий</p>
      ) : (
        filteredSchedule.map((item) => (
          <div key={item.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <h3>{item.danceStyle.name}</h3>
                <p><strong>Дата:</strong> {formatDate(item.date)}</p>
                <p><strong>Время:</strong> {item.startTime} - {item.endTime}</p>
                <p><strong>Зал:</strong> {item.hall.name}</p>
                <p><strong>Записано клиентов:</strong> {item.currentBookings} / {item.maxCapacity}</p>
              </div>
              <div>
                <span className={`btn ${item.status === 'scheduled' ? 'btn-primary' : item.status === 'cancelled' ? 'btn-danger' : ''}`}>
                  {item.status === 'scheduled' ? 'Запланировано' : 
                   item.status === 'cancelled' ? 'Отменено' : 'Завершено'}
                </span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default TrainerSchedule;