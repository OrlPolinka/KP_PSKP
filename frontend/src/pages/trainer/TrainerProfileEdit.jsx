import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './TrainerProfileEdit.css';

const TrainerProfileEdit = () => {
  const [trainer, setTrainer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const [formData, setFormData] = useState({
    specialization: '',
    bio: '',
    photoUrl: '',
    videoUrl: '',
    experience: '',
    education: '',
    customPageTitle: '',
    customPageContent: '',
    isPublished: false
  });

  const [gallery, setGallery] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [socialLinks, setSocialLinks] = useState([]);

  useEffect(() => {
    fetchTrainerProfile();
  }, []);

  const fetchTrainerProfile = async () => {
    try {
      setLoading(true);
      // Получаем информацию о текущем тренере
      const meResponse = await api.get('/auth/me');
      const trainerInfo = meResponse.data.user?.trainerInfo;
      
      if (trainerInfo) {
        setTrainer(trainerInfo);
        setFormData({
          specialization: trainerInfo.specialization || '',
          bio: trainerInfo.bio || '',
          photoUrl: trainerInfo.photoUrl || '',
          videoUrl: trainerInfo.videoUrl || '',
          experience: trainerInfo.experience || '',
          education: trainerInfo.education || '',
          customPageTitle: trainerInfo.customPageTitle || '',
          customPageContent: trainerInfo.customPageContent || '',
          isPublished: trainerInfo.isPublished || false
        });
        
        if (trainerInfo.gallery) {
          try { setGallery(JSON.parse(trainerInfo.gallery)); } catch (e) {}
        }
        if (trainerInfo.achievements) {
          try { setAchievements(JSON.parse(trainerInfo.achievements)); } catch (e) {}
        }
        if (trainerInfo.certificates) {
          try { setCertificates(JSON.parse(trainerInfo.certificates)); } catch (e) {}
        }
        if (trainerInfo.socialLinks) {
          try { setSocialLinks(JSON.parse(trainerInfo.socialLinks)); } catch (e) {}
        }
      }
    } catch (err) {
      console.error('Ошибка при загрузке профиля:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addGalleryItem = () => {
    setGallery([...gallery, { url: '', type: 'image' }]);
  };

  const updateGalleryItem = (index, field, value) => {
    const updated = [...gallery];
    updated[index][field] = value;
    setGallery(updated);
  };

  const removeGalleryItem = (index) => {
    setGallery(gallery.filter((_, i) => i !== index));
  };

  const addAchievement = () => {
    setAchievements([...achievements, '']);
  };

  const updateAchievement = (index, value) => {
    const updated = [...achievements];
    updated[index] = value;
    setAchievements(updated);
  };

  const removeAchievement = (index) => {
    setAchievements(achievements.filter((_, i) => i !== index));
  };

  const addCertificate = () => {
    setCertificates([...certificates, '']);
  };

  const updateCertificate = (index, value) => {
    const updated = [...certificates];
    updated[index] = value;
    setCertificates(updated);
  };

  const removeCertificate = (index) => {
    setCertificates(certificates.filter((_, i) => i !== index));
  };

  const addSocialLink = () => {
    setSocialLinks([...socialLinks, { name: '', url: '', icon: '' }]);
  };

  const updateSocialLink = (index, field, value) => {
    const updated = [...socialLinks];
    updated[index][field] = value;
    setSocialLinks(updated);
  };

  const removeSocialLink = (index) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setMessage(null);

      const data = {
        ...formData,
        experience: formData.experience ? parseInt(formData.experience) : null,
        gallery: gallery.length > 0 ? gallery : null,
        achievements: achievements.filter(a => a.trim()).length > 0 ? achievements.filter(a => a.trim()) : null,
        certificates: certificates.filter(c => c.trim()).length > 0 ? certificates.filter(c => c.trim()) : null,
        socialLinks: socialLinks.filter(s => s.url.trim()).length > 0 ? socialLinks.filter(s => s.url.trim()) : null
      };

      await api.put(`/trainer/profile/${trainer.id}`, data);
      
      setMessage({ type: 'success', text: 'Профиль успешно сохранён!' });
    } catch (err) {
      console.error('Ошибка при сохранении:', err);
      setMessage({ type: 'error', text: 'Ошибка при сохранении профиля' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="trainer-profile-edit-page">
        <div className="loading-spinner">Загрузка...</div>
      </div>
    );
  }

  if (!trainer) {
    return (
      <div className="trainer-profile-edit-page">
        <div className="error-message">Профиль тренера не найден</div>
      </div>
    );
  }

  return (
    <div className="trainer-profile-edit-page">
      <div className="page-header">
        <h1>👤 Редактирование профиля</h1>
        <p>Заполните информацию о себе для публичной страницы</p>
      </div>

      <form onSubmit={handleSubmit} className="profile-form">
        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="form-section">
          <h2>Основная информация</h2>
          
          <div className="form-group">
            <label>Специализация</label>
            <input
              type="text"
              name="specialization"
              value={formData.specialization}
              onChange={handleChange}
              placeholder="Например: Hip-Hop, Contemporary, Stretching"
            />
          </div>

          <div className="form-group">
            <label>О себе</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Расскажите о своём опыте и подходе к обучению"
              rows={4}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Опыт (лет)</label>
              <input
                type="number"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Образование</label>
              <input
                type="text"
                name="education"
                value={formData.education}
                onChange={handleChange}
                placeholder="Учебное заведение, специальность"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Медиа</h2>
          
          <div className="form-group">
            <label>URL фото профиля</label>
            <input
              type="url"
              name="photoUrl"
              value={formData.photoUrl}
              onChange={handleChange}
              placeholder="https://..."
            />
          </div>

          <div className="form-group">
            <label>URL видео (YouTube или прямая ссылка)</label>
            <input
              type="url"
              name="videoUrl"
              value={formData.videoUrl}
              onChange={handleChange}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>
        </div>

        <div className="form-section">
          <h2>Достижения</h2>
          {achievements.map((achievement, index) => (
            <div key={index} className="dynamic-field">
              <input
                type="text"
                value={achievement}
                onChange={(e) => updateAchievement(index, e.target.value)}
                placeholder="Достижение"
              />
              <button type="button" className="remove-btn" onClick={() => removeAchievement(index)}>✕</button>
            </div>
          ))}
          <button type="button" className="add-btn" onClick={addAchievement}>+ Добавить достижение</button>
        </div>

        <div className="form-section">
          <h2>Сертификаты</h2>
          {certificates.map((cert, index) => (
            <div key={index} className="dynamic-field">
              <input
                type="text"
                value={cert}
                onChange={(e) => updateCertificate(index, e.target.value)}
                placeholder="Название сертификата"
              />
              <button type="button" className="remove-btn" onClick={() => removeCertificate(index)}>✕</button>
            </div>
          ))}
          <button type="button" className="add-btn" onClick={addCertificate}>+ Добавить сертификат</button>
        </div>

        <div className="form-section">
          <h2>Галерея (фото/видео)</h2>
          {gallery.map((item, index) => (
            <div key={index} className="gallery-item-edit">
              <select
                value={item.type}
                onChange={(e) => updateGalleryItem(index, 'type', e.target.value)}
              >
                <option value="image">Фото</option>
                <option value="video">Видео</option>
              </select>
              <input
                type="url"
                value={item.url}
                onChange={(e) => updateGalleryItem(index, 'url', e.target.value)}
                placeholder="URL"
              />
              <button type="button" className="remove-btn" onClick={() => removeGalleryItem(index)}>✕</button>
            </div>
          ))}
          <button type="button" className="add-btn" onClick={addGalleryItem}>+ Добавить в галерею</button>
        </div>

        <div className="form-section">
          <h2>Социальные сети</h2>
          {socialLinks.map((link, index) => (
            <div key={index} className="social-link-edit">
              <input
                type="text"
                value={link.name}
                onChange={(e) => updateSocialLink(index, 'name', e.target.value)}
                placeholder="Название (Instagram, VK...)"
              />
              <input
                type="url"
                value={link.url}
                onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                placeholder="URL"
              />
              <button type="button" className="remove-btn" onClick={() => removeSocialLink(index)}>✕</button>
            </div>
          ))}
          <button type="button" className="add-btn" onClick={addSocialLink}>+ Добавить ссылку</button>
        </div>

        <div className="form-section">
          <h2>Публичная страница</h2>
          
          <div className="form-group">
            <label>Заголовок страницы</label>
            <input
              type="text"
              name="customPageTitle"
              value={formData.customPageTitle}
              onChange={handleChange}
              placeholder="Например: Добро пожаловать в мир танца!"
            />
          </div>

          <div className="form-group">
            <label>Содержимое страницы</label>
            <textarea
              name="customPageContent"
              value={formData.customPageContent}
              onChange={handleChange}
              placeholder="Дополнительная информация, расписание и т.д."
              rows={6}
            />
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="isPublished"
                checked={formData.isPublished}
                onChange={handleChange}
              />
              Опубликовать страницу (видна клиентам)
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="save-btn" disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить профиль'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TrainerProfileEdit;
