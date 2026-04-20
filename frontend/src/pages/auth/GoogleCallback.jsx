import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const GoogleCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState('Выполняется вход через Google...');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const userStr = params.get('user');
    const error = params.get('error');

    if (error) {
      if (error === 'google_not_configured') {
        navigate('/login?info=google_setup');
      } else {
        setStatus('Ошибка входа. Перенаправление...');
        setTimeout(() => navigate('/login?error=google_failed'), 1500);
      }
      return;
    }

    if (!token || !userStr) {
      setStatus('Данные не получены. Перенаправление...');
      setTimeout(() => navigate('/login?error=google_failed'), 1500);
      return;
    }

    try {
      const user = JSON.parse(decodeURIComponent(userStr));

      // Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      setStatus('Вход выполнен! Перенаправление...');

      // Redirect based on role
      const roleRoutes = {
        admin: '/admin/dashboard',
        trainer: '/trainer/schedule',
        client: '/schedule',
      };

      // Small delay so localStorage is written before navigation
      setTimeout(() => {
        window.location.href = roleRoutes[user.role] || '/';
      }, 300);

    } catch (e) {
      console.error('GoogleCallback parse error:', e);
      setStatus('Ошибка обработки данных. Перенаправление...');
      setTimeout(() => navigate('/login?error=google_failed'), 1500);
    }
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F0F1A 0%, #1A0A2E 50%, #0F0F1A 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: '20px',
    }}>
      <div style={{
        width: '56px', height: '56px',
        border: '3px solid rgba(139,92,246,0.2)',
        borderTop: '3px solid #8B5CF6',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px', fontFamily: 'Inter, sans-serif' }}>
        {status}
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default GoogleCallback;
