import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Profile = () => {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});
  const [passwordData, setPasswordData] = useState({ current: '', newPass: '', confirm: '' });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const fileInputRef = useRef();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/me');
      const p = response.data.user;
      setProfile(p);
      setFormData({
        fullName: p.fullName || '',
        phone: p.phone || '',
        email: p.email || '',
      });
      // Sync photo from DB to localStorage
      if (p.photoUrl) {
        try {
          localStorage.setItem(`avatar_${p.id}`, p.photoUrl);
        } catch {
          // localStorage full — use photoUrl directly
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await api.put(`/users/${profile.id}/profile`, {
        fullName: formData.fullName,
        phone: formData.phone,
      });
      setMessage({ type: 'success', text: 'Профиль обновлён' });
      setEditing(false);
      fetchProfile();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Ошибка при сохранении' });
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Файл слишком большой. Максимум 5 МБ' });
      return;
    }

    // Compress image before saving
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = async () => {
        // Create canvas and resize
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64 with compression (JPEG 0.7 quality)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);

        // Check size
        if (compressedBase64.length > 500000) { // ~500KB limit
          setMessage({ type: 'error', text: 'Изображение слишком большое даже после сжатия. Попробуйте другое фото.' });
          return;
        }

        // Save to localStorage for immediate display
        try {
          localStorage.setItem(`avatar_${profile.id}`, compressedBase64);
        } catch (quotaErr) {
          // If localStorage is full, clear old avatars
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('avatar_') && key !== `avatar_${profile.id}`) {
              localStorage.removeItem(key);
            }
          });
          try {
            localStorage.setItem(`avatar_${profile.id}`, compressedBase64);
          } catch {
            setMessage({ type: 'error', text: 'Не удалось сохранить фото локально. Очистите кэш браузера.' });
            return;
          }
        }

        setProfile(prev => ({ ...prev, _localAvatar: compressedBase64, photoUrl: compressedBase64 }));

        // Save to DB
        try {
          await api.put(`/users/${profile.id}/profile`, { photoUrl: compressedBase64 });
          setMessage({ type: 'success', text: 'Фото обновлено' });
        } catch (err) {
          setMessage({ type: 'warning', text: 'Фото сохранено локально, но не удалось сохранить в БД' });
        }
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const getRoleName = (role) => {
    switch (role) {
      case 'admin': return '👑 Администратор';
      case 'trainer': return '🏋️ Тренер';
      case 'client': return '🎓 Клиент';
      default: return role;
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin': return 'badge-warning';
      case 'trainer': return 'badge-purple';
      case 'client': return 'badge-info';
      default: return 'badge-info';
    }
  };

  if (loading) return (
    <div className="loading">
      <div className="spinner" />
      <span>Загрузка профиля...</span>
    </div>
  );

  const initials = profile?.fullName
    ? profile.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : profile?.email?.[0]?.toUpperCase() || '?';

  const localAvatar = localStorage.getItem(`avatar_${profile?.id}`);
  const avatarSrc = profile?._localAvatar || profile?.photoUrl || localAvatar || profile?.trainerInfo?.[0]?.photoUrl;

  const activeMemberships = profile?.memberships?.filter(m => m.status === 'active') || [];

  return (
    <div className="container" style={{ maxWidth: '900px' }}>
      <div className="page-header">
        <h1 className="page-title">Личный кабинет</h1>
      </div>

      {message && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : message.type === 'warning' ? 'alert-warning' : 'alert-error'}`} style={{ marginBottom: '20px' }}>
          {message.type === 'success' ? '✅' : message.type === 'warning' ? '⚠️' : '❌'} {message.text}
        </div>
      )}

      {/* Profile header card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(236,72,153,0.08))',
        border: '1px solid rgba(139,92,246,0.25)',
        borderRadius: '20px',
        padding: '32px',
        marginBottom: '24px',
        display: 'flex',
        gap: '24px',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        {/* Avatar */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div
            onClick={handlePhotoClick}
            style={{
              width: '100px', height: '100px',
              borderRadius: '50%',
              background: avatarSrc ? 'transparent' : 'linear-gradient(135deg, #8B5CF6, #EC4899)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '36px', fontWeight: '700', color: 'white',
              cursor: 'pointer',
              border: '3px solid rgba(139,92,246,0.4)',
              overflow: 'hidden',
              transition: 'all 0.2s ease',
              boxShadow: '0 8px 24px rgba(139,92,246,0.3)',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            {avatarSrc ? (
              <img src={avatarSrc} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : initials}
          </div>
          <div
            onClick={handlePhotoClick}
            style={{
              position: 'absolute', bottom: '2px', right: '2px',
              width: '28px', height: '28px',
              background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', cursor: 'pointer',
              border: '2px solid var(--dark)',
            }}
          >
            📷
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handlePhotoChange}
          />
        </div>

        {/* Info */}
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '26px', fontWeight: '700', color: 'white', marginBottom: '6px' }}>
            {profile?.fullName}
          </h2>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
            <span className={`badge ${getRoleBadge(profile?.role)}`}>
              {getRoleName(profile?.role)}
            </span>
            <span className={`badge ${profile?.isActive ? 'badge-success' : 'badge-danger'}`}>
              {profile?.isActive ? '🟢 Активен' : '🔴 Заблокирован'}
            </span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
            📧 {profile?.email}
            {profile?.phone && <> &nbsp;|&nbsp; 📞 {profile.phone}</>}
          </p>
          {profile?.createdAt && (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', marginTop: '4px' }}>
              Зарегистрирован: {new Date(profile.createdAt).toLocaleDateString('ru-RU')}
            </p>
          )}
        </div>

        {/* Quick stats for client */}
        {profile?.role === 'client' && (
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '28px', fontWeight: '800',
                background: 'linear-gradient(135deg, #A78BFA, #EC4899)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                {activeMemberships.length}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Абонементов</div>
            </div>
          </div>
        )}

        {/* Trainer info */}
        {profile?.role === 'trainer' && profile?.trainerInfo?.[0] && (
          <div style={{ flex: 1, minWidth: '200px' }}>
            {profile.trainerInfo[0].specialization && (
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '4px' }}>
                🎯 {profile.trainerInfo[0].specialization}
              </p>
            )}
            {profile.trainerInfo[0].hireDate && (
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                Работает с: {new Date(profile.trainerInfo[0].hireDate).toLocaleDateString('ru-RU')}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
        {[
          { key: 'info', label: '👤 Информация' },
          ...(profile?.role === 'client' ? [{ key: 'memberships', label: '🎫 Абонементы' }] : []),
          ...(profile?.role === 'trainer' ? [{ key: 'trainer', label: '🏋️ Тренер' }] : []),
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 20px',
              border: 'none', borderRadius: '10px',
              cursor: 'pointer', fontSize: '14px', fontWeight: '600',
              fontFamily: 'Inter, sans-serif', transition: 'all 0.2s ease',
              background: activeTab === tab.key
                ? 'linear-gradient(135deg, #8B5CF6, #7C3AED)' : 'transparent',
              color: activeTab === tab.key ? 'white' : 'rgba(255,255,255,0.5)',
              boxShadow: activeTab === tab.key ? '0 4px 12px rgba(139,92,246,0.4)' : 'none',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'info' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white' }}>Личные данные</h3>
            {!editing ? (
              <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}>
                ✏️ Редактировать
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Отмена</button>
                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                  {saving ? '⏳ Сохранение...' : '💾 Сохранить'}
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>ФИО</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                />
              ) : (
                <div style={{ padding: '12px 0', color: 'white', fontSize: '15px' }}>
                  {profile?.fullName || '—'}
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Email</label>
              <div style={{ padding: '12px 0', color: 'rgba(255,255,255,0.6)', fontSize: '15px' }}>
                {profile?.email}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Телефон</label>
              {editing ? (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+7 (999) 123-45-67"
                />
              ) : (
                <div style={{ padding: '12px 0', color: 'white', fontSize: '15px' }}>
                  {profile?.phone || '—'}
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Роль</label>
              <div style={{ padding: '12px 0' }}>
                <span className={`badge ${getRoleBadge(profile?.role)}`}>
                  {getRoleName(profile?.role)}
                </span>
              </div>
            </div>
          </div>

          <div className="divider" />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white' }}>Безопасность</h3>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setShowPasswordForm(!showPasswordForm)}
            >
              🔐 Сменить пароль
            </button>
          </div>

          {showPasswordForm && (
            <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Текущий пароль</label>
                <input
                  type="password"
                  value={passwordData.current}
                  onChange={e => setPasswordData({ ...passwordData, current: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Новый пароль</label>
                <input
                  type="password"
                  value={passwordData.newPass}
                  onChange={e => setPasswordData({ ...passwordData, newPass: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Подтвердить</label>
                <input
                  type="password"
                  value={passwordData.confirm}
                  onChange={e => setPasswordData({ ...passwordData, confirm: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    if (passwordData.newPass !== passwordData.confirm) {
                      setMessage({ type: 'error', text: 'Пароли не совпадают' });
                      return;
                    }
                    setMessage({ type: 'info', text: 'Смена пароля: обратитесь к администратору или используйте API' });
                  }}
                >
                  Сохранить пароль
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'memberships' && (
        <div>
          {activeMemberships.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎫</div>
              <div className="empty-state-title">Нет активных абонементов</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activeMemberships.map(m => (
                <div key={m.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white' }}>
                      {m.membershipType?.name}
                    </h3>
                    <span className="badge badge-success">✅ Активен</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Осталось занятий</div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: m.remainingVisits <= 3 ? '#EF4444' : '#10B981' }}>
                        {m.remainingVisits === null ? '∞' : m.remainingVisits}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>Действует до</div>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: 'white' }}>
                        {m.endDate ? new Date(m.endDate).toLocaleDateString('ru-RU') : 'Бессрочно'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'trainer' && profile?.trainerInfo?.[0] && (
        <div className="card">
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white', marginBottom: '20px' }}>
            Информация тренера
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Специализация
              </div>
              <div style={{ fontSize: '15px', color: 'white' }}>
                {profile.trainerInfo[0].specialization || '—'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Дата найма
              </div>
              <div style={{ fontSize: '15px', color: 'white' }}>
                {profile.trainerInfo[0].hireDate
                  ? new Date(profile.trainerInfo[0].hireDate).toLocaleDateString('ru-RU')
                  : '—'}
              </div>
            </div>
            {profile.trainerInfo[0].bio && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  О себе
                </div>
                <div style={{ fontSize: '15px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>
                  {profile.trainerInfo[0].bio}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
