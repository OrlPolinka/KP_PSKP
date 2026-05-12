import React, { useState, useEffect, useRef } from 'react';

import api from '../../services/api';

import './TrainingInfoManager.css';



const TrainingInfoManager = () => {

  const [infoList, setInfoList] = useState([]);

  const [loading, setLoading] = useState(true);

  const [editingInfo, setEditingInfo] = useState(null);

  const [showModal, setShowModal] = useState(false);

  const [filter, setFilter] = useState('all');



  const categories = [

    { key: 'preparation', label: 'Подготовка' },

    { key: 'what_to_bring', label: 'Что взять с собой' },

    { key: 'rules', label: 'Правила' },

    { key: 'tips', label: 'Советы' }

  ];



  const [formData, setFormData] = useState({

    title: '',

    content: '',

    category: 'preparation',

    videoUrl: '',

    imageUrl: '',

    order: 0,

    isActive: true

  });

  const videoFileRef = useRef(null);

  const imageFileRef = useRef(null);

  // Конвертация файлов в base64 как у тренера
  const readFileAsBase64 = (file) => new Promise((resolve, reject) => {
    if (file.size > 50 * 1024 * 1024) { 
      reject(new Error('Файл слишком большой (макс. 50 МБ)')); 
      return; 
    }
    const reader = new FileReader();
    reader.onload = (ev) => resolve(ev.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });



  useEffect(() => {

    fetchInfo();

  }, []);



  const fetchInfo = async () => {

    try {

      setLoading(true);

      const response = await api.get('/training-info');

      setInfoList(response.data.trainingInfo || []);

    } catch (err) {

      console.error('Ошибка при загрузке информации:', err);

    } finally {

      setLoading(false);

    }

  };



  const openModal = (info = null) => {

    if (info) {

      setEditingInfo(info);

      setFormData({

        title: info.title,

        content: info.content,

        category: info.category,

        videoUrl: info.videoUrl || '',

        imageUrl: info.imageUrl || '',

        order: info.order || 0,

        isActive: info.isActive

      });

    } else {

      setEditingInfo(null);

      setFormData({

        title: '',

        content: '',

        category: 'preparation',

        videoUrl: '',

        imageUrl: '',

        order: 0,

        isActive: true

      });

    }

    setShowModal(true);

  };



  const closeModal = () => {

    setShowModal(false);

    setEditingInfo(null);

  };



  const handleChange = (e) => {

    const { name, value, type, checked } = e.target;

    setFormData(prev => ({

      ...prev,

      [name]: type === 'checkbox' ? checked : value

    }));

  };

  const handleVideoFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const base64 = await readFileAsBase64(file);
        setFormData(prev => ({ ...prev, videoUrl: base64 }));
      } catch (err) {
        console.error('Ошибка при загрузке видео:', err);
        alert('Ошибка при загрузке видео: ' + (err.message || 'Неизвестная ошибка'));
      }
    }
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const base64 = await readFileAsBase64(file);
        setFormData(prev => ({ ...prev, imageUrl: base64 }));
      } catch (err) {
        console.error('Ошибка при загрузке изображения:', err);
        alert('Ошибка при загрузке изображения: ' + (err.message || 'Неизвестная ошибка'));
      }
    }
  };



  const handleSubmit = async (e) => {

    e.preventDefault();

    

    try {

      const data = {

        ...formData,

        order: formData.order ? parseInt(formData.order) : 0

      };



      if (editingInfo) {

        await api.put(`/training-info/${editingInfo.id}`, data);

      } else {

        await api.post('/training-info', data);

      }



      closeModal();

      fetchInfo();

    } catch (err) {

      console.error('Ошибка при сохранении:', err);

      alert('Ошибка при сохранении');

    }

  };



  const handleDelete = async (id) => {

    if (!window.confirm('Удалить эту информацию?')) return;

    

    try {

      await api.delete(`/training-info/${id}`);

      fetchInfo();

    } catch (err) {

      console.error('Ошибка при удалении:', err);

      alert('Ошибка при удалении');

    }

  };



  const getCategoryLabel = (key) => {

    const cat = categories.find(c => c.key === key);

    return cat ? cat.label : key;

  };



  const filteredInfo = filter === 'all' 

    ? infoList 

    : infoList.filter(item => item.category === filter);



  if (loading) {

    return <div className="loading-spinner">Загрузка...</div>;

  }



  return (

    <div className="training-info-manager">

      <div className="page-header">

        <h1>📚 Информация о подготовке</h1>

        <button className="add-btn" onClick={() => openModal()}>+ Добавить</button>

      </div>



      <div className="filter-tabs">

        <button 

          className={`tab ${filter === 'all' ? 'active' : ''}`}

          onClick={() => setFilter('all')}

        >

          Все

        </button>

        {categories.map(cat => (

          <button

            key={cat.key}

            className={`tab ${filter === cat.key ? 'active' : ''}`}

            onClick={() => setFilter(cat.key)}

          >

            {cat.label}

          </button>

        ))}

      </div>



      <div className="info-list">

        {filteredInfo.map(info => (

          <div key={info.id} className="info-card">

            <div className="info-card-header">

              <span className="info-category">{getCategoryLabel(info.category)}</span>

              <span className={`info-status ${info.isActive ? 'active' : 'inactive'}`}>

                {info.isActive ? 'Активно' : 'Неактивно'}

              </span>

            </div>

            <h3>{info.title}</h3>

            <p>{info.content.length > 150 ? info.content.substring(0, 150) + '...' : info.content}</p>

            <div className="info-card-footer">

              <span className="info-order">Порядок: {info.order}</span>

              <div className="info-actions">

                <button className="edit-btn" onClick={() => openModal(info)}>✏️</button>

                <button className="delete-btn" onClick={() => handleDelete(info.id)}>🗑️</button>

              </div>

            </div>

          </div>

        ))}

      </div>



      {showModal && (

        <div className="modal-overlay" onClick={closeModal}>

          <div className="modal" onClick={e => e.stopPropagation()}>

            <h2>{editingInfo ? 'Редактировать' : 'Добавить информацию'}</h2>

            <form onSubmit={handleSubmit}>

              <div className="form-group">

                <label>Заголовок *</label>

                <input name="title" value={formData.title} onChange={handleChange} required />

              </div>

              

              <div className="form-group">

                <label>Содержимое *</label>

                <textarea name="content" value={formData.content} onChange={handleChange} rows={5} required />

              </div>

              

              <div className="form-row">

                <div className="form-group">

                  <label>Категория</label>

                  <select name="category" value={formData.category} onChange={handleChange}>

                    {categories.map(cat => (

                      <option key={cat.key} value={cat.key}>{cat.label}</option>

                    ))}

                  </select>

                </div>

                <div className="form-group">

                  <label>Порядок</label>

                  <input type="number" name="order" value={formData.order} onChange={handleChange} />

                </div>

              </div>

              

              <div className="form-row">

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

                      <video src={formData.videoUrl} controls style={{ width: '100%', maxHeight: '150px', borderRadius: '8px' }} />

                    </div>

                  )}

                </div>

                <div className="form-group">

                  <label>Изображение (файл с компьютера)</label>

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

                      <img src={formData.imageUrl} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '10px', border: '2px solid rgba(139,92,246,0.3)' }} />

                    </div>

                  )}

                </div>

              </div>

              

              <div className="form-group checkbox">

                <label>

                  <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} />

                  Активно

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



export default TrainingInfoManager;

