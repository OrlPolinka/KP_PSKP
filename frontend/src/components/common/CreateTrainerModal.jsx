import React, { useState } from 'react';
import api from '../../services/api';

const CreateTrainerModal = ({ onClose, onTrainerCreated }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    specialization: '',
    bio: '',
    photoUrl: '',
    videoUrl: '',
    experience: '',
    education: '',
    hireDate: new Date().toISOString().split('T')[0]
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Клиентская валидация
    if (!formData.fullName.trim()) {
      setError('Имя обязательно для заполнения');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email обязателен для заполнения');
      return;
    }

    if (!formData.password.trim()) {
      setError('Пароль обязателен для заполнения');
      return;
    }

    setLoading(true);

    try {
      // Простое создание тренера через один эндпоинт
      await api.post('/trainers', {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        specialization: formData.specialization,
        bio: formData.bio,
        photoUrl: formData.photoUrl,
        videoUrl: formData.videoUrl,
        experience: formData.experience,
        education: formData.education,
        hireDate: formData.hireDate
      });

      // Успешное создание
      onTrainerCreated && onTrainerCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка при создании тренера');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Добавить тренера</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '20px' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Основная информация */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'white', marginBottom: '16px' }}>
              Основная информация
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                  Полное имя *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'white',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'white',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                  Телефон
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'white',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                  Пароль *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'white',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Профиль тренера */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'white', marginBottom: '16px' }}>
              Профиль тренера
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                Специализация
              </label>
              <input
                type="text"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                placeholder="Например: Хип-хоп, Contemporary, Бальные танцы"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'white',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                О себе
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'white',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                  Опыт (лет)
                </label>
                <input
                  type="text"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'white',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                  Образование
                </label>
                <input
                  type="text"
                  name="education"
                  value={formData.education}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'white',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                Дата найма
              </label>
              <input
                type="date"
                name="hireDate"
                value={formData.hireDate}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'white',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          {/* Кнопки */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 24px',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                background: 'transparent',
                color: 'rgba(255,255,255,0.7)',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Отмена
            </button>
            
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Создание...' : 'Создать тренера'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTrainerModal;
