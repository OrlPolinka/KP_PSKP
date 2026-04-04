import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/auth/me');
        setProfile(response.data.user);
      } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="container">
      <div className="card">
        <h2>Профиль пользователя</h2>
        <div className="form-group">
          <label>ФИО</label>
          <p><strong>{profile?.fullName}</strong></p>
        </div>
        <div className="form-group">
          <label>Email</label>
          <p><strong>{profile?.email}</strong></p>
        </div>
        <div className="form-group">
          <label>Телефон</label>
          <p><strong>{profile?.phone || 'Не указан'}</strong></p>
        </div>
        <div className="form-group">
          <label>Роль</label>
          <p><strong>
            {profile?.role === 'admin' ? 'Администратор' : 
             profile?.role === 'trainer' ? 'Тренер' : 'Клиент'}
          </strong></p>
        </div>
      </div>
    </div>
  );
};

export default Profile;