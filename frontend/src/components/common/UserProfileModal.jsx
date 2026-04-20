import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const UserProfileModal = ({ userId, onClose }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    api.get(`/users/${userId}`)
      .then(res => setProfile(res.data.user))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [userId]);

  if (!userId) return null;

  const roleConfig = {
    admin: { label: 'Администратор', badge: 'badge-warning', icon: '👑' },
    trainer: { label: 'Тренер', badge: 'badge-purple', icon: '🏋️' },
    client: { label: 'Клиент', badge: 'badge-info', icon: '🎓' },
  };
  const role = profile ? (roleConfig[profile.role] || roleConfig.client) : null;
  const initials = profile?.fullName
    ? profile.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const localAvatar = profile ? localStorage.getItem(`avatar_${profile.id}`) : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
        {loading ? (
          <div className="loading" style={{ padding: '40px' }}>
            <div className="spinner" />
          </div>
        ) : profile ? (
          <>
            <div className="modal-header">
              <h2 className="modal-title">Профиль пользователя</h2>
              <button className="modal-close" onClick={onClose}>×</button>
            </div>

            {/* Avatar + name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%', flexShrink: 0,
                background: localAvatar ? 'transparent' : 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '24px', fontWeight: '700', color: 'white',
                border: '3px solid rgba(139,92,246,0.3)',
                overflow: 'hidden',
              }}>
                {localAvatar
                  ? <img src={localAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : initials}
              </div>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'white', marginBottom: '6px' }}>
                  {profile.fullName}
                </h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span className={`badge ${role.badge}`}>{role.icon} {role.label}</span>
                  <span className={`badge ${profile.isActive ? 'badge-success' : 'badge-danger'}`}>
                    {profile.isActive ? '🟢 Активен' : '🔴 Заблокирован'}
                  </span>
                </div>
              </div>
            </div>

            {/* Info grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              {[
                { icon: '📧', label: 'Email', value: profile.email },
                { icon: '📞', label: 'Телефон', value: profile.phone || '—' },
                { icon: '📅', label: 'Регистрация', value: profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('ru-RU') : '—' },
              ].map((item, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '10px', padding: '12px',
                  gridColumn: i === 0 ? '1 / -1' : 'auto',
                }}>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {item.icon} {item.label}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: 'rgba(255,255,255,0.85)' }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Trainer info */}
            {profile.role === 'trainer' && profile.trainerInfo?.[0] && (
              <div style={{
                background: 'rgba(139,92,246,0.08)',
                border: '1px solid rgba(139,92,246,0.2)',
                borderRadius: '12px', padding: '16px', marginBottom: '16px',
              }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#A78BFA', marginBottom: '10px' }}>
                  🏋️ Информация тренера
                </div>
                {profile.trainerInfo[0].specialization && (
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Специализация: </span>
                    <span style={{ fontSize: '13px', color: 'white', fontWeight: '500' }}>
                      {profile.trainerInfo[0].specialization}
                    </span>
                  </div>
                )}
                {profile.trainerInfo[0].bio && (
                  <div>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>О себе: </span>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.5' }}>
                      {profile.trainerInfo[0].bio}
                    </span>
                  </div>
                )}
                {profile.trainerInfo[0].hireDate && (
                  <div style={{ marginTop: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Работает с: </span>
                    <span style={{ fontSize: '13px', color: 'white' }}>
                      {new Date(profile.trainerInfo[0].hireDate).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Memberships for client */}
            {profile.role === 'client' && profile.memberships?.length > 0 && (
              <div style={{
                background: 'rgba(59,130,246,0.08)',
                border: '1px solid rgba(59,130,246,0.2)',
                borderRadius: '12px', padding: '16px', marginBottom: '16px',
              }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#93C5FD', marginBottom: '10px' }}>
                  🎫 Абонементы ({profile.memberships.length})
                </div>
                {profile.memberships.slice(0, 3).map((m, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: i < Math.min(profile.memberships.length, 3) - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  }}>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                      {m.membershipType?.name}
                    </span>
                    <span className={`badge ${m.status === 'active' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '10px' }}>
                      {m.status === 'active' ? 'Активен' : m.status === 'paused' ? 'Пауза' : m.status === 'expired' ? 'Истёк' : 'Отменён'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={onClose}>Закрыть</button>
            </div>
          </>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
            Пользователь не найден
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfileModal;
