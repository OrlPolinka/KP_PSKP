import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';

const TrainersList = () => {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    specialization: '',
    bio: '',
  });

  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    try {
      const data = await userService.getTrainers();
      setTrainers(data);
    } catch (error) {
      console.error('Ошибка загрузки тренеров:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await userService.createTrainer(formData);
      setShowModal(false);
      setFormData({ email: '', password: '', fullName: '', phone: '', specialization: '', bio: '' });
      fetchTrainers();
      alert('Тренер успешно создан');
    } catch (error) {
      alert(error.response?.data?.error || 'Ошибка при создании тренера');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить тренера?')) {
      try {
        await userService.deleteTrainer(id);
        fetchTrainers();
      } catch (error) {
        alert('Ошибка при удалении тренера');
      }
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Управление тренерами</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Добавить тренера
        </button>
      </div>

      <div className="card">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ddd', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>ФИО</th>
              <th style={{ padding: '12px' }}>Email</th>
              <th style={{ padding: '12px' }}>Телефон</th>
              <th style={{ padding: '12px' }}>Специализация</th>
              <th style={{ padding: '12px' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {trainers.map((trainer) => (
              <tr key={trainer.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px' }}>{trainer.fullName}</td>
                <td style={{ padding: '12px' }}>{trainer.email}</td>
                <td style={{ padding: '12px' }}>{trainer.phone || '—'}</td>
                <td style={{ padding: '12px' }}>{trainer.trainerInfo?.specialization || '—'}</td>
                <td style={{ padding: '12px' }}>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(trainer.id)}
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
            <h3>Добавить тренера</h3>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Пароль</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>ФИО</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Телефон</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Специализация</label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Биография</label>
                <textarea
                  rows="3"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={() => setShowModal(false)}>Отмена</button>
                <button type="submit" className="btn btn-primary">Создать</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainersList;