import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import './Trainers.css';

const Trainers = () => {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/public/trainers');
      setTrainers(response.data.trainers || []);
    } catch (err) {
      console.error('Ошибка при загрузке тренеров:', err);
      setError('Не удалось загрузить список тренеров');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="trainers-page">
        <div className="loading-spinner">Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="trainers-page">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="trainers-page">
      <div className="page-header">
        <h1>🧑‍🏫 Наши тренеры</h1>
        <p>Познакомьтесь с профессионалами нашей студии</p>
      </div>

      <div className="trainers-grid">
        {trainers.map(trainer => (
          <Link 
            to={`/trainers/${trainer.id}`} 
            key={trainer.id} 
            className="trainer-card"
          >
            <div className="trainer-photo">
              {trainer.photoUrl ? (
                <img src={trainer.photoUrl} alt={trainer.fullName} />
              ) : (
                <div className="trainer-photo-placeholder">
                  {trainer.fullName?.charAt(0) || '👤'}
                </div>
              )}
            </div>
            <div className="trainer-info">
              <h3>{trainer.fullName}</h3>
              {trainer.specialization && (
                <p className="trainer-specialization">{trainer.specialization}</p>
              )}
              {trainer.experience && (
                <p className="trainer-experience">
                  <span className="exp-icon">⭐</span>
                  {trainer.experience} лет опыта
                </p>
              )}
              {trainer.bio && (
                <p className="trainer-bio-preview">
                  {trainer.bio.length > 100 
                    ? trainer.bio.substring(0, 100) + '...' 
                    : trainer.bio}
                </p>
              )}
            </div>
            <div className="trainer-card-footer">
              <span className="view-profile">Подробнее →</span>
            </div>
          </Link>
        ))}
      </div>

      {trainers.length === 0 && (
        <div className="no-trainers">
          <p>Тренеры не найдены</p>
        </div>
      )}
    </div>
  );
};

export default Trainers;
