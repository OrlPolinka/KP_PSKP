import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import './Sidebar.css';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { unreadTotal } = useChat();
  const navigate = useNavigate();
  const location = useLocation();
  const [avatarSrc, setAvatarSrc] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (user?.id) {
      const stored = localStorage.getItem(`avatar_${user.id}`);
      setAvatarSrc(stored || null);
    }
  }, [user, location.pathname]);

  useEffect(() => {
    if (user?.id) {
      import('../../services/api').then(({ default: api }) => {
        api.get('/auth/me').then(res => {
          const photoUrl = res.data?.user?.photoUrl;
          if (photoUrl) {
            try {
              localStorage.setItem(`avatar_${user.id}`, photoUrl);
              setAvatarSrc(photoUrl);
            } catch {
              setAvatarSrc(photoUrl);
            }
          }
        }).catch(() => {});
      });
    }
  }, [user?.id]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const getMenuItems = () => {
    switch (user.role) {
      case 'admin':
        return [
          { path: '/admin/dashboard', icon: '📊', label: 'Дашборд' },
          { path: '/admin/users', icon: '👥', label: 'Пользователи' },
          { path: '/admin/trainers', icon: '🧑‍🏫', label: 'Тренеры' },
          { path: '/admin/schedule', icon: '📅', label: 'Расписание' },
          { path: '/admin/membership-types', icon: '🎫', label: 'Типы абонементов' },
          { path: '/admin/memberships', icon: '💳', label: 'Абонементы клиентов' },
          { path: '/admin/dance-styles', icon: '💃', label: 'Стили танцев' },
          { path: '/admin/training-info', icon: '📚', label: 'Информация' },
          { path: '/admin/analytics', icon: '📈', label: 'Аналитика' },
          { path: '/admin/payments', icon: '💰', label: 'Платежи' },
          { path: '/chat', icon: '💬', label: 'Чат', badge: unreadTotal },
        ];
      case 'trainer':
        return [
          { path: '/trainer/schedule', icon: '📅', label: 'Моё расписание' },
          { path: '/trainer/classes', icon: '✅', label: 'Посещаемость' },
          { path: '/trainer/qr-scanner', icon: '📱', label: 'Сканер QR' },
          { path: '/trainer/profile', icon: '👤', label: 'Мой профиль' },
          { path: '/chat', icon: '💬', label: 'Чат', badge: unreadTotal },
        ];
      case 'client':
        return [
          { path: '/schedule', icon: '📅', label: 'Расписание' },
          { path: '/my-bookings', icon: '📝', label: 'Мои записи' },
          { path: '/qr-codes', icon: '📱', label: 'QR-коды' },
          { path: '/my-memberships', icon: '💳', label: 'Абонементы' },
          { path: '/trainers', icon: '🧑‍🏫', label: 'Тренеры' },
          { path: '/dance-styles', icon: '💃', label: 'Стили танцев' },
          { path: '/training-info', icon: '📋', label: 'Подготовка' },
          { path: '/history', icon: '📜', label: 'История' },
          { path: '/chat', icon: '💬', label: 'Чат', badge: unreadTotal },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  const initials = user.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user.email[0].toUpperCase();

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <Link to="/" className="sidebar-logo">
          <span className="sidebar-logo-icon">💃</span>
          {!isCollapsed && <span className="sidebar-logo-text">DanceStudio</span>}
        </Link>
        <button 
          className="sidebar-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Развернуть' : 'Свернуть'}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item, index) => (
          <Link
            key={index}
            to={item.path}
            className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
            title={item.label}
          >
            <span className="sidebar-icon">{item.icon}</span>
            {!isCollapsed && (
              <>
                <span className="sidebar-label">{item.label}</span>
                {item.badge > 0 && (
                  <span className="sidebar-badge">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </>
            )}
            {isCollapsed && item.badge > 0 && (
              <span className="sidebar-badge-collapsed">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <Link to="/profile" className={`sidebar-profile ${isActive('/profile') ? 'active' : ''}`}>
          <div className="sidebar-avatar" style={{
            background: avatarSrc ? 'transparent' : undefined,
            overflow: avatarSrc ? 'hidden' : undefined,
          }}>
            {avatarSrc
              ? <img src={avatarSrc} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : initials}
          </div>
          {!isCollapsed && (
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user.fullName?.split(' ')[0] || 'Профиль'}</span>
              <span className="sidebar-user-role">
                {user.role === 'admin' ? 'Администратор' : user.role === 'trainer' ? 'Тренер' : 'Клиент'}
              </span>
            </div>
          )}
        </Link>
        <button onClick={handleLogout} className="sidebar-logout" title="Выйти">
          <span className="sidebar-icon">🚪</span>
          {!isCollapsed && <span>Выйти</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
