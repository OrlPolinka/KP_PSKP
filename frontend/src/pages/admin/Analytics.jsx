import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const Analytics = () => {
  const [activeTab, setActiveTab] = useState('popular');
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
        api.get('/analytics/popular?limit=5'),
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

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="container">
      <h2>Аналитика</h2>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          className={`btn ${activeTab === 'popular' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('popular')}
        >
          Популярные занятия
        </button>
        <button
          className={`btn ${activeTab === 'trainers' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('trainers')}
        >
          Статистика тренеров
        </button>
        <button
          className={`btn ${activeTab === 'financial' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('financial')}
        >
          Финансовая статистика
        </button>
      </div>

      {activeTab === 'popular' && popular && (
        <div>
          <div className="card">
            <h3>Общая статистика</h3>
            <p><strong>Всего занятий:</strong> {popular.summary.totalSchedules}</p>
            <p><strong>Всего записей:</strong> {popular.summary.totalBookings}</p>
            <p><strong>Средняя заполняемость:</strong> {popular.summary.averageBookingsPerClass} чел./занятие</p>
          </div>
          <h3>Популярные направления</h3>
          {popular.popularClasses.map((item, idx) => (
            <div key={idx} className="card">
              <h4>{idx + 1}. {item.danceStyleName}</h4>
              <p><strong>Записей:</strong> {item.totalBookings}</p>
              <p><strong>Средняя заполняемость:</strong> {item.averageOccupancy} / {item.maxCapacity}</p>
              <p><strong>Загруженность:</strong> {item.occupancyRate}%</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'trainers' && trainers && (
        <div>
          <div className="card">
            <h3>Общая статистика</h3>
            <p><strong>Всего тренеров:</strong> {trainers.summary.totalTrainers}</p>
            <p><strong>Всего занятий:</strong> {trainers.summary.totalClasses}</p>
            <p><strong>Всего записей:</strong> {trainers.summary.totalBookings}</p>
            <p><strong>Посещаемость:</strong> {trainers.summary.overallAttendanceRate}%</p>
          </div>
          <h3>Статистика по тренерам</h3>
          {trainers.trainers.map((trainer, idx) => (
            <div key={idx} className="card">
              <h4>{trainer.fullName}</h4>
              <p><strong>Специализация:</strong> {trainer.specialization}</p>
              <p><strong>Проведено занятий:</strong> {trainer.statistics.totalClasses}</p>
              <p><strong>Всего записей:</strong> {trainer.statistics.totalBookings}</p>
              <p><strong>Посетило:</strong> {trainer.statistics.attendedBookings}</p>
              <p><strong>Не пришло:</strong> {trainer.statistics.noShowBookings}</p>
              <p><strong>Посещаемость:</strong> {trainer.statistics.attendanceRate}%</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'financial' && financial && (
        <div>
          <div className="card">
            <h3>Финансовая сводка</h3>
            <p><strong>Общая выручка:</strong> {financial.summary.totalRevenue.toLocaleString()} ₽</p>
            <p><strong>Продано абонементов:</strong> {financial.summary.totalSoldMemberships}</p>
            <p><strong>Средний чек:</strong> {financial.summary.averageCheck.toLocaleString()} ₽</p>
            <p><strong>Активных абонементов:</strong> {financial.summary.activeMemberships}</p>
            <p><strong>Рост к предыдущему периоду:</strong> {financial.summary.growthRate}</p>
          </div>
          
          <div className="card">
            <h3>Прогноз на следующий период</h3>
            <p><strong>Ожидаемая выручка:</strong> {financial.forecast.nextPeriodRevenue.toLocaleString()} ₽</p>
            <p><strong>Ожидаемый рост:</strong> {financial.forecast.estimatedGrowth}</p>
          </div>

          <h3>Продажи по типам абонементов</h3>
          {financial.byMembershipType.map((type, idx) => (
            <div key={idx} className="card">
              <h4>{type.typeName}</h4>
              <p><strong>Продано:</strong> {type.soldCount} шт.</p>
              <p><strong>Выручка:</strong> {type.totalRevenue.toLocaleString()} ₽</p>
              <p><strong>Средняя цена:</strong> {type.averagePrice.toLocaleString()} ₽</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Analytics;