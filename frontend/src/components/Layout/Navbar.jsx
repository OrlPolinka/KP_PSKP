import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const getNavLinks = () => {
    switch (user.role) {
      case 'admin':
        return (
          <>
            <Link to="/admin/users">Пользователи</Link>
            <Link to="/admin/trainers">Тренеры</Link>
            <Link to="/admin/schedule">Расписание</Link>
            <Link to="/admin/membership-types">Типы абонементов</Link>
            <Link to="/admin/analytics">Аналитика</Link>
          </>
        );
      case 'trainer':
        return (
          <>
            <Link to="/trainer/schedule">Мое расписание</Link>
            <Link to="/trainer/classes">Мои занятия</Link>
          </>
        );
      case 'client':
        return (
          <>
            <Link to="/schedule">Расписание</Link>
            <Link to="/my-bookings">Мои записи</Link>
            <Link to="/my-memberships">Мои абонементы</Link>
            <Link to="/history">История</Link>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">Танцевальная студия</Link>
        <div className="nav-links">
          {getNavLinks()}
          <Link to="/profile">Профиль</Link>
          <button onClick={handleLogout} className="nav-logout">Выйти</button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;