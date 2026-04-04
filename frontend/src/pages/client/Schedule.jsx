import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import ScheduleCard from '../../components/Schedule/ScheduleCard';

const Schedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const response = await api.get('/schedule');
        setSchedule(response.data.schedule);
      } catch (error) {
        console.error('Ошибка загрузки расписания:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, []);

  const filteredSchedule = schedule.filter(item => 
    item.danceStyle.name.toLowerCase().includes(filter.toLowerCase()) ||
    item.trainer.fullName.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="container">
      <h2>Расписание занятий</h2>
      <div className="form-group">
        <input
          type="text"
          placeholder="Поиск по направлению или тренеру..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ maxWidth: '300px' }}
        />
      </div>
      <div className="schedule-grid">
        {filteredSchedule.map((item) => (
          <ScheduleCard key={item.id} schedule={item} />
        ))}
      </div>
    </div>
  );
};

export default Schedule;