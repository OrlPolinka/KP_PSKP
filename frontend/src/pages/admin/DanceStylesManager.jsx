import React, { useState, useEffect } from 'react';

import api from '../../services/api';

import './DanceStylesManager.css';



const DanceStylesManager = () => {

  const [styles, setStyles] = useState([]);

  const [loading, setLoading] = useState(true);

  const [editingStyle, setEditingStyle] = useState(null);

  const [showModal, setShowModal] = useState(false);



  const [formData, setFormData] = useState({

    name: '',

    description: '',

    longDescription: '',

    videoUrl: '',

    imageUrl: '',

    benefits: '',

    difficulty: 'beginner',

    duration: '',

    calories: '',

    isActive: true

  });



  const videoFileRef = React.useRef();

  const imageFileRef = React.useRef();



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



  const readFileAsBase64 = (file) => new Promise((resolve, reject) => {

    if (file.size > 50 * 1024 * 1024) { reject(new Error('Файл слишком большой (макс. 50 МБ)')); return; }

    const reader = new FileReader();

    reader.onload = (ev) => resolve(ev.target.result);

    reader.onerror = reject;

    reader.readAsDataURL(file);

  });



  const handleVideoFileChange = async (e) => {

    const file = e.target.files[0];

    if (!file) return;

    try {

      const base64 = await readFileAsBase64(file);

      setFormData(prev => ({ ...prev, videoUrl: base64 }));

    } catch (err) { 

      alert(err.message || 'Ошибка при загрузке видео'); 

    }

  };



  const handleImageFileChange = async (e) => {

    const file = e.target.files[0];

    if (!file) return;

    try {

      const base64 = await compressImage(file);

      setFormData(prev => ({ ...prev, imageUrl: base64 }));

    } catch (err) { 

      alert('Ошибка при загрузке изображения'); 

    }

  };



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

    } finally {

      setLoading(false);

    }

  };



  const openModal = (style = null) => {

    if (style) {

      setEditingStyle(style);

      setFormData({

        name: style.name,

        description: style.description || '',

        longDescription: style.longDescription || '',

        videoUrl: style.videoUrl || '',

        imageUrl: style.imageUrl || '',

        benefits: style.benefits?.join('\n') || '',

        difficulty: style.difficulty || 'beginner',

        duration: style.duration || '',

        calories: style.calories || '',

        isActive: style.isActive

      });

    } else {

      setEditingStyle(null);

      setFormData({

        name: '',

        description: '',

        longDescription: '',

        videoUrl: '',

        imageUrl: '',

        benefits: '',

        difficulty: 'beginner',

        duration: '',

        calories: '',

        isActive: true

      });

    }

    setShowModal(true);

  };



  const closeModal = () => {

    setShowModal(false);

    setEditingStyle(null);

  };



  const handleChange = (e) => {

    const { name, value, type, checked } = e.target;

    setFormData(prev => ({

      ...prev,

      [name]: type === 'checkbox' ? checked : value

    }));

  };



  const handleSubmit = async (e) => {

    e.preventDefault();

    

    try {

      const data = {

        ...formData,

        duration: formData.duration ? parseInt(formData.duration) : null,

        calories: formData.calories ? parseInt(formData.calories) : null,

        benefits: formData.benefits ? formData.benefits.split('\n').filter(b => b.trim()) : null

      };



      if (editingStyle) {

        await api.put(`/dance-styles-detailed/${editingStyle.id}`, data);

      } else {

        await api.post('/dance-styles', data);

      }



      closeModal();

      fetchStyles();

    } catch (err) {

      console.error('Ошибка при сохранении:', err);

      alert('Ошибка при сохранении стиля');

    }

  };



  const handleDelete = async (id) => {

    if (!window.confirm('Удалить этот стиль?')) return;

    

    try {

      await api.delete(`/dance-styles/${id}`);

      fetchStyles();

    } catch (err) {

      console.error('Ошибка при удалении:', err);

      alert('Ошибка при удалении стиля');

    }

  };



  if (loading) {

    return <div className="loading-spinner">Загрузка...</div>;

  }



  return (

    <div className="dance-styles-manager">

      <div className="page-header">

        <h1>💃 Управление стилями танцев</h1>

        <button className="add-btn" onClick={() => openModal()}>+ Добавить стиль</button>

      </div>



      <div className="styles-table">

        <table>

          <thead>

            <tr>

              <th>Название</th>

              <th>Сложность</th>

              <th>Длительность</th>

              <th>Калории</th>

              <th>Статус</th>

              <th>Действия</th>

            </tr>

          </thead>

          <tbody>

            {styles.map(style => (

              <tr key={style.id}>

                <td>

                  <strong>{style.name}</strong>

                  {style.description && (

                    <p className="style-desc">{style.description}</p>

                  )}

                </td>

                <td>

                  <span className={`difficulty-badge ${style.difficulty}`}>

                    {style.difficulty === 'beginner' ? 'Начинающий' : 

                     style.difficulty === 'intermediate' ? 'Средний' : 'Продвинутый'}

                  </span>

                </td>

                <td>{style.duration ? `${style.duration} мин` : '-'}</td>

                <td>{style.calories ? `${style.calories} ккал` : '-'}</td>

                <td>

                  <span className={`status-badge ${style.isActive ? 'active' : 'inactive'}`}>

                    {style.isActive ? 'Активен' : 'Неактивен'}

                  </span>

                </td>

                <td>

                  <div className="actions">

                    <button className="edit-btn" onClick={() => openModal(style)}>✏️</button>

                    <button className="delete-btn" onClick={() => handleDelete(style.id)}>🗑️</button>

                  </div>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>



      {showModal && (

        <div className="modal-overlay" onClick={closeModal}>

          <div className="modal" onClick={e => e.stopPropagation()}>

            <h2>{editingStyle ? 'Редактировать стиль' : 'Новый стиль танца'}</h2>

            <form onSubmit={handleSubmit}>

              <div className="form-group">

                <label>Название *</label>

                <input name="name" value={formData.name} onChange={handleChange} required />

              </div>

              

              <div className="form-group">

                <label>Краткое описание</label>

                <textarea name="description" value={formData.description} onChange={handleChange} rows={2} />

              </div>

              

              <div className="form-group">

                <label>Подробное описание</label>

                <textarea name="longDescription" value={formData.longDescription} onChange={handleChange} rows={4} />

              </div>

              

              <div className="form-row">

                <div className="form-group">

                  <label>Видео</label>

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

                      <video src={formData.videoUrl} controls style={{ width: '100%', maxHeight: '150px', borderRadius: '8px' }} />

                    </div>

                  )}

                </div>

                <div className="form-group">

                  <label>Изображение</label>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

                    <button type="button" className="add-btn" onClick={() => imageFileRef.current?.click()}

                      style={{ whiteSpace: 'nowrap', background: 'rgba(139,92,246,0.15)', color: 'var(--primary-light)' }}>

                      📁 Выбрать изображение с компьютера

                    </button>

                    {formData.imageUrl && (

                      <button type="button" className="remove-btn" onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}>✕</button>

                    )}

                  </div>

                  <input ref={imageFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageFileChange} />

                  {formData.imageUrl && formData.imageUrl.startsWith('data:image') && (

                    <div style={{ marginTop: '10px' }}>

                      <img src={formData.imageUrl} alt="preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />

                    </div>

                  )}

                </div>

              </div>

              

              <div className="form-group">

                <label>Преимущества (по одному на строку)</label>

                <textarea name="benefits" value={formData.benefits} onChange={handleChange} rows={3} />

              </div>

              

              <div className="form-row">

                <div className="form-group">

                  <label>Сложность</label>

                  <select name="difficulty" value={formData.difficulty} onChange={handleChange}>

                    <option value="beginner">Начинающий</option>

                    <option value="intermediate">Средний</option>

                    <option value="advanced">Продвинутый</option>

                  </select>

                </div>

                <div className="form-group">

                  <label>Длительность (мин)</label>

                  <input type="number" name="duration" value={formData.duration} onChange={handleChange} />

                </div>

                <div className="form-group">

                  <label>Калории</label>

                  <input type="number" name="calories" value={formData.calories} onChange={handleChange} />

                </div>

              </div>

              

              <div className="form-group checkbox">

                <label>

                  <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} />

                  Активен

                </label>

              </div>

              

              <div className="modal-actions">

                <button type="button" onClick={closeModal} className="cancel-btn">Отмена</button>

                <button type="submit" className="save-btn">Сохранить</button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>

  );

};



export default DanceStylesManager;

