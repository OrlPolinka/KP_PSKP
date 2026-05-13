import React, { useState, useEffect } from 'react';

import api from '../../services/api';

import './TrainerProfileEdit.css';

// Error Boundary для предотвращения черного экрана
class TrainerProfileErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('TrainerProfileEdit Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="trainer-profile-edit-page">
          <div className="error-message">
            <h2>⚠️ Ошибка в профиле тренера</h2>
            <p>Произошла ошибка. Попробуйте перезагрузить страницу.</p>
            <button onClick={() => window.location.reload()} className="retry-btn">
              🔄 Обновить страницу
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}



const TrainerProfileEdit = () => {

  const [trainer, setTrainer] = useState(null);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState(null);

  const [error, setError] = useState(null);



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



  const [gallery] = useState([]);

  const [achievements, setAchievements] = useState([]);

  const [certificates, setCertificates] = useState([]);

  const [socialLinks, setSocialLinks] = useState([]);




  const photoFileRef = React.useRef();

  const videoFileRef = React.useRef();




  // Сжатие изображения перед сохранением

  const compressImage = (file) => new Promise((resolve) => {

    const reader = new FileReader();

    reader.onload = (ev) => {

      const img = new Image();

      img.onload = () => {

        const canvas = document.createElement('canvas');

        const MAX = 600;

        let w = img.width, h = img.height;

        if (w > h) { if (w > MAX) { h = h * MAX / w; w = MAX; } }

        else { if (h > MAX) { w = w * MAX / h; h = MAX; } }

        canvas.width = w; canvas.height = h;

        canvas.getContext('2d').drawImage(img, 0, 0, w, h);

        resolve(canvas.toDataURL('image/jpeg', 0.75));

      };

      img.src = ev.target.result;

    };

    reader.readAsDataURL(file);

  });




  // Конвертация видео в base64

  const readFileAsBase64 = (file) => new Promise((resolve, reject) => {

    if (file.size > 50 * 1024 * 1024) { reject(new Error('Файл слишком большой (макс. 50 МБ)')); return; }

    const reader = new FileReader();

    reader.onload = (ev) => resolve(ev.target.result);

    reader.onerror = reject;

    reader.readAsDataURL(file);

  });




  const handlePhotoFileChange = async (e) => {

    const file = e.target.files[0];

    if (!file) return;

    if (file.size > 10 * 1024 * 1024) { setMessage({ type: 'error', text: 'Фото слишком большое (макс. 10 МБ)' }); return; }

    try {

      const base64 = await compressImage(file);

      setFormData(prev => ({ ...prev, photoUrl: base64 }));

      setMessage({ type: 'success', text: 'Фото загружено' });

    } catch { setMessage({ type: 'error', text: 'Ошибка при загрузке фото' }); }

  };



  const handleVideoFileChange = async (e) => {

    const file = e.target.files[0];

    if (!file) return;

    try {

      setMessage({ type: 'success', text: 'Загрузка видео...' });

      const base64 = await readFileAsBase64(file);

      setFormData(prev => ({ ...prev, videoUrl: base64 }));

      setMessage({ type: 'success', text: 'Видео загружено' });

    } catch (err) { setMessage({ type: 'error', text: err.message || 'Ошибка при загрузке видео' }); }

  };



  useEffect(() => {

    fetchTrainerProfile();

  }, []);




  const fetchTrainerProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      
      // Получаем информацию о текущем тренере
      const meResponse = await api.get('/auth/me');
      const trainerInfo = meResponse.data.user?.trainerInfo;
      
      if (trainerInfo) {
        setTrainer(trainerInfo);
        
        // Безопасная обработка медиа файлов
        let safePhotoUrl = '';
        let safeVideoUrl = '';
        
        try {
          safePhotoUrl = trainerInfo && trainerInfo.photoUrl && trainerInfo.photoUrl.length < 1000000 ? trainerInfo.photoUrl : '';
        } catch (e) {
          console.warn('Error processing photoUrl:', e);
        }
        
        try {
          safeVideoUrl = trainerInfo && trainerInfo.videoUrl && trainerInfo.videoUrl.length < 1000000 ? trainerInfo.videoUrl : '';
        } catch (e) {
          console.warn('Error processing videoUrl:', e);
        }
        
        setFormData({
          specialization: trainerInfo.specialization || '',
          bio: trainerInfo.bio || '',
          photoUrl: safePhotoUrl,
          videoUrl: safeVideoUrl,
          experience: trainerInfo.experience || '',
          education: trainerInfo.education || '',
          customPageTitle: trainerInfo.customPageTitle || '',
          customPageContent: trainerInfo.customPageContent || '',
          isPublished: trainerInfo.isPublished || false
        });
      }
    } catch (err) {
      console.error('Ошибка при загрузке профиля:', err);
      setError('Не удалось загрузить профиль. Попробуйте обновить страницу.');
      setMessage({ type: 'error', text: 'Ошибка при загрузке профиля' });
      
      // Устанавливаем безопасные значения по умолчанию
      setTrainer({});
      setFormData({
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
    console.log('handleSubmit called', { formData, trainer, gallery, achievements, certificates, socialLinks });
    
    try {
      setSaving(true);
      setMessage(null);

      const data = {
        ...formData,
        experience: formData.experience ? parseInt(formData.experience) : null,
        gallery: gallery && gallery.length > 0 ? gallery : null,
        achievements: achievements && achievements.filter(a => a.trim()).length > 0 ? achievements.filter(a => a.trim()) : null,
        certificates: certificates && certificates.filter(c => c.trim()).length > 0 ? certificates.filter(c => c.trim()) : null,
        socialLinks: socialLinks && socialLinks.filter(s => s.url.trim()).length > 0 ? socialLinks.filter(s => s.url.trim()) : null
      };

      console.log('Sending data to API:', data);
      const response = await api.put(`/trainer/profile/${trainer.id}`, data);
      console.log('API response:', response);
      
      setMessage({ type: 'success', text: 'Профиль успешно сохранён!' });
      
      // Перезагружаем данные профиля после сохранения с защитой от ошибок
      try {
        await fetchTrainerProfile();
      } catch (fetchError) {
        console.error('Error fetching trainer profile after save:', fetchError);
        // Не показываем ошибку пользователю, просто логируем
      }
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



  if (!trainer || error) {

    return (

      <div className="trainer-profile-edit-page">

        <div className="error-message">

          {error || 'Профиль тренера не найден'}

        </div>

        <button onClick={() => window.location.reload()} className="retry-btn">

          Попробовать снова

        </button>

      </div>

    );

  }



  return (
    <TrainerProfileErrorBoundary>
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

            <label>Фото профиля</label>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

              <button type="button" className="add-btn" onClick={() => photoFileRef.current?.click()}

                style={{ whiteSpace: 'nowrap', background: 'rgba(139,92,246,0.15)', color: 'var(--primary-light)' }}>

                📁 Выбрать фото с компьютера

              </button>

              {formData.photoUrl && (

                <button type="button" className="remove-btn" onClick={() => setFormData(prev => ({ ...prev, photoUrl: '' }))}>✕</button>

              )}

            </div>

            <input ref={photoFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoFileChange} />

            {formData.photoUrl && (

              <div style={{ marginTop: '10px' }}>

                <img src={formData.photoUrl} alt="preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '10px', border: '2px solid rgba(139,92,246,0.3)' }} />

              </div>

            )}

          </div>



          <div className="form-group">

            <label>Видео (файл с компьютера)</label>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

              <button type="button" className="add-btn" onClick={() => videoFileRef.current?.click()}

                style={{ whiteSpace: 'nowrap', background: 'rgba(139,92,246,0.15)', color: 'var(--primary-light)' }}>

                🎬 Выбрать видео с компьютера

              </button>

              {formData.videoUrl && (

                <button type="button" className="remove-btn" onClick={() => setFormData(prev => ({ ...prev, videoUrl: '' }))}>✕</button>

              )}

            </div>

            <input ref={videoFileRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={handleVideoFileChange} />

            {formData.videoUrl && formData.videoUrl.startsWith('data:video') && (

              <div style={{ marginTop: '10px' }}>

                <video src={formData.videoUrl} controls style={{ width: '100%', maxHeight: '200px', borderRadius: '10px' }} />

              </div>

            )}

          </div>

        </div>



        <div className="form-section">

          <h2>Достижения</h2>

          {achievements && achievements.map((achievement, index) => (

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

          {certificates && certificates.map((cert, index) => (

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

          <h2>Социальные сети</h2>

          {socialLinks && socialLinks.map((link, index) => (

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
    </TrainerProfileErrorBoundary>
  );

};
export default TrainerProfileEdit;
