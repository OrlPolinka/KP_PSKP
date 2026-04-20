import React, { useState, useEffect } from 'react';
import api from '../../services/api';

// Simple bar chart component
const BarChart = ({ data, valueKey, labelKey, colorFn, maxValue }) => {
  const max = maxValue || Math.max(...data.map(d => d[valueKey]), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {data.map((item, i) => {
        const pct = Math.round((item[valueKey] / max) * 100);
        const color = colorFn ? colorFn(i, item) : `hsl(${260 + i * 20}, 70%, 65%)`;
        return (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: '500' }}>
                {item[labelKey]}
              </span>
              <span style={{ fontSize: '13px', fontWeight: '700', color }}>
                {item[valueKey]}
              </span>
            </div>
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${pct}%`,
                background: color,
                borderRadius: '4px',
                transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Donut chart
const DonutChart = ({ segments, size = 140 }) => {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return null;
  const r = 50, cx = 60, cy = 60;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  const arcs = segments.map(seg => {
    const pct = seg.value / total;
    const dash = pct * circumference;
    const arc = { ...seg, dash, offset, pct };
    offset += dash;
    return arc;
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
      <svg width={size} height={size} viewBox="0 0 120 120" style={{ flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="18" />
        {arcs.map((arc, i) => (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={arc.color}
            strokeWidth="18"
            strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
            strokeDashoffset={-arc.offset}
            strokeLinecap="round"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '60px 60px', transition: 'all 0.8s ease' }}
          />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fill="white" fontSize="16" fontWeight="700">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9">всего</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {arcs.map((arc, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: arc.color, flexShrink: 0 }} />
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)' }}>{arc.label}</span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: arc.color, marginLeft: 'auto' }}>
              {arc.value} <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: '400' }}>({Math.round(arc.pct * 100)}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Mini stat card
const StatCard = ({ icon, label, value, sub, color }) => (
  <div className="stat-card" style={{ textAlign: 'left', padding: '20px' }}>
    <div style={{ fontSize: '28px', marginBottom: '8px' }}>{icon}</div>
    <div style={{
      fontSize: '28px', fontWeight: '800', marginBottom: '4px',
      background: color || 'linear-gradient(135deg, #A78BFA, #EC4899)',
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
    }}>
      {value}
    </div>
    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: '500' }}>{label}</div>
    {sub && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>{sub}</div>}
  </div>
);

const Analytics = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [popular, setPopular] = useState(null);
  const [trainers, setTrainers] = useState(null);
  const [financial, setFinancial] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [popularRes, trainersRes, financialRes] = await Promise.all([
        api.get('/analytics/popular?limit=8'),
        api.get('/analytics/trainers'),
        api.get('/analytics/financial'),
      ]);
      setPopular(popularRes.data);
      setTrainers(trainersRes.data);
      setFinancial(financialRes.data);
    } catch (error) {
      console.error('Ошибка загрузки аналитики:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="loading">
      <div className="spinner" />
      <span>Загрузка аналитики...</span>
    </div>
  );

  const tabs = [
    { key: 'overview', label: '📊 Обзор' },
    { key: 'popular', label: '🔥 Популярность' },
    { key: 'trainers', label: '🏋️ Тренеры' },
    { key: 'financial', label: '💰 Финансы' },
  ];

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Аналитика</h1>
          <p className="page-subtitle">Статистика и показатели студии</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={fetchData}>🔄 Обновить</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '28px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '4px', width: 'fit-content', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding: '10px 20px', border: 'none', borderRadius: '10px',
            cursor: 'pointer', fontSize: '14px', fontWeight: '600',
            fontFamily: 'Inter, sans-serif', transition: 'all 0.2s ease',
            background: activeTab === tab.key ? 'linear-gradient(135deg, #8B5CF6, #7C3AED)' : 'transparent',
            color: activeTab === tab.key ? 'white' : 'rgba(255,255,255,0.5)',
            boxShadow: activeTab === tab.key ? '0 4px 12px rgba(139,92,246,0.4)' : 'none',
            whiteSpace: 'nowrap',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeTab === 'overview' && popular && trainers && financial && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Key metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
            <StatCard icon="📅" label="Всего занятий" value={popular.summary.totalSchedules} />
            <StatCard icon="👥" label="Всего записей" value={popular.summary.totalBookings} color="linear-gradient(135deg, #10B981, #059669)" />
            <StatCard icon="💰" label="Выручка" value={`${(financial.summary.totalRevenue || 0).toLocaleString()} ₽`} color="linear-gradient(135deg, #F59E0B, #D97706)" />
            <StatCard icon="🎫" label="Абонементов" value={financial.summary.totalSoldMemberships} sub={`${financial.summary.activeMemberships} активных`} color="linear-gradient(135deg, #EC4899, #DB2777)" />
            <StatCard icon="🏋️" label="Тренеров" value={trainers.summary.totalTrainers} color="linear-gradient(135deg, #3B82F6, #2563EB)" />
            <StatCard icon="📈" label="Посещаемость" value={`${trainers.summary.overallAttendanceRate}%`} color="linear-gradient(135deg, #A78BFA, #8B5CF6)" />
          </div>

          {/* Two columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Popular styles */}
            <div className="card">
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'white', marginBottom: '20px' }}>
                🔥 Топ направлений
              </h3>
              <BarChart
                data={popular.popularClasses.slice(0, 5)}
                valueKey="totalBookings"
                labelKey="danceStyleName"
                colorFn={(i) => `hsl(${260 + i * 25}, 70%, 65%)`}
              />
            </div>

            {/* Membership types donut */}
            <div className="card">
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'white', marginBottom: '20px' }}>
                🎫 Продажи абонементов
              </h3>
              <DonutChart
                segments={financial.byMembershipType.slice(0, 5).map((t, i) => ({
                  label: t.typeName,
                  value: t.soldCount,
                  color: ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6'][i % 5],
                }))}
              />
            </div>
          </div>

          {/* Trainer attendance */}
          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'white', marginBottom: '20px' }}>
              🏋️ Посещаемость по тренерам
            </h3>
            <BarChart
              data={trainers.trainers.slice(0, 6).map(t => ({
                name: t.fullName,
                rate: parseFloat(t.statistics.attendanceRate),
              }))}
              valueKey="rate"
              labelKey="name"
              maxValue={100}
              colorFn={(i, item) => item.rate >= 80 ? '#10B981' : item.rate >= 50 ? '#F59E0B' : '#EF4444'}
            />
          </div>
        </div>
      )}

      {/* POPULAR */}
      {activeTab === 'popular' && popular && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <StatCard icon="📅" label="Всего занятий" value={popular.summary.totalSchedules} />
            <StatCard icon="👥" label="Всего записей" value={popular.summary.totalBookings} color="linear-gradient(135deg, #10B981, #059669)" />
            <StatCard icon="📊" label="Среднее на занятие" value={popular.summary.averageBookingsPerClass} sub="чел./занятие" />
          </div>

          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'white', marginBottom: '20px' }}>
              Популярность направлений
            </h3>
            <BarChart
              data={popular.popularClasses}
              valueKey="totalBookings"
              labelKey="danceStyleName"
              colorFn={(i) => `hsl(${260 + i * 20}, 70%, 65%)`}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {popular.popularClasses.map((item, idx) => (
              <div key={idx} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                <div style={{
                  position: 'absolute', top: '12px', right: '12px',
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: idx === 0 ? 'linear-gradient(135deg, #F59E0B, #D97706)'
                    : idx === 1 ? 'linear-gradient(135deg, #94A3B8, #64748B)'
                    : idx === 2 ? 'linear-gradient(135deg, #CD7F32, #A0522D)'
                    : 'rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', fontWeight: '800', color: 'white',
                }}>
                  {idx + 1}
                </div>
                <h4 style={{ fontSize: '17px', fontWeight: '700', color: 'white', marginBottom: '12px', paddingRight: '40px' }}>
                  {item.danceStyleName}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Записей</span>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#A78BFA' }}>{item.totalBookings}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Загруженность</span>
                    <span style={{
                      fontSize: '13px', fontWeight: '600',
                      color: item.occupancyRate >= 80 ? '#10B981' : item.occupancyRate >= 50 ? '#F59E0B' : '#EF4444',
                    }}>
                      {item.occupancyRate}%
                    </span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${item.occupancyRate}%`,
                      background: item.occupancyRate >= 80 ? '#10B981' : item.occupancyRate >= 50 ? '#F59E0B' : '#EF4444',
                      borderRadius: '3px',
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TRAINERS */}
      {activeTab === 'trainers' && trainers && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <StatCard icon="🏋️" label="Тренеров" value={trainers.summary.totalTrainers} />
            <StatCard icon="📅" label="Занятий" value={trainers.summary.totalClasses} color="linear-gradient(135deg, #A78BFA, #8B5CF6)" />
            <StatCard icon="👥" label="Записей" value={trainers.summary.totalBookings} color="linear-gradient(135deg, #10B981, #059669)" />
            <StatCard icon="📈" label="Посещаемость" value={`${trainers.summary.overallAttendanceRate}%`} color="linear-gradient(135deg, #F59E0B, #D97706)" />
          </div>

          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'white', marginBottom: '20px' }}>
              Посещаемость по тренерам
            </h3>
            <BarChart
              data={trainers.trainers.map(t => ({
                name: t.fullName,
                rate: parseFloat(t.statistics.attendanceRate),
              }))}
              valueKey="rate"
              labelKey="name"
              maxValue={100}
              colorFn={(i, item) => item.rate >= 80 ? '#10B981' : item.rate >= 50 ? '#F59E0B' : '#EF4444'}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {trainers.trainers.map((trainer, idx) => {
              const rate = parseFloat(trainer.statistics.attendanceRate);
              return (
                <div key={idx} className="card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '16px', fontWeight: '700', color: 'white', flexShrink: 0,
                    }}>
                      {trainer.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: 'white' }}>{trainer.fullName}</div>
                      {trainer.specialization && (
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{trainer.specialization}</div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                    {[
                      { label: 'Занятий', value: trainer.statistics.totalClasses },
                      { label: 'Записей', value: trainer.statistics.totalBookings },
                      { label: 'Посетило', value: trainer.statistics.attendedBookings, color: '#10B981' },
                      { label: 'Не пришло', value: trainer.statistics.noShowBookings, color: '#EF4444' },
                    ].map((s, i) => (
                      <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '10px' }}>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '4px' }}>{s.label}</div>
                        <div style={{ fontSize: '18px', fontWeight: '700', color: s.color || 'white' }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Посещаемость</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: rate >= 80 ? '#10B981' : rate >= 50 ? '#F59E0B' : '#EF4444' }}>
                        {rate}%
                      </span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${rate}%`,
                        background: rate >= 80 ? '#10B981' : rate >= 50 ? '#F59E0B' : '#EF4444',
                        borderRadius: '3px',
                      }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FINANCIAL */}
      {activeTab === 'financial' && financial && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
            <StatCard icon="💰" label="Общая выручка" value={`${(financial.summary.totalRevenue || 0).toLocaleString()} ₽`} color="linear-gradient(135deg, #F59E0B, #D97706)" />
            <StatCard icon="🎫" label="Продано абонементов" value={financial.summary.totalSoldMemberships} />
            <StatCard icon="📊" label="Средний чек" value={`${(financial.summary.averageCheck || 0).toLocaleString()} ₽`} color="linear-gradient(135deg, #10B981, #059669)" />
            <StatCard icon="✅" label="Активных" value={financial.summary.activeMemberships} color="linear-gradient(135deg, #A78BFA, #8B5CF6)" />
            <StatCard icon="📈" label="Рост" value={financial.summary.growthRate} color="linear-gradient(135deg, #EC4899, #DB2777)" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="card">
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'white', marginBottom: '20px' }}>
                Выручка по типам абонементов
              </h3>
              <BarChart
                data={financial.byMembershipType.map(t => ({
                  name: t.typeName,
                  revenue: Math.round(t.totalRevenue),
                }))}
                valueKey="revenue"
                labelKey="name"
                colorFn={(i) => ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6'][i % 5]}
              />
            </div>

            <div className="card">
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'white', marginBottom: '20px' }}>
                Продажи по типам
              </h3>
              <DonutChart
                segments={financial.byMembershipType.slice(0, 5).map((t, i) => ({
                  label: t.typeName,
                  value: t.soldCount,
                  color: ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6'][i % 5],
                }))}
              />
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'white', marginBottom: '16px' }}>
              🔮 Прогноз на следующий период
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Ожидаемая выручка
                </div>
                <div style={{ fontSize: '28px', fontWeight: '800', color: '#A78BFA' }}>
                  {(financial.forecast.nextPeriodRevenue || 0).toLocaleString()} ₽
                </div>
              </div>
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Ожидаемый рост
                </div>
                <div style={{ fontSize: '28px', fontWeight: '800', color: '#10B981' }}>
                  {financial.forecast.estimatedGrowth}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            {financial.byMembershipType.map((type, idx) => (
              <div key={idx} className="card">
                <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'white', marginBottom: '12px' }}>
                  {type.typeName}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { label: 'Продано', value: `${type.soldCount} шт.`, color: '#A78BFA' },
                    { label: 'Выручка', value: `${Math.round(type.totalRevenue).toLocaleString()} ₽`, color: '#F59E0B' },
                    { label: 'Средняя цена', value: `${Math.round(type.averagePrice).toLocaleString()} ₽`, color: '#10B981' },
                  ].map((s, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{s.label}</span>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: s.color }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
