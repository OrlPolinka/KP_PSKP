import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const ScheduleCard = ({ schedule, onRefresh }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleBook = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'client') {
      alert('Только клиенты могут записываться на занятия');
      return;
    }
    try {
      await api.post('/bookings', { scheduleId: schedule.id });
      alert('Вы успешно записаны на занятие!');
      if (onRefresh) onRefresh();
    } catch (error) {
      alert(error.response?.data?.error || 'Ошибка при записи');
    }
  };

  return (
    <div className="card">
      <h3>{schedule.danceStyle.name}</h3>
      <p><strong>Тренер:</strong> {schedule.trainer.fullName}</p>
      <p><strong>Зал:</strong> {schedule.hall.name}</p>
      <p><strong>Дата:</strong> {schedule.date}</p>
      <p><strong>Время:</strong> {schedule.startTime} - {schedule.endTime}</p>
      <p><strong>Свободных мест:</strong> {schedule.maxCapacity - schedule.currentBookings}</p>
      <p><strong>Статус:</strong> {
        schedule.status === 'scheduled' ? 'Запланировано' :
        schedule.status === 'cancelled' ? 'Отменено' : 'Завершено'
      }</p>
      {schedule.status === 'scheduled' && schedule.maxCapacity - schedule.currentBookings > 0 && (
        <button className="btn btn-primary" onClick={handleBook}>
          Записаться
        </button>
      )}
    </div>
  );
};

export default ScheduleCard;