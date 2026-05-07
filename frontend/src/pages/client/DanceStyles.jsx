import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import './DanceStyles.css';

const DanceStyles = () => {
  const [styles, setStyles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(null);

  useEffect(() => {
    fetchStyles();
  }, []);

  const fetchStyles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dance-styles-detailed');
      setStyles(response.data.danceStyles || []);
    } catch (err) {
      console.error('Ошибка при загрузке стилей:', err);
      setError('Не удалось загрузить стили танцев');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyLabel = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'Начинающий';
      case 'intermediate': return 'Средний';
      case 'advanced': return 'Продвинутый';
      default: return 'Начинающий';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return '#10B981';
      case 'intermediate': return '#F59E0B';
      case 'advanced': return '#EF4444';
      default: return '#10B981';
    }
  };

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return '';
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtu.be')) {
        const id = u.pathname.split('/').filter(Boolean)[0];
        return id ? `https://www.youtube.com/embed/${id}` : url;
      }
      if (u.hostname.includes('youtube.com')) {
        if (u.pathname.includes('/shorts/')) {
          const id = u.pathname.split('/shorts/')[1]?.split('/')[0];
          return id ? `https://www.youtube.com/embed/${id}` : url;
        }
        const id = u.searchParams.get('v');
        return id ? `https://www.youtube.com/embed/${id}` : url;
      }
      return url;
    } catch {
      return url;
    }
  };

  if (loading) {
    return (
      <div className="dance-styles-page">
        <div className="loading-spinner">Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dance-styles-page">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="dance-styles-page">
      <div className="page-header">
        <h1>💃 Стили танцев</h1>
        <p>Выберите направление, которое вам интересно</p>
      </div>

      <div className="styles-grid">
        {styles.map(style => (
          <div 
            key={style.id} 
            className={`style-card ${selectedStyle === style.id ? 'expanded' : ''}`}
            onClick={() => setSelectedStyle(selectedStyle === style.id ? null : style.id)}
          >
            <div className="style-card-header">
              {style.imageUrl && (
                <img src={style.imageUrl} alt={style.name} className="style-image" />
              )}
              <div className="style-header-overlay">
                <h3>{style.name}</h3>
                <div className="style-meta">
                  {style.difficulty && (
                    <span 
                      className="difficulty-badge"
                      style={{ background: getDifficultyColor(style.difficulty) }}
                    >
                      {getDifficultyLabel(style.difficulty)}
                    </span>
                  )}
                  {style.duration && (
                    <span className="duration">⏱️ {style.duration} мин</span>
                  )}
                  {style.calories && (
                    <span className="calories">🔥 {style.calories} ккал</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="style-card-body">
              <p className="style-description">{style.description}</p>
              
              {selectedStyle === style.id && (
                <div className="style-details">
                  {style.longDescription && (
                    <div className="detail-section">
                      <h4>Подробнее</h4>
                      <p>{style.longDescription}</p>
                    </div>
                  )}
                  
                  {style.benefits && style.benefits.length > 0 && (
                    <div className="detail-section">
                      <h4>Преимущества</h4>
                      <ul className="benefits-list">
                        {style.benefits.map((benefit, index) => (
                          <li key={index}>✓ {benefit}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {style.videoUrl && (
                    <div className="detail-section video-section">
                      <h4>Видео</h4>
                      <div className="video-container">
                        {style.videoUrl.includes('youtube.com') || style.videoUrl.includes('youtu.be') ? (
                          <iframe
                            src={getYouTubeEmbedUrl(style.videoUrl)}
                            title={style.name}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <video controls src={style.videoUrl} />
                        )}
                      </div>
                    </div>
                  )}
                  
                  <Link to={`/schedule?style=${style.id}`} className="view-schedule-btn">
                    Смотреть расписание
                  </Link>
                </div>
              )}
            </div>
            
            <div className="style-card-footer">
              <span className="expand-hint">
                {selectedStyle === style.id ? 'Свернуть ↑' : 'Подробнее ↓'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {styles.length === 0 && (
        <div className="no-styles">
          <p>Стили танцев не найдены</p>
        </div>
      )}
    </div>
  );
};

export default DanceStyles;
