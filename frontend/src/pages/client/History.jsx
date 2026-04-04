import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const History = () => {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get('/history');
        setHistory(response.data.history);
        setStats(response.data.stats);
      } catch (error) {
        console.error('Ошибка загрузки истории:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="container">
      <h2>История посещений</h2>
      
      {stats && (
        <div className="card">
          <h3>Статистика</h3>
          <p><strong>Всего посещений:</strong> {stats.totalVisits}</p>
          <p><strong>Посещено:</strong> {stats.attended}</p>
          <p><strong>Пропущено:</strong> {stats.noShow}</p>
          <p><strong>Посещаемость:</strong> {stats.attendanceRate}%</p>
        </div>
      )}

      {history.length === 0 ? (
        <p>История посещений пуста</p>
      ) : (
        history.map((item) => (
          <div key={item.id} className="card">
            <h3>{item.schedule.danceStyle}</h3>
            <p><strong>Тренер:</strong> {item.schedule.trainer}</p>
            <p><strong>Дата:</strong> {item.schedule.date}</p>
            <p><strong>Время:</strong> {item.schedule.startTime} - {item.schedule.endTime}</p>
            <p><strong>Статус:</strong> {item.status === 'attended' ? '✅ Посещено' : '❌ Не пришел'}</p>
          </div>
        ))
      )}
    </div>
  );
};

export default History;