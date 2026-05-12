import React, { useState, useEffect, useCallback } from 'react';

import { useParams, Link } from 'react-router-dom';

import api from '../../services/api';

import './TrainerProfile.css';



const TrainerProfile = () => {

  const { id } = useParams();

  const [trainer, setTrainer] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);



  const fetchTrainer = useCallback(async () => {

    try {

      setLoading(true);

      setError(null);

      const response = await api.get(`/public/trainers/${id}`);

      if (response.data && response.data.trainer) {

        setTrainer(response.data.trainer);

      } else {

        setError('Тренер не найден');

      }

    } catch (err) {

      setError(err.response?.data?.error || 'Ошибка при загрузке тренера');

    } finally {

      setLoading(false);

    }

  }, [id]);



  useEffect(() => {

    if (id) {

      fetchTrainer();

    }

  }, [id, fetchTrainer]);



  if (loading) {

    return (

      <div className="trainer-profile-page">

        <div className="loading-spinner">Загрузка...</div>

      </div>

    );

  }



  if (error || !trainer) {

    return (

      <div className="trainer-profile-page">

        <div className="error-message">{error || 'Тренер не найден'}</div>

        <Link to="/trainers" className="back-link">← Вернуться к списку тренеров</Link>

      </div>

    );

  }



  return (

    <div className="trainer-profile-page">

      <Link to="/trainers" className="back-link">← Все тренеры</Link>



      <div className="trainer-header">

        <div className="trainer-photo-large">

          {trainer.photoUrl ? (

            <img src={trainer.photoUrl} alt={trainer.fullName} />

          ) : (

            <div className="trainer-photo-placeholder-large">

              {trainer.fullName?.charAt(0) || '👤'}

            </div>

          )}

        </div>

        <div className="trainer-header-info">

          <h1>{trainer.fullName}</h1>

          {trainer.specialization && (

            <p className="trainer-specialization-large">{trainer.specialization}</p>

          )}

          {trainer.experience && (

            <p className="trainer-experience-large">

              <span>⭐</span> {trainer.experience} лет опыта

            </p>

          )}

          {trainer.phone && (

            <p className="trainer-contact">

              <span>📱</span> {trainer.phone}

            </p>

          )}

        </div>

      </div>



      {trainer.customPageContent && (

        <div className="trainer-custom-section">

          <h2>{trainer.customPageTitle || 'О себе'}</h2>

          <div className="custom-content" dangerouslySetInnerHTML={{ __html: trainer.customPageContent }} />

        </div>

      )}



      {trainer.bio && (

        <div className="trainer-section">

          <h2>О тренере</h2>

          <p>{trainer.bio}</p>

        </div>

      )}



      {trainer.education && (

        <div className="trainer-section">

          <h2>🎓 Образование</h2>

          <p>{trainer.education}</p>

        </div>

      )}



      {trainer.achievements && trainer.achievements.length > 0 && (

        <div className="trainer-section">

          <h2>🏆 Достижения</h2>

          <ul className="achievements-list">

            {trainer.achievements.map((achievement, index) => (

              <li key={index}>{achievement}</li>

            ))}

          </ul>

        </div>

      )}



      {trainer.certificates && trainer.certificates.length > 0 && (

        <div className="trainer-section">

          <h2>📜 Сертификаты</h2>

          <ul className="certificates-list">

            {trainer.certificates.map((cert, index) => (

              <li key={index}>{cert}</li>

            ))}

          </ul>

        </div>

      )}



      {trainer.videoUrl && (

        <div className="trainer-section">

          <h2>🎬 Видео</h2>

          <div className="video-container">

            {trainer.videoUrl.includes('youtube.com') || trainer.videoUrl.includes('youtu.be') ? (

              <iframe

                src={trainer.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}

                title="Видео тренера"

                frameBorder="0"

                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"

                allowFullScreen

              />

            ) : (

              <video controls src={trainer.videoUrl} />

            )}

          </div>

        </div>

      )}



      {trainer.gallery && trainer.gallery.length > 0 && (

        <div className="trainer-section">

          <h2>📸 Галерея</h2>

          <div className="gallery-grid">

            {trainer.gallery.map((item, index) => (

              <div key={index} className="gallery-item">

                {item.type === 'video' ? (

                  <video src={item.url} controls />

                ) : (

                  <img src={item.url || item} alt={`Галерея ${index + 1}`} />

                )}

              </div>

            ))}

          </div>

        </div>

      )}



      {trainer.socialLinks && trainer.socialLinks.length > 0 && (

        <div className="trainer-section">

          <h2>🔗 Социальные сети</h2>

          <div className="social-links">

            {trainer.socialLinks.map((link, index) => (

              <a 

                key={index} 

                href={link.url} 

                target="_blank" 

                rel="noopener noreferrer"

                className="social-link"

              >

                {link.icon || '🔗'} {link.name || 'Ссылка'}

              </a>

            ))}

          </div>

        </div>

      )}



      <div className="trainer-actions">

        <Link to="/schedule" className="book-btn">

          Записаться на занятие

        </Link>

      </div>

    </div>

  );

};



export default TrainerProfile;

