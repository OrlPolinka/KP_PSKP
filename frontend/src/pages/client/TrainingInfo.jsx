import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './TrainingInfo.css';

const TrainingInfo = () => {
  const [info, setInfo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { key: 'all', label: 'Всё' },
    { key: 'preparation', label: 'Подготовка' },
    { key: 'what_to_bring', label: 'Что взять с собой' },
    { key: 'rules', label: 'Правила' },
    { key: 'tips', label: 'Советы' }
  ];

  useEffect(() => {
    fetchInfo();
  }, []);

  const fetchInfo = async () => {
    try {
      setLoading(true);
      const response = await api.get('/training-info');
      setInfo(response.data.trainingInfo || []);
    } catch (err) {
      console.error('Ошибка при загрузке информации:', err);
      setError('Не удалось загрузить информацию');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category) => {
    const cat = categories.find(c => c.key === category);
    return cat ? cat.label : category;
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'preparation': return '🏃';
      case 'what_to_bring': return '🎒';
      case 'rules': return '📋';
      case 'tips': return '💡';
      default: return '📝';
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

  const filteredInfo = activeCategory === 'all' 
    ? info 
    : info.filter(item => item.category === activeCategory);

  // Группируем по категориям для отображения
  const groupedInfo = filteredInfo.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="training-info-page">
        <div className="loading-spinner">Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="training-info-page">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="training-info-page">
      <div className="page-header">
        <h1>📋 Подготовка к тренировкам</h1>
        <p>Всё, что нужно знать перед занятием</p>
      </div>

      <div className="category-tabs">
        {categories.map(cat => (
          <button
            key={cat.key}
            className={`category-tab ${activeCategory === cat.key ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="info-content">
        {Object.entries(groupedInfo).map(([category, items]) => (
          <div key={category} className="info-section">
            <h2 className="section-title">
              <span className="section-icon">{getCategoryIcon(category)}</span>
              {getCategoryLabel(category)}
            </h2>
            
            <div className="info-cards">
              {items.map((item, index) => (
                <div key={item.id || index} className="info-card">
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt={item.title} className="info-card-image" />
                  )}
                  <div className="info-card-content">
                    <h3>{item.title}</h3>
                    <p>{item.content}</p>
                    {item.videoUrl && (
                      <div className="info-video">
                        {item.videoUrl.includes('youtube.com') || item.videoUrl.includes('youtu.be') ? (
                          <iframe
                            src={getYouTubeEmbedUrl(item.videoUrl)}
                            title={item.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <video controls src={item.videoUrl} />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredInfo.length === 0 && (
        <div className="no-info">
          <p>Информация не найдена</p>
        </div>
      )}
    </div>
  );
};

export default TrainingInfo;
