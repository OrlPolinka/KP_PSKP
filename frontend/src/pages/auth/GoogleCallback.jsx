import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const GoogleCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const userStr = params.get('user');
    const error = params.get('error');

    if (error || !token || !userStr) {
      if (error === 'google_not_configured') {
        navigate('/login?info=google_setup');
      } else {
        navigate('/login?error=google_failed');
      }
      return;
    }

    try {
      const user = JSON.parse(userStr);
      // Store token and user like normal login
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      // Redirect based on role
      const routes = {
        admin: '/admin/dashboard',
        trainer: '/trainer/schedule',
        client: '/schedule',
      };
      navigate(routes[user.role] || '/');
    } catch (e) {
      navigate('/login?error=google_failed');
    }
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F0F1A 0%, #1A0A2E 50%, #0F0F1A 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: '16px',
    }}>
      <div className="spinner" style={{ width: '48px', height: '48px' }} />
      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '16px' }}>
        Выполняется вход через Google...
      </p>
    </div>
  );
};

export default GoogleCallback;
