import React, { useState, useEffect } from 'react';
import { scheduleService } from '../../services/scheduleService';
import { userService } from '../../services/userService';
import { formatDate, formatTime } from '../../utils/dateHelpers';

const ScheduleManager = () => {
  const [schedule, setSchedule] = useState([]);
  const [halls, setHalls] = useState([]);
  const [danceStyles, setDanceStyles] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    danceStyleId: '',
    trainerId: '',
    hallId: '',
    date: '',
    startTime: '',
    endTime: '',
    maxCapacity: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [scheduleData, hallsData, stylesData, trainersData] = await Promise.all([
        scheduleService.getSchedule(),
        scheduleService.getHalls(),
        scheduleService.getDanceStyles(),
        userService.getTrainers(),
      ]);
      setSchedule(scheduleData);
      setHalls(hallsData);
      setDanceStyles(stylesData);
      setTrainers(trainersData);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await scheduleService.updateSchedule(editingId, formData);
      } else {
        await scheduleService.createSchedule(formData);
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({ danceStyleId: '', trainerId: '', hallId: '', date: '', startTime: '', endTime: '', maxCapacity: '' });
      fetchData();
      alert(editingId ? 'Занятие обновлено' : 'Занятие создано');
    } catch (error) {
      alert(error.response?.data?.error || 'Ошибка при сохранении');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить занятие?')) {
      try {
        await scheduleService.deleteSchedule(id);
        fetchData();
      } catch (error) {
        alert('Ошибка при удалении');
      }
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      danceStyleId: item.danceStyleId,
      trainerId: item.trainer.id,
      hallId: item.hallId,
      date: item.date,
      startTime: item.startTime,
      endTime: item.endTime,
      maxCapacity: item.maxCapacity,
    });
    setShowModal(true);
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Управление расписанием</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Добавить занятие
        </button>
      </div>

      <div className="card">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ddd', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>Дата</th>
              <th style={{ padding: '12px' }}>Время</th>
              <th style={{ padding: '12px' }}>Направление</th>
              <th style={{ padding: '12px' }}>Тренер</th>
              <th style={{ padding: '12px' }}>Зал</th>
              <th style={{ padding: '12px' }}>Мест</th>
              <th style={{ padding: '12px' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px' }}>{formatDate(item.date)}</td>
                <td style={{ padding: '12px' }}>{item.startTime} - {item.endTime}</td>
                <td style={{ padding: '12px' }}>{item.danceStyle.name}</td>
                <td style={{ padding: '12px' }}>{item.trainer.fullName}</td>
                <td style={{ padding: '12px' }}>{item.hall.name}</td>
                <td style={{ padding: '12px' }}>{item.currentBookings}/{item.maxCapacity}</td>
                <td style={{ padding: '12px' }}>
                  <button
                    className="btn btn-primary"
                    style={{ marginRight: '10px' }}
                    onClick={() => handleEdit(item)}
                  >
                    Изменить
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(item.id)}
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}>
          <div className="card" style={{ maxWidth: '500px', width: '90%' }}>
            <h3>{editingId ? 'Редактировать занятие' : 'Добавить занятие'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Направление</label>
                <select
                  required
                  value={formData.danceStyleId}
                  onChange={(e) => setFormData({ ...formData, danceStyleId: e.target.value })}
                >
                  <option value="">Выберите направление</option>
                  {danceStyles.map((style) => (
                    <option key={style.id} value={style.id}>{style.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Тренер</label>
                <select
                  required
                  value={formData.trainerId}
                  onChange={(e) => setFormData({ ...formData, trainerId: e.target.value })}
                >
                  <option value="">Выберите тренера</option>
                  {trainers.map((trainer) => (
                    <option key={trainer.id} value={trainer.id}>{trainer.fullName}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Зал</label>
                <select
                  required
                  value={formData.hallId}
                  onChange={(e) => setFormData({ ...formData, hallId: e.target.value })}
                >
                  <option value="">Выберите зал</option>
                  {halls.map((hall) => (
                    <option key={hall.id} value={hall.id}>{hall.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Дата</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Время начала</label>
                <input
                  type="time"
                  required
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Время окончания</label>
                <input
                  type="time"
                  required
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Максимальное количество мест</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.maxCapacity}
                  onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                }}>Отмена</button>
                <button type="submit" className="btn btn-primary">Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleManager;