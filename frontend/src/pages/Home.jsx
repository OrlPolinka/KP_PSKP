import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const danceStyles = [
  { icon: '💃', name: 'Сальса', desc: 'Зажигательные латинские ритмы' },
  { icon: '🕺', name: 'Хип-хоп', desc: 'Уличная культура и свобода движений' },
  { icon: '🩰', name: 'Балет', desc: 'Классическая грация и элегантность' },
  { icon: '🌹', name: 'Танго', desc: 'Страсть и чувственность аргентинского танца' },
  { icon: '✨', name: 'Современный', desc: 'Творческое самовыражение без границ' },
  { icon: '🎭', name: 'Джаз-фанк', desc: 'Энергия и стиль джазового танца' },
];

const features = [
  { icon: '🏆', title: 'Опытные тренеры', desc: 'Наши тренеры — профессионалы с международным опытом и победители чемпионатов' },
  { icon: '🎯', title: 'Индивидуальный подход', desc: 'Программы для любого уровня: от новичков до профессионалов' },
  { icon: '🏛️', title: 'Современные залы', desc: '4 просторных зала с профессиональным покрытием и зеркалами' },
  { icon: '📱', title: 'Удобное расписание', desc: 'Онлайн-запись, гибкое расписание и удобные абонементы' },
];

const stats = [
  { value: '500+', label: 'Учеников' },
  { value: '15', label: 'Тренеров' },
  { value: '20+', label: 'Направлений' },
  { value: '8 лет', label: 'Опыта' },
];

const Home = () => {
  const { user } = useAuth();

  return (
    <div style={{ background: 'var(--dark)', minHeight: '100vh' }}>
      {/* Hero Section */}
      <section style={{
        position: 'relative',
        minHeight: '90vh',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0F0F1A 0%, #1A0A2E 50%, #0F0F1A 100%)',
      }}>
        {/* Background decorations */}
        <div style={{
          position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none'
        }}>
          <div style={{
            position: 'absolute', top: '-20%', right: '-10%',
            width: '600px', height: '600px',
            background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
            borderRadius: '50%',
          }} />
          <div style={{
            position: 'absolute', bottom: '-20%', left: '-10%',
            width: '500px', height: '500px',
            background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)',
            borderRadius: '50%',
          }} />
          {/* Floating particles */}
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              width: `${4 + i * 2}px`,
              height: `${4 + i * 2}px`,
              background: i % 2 === 0 ? 'rgba(139,92,246,0.4)' : 'rgba(236,72,153,0.4)',
              borderRadius: '50%',
              top: `${15 + i * 12}%`,
              left: `${5 + i * 15}%`,
              animation: `float ${3 + i}s ease-in-out infinite alternate`,
            }} />
          ))}
        </div>

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '700px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
              borderRadius: '20px', padding: '6px 16px', marginBottom: '24px',
              fontSize: '13px', color: '#A78BFA', fontWeight: '500',
            }}>
              <span>✨</span> Лучшая танцевальная студия города
            </div>

            <h1 style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: 'clamp(40px, 6vw, 72px)',
              fontWeight: '700',
              lineHeight: '1.1',
              marginBottom: '24px',
              color: 'white',
            }}>
              Открой мир{' '}
              <span style={{
                background: 'linear-gradient(135deg, #A78BFA, #EC4899)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                танца
              </span>
              {' '}вместе с нами
            </h1>

            <p style={{
              fontSize: '18px', color: 'rgba(255,255,255,0.65)',
              lineHeight: '1.7', marginBottom: '40px', maxWidth: '560px',
            }}>
              Профессиональные тренеры, современные залы и атмосфера, 
              которая вдохновляет. Начни свой танцевальный путь сегодня.
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {user ? (
                <Link to={
                  user.role === 'admin' ? '/admin/dashboard' :
                  user.role === 'trainer' ? '/trainer/schedule' : '/schedule'
                } className="btn btn-primary btn-lg">
                  Перейти в кабинет →
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary btn-lg">
                    Начать бесплатно
                  </Link>
                  <Link to="/login" className="btn btn-outline btn-lg">
                    Войти
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{
        background: 'rgba(139,92,246,0.05)',
        borderTop: '1px solid rgba(139,92,246,0.15)',
        borderBottom: '1px solid rgba(139,92,246,0.15)',
        padding: '40px 0',
      }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '32px',
            textAlign: 'center',
          }}>
            {stats.map((stat, i) => (
              <div key={i}>
                <div style={{
                  fontSize: '40px', fontWeight: '800',
                  background: 'linear-gradient(135deg, #A78BFA, #EC4899)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  {stat.value}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginTop: '4px' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dance Styles */}
      <section style={{ padding: '80px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '40px', fontWeight: '700', color: 'white', marginBottom: '12px',
            }}>
              Наши направления
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px' }}>
              Выбери свой стиль и начни двигаться
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
          }}>
            {danceStyles.map((style, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                padding: '28px',
                transition: 'all 0.3s ease',
                cursor: 'default',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(139,92,246,0.15)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>{style.icon}</div>
                <h3 style={{ fontSize: '20px', fontWeight: '600', color: 'white', marginBottom: '8px' }}>
                  {style.name}
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', lineHeight: '1.6' }}>
                  {style.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{
        padding: '80px 0',
        background: 'linear-gradient(180deg, transparent, rgba(139,92,246,0.05), transparent)',
      }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '40px', fontWeight: '700', color: 'white', marginBottom: '12px',
            }}>
              Почему выбирают нас
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '24px',
          }}>
            {features.map((f, i) => (
              <div key={i} className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>{f.icon}</div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white', marginBottom: '10px' }}>
                  {f.title}
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', lineHeight: '1.7' }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section style={{ padding: '80px 0' }}>
          <div className="container">
            <div style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(236,72,153,0.2))',
              border: '1px solid rgba(139,92,246,0.3)',
              borderRadius: '24px',
              padding: '60px 40px',
              textAlign: 'center',
            }}>
              <h2 style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: '36px', fontWeight: '700', color: 'white', marginBottom: '16px',
              }}>
                Готов начать?
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '16px', marginBottom: '32px' }}>
                Зарегистрируйся и запишись на первое занятие уже сегодня
              </p>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/register" className="btn btn-primary btn-lg">
                  Зарегистрироваться
                </Link>
                <Link to="/login" className="btn btn-outline btn-lg">
                  Уже есть аккаунт
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.08)',
        padding: '40px 0',
        textAlign: 'center',
        color: 'rgba(255,255,255,0.3)',
        fontSize: '14px',
      }}>
        <div className="container">
          <div style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '20px',
            background: 'linear-gradient(135deg, #A78BFA, #EC4899)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '12px',
          }}>
            💃 DanceStudio
          </div>
          <p>© 2024 DanceStudio. Все права защищены.</p>
          <p style={{ marginTop: '8px' }}>📍 ул. Танцевальная, 1 &nbsp;|&nbsp; 📞 +7 (999) 123-45-67 &nbsp;|&nbsp; ✉️ info@dancestudio.ru</p>
        </div>
      </footer>

      <style>{`
        @keyframes float {
          from { transform: translateY(0px); }
          to { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
};

export default Home;
