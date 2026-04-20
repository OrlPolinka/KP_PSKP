import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '',
    fullName: '', phone: '', role: 'client',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) { setError('Пароли не совпадают'); return; }
    if (formData.password.length < 6) { setError('Пароль должен содержать минимум 6 символов'); return; }
    setLoading(true);
    try {
      const { confirmPassword, ...submitData } = formData;
      await register(submitData);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка при регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F0F1A 0%, #1A0A2E 50%, #0F0F1A 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: '-20%', left: '-10%', width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', right: '-10%', width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      <div style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '24px', padding: '48px 40px', width: '100%', maxWidth: '480px',
        backdropFilter: 'blur(20px)', boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>💃</div>
          <h1 style={{
            fontFamily: 'Playfair Display, serif', fontSize: '28px', fontWeight: '700',
            background: 'linear-gradient(135deg, #A78BFA, #EC4899)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text', marginBottom: '6px',
          }}>
            Создать аккаунт
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
            Присоединяйся к DanceStudio
          </p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '20px' }}>⚠️ {error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>ФИО</label>
            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange}
              placeholder="Иванова Анна Сергеевна" required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange}
              placeholder="your@email.com" required />
          </div>
          <div className="form-group">
            <label>Телефон</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
              placeholder="+7 (999) 123-45-67" />
          </div>
          <div className="form-group">
            <label>Пароль</label>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} name="password"
                value={formData.password} onChange={handleChange}
                placeholder="Минимум 6 символов" required style={{ paddingRight: '48px' }} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.4)', fontSize: '16px', padding: '4px',
              }}>
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>Подтвердите пароль</label>
            <input type={showPassword ? 'text' : 'password'} name="confirmPassword"
              value={formData.confirmPassword} onChange={handleChange}
              placeholder="Повторите пароль" required />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '15px', marginTop: '8px' }}>
            {loading ? (
              <><span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} /> Регистрация...</>
            ) : 'Создать аккаунт'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
          Уже есть аккаунт?{' '}
          <Link to="/login" style={{ color: '#A78BFA', textDecoration: 'none', fontWeight: '500' }}>
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
