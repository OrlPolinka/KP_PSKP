import React from 'react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const menuItems = [
    { title: 'Пользователи', path: '/admin/users', icon: '👥', description: 'Управление пользователями и их ролями' },
    { title: 'Тренеры', path: '/admin/trainers', icon: '🏋️', description: 'Добавление и редактирование тренеров' },
    { title: 'Расписание', path: '/admin/schedule', icon: '📅', description: 'Создание и управление расписанием' },
    { title: 'Типы абонементов', path: '/admin/membership-types', icon: '🎫', description: 'Управление тарифами' },
    { title: 'Аналитика', path: '/admin/analytics', icon: '📊', description: 'Статистика и отчеты' },
  ];

  return (
    <div className="container">
      <h2>Панель администратора</h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px',
        marginTop: '30px',
      }}>
        {menuItems.map((item) => (
          <Link key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ cursor: 'pointer', transition: 'transform 0.2s' }}>
              <div style={{ fontSize: '48px', textAlign: 'center' }}>{item.icon}</div>
              <h3 style={{ textAlign: 'center', marginTop: '10px' }}>{item.title}</h3>
              <p style={{ textAlign: 'center', color: '#666' }}>{item.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;