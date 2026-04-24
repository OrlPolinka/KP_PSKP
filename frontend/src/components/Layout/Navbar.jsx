import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { unreadTotal } = useChat();
  const navigate = useNavigate();
  const location = useLocation();
  const [avatarSrc, setAvatarSrc] = useState(null);

  // Reload avatar when location changes (e.g. after profile update)
  useEffect(() => {
    if (user?.id) {
      // Check DB photo first (stored in localStorage after profile load), then localStorage
      const stored = localStorage.getItem(`avatar_${user.id}`);
      setAvatarSrc(stored || null);
    }
  }, [user, location.pathname]);

  // On mount, fetch profile to sync photo from DB to localStorage
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
              // localStorage full — just use the URL directly without storing
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

  const getNavLinks = () => {
    switch (user.role) {
      case 'admin':
        return (
          <>
            <Link to="/admin/dashboard" className={isActive('/admin/dashboard') ? 'active' : ''}>Дашборд</Link>
            <Link to="/admin/users" className={isActive('/admin/users') ? 'active' : ''}>Пользователи</Link>
            <Link to="/admin/trainers" className={isActive('/admin/trainers') ? 'active' : ''}>Тренеры</Link>
            <Link to="/admin/schedule" className={isActive('/admin/schedule') ? 'active' : ''}>Расписание</Link>
            <Link to="/admin/membership-types" className={isActive('/admin/membership-types') ? 'active' : ''}>Абонементы</Link>
            <Link to="/admin/memberships" className={isActive('/admin/memberships') ? 'active' : ''}>Абонементы клиентов</Link>
            <Link to="/admin/analytics" className={isActive('/admin/analytics') ? 'active' : ''}>Аналитика</Link>
          </>
        );
      case 'trainer':
        return (
          <>
            <Link to="/trainer/schedule" className={isActive('/trainer/schedule') ? 'active' : ''}>Моё расписание</Link>
            <Link to="/trainer/classes" className={isActive('/trainer/classes') ? 'active' : ''}>Посещаемость</Link>
            <Link to="/chat" className={isActive('/chat') ? 'active' : ''} style={{ position: 'relative' }}>
              💬 Чат
              {unreadTotal > 0 && (
                <span style={{
                  position: 'absolute', top: '-6px', right: '-10px',
                  background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                  color: 'white', fontSize: '10px', fontWeight: '700',
                  borderRadius: '10px', padding: '1px 5px', minWidth: '16px', textAlign: 'center',
                }}>
                  {unreadTotal > 99 ? '99+' : unreadTotal}
                </span>
              )}
            </Link>
          </>
        );
      case 'client':
        return (
          <>
            <Link to="/schedule" className={isActive('/schedule') ? 'active' : ''}>Расписание</Link>
            <Link to="/my-bookings" className={isActive('/my-bookings') ? 'active' : ''}>Мои записи</Link>
            <Link to="/my-memberships" className={isActive('/my-memberships') ? 'active' : ''}>Абонементы</Link>
            <Link to="/history" className={isActive('/history') ? 'active' : ''}>История</Link>
            <Link to="/chat" className={isActive('/chat') ? 'active' : ''} style={{ position: 'relative' }}>
              💬 Чат
              {unreadTotal > 0 && (
                <span style={{
                  position: 'absolute', top: '-6px', right: '-10px',
                  background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                  color: 'white', fontSize: '10px', fontWeight: '700',
                  borderRadius: '10px', padding: '1px 5px', minWidth: '16px', textAlign: 'center',
                }}>
                  {unreadTotal > 99 ? '99+' : unreadTotal}
                </span>
              )}
            </Link>
          </>
        );
      default:
        return null;
    }
  };

  const initials = user.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user.email[0].toUpperCase();

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <span className="nav-logo-icon">💃</span>
          DanceStudio
        </Link>
        <div className="nav-links">
          {getNavLinks()}
          <div className="nav-divider" />
          <Link to="/profile" className={`nav-profile ${isActive('/profile') ? 'active' : ''}`}>
            <div className="nav-avatar" style={{
              background: avatarSrc ? 'transparent' : undefined,
              overflow: avatarSrc ? 'hidden' : undefined,
            }}>
              {avatarSrc
                ? <img src={avatarSrc} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : initials}
            </div>
            <span>{user.fullName?.split(' ')[0] || 'Профиль'}</span>
          </Link>
          <button onClick={handleLogout} className="nav-logout">Выйти</button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
